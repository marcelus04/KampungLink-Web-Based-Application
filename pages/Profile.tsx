import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Camera, Loader2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { FamilySection } from "@/components/FamilySection";
import { FamilyInvitations } from "@/components/FamilyInvitations";
import { FamilyMembership } from "@/components/FamilyMembership";
import { QRFamilyScanner } from "@/components/QRFamilyScanner";
import TopNavigation from "@/components/TopNavigation";

const EDUCATION_LEVELS = [
  { value: "primary", label: "Sekolah Rendah" },
  { value: "secondary", label: "Sekolah Menengah (SPM)" },
  { value: "diploma", label: "Diploma" },
  { value: "degree", label: "Ijazah Sarjana Muda" },
  { value: "masters", label: "Ijazah Sarjana" },
  { value: "phd", label: "PhD" },
  { value: "other", label: "Lain-lain" },
];

const OCCUPATION_DEPARTMENTS = [
  { value: "agriculture", label: "Pertanian" },
  { value: "business", label: "Perniagaan" },
  { value: "education", label: "Pendidikan" },
  { value: "engineering", label: "Kejuruteraan" },
  { value: "healthcare", label: "Kesihatan" },
  { value: "it", label: "Teknologi Maklumat (IT)" },
  { value: "government", label: "Kerajaan" },
  { value: "private", label: "Swasta" },
  { value: "self_employed", label: "Bekerja Sendiri" },
  { value: "retired", label: "Pesara" },
  { value: "student", label: "Pelajar" },
  { value: "unemployed", label: "Tidak Bekerja" },
  { value: "other", label: "Lain-lain" },
];

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, isAdmin, role, isLoading, refreshProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    avatar_url: null as string | null,
    gender: "" as string,
    date_of_birth: "" as string,
    occupation: "" as string,
    education_level: "" as string,
    address: "" as string,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [hasFamilyMembership, setHasFamilyMembership] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login");
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        phone: profile.phone || "",
        avatar_url: profile.avatar_url || null,
        gender: profile.gender || "",
        date_of_birth: profile.date_of_birth || "",
        occupation: profile.occupation || "",
        education_level: profile.education_level || "",
        address: profile.address || "",
      });
    }
  }, [profile]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast({ variant: "destructive", title: "Ralat", description: "Sila pilih fail imej sahaja." });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({ variant: "destructive", title: "Ralat", description: "Saiz fail melebihi 2MB." });
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      if (formData.avatar_url) {
        const oldPath = formData.avatar_url.split("/uploads/")[1];
        if (oldPath) {
          await supabase.storage.from("uploads").remove([oldPath]);
        }
      }

      const { error: uploadError } = await supabase.storage
        .from("uploads")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("uploads")
        .getPublicUrl(fileName);

      setFormData(prev => ({ ...prev, avatar_url: publicUrl }));
      toast({ title: "Berjaya!", description: "Gambar profil telah dimuat naik." });
    } catch (error) {
      console.error("Upload error:", error);
      toast({ variant: "destructive", title: "Ralat", description: "Gagal memuat naik gambar." });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          name: formData.name,
          phone: formData.phone,
          avatar_url: formData.avatar_url,
          gender: formData.gender || null,
          date_of_birth: formData.date_of_birth || null,
          occupation: formData.occupation || null,
          education_level: formData.education_level || null,
          address: formData.address || null,
        })
        .eq("user_id", user.id);

      if (error) throw error;

      await refreshProfile();
      toast({ title: "Berjaya!", description: "Profil anda telah dikemaskini." });
    } catch (error) {
      console.error("Update error:", error);
      toast({ variant: "destructive", title: "Ralat", description: "Gagal mengemaskini profil." });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const userVillage = isAdmin ? profile?.address : profile?.village;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10">
      <TopNavigation />

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Maklumat Profil</CardTitle>
            <CardDescription>Kemaskini maklumat peribadi anda</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Avatar Section */}
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="w-28 h-28 rounded-full bg-muted flex items-center justify-center overflow-hidden border-4 border-background shadow-lg">
                    {formData.avatar_url ? (
                      <img 
                        src={formData.avatar_url} 
                        alt="Avatar" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-12 h-12 text-muted-foreground" />
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="absolute bottom-0 right-0 rounded-full shadow-md"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">Klik ikon kamera untuk tukar gambar</p>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nama Penuh</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Masukkan nama penuh"
                    required
                    className="bg-background"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">E-mel</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile?.email || ""}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">E-mel tidak boleh ditukar</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">No. Telefon</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="012-3456789"
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Jantina</Label>
                    <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Pilih jantina" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Lelaki</SelectItem>
                        <SelectItem value="female">Perempuan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dob">Tarikh Lahir</Label>
                    <Input
                      id="dob"
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="education">Tahap Pendidikan</Label>
                    <Select value={formData.education_level} onValueChange={(value) => setFormData({ ...formData, education_level: value })}>
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Pilih tahap" />
                      </SelectTrigger>
                      <SelectContent>
                        {EDUCATION_LEVELS.map((level) => (
                          <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="occupation">Bidang Pekerjaan</Label>
                  <Select value={formData.occupation} onValueChange={(value) => setFormData({ ...formData, occupation: value })}>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Pilih bidang" />
                    </SelectTrigger>
                    <SelectContent>
                      {OCCUPATION_DEPARTMENTS.map((dept) => (
                        <SelectItem key={dept.value} value={dept.value}>{dept.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Peranan</Label>
                  <Input
                    value={isAdmin ? "Ketua Kampung" : role === "jkkk" ? "JKKK" : "Penduduk"}
                    disabled
                    className="bg-muted"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Alamat</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="No. 123, Jalan Kampung, ..."
                    className="bg-background"
                  />
                </div>

                {userVillage && (
                  <div className="space-y-2">
                    <Label>Kampung</Label>
                    <Input
                      value={userVillage}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Status Akaun</Label>
                  <Input
                    value={
                      profile?.approval_status === "approved" 
                        ? "Diluluskan" 
                        : profile?.approval_status === "pending" 
                        ? "Menunggu Kelulusan" 
                        : "Ditolak"
                    }
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Simpan Perubahan
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* QR Scanner to Join Family */}
        {user && !hasFamilyMembership && (
          <Card className="mt-6 border-0 shadow-lg bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg">Sertai Keluarga</CardTitle>
              <CardDescription>Imbas kod QR untuk menyertai keluarga</CardDescription>
            </CardHeader>
            <CardContent>
              <QRFamilyScanner userId={user.id} onJoinSuccess={() => window.location.reload()} />
            </CardContent>
          </Card>
        )}

        {/* Family Invitations - Show pending invitations to respond to */}
        {user && (
          <div className="mt-6">
            <FamilyInvitations userId={user.id} />
          </div>
        )}

        {/* Family Memberships - Show families user has joined as member */}
        {user && (
          <div className="mt-6">
            <FamilyMembership userId={user.id} onMembershipChange={setHasFamilyMembership} />
          </div>
        )}

        {/* Family Section - Manage own family (only show if user is NOT a member of another family) */}
        {user && !hasFamilyMembership && (
          <div className="mt-6">
            <FamilySection userId={user.id} village={userVillage || null} />
          </div>
        )}
      </main>
    </div>
  );
};

export default Profile;