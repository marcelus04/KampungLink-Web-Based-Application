import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Bell, AlertTriangle, Info, Newspaper, Edit, MapPin, Lock, Plus, Trash2, Calendar, User, Filter, Search, MoreVertical } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import ImageUpload from "@/components/ImageUpload";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { ms } from "date-fns/locale";
import { Separator } from "@/components/ui/separator";

interface AnnouncementWithVillage {
  id: string;
  title: string;
  content: string;
  category: string;
  is_urgent: boolean;
  created_at: string;
  user_id: string;
  image_url?: string | null;
  author_name?: string;
  village_name?: string;
}

interface VillageKetua {
  ketua_name: string;
  ketua_id: string;
}

const Announcements = () => {
  const [allAnnouncements, setAllAnnouncements] = useState<AnnouncementWithVillage[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<AnnouncementWithVillage | null>(null);
  const [formData, setFormData] = useState({ title: "", content: "", category: "general", is_urgent: false, image_url: null as string | null });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [villageKetuas, setVillageKetuas] = useState<Map<string, VillageKetua>>(new Map());
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  
  const navigate = useNavigate();
  const { user, profile, isAdmin, hasAdminAccess, isLoading } = useAuth();
  const { toast } = useToast();

  // Get user's own village
  const ownVillage = isAdmin ? profile?.address : profile?.village;

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login");
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    if (user && profile && hasAdminAccess) {
      fetchAllAnnouncements();
    }
  }, [user, profile, hasAdminAccess]);

  const fetchVillageKetua = async (village: string) => {
    const { data } = await supabase.rpc("get_village_ketua", { _village: village });
    if (data && data.length > 0) {
      return { ketua_name: data[0].ketua_name, ketua_id: data[0].ketua_id };
    }
    return null;
  };

  const fetchAllAnnouncements = async () => {
    setIsLoadingData(true);
    
    const { data, error } = await supabase.rpc("get_all_announcements_with_villages");
    
    if (!error && data) {
      setAllAnnouncements(data);
      
      // Get unique villages and fetch their Ketua Kampung
      const uniqueVillages = [...new Set(data.map((a: AnnouncementWithVillage) => a.village_name).filter(Boolean))];
      const ketuaMap = new Map<string, VillageKetua>();
      
      for (const village of uniqueVillages) {
        if (village) {
          const ketua = await fetchVillageKetua(village);
          if (ketua) {
            ketuaMap.set(village, ketua);
          }
        }
      }
      setVillageKetuas(ketuaMap);
    }
    setIsLoadingData(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);

    const { error } = await supabase.from("announcements").insert({
      user_id: user.id,
      title: formData.title,
      content: formData.content,
      category: formData.category,
      is_urgent: formData.is_urgent,
      image_url: formData.image_url,
    });

    if (error) {
      toast({ variant: "destructive", title: "Ralat", description: "Gagal menyiarkan pengumuman." });
    } else {
      toast({ title: "Berjaya!", description: "Pengumuman telah disiarkan." });
      setFormData({ title: "", content: "", category: "general", is_urgent: false, image_url: null });
      setShowForm(false);
      fetchAllAnnouncements();
    }
    setIsSubmitting(false);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAnnouncement) return;
    setIsSubmitting(true);

    const { error } = await supabase
      .from("announcements")
      .update({
        title: formData.title,
        content: formData.content,
        category: formData.category,
        is_urgent: formData.is_urgent,
        image_url: formData.image_url,
      })
      .eq("id", editingAnnouncement.id);

    if (error) {
      toast({ variant: "destructive", title: "Ralat", description: "Gagal mengemaskini pengumuman." });
    } else {
      toast({ title: "Dikemaskini!", description: "Pengumuman telah dikemaskini." });
      setEditingAnnouncement(null);
      setFormData({ title: "", content: "", category: "general", is_urgent: false, image_url: null });
      fetchAllAnnouncements();
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (announcementId: string) => {
    const { error } = await supabase
      .from("announcements")
      .delete()
      .eq("id", announcementId);

    if (error) {
      toast({ variant: "destructive", title: "Ralat", description: "Gagal memadam pengumuman." });
    } else {
      toast({ title: "Dipadam!", description: "Pengumuman telah dipadam." });
      fetchAllAnnouncements();
    }
  };

  const openEditDialog = (announcement: AnnouncementWithVillage) => {
    setFormData({
      title: announcement.title,
      content: announcement.content,
      category: announcement.category || "general",
      is_urgent: announcement.is_urgent || false,
      image_url: announcement.image_url || null,
    });
    setEditingAnnouncement(announcement);
  };

  const closeEditDialog = () => {
    setEditingAnnouncement(null);
    setFormData({ title: "", content: "", category: "general", is_urgent: false, image_url: null });
  };

  // Check if user can edit/delete an announcement
  const canModifyAnnouncement = (announcement: AnnouncementWithVillage) => {
    if (!user || !hasAdminAccess) return false;
    
    // Admin/JKKK can only modify announcements from their own village
    return announcement.village_name === ownVillage;
  };

  // Filter and group announcements
  const filteredAnnouncements = useMemo(() => {
    return allAnnouncements.filter(a => {
      // Search filter
      if (searchQuery && !a.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
          !a.content.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      // Category filter
      if (categoryFilter !== "all" && a.category !== categoryFilter) {
        return false;
      }
      // Date filter
      if (dateFilter !== "all") {
        const date = new Date(a.created_at);
        const now = new Date();
        if (dateFilter === "today" && date.toDateString() !== now.toDateString()) return false;
        if (dateFilter === "week") {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (date < weekAgo) return false;
        }
        if (dateFilter === "month") {
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          if (date < monthAgo) return false;
        }
      }
      return true;
    });
  }, [allAnnouncements, searchQuery, categoryFilter, dateFilter]);

  const ownVillageAnnouncements = filteredAnnouncements.filter(a => a.village_name === ownVillage);
  const otherVillagesAnnouncements = filteredAnnouncements.filter(a => a.village_name !== ownVillage);
  
  // Group other village announcements by village
  const groupedOtherAnnouncements = useMemo(() => {
    const grouped = new Map<string, AnnouncementWithVillage[]>();
    otherVillagesAnnouncements.forEach(a => {
      const village = a.village_name || "Lain-lain";
      if (!grouped.has(village)) {
        grouped.set(village, []);
      }
      grouped.get(village)!.push(a);
    });
    return grouped;
  }, [otherVillagesAnnouncements]);

  const getIcon = (category: string, isUrgent: boolean) => {
    if (isUrgent) return <AlertTriangle className="h-4 w-4" />;
    switch (category) {
      case "news": return <Newspaper className="h-4 w-4" />;
      case "info": return <Info className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getBadgeVariant = (category: string, isUrgent: boolean) => {
    if (isUrgent) return "destructive";
    switch (category) {
      case "news": return "default";
      case "info": return "secondary";
      default: return "outline";
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "news": return "Berita";
      case "info": return "Maklumat";
      default: return "Umum";
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Non-admin view
  if (!hasAdminAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10">
        <header className="bg-card border-b border-border sticky top-0 z-10 shadow-sm">
          <div className="container mx-auto px-4 py-4 flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Pengumuman</h1>
              <p className="text-sm text-muted-foreground">{ownVillage}</p>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <p className="text-center text-muted-foreground">Halaman ini hanya untuk pentadbir.</p>
        </main>
      </div>
    );
  }

  // Announcement Card Component for reuse
  const AnnouncementCard = ({ announcement, canModify, dimmed = false }: { announcement: AnnouncementWithVillage; canModify: boolean; dimmed?: boolean }) => (
    <Card className={`${dimmed ? 'bg-card/50 opacity-80 hover:opacity-100' : 'bg-card/80 hover:shadow-lg'} transition-all`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge variant={getBadgeVariant(announcement.category, announcement.is_urgent)} className="gap-1">
                {getIcon(announcement.category, announcement.is_urgent)}
                {announcement.is_urgent ? "Penting" : getCategoryLabel(announcement.category)}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {format(new Date(announcement.created_at), "d MMM yyyy", { locale: ms })}
              </span>
            </div>
            <h4 className={`font-semibold line-clamp-1 ${dimmed ? 'text-sm' : ''}`}>{announcement.title}</h4>
            <p className={`text-muted-foreground line-clamp-2 mt-1 ${dimmed ? 'text-xs' : 'text-sm'}`}>{announcement.content}</p>
            {announcement.image_url && (
              <img src={announcement.image_url} alt="" className={`mt-2 rounded-lg w-full object-cover ${dimmed ? 'h-20 opacity-70' : 'h-24'}`} />
            )}
            <p className="text-xs text-muted-foreground mt-2">Oleh: {announcement.author_name}</p>
          </div>
          
          {/* Actions Menu - Only show if user can modify */}
          {canModify && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => openEditDialog(announcement)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Padam
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Padam Pengumuman?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Adakah anda pasti mahu memadam pengumuman ini? Tindakan ini tidak boleh dibatalkan.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Batal</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(announcement.id)}>
                        Padam
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold">Dashboard Pengumuman</h1>
                <p className="text-sm text-muted-foreground">Kelola pengumuman semua kampung</p>
              </div>
            </div>
            
            {/* Create Button */}
            <Dialog open={showForm} onOpenChange={setShowForm}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Buat Pengumuman</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Pengumuman Baru untuk {ownVillage}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Tajuk</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Kategori</Label>
                    <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">Umum</SelectItem>
                        <SelectItem value="news">Berita</SelectItem>
                        <SelectItem value="info">Maklumat</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="content">Kandungan</Label>
                    <Textarea
                      id="content"
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      rows={4}
                      required
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="urgent"
                      checked={formData.is_urgent}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_urgent: checked as boolean })}
                    />
                    <Label htmlFor="urgent">Penting/Segera</Label>
                  </div>
                  <ImageUpload
                    onImageUploaded={(url) => setFormData({ ...formData, image_url: url })}
                    currentImageUrl={formData.image_url}
                    label="Gambar Pengumuman"
                    folder="announcements"
                  />
                  <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting ? "Menyiarkan..." : "Siarkan Pengumuman"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* Edit Dialog */}
      <Dialog open={!!editingAnnouncement} onOpenChange={() => closeEditDialog()}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Pengumuman</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Tajuk</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-category">Kategori</Label>
              <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">Umum</SelectItem>
                  <SelectItem value="news">Berita</SelectItem>
                  <SelectItem value="info">Maklumat</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-content">Kandungan</Label>
              <Textarea
                id="edit-content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={4}
                required
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-urgent"
                checked={formData.is_urgent}
                onCheckedChange={(checked) => setFormData({ ...formData, is_urgent: checked as boolean })}
              />
              <Label htmlFor="edit-urgent">Penting/Segera</Label>
            </div>
            <ImageUpload
              onImageUploaded={(url) => setFormData({ ...formData, image_url: url })}
              currentImageUrl={formData.image_url}
              label="Gambar Pengumuman"
              folder="announcements"
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

      <main className="container mx-auto px-4 py-6">
        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari pengumuman..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-32">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua</SelectItem>
                    <SelectItem value="general">Umum</SelectItem>
                    <SelectItem value="news">Berita</SelectItem>
                    <SelectItem value="info">Maklumat</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-32">
                    <Calendar className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Tarikh" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua</SelectItem>
                    <SelectItem value="today">Hari Ini</SelectItem>
                    <SelectItem value="week">Minggu Ini</SelectItem>
                    <SelectItem value="month">Bulan Ini</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {isLoadingData ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Own Village Section */}
            <section>
              <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-primary rounded-xl">
                        <MapPin className="h-6 w-6 text-primary-foreground" />
                      </div>
                      <div>
                        <CardTitle className="text-xl flex items-center gap-2">
                          Kampung {ownVillage}
                          <Badge variant="default" className="gap-1">
                            <Edit className="h-3 w-3" />
                            Akses Penuh
                          </Badge>
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <User className="h-4 w-4" />
                          Ketua Kampung: {villageKetuas.get(ownVillage || "")?.ketua_name || profile?.name || "Anda"}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-lg px-4 py-1">
                      {ownVillageAnnouncements.length} Pengumuman
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {ownVillageAnnouncements.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Bell className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p>Tiada pengumuman untuk kampung anda.</p>
                      <Button onClick={() => setShowForm(true)} variant="outline" className="mt-4 gap-2">
                        <Plus className="h-4 w-4" />
                        Buat Pengumuman Pertama
                      </Button>
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      {ownVillageAnnouncements.map((announcement) => (
                        <AnnouncementCard 
                          key={announcement.id} 
                          announcement={announcement} 
                          canModify={canModifyAnnouncement(announcement)}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>

            {/* Separator */}
            <div className="flex items-center gap-4">
              <Separator className="flex-1" />
              <span className="text-sm text-muted-foreground font-medium px-4 py-2 bg-muted rounded-full">
                Kampung Lain
              </span>
              <Separator className="flex-1" />
            </div>

            {/* Other Villages Section */}
            <section>
              {groupedOtherAnnouncements.size === 0 ? (
                <Card className="bg-muted/30 border-dashed">
                  <CardContent className="py-12 text-center">
                    <MapPin className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="text-muted-foreground">Tiada pengumuman dari kampung lain.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {Array.from(groupedOtherAnnouncements.entries()).map(([village, announcements]) => (
                    <Card key={village} className="bg-muted/20 border-muted-foreground/20">
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between flex-wrap gap-4">
                          <div className="flex items-center gap-3">
                            <div className="p-3 bg-muted rounded-xl">
                              <MapPin className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div>
                              <CardTitle className="text-lg flex items-center gap-2 text-muted-foreground">
                                Kampung {village}
                                <Badge variant="secondary" className="gap-1 text-xs">
                                  <Lock className="h-3 w-3" />
                                  Lihat Sahaja
                                </Badge>
                              </CardTitle>
                              <CardDescription className="flex items-center gap-2 mt-1">
                                <User className="h-3 w-3" />
                                Ketua Kampung: {villageKetuas.get(village)?.ketua_name || "Tidak Diketahui"}
                              </CardDescription>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-sm">
                            {announcements.length} Pengumuman
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                          {announcements.map((announcement) => (
                            <AnnouncementCard 
                              key={announcement.id} 
                              announcement={announcement} 
                              canModify={false}
                              dimmed
                            />
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
};

export default Announcements;
