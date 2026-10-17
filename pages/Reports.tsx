import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, AlertTriangle, Upload, CheckCircle, Edit, Trash2, MoreVertical, MessageSquare, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import ImageUpload from "@/components/ImageUpload";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface ReportWithProfile {
  id: string;
  title: string;
  description: string;
  location: string;
  photo_url?: string | null;
  status: "pending" | "in_progress" | "resolved";
  admin_response?: string | null;
  user_id: string;
  created_at: string;
  reporter_name?: string;
  reporter_village?: string;
}

const Reports = () => {
  const [reports, setReports] = useState<ReportWithProfile[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingReport, setEditingReport] = useState<ReportWithProfile | null>(null);
  const [respondingReport, setRespondingReport] = useState<ReportWithProfile | null>(null);
  const [adminResponse, setAdminResponse] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    photo_url: null as string | null,
  });
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, isAdmin, hasAdminAccess, isLoading } = useAuth();

  // Get user's village
  const userVillage = isAdmin ? profile?.address : profile?.village;

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login");
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchReports();
    }
  }, [user]);

  const fetchReports = async () => {
    // First get all reports
    const { data: reportsData, error: reportsError } = await supabase
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false });

    if (reportsError || !reportsData) {
      setIsLoadingData(false);
      return;
    }

    // Get unique user IDs and fetch their profiles
    const userIds = [...new Set(reportsData.map(r => r.user_id))];
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("user_id, name, village, address")
      .in("user_id", userIds);

    const profileMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);

    // Map reports with profile info
    const reportsWithProfiles: ReportWithProfile[] = reportsData.map(report => {
      const reporterProfile = profileMap.get(report.user_id);
      return {
        ...report,
        reporter_name: reporterProfile?.name || "Pengguna",
        reporter_village: reporterProfile?.village || reporterProfile?.address,
      };
    });

    setReports(reportsWithProfiles);
    setIsLoadingData(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);

    const { error } = await supabase.from("reports").insert({
      user_id: user.id,
      title: formData.title,
      description: formData.description,
      location: formData.location,
      photo_url: formData.photo_url,
    });

    if (error) {
      toast({ variant: "destructive", title: "Ralat", description: "Gagal menghantar laporan." });
    } else {
      toast({ title: "Laporan dihantar", description: "Terima kasih. Laporan anda akan disemak." });
      setFormData({ title: "", description: "", location: "", photo_url: null });
      setShowForm(false);
      fetchReports();
    }
    setIsSubmitting(false);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReport) return;
    setIsSubmitting(true);

    const { error } = await supabase
      .from("reports")
      .update({
        title: formData.title,
        description: formData.description,
        location: formData.location,
        photo_url: formData.photo_url,
      })
      .eq("id", editingReport.id);

    if (error) {
      toast({ variant: "destructive", title: "Ralat", description: "Gagal mengemaskini laporan." });
    } else {
      toast({ title: "Dikemaskini!", description: "Laporan telah dikemaskini." });
      setEditingReport(null);
      setFormData({ title: "", description: "", location: "", photo_url: null });
      fetchReports();
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (reportId: string) => {
    const { error } = await supabase
      .from("reports")
      .delete()
      .eq("id", reportId);

    if (error) {
      toast({ variant: "destructive", title: "Ralat", description: "Gagal memadam laporan." });
    } else {
      toast({ title: "Dipadam!", description: "Laporan telah dipadam." });
      fetchReports();
    }
  };

  const handleStatusChange = async (reportId: string, newStatus: "pending" | "in_progress" | "resolved") => {
    const { error } = await supabase
      .from("reports")
      .update({ status: newStatus })
      .eq("id", reportId);

    if (error) {
      toast({ variant: "destructive", title: "Ralat", description: "Gagal mengemaskini status." });
    } else {
      toast({ title: "Dikemaskini!", description: "Status laporan telah dikemaskini." });
      fetchReports();
    }
  };

  const handleAdminResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!respondingReport || !adminResponse.trim()) return;
    setIsSubmitting(true);

    const { error } = await supabase
      .from("reports")
      .update({ admin_response: adminResponse.trim() })
      .eq("id", respondingReport.id);

    if (error) {
      toast({ variant: "destructive", title: "Ralat", description: "Gagal menghantar maklum balas." });
    } else {
      toast({ title: "Berjaya!", description: "Maklum balas telah dihantar." });
      setRespondingReport(null);
      setAdminResponse("");
      fetchReports();
    }
    setIsSubmitting(false);
  };

  const openEditDialog = (report: ReportWithProfile) => {
    setFormData({
      title: report.title,
      description: report.description,
      location: report.location || "",
      photo_url: report.photo_url || null,
    });
    setEditingReport(report);
  };

  const closeEditDialog = () => {
    setEditingReport(null);
    setFormData({ title: "", description: "", location: "", photo_url: null });
  };

  const openResponseDialog = (report: ReportWithProfile) => {
    setAdminResponse(report.admin_response || "");
    setRespondingReport(report);
  };

  const closeResponseDialog = () => {
    setRespondingReport(null);
    setAdminResponse("");
  };

  // Check if user can edit/delete a report
  const canModifyReport = (report: ReportWithProfile) => {
    if (!user) return false;
    
    // Owner can always modify their own reports
    if (report.user_id === user.id) return true;
    
    // Admin/JKKK can modify reports from their village
    if (hasAdminAccess) {
      return report.reporter_village === userVillage;
    }
    
    return false;
  };

  // Check if user has admin controls (status change, response)
  const hasAdminControls = (report: ReportWithProfile) => {
    if (!hasAdminAccess) return false;
    return report.reporter_village === userVillage;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "resolved":
        return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Selesai</Badge>;
      case "in_progress":
        return <Badge variant="secondary">Dalam Proses</Badge>;
      default:
        return <Badge variant="outline">Menunggu</Badge>;
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-amber-500/20 flex items-center justify-center animate-pulse">
            <AlertTriangle className="h-6 w-6 text-amber-500" />
          </div>
          <p className="text-sm text-muted-foreground">Memuatkan...</p>
        </div>
      </div>
    );
  }

  // Filter reports based on role
  const visibleReports = hasAdminAccess ? reports : reports.filter((r) => r.user_id === user.id);

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card/90 backdrop-blur-xl border-b border-border/50 sticky top-0 z-10 shadow-soft">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="rounded-xl">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-soft">
              <AlertTriangle className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold">Laporan Masalah</h1>
              <p className="text-sm text-muted-foreground">{userVillage || "Laporkan masalah di kampung"}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Button onClick={() => setShowForm(!showForm)} className="mb-6 rounded-xl gap-2 shadow-soft">
          <AlertTriangle className="h-4 w-4" />
          {showForm ? "Tutup Borang" : "Buat Laporan Baru"}
        </Button>

        {showForm && (
          <Card className="mb-8 animate-fade-in">
            <CardHeader>
              <CardTitle className="font-display">Borang Laporan</CardTitle>
              <CardDescription>Sila isi maklumat dengan lengkap</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="title">Tajuk Masalah</Label>
                  <Input
                    id="title"
                    placeholder="Contoh: Lampu jalan rosak"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Lokasi</Label>
                  <Input
                    id="location"
                    placeholder="Contoh: Jalan Utama, Kampung Baru"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Penerangan</Label>
                  <Textarea
                    id="description"
                    placeholder="Terangkan masalah dengan lebih terperinci..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    required
                  />
                </div>
                <ImageUpload
                  onImageUploaded={(url) => setFormData({ ...formData, photo_url: url })}
                  currentImageUrl={formData.photo_url}
                  label="Gambar Masalah"
                  folder="reports"
                />
                <Button type="submit" disabled={isSubmitting} className="rounded-xl gap-2">
                  <Upload className="h-4 w-4" />
                  {isSubmitting ? "Menghantar..." : "Hantar Laporan"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Edit Dialog */}
        <Dialog open={!!editingReport} onOpenChange={() => closeEditDialog()}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Laporan</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEdit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Tajuk Masalah</Label>
                <Input
                  id="edit-title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-location">Lokasi</Label>
                <Input
                  id="edit-location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Penerangan</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  required
                />
              </div>
              <ImageUpload
                onImageUploaded={(url) => setFormData({ ...formData, photo_url: url })}
                currentImageUrl={formData.photo_url}
                label="Gambar Masalah"
                folder="reports"
              />
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={closeEditDialog} className="flex-1">
                  Batal
                </Button>
                <Button type="submit" disabled={isSubmitting} className="flex-1">
                  {isSubmitting ? "Mengemaskini..." : "Kemaskini"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Admin Response Dialog */}
        <Dialog open={!!respondingReport} onOpenChange={() => closeResponseDialog()}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Maklum Balas Admin</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdminResponse} className="space-y-4">
              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-sm font-medium">{respondingReport?.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{respondingReport?.description}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-response">Maklum Balas Anda</Label>
                <Textarea
                  id="admin-response"
                  placeholder="Tulis maklum balas untuk penduduk..."
                  value={adminResponse}
                  onChange={(e) => setAdminResponse(e.target.value)}
                  rows={4}
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={closeResponseDialog} className="flex-1">
                  Batal
                </Button>
                <Button type="submit" disabled={isSubmitting || !adminResponse.trim()} className="flex-1 gap-2">
                  <Send className="h-4 w-4" />
                  {isSubmitting ? "Menghantar..." : "Hantar Maklum Balas"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <div className="space-y-4">
          <h2 className="text-2xl font-display font-bold flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            {hasAdminAccess ? "Semua Laporan" : "Laporan Saya"}
          </h2>
          {isLoadingData ? (
            <div className="flex justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-amber-500/20 flex items-center justify-center animate-pulse">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                </div>
                <p className="text-sm text-muted-foreground">Memuatkan laporan...</p>
              </div>
            </div>
          ) : visibleReports.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-16 text-center">
                <div className="h-20 w-20 rounded-3xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="h-10 w-10 opacity-30" />
                </div>
                <p className="font-display font-bold text-lg mb-1">Tiada Laporan</p>
                <p className="text-sm text-muted-foreground">Belum ada laporan dihantar</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {visibleReports.map((report, index) => (
                <Card key={report.id} className="hover:shadow-hover transition-all duration-300 animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          {getStatusBadge(report.status)}
                        </div>
                        <CardTitle className="font-display text-lg">{report.title}</CardTitle>
                        <CardDescription className="mt-2 flex items-center gap-3 flex-wrap">
                          <span className="flex items-center gap-1 bg-muted/50 px-2 py-1 rounded-lg text-xs">
                            📍 {report.location}
                          </span>
                          <span className="text-xs">{new Date(report.created_at).toLocaleDateString("ms-MY")}</span>
                          {hasAdminAccess && <span className="text-xs font-medium">👤 {report.reporter_name}</span>}
                        </CardDescription>
                      </div>
                      
                      {canModifyReport(report) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl">
                            <DropdownMenuItem onClick={() => openEditDialog(report)} className="rounded-lg">
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            {hasAdminControls(report) && (
                              <DropdownMenuItem onClick={() => openResponseDialog(report)} className="rounded-lg">
                                <MessageSquare className="h-4 w-4 mr-2" />
                                {report.admin_response ? "Edit Maklum Balas" : "Beri Maklum Balas"}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive rounded-lg">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Padam
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="font-display">Padam Laporan?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Adakah anda pasti mahu memadam laporan ini? Tindakan ini tidak boleh dibatalkan.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="rounded-xl">Batal</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(report.id)} className="rounded-xl">
                                    Padam
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-4 text-muted-foreground">{report.description}</p>
                    {report.photo_url && (
                      <img
                        src={report.photo_url}
                        alt={report.title}
                        className="mb-4 rounded-xl max-h-48 w-full object-cover shadow-soft"
                      />
                    )}
                    {report.admin_response && (
                      <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="h-6 w-6 rounded-lg bg-primary/20 flex items-center justify-center">
                            <MessageSquare className="h-3 w-3 text-primary" />
                          </div>
                          <p className="text-sm font-semibold text-primary">Maklum Balas Admin</p>
                        </div>
                        <p className="text-sm">{report.admin_response}</p>
                      </div>
                    )}
                    
                    {hasAdminControls(report) && (
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-4 border-t border-border/50">
                        {report.status !== "resolved" && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Status:</span>
                            <Select 
                              value={report.status} 
                              onValueChange={(value) => handleStatusChange(report.id, value as "pending" | "in_progress" | "resolved")}
                            >
                              <SelectTrigger className="w-44 h-9 rounded-xl text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Menunggu</SelectItem>
                                <SelectItem value="in_progress">Dalam Proses</SelectItem>
                                <SelectItem value="resolved">Selesai</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                        {!report.admin_response && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => openResponseDialog(report)}
                            className="gap-2 rounded-xl"
                          >
                            <MessageSquare className="h-4 w-4" />
                            Beri Maklum Balas
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Reports;