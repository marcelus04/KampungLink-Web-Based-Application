import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Search, Upload, CheckCircle, Trash2, Edit, MoreVertical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import ImageUpload from "@/components/ImageUpload";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface ItemWithProfile {
  id: string;
  type: "lost" | "found";
  title: string;
  description: string;
  location: string;
  contact: string;
  photo_url?: string | null;
  created_at: string;
  user_id: string;
  reporter_name?: string;
  is_resolved?: boolean;
}

const LostFound = () => {
  const [items, setItems] = useState<ItemWithProfile[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingItem, setEditingItem] = useState<ItemWithProfile | null>(null);
  const [formData, setFormData] = useState({
    type: "lost" as "lost" | "found",
    title: "",
    description: "",
    location: "",
    contact: "",
    photo_url: null as string | null,
  });
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, isAdmin, hasAdminAccess, isLoading } = useAuth();

  // Get user's village (admin uses address, others use village)
  const userVillage = isAdmin ? profile?.address : profile?.village;

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login");
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    if (user && profile) {
      setFormData((prev) => ({ ...prev, contact: profile.phone || "" }));
      if (userVillage) {
        fetchItems();
      }
    }
  }, [user, profile, userVillage]);

  const fetchItems = async () => {
    if (!userVillage) {
      setIsLoadingData(false);
      return;
    }

    // Get residents from the same village
    const { data: villageResidents } = await supabase
      .from("profiles")
      .select("user_id, name")
      .eq("village", userVillage)
      .eq("approval_status", "approved");

    // Also get admins/JKKK who have this village as their address
    const { data: villageAdmins } = await supabase
      .from("profiles")
      .select("user_id, name")
      .eq("address", userVillage)
      .eq("approval_status", "approved");

    const allVillageUsers = [...(villageResidents || []), ...(villageAdmins || [])];
    const villageUserIds = [...new Set(allVillageUsers.map(u => u.user_id))];
    const userNameMap = new Map(allVillageUsers.map(u => [u.user_id, u.name]));

    if (villageUserIds.length === 0) {
      setItems([]);
      setIsLoadingData(false);
      return;
    }

    const { data, error } = await supabase
      .from("lost_found")
      .select("*")
      .in("user_id", villageUserIds)
      .order("created_at", { ascending: false });

    if (!error && data) {
      const itemsWithNames = data.map(i => ({
        ...i,
        reporter_name: userNameMap.get(i.user_id) || "Pengguna"
      }));
      setItems(itemsWithNames);
    }
    setIsLoadingData(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);

    const { error } = await supabase.from("lost_found").insert({
      user_id: user.id,
      type: formData.type,
      title: formData.title,
      description: formData.description,
      location: formData.location,
      contact: formData.contact,
      photo_url: formData.photo_url,
    });

    if (error) {
      toast({ variant: "destructive", title: "Ralat", description: "Gagal menyiarkan item." });
    } else {
      toast({ title: "Disiarkan!", description: `${formData.type === "lost" ? "Kehilangan" : "Penjumpaan"} anda telah disiarkan.` });
      setFormData({ type: "lost", title: "", description: "", location: "", contact: profile?.phone || "", photo_url: null });
      setShowForm(false);
      fetchItems();
    }
    setIsSubmitting(false);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setIsSubmitting(true);

    const { error } = await supabase
      .from("lost_found")
      .update({
        type: formData.type,
        title: formData.title,
        description: formData.description,
        location: formData.location,
        contact: formData.contact,
        photo_url: formData.photo_url,
      })
      .eq("id", editingItem.id);

    if (error) {
      toast({ variant: "destructive", title: "Ralat", description: "Gagal mengemaskini item." });
    } else {
      toast({ title: "Dikemaskini!", description: "Item telah dikemaskini." });
      setEditingItem(null);
      setFormData({ type: "lost", title: "", description: "", location: "", contact: profile?.phone || "", photo_url: null });
      fetchItems();
    }
    setIsSubmitting(false);
  };

  const handleMarkAsFound = async (itemId: string) => {
    const { error } = await supabase
      .from("lost_found")
      .update({ is_resolved: true, found_at: new Date().toISOString() })
      .eq("id", itemId);

    if (error) {
      toast({ variant: "destructive", title: "Ralat", description: "Gagal mengemaskini status." });
    } else {
      toast({ title: "Dikemaskini!", description: "Item telah ditandakan sebagai dijumpai." });
      fetchItems();
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    const { error } = await supabase
      .from("lost_found")
      .delete()
      .eq("id", itemId);

    if (error) {
      toast({ variant: "destructive", title: "Ralat", description: "Gagal memadam item." });
    } else {
      toast({ title: "Dipadam!", description: "Item telah dipadam." });
      fetchItems();
    }
  };

  const openEditDialog = (item: ItemWithProfile) => {
    setFormData({
      type: item.type,
      title: item.title,
      description: item.description,
      location: item.location || "",
      contact: item.contact || "",
      photo_url: item.photo_url || null,
    });
    setEditingItem(item);
  };

  const closeEditDialog = () => {
    setEditingItem(null);
    setFormData({ type: "lost", title: "", description: "", location: "", contact: profile?.phone || "", photo_url: null });
  };

  // Check if user can edit/delete an item
  const canModifyItem = (item: ItemWithProfile) => {
    if (!user) return false;
    
    // Owner can always modify their own items
    if (item.user_id === user.id) return true;
    
    // Admin/JKKK can modify items from their village
    if (hasAdminAccess) return true;
    
    return false;
  };

  // Check if user is owner
  const isOwner = (item: ItemWithProfile) => {
    return user?.id === item.user_id;
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10">
      <header className="bg-card border-b border-border sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Kehilangan & Jumpa</h1>
            <p className="text-sm text-muted-foreground">{userVillage || "Bantu cari barang hilang"}</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Button onClick={() => setShowForm(!showForm)} className="mb-6">
          <Search className="mr-2 h-4 w-4" />
          {showForm ? "Tutup Borang" : "Siarkan Item"}
        </Button>

        {showForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Borang Item</CardTitle>
              <CardDescription>Siarkan item hilang atau dijumpai</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Jenis</Label>
                  <Select value={formData.type} onValueChange={(value: "lost" | "found") => setFormData({ ...formData, type: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lost">Kehilangan</SelectItem>
                      <SelectItem value="found">Dijumpai</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Nama Item</Label>
                  <Input
                    id="title"
                    placeholder="Contoh: Dompet kulit hitam"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Lokasi</Label>
                  <Input
                    id="location"
                    placeholder="Tempat hilang/dijumpai"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Penerangan</Label>
                  <Textarea
                    id="description"
                    placeholder="Terangkan item dengan lebih terperinci..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact">No. Telefon</Label>
                  <Input
                    id="contact"
                    type="tel"
                    placeholder="012-3456789"
                    value={formData.contact}
                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                    required
                  />
                </div>
                <ImageUpload
                  onImageUploaded={(url) => setFormData({ ...formData, photo_url: url })}
                  currentImageUrl={formData.photo_url}
                  label="Gambar Item"
                  folder="lost-found"
                />
                <Button type="submit" disabled={isSubmitting}>
                  <Upload className="mr-2 h-4 w-4" />
                  {isSubmitting ? "Menyiarkan..." : "Siarkan"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Edit Dialog */}
        <Dialog open={!!editingItem} onOpenChange={() => closeEditDialog()}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Item</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEdit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-type">Jenis</Label>
                <Select value={formData.type} onValueChange={(value: "lost" | "found") => setFormData({ ...formData, type: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lost">Kehilangan</SelectItem>
                    <SelectItem value="found">Dijumpai</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-title">Nama Item</Label>
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
                  rows={3}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-contact">No. Telefon</Label>
                <Input
                  id="edit-contact"
                  type="tel"
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                  required
                />
              </div>
              <ImageUpload
                onImageUploaded={(url) => setFormData({ ...formData, photo_url: url })}
                currentImageUrl={formData.photo_url}
                label="Gambar Item"
                folder="lost-found"
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

        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Senarai Item</h2>
          {isLoadingData ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : items.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Tiada item disiarkan lagi.</p>
              </CardContent>
            </Card>
          ) : (
            items.filter(i => !i.is_resolved).map((item) => (
              <Card key={item.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={item.type === "lost" ? "destructive" : "default"}>
                          {item.type === "lost" ? "Kehilangan" : "Dijumpai"}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(item.created_at).toLocaleDateString("ms-MY")}
                        </span>
                        {isOwner(item) && (
                          <Badge variant="outline" className="text-xs">Milik Anda</Badge>
                        )}
                      </div>
                      <CardTitle>{item.title}</CardTitle>
                      <CardDescription className="mt-2">
                        📍 {item.location} • 👤 {item.reporter_name} • 📞 {item.contact}
                      </CardDescription>
                    </div>
                    
                    {/* Actions Menu */}
                    {canModifyItem(item) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(item)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleMarkAsFound(item.id)}>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Tandakan Dijumpai
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
                                <AlertDialogTitle>Padam Item?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Adakah anda pasti mahu memadam item ini? Tindakan ini tidak boleh dibatalkan.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteItem(item.id)}>
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
                  {item.photo_url && (
                    <img
                      src={item.photo_url}
                      alt={item.title}
                      className="mb-3 rounded-lg max-h-48 w-full object-cover"
                    />
                  )}
                  <p className="text-sm">{item.description}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default LostFound;