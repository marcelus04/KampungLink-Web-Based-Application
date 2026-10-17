import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft } from "lucide-react";
import logo from "@/assets/logo.png";

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

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    village: "",
    role: "resident",
    gender: "",
    date_of_birth: "",
    education_level: "",
    occupation: "",
  });

  const [villages, setVillages] = useState<string[]>([]);
  const isAdmin = formData.role === "admin";
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signUp, user, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user) {
      navigate("/dashboard");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    fetchVillages();
  }, []);

  const fetchVillages = async () => {
    try {
      const { data } = await supabase.rpc("get_public_villages");
      if (data) {
        setVillages(data.filter((d: { village_name: string | null }) => d.village_name).map((d: { village_name: string }) => d.village_name));
      }
    } catch (error) {
      console.error("Error fetching villages:", error);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (formData.password.length < 6) {
      toast({
        variant: "destructive",
        title: "Ralat",
        description: "Kata laluan mestilah sekurang-kurangnya 6 aksara.",
      });
      setIsLoading(false);
      return;
    }

    const { error } = await signUp(formData.email, formData.password, {
      name: formData.name,
      phone: formData.phone,
      address: formData.address,
      village: formData.village || null,
      role: formData.role,
      gender: formData.gender || null,
      date_of_birth: formData.date_of_birth || null,
      education_level: formData.education_level || null,
      occupation: formData.occupation || null,
    });

    if (error) {
      let errorMessage = "Pendaftaran gagal. Sila cuba lagi.";
      if (error.message.includes("User already registered")) {
        errorMessage = "Email ini telah didaftarkan.";
      } else if (error.message.includes("Password")) {
        errorMessage = "Kata laluan tidak memenuhi syarat.";
      }

      toast({
        variant: "destructive",
        title: "Ralat",
        description: errorMessage,
      });
    } else {
      toast({
        title: "Pendaftaran Berjaya!",
        description: "Akaun anda telah didaftarkan.",
      });
      navigate("/dashboard");
    }

    setIsLoading(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/20 p-4">
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-4 left-4 gap-2"
        onClick={() => navigate("/")}
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali
      </Button>
      <Card className="w-full max-w-lg shadow-xl border-0 bg-card/80 backdrop-blur-sm">
        <CardHeader className="space-y-1 text-center select-none">
          <img src={logo} alt="KampungLink Logo" className="h-24 mx-auto pointer-events-none" draggable={false} />
          <CardTitle className="text-2xl font-bold text-primary cursor-default">Daftar Akaun</CardTitle>
          <CardDescription className="cursor-default">Sertai komuniti KampungLink</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Penuh</Label>
              <Input
                id="name"
                placeholder="Ahmad bin Ali"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="ahmad@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="bg-background"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">No. Telefon</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="012-3456789"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
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
              <Label htmlFor="role">Jenis Pengguna</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value, address: "", village: "" })}>
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="resident">Penduduk</SelectItem>
                  <SelectItem value="jkkk">JKKK (Ahli Jawatankuasa)</SelectItem>
                  <SelectItem value="admin">Ketua Kampung</SelectItem>
                </SelectContent>
              </Select>
              {formData.role === "jkkk" && (
                <p className="text-xs text-muted-foreground">
                  JKKK mempunyai akses pentadbir tetapi perlu kelulusan Ketua Kampung.
                </p>
              )}
            </div>
            {isAdmin ? (
              <div className="space-y-2">
                <Label htmlFor="address">Alamat Kampung</Label>
                <Input
                  id="address"
                  placeholder="Kampung Seri Indah, Mukim Batu"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  required
                  className="bg-background"
                />
                <p className="text-xs text-muted-foreground">
                  Alamat ini akan digunakan untuk penduduk memilih kampung anda.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="village">Pilih Kampung</Label>
                <Select value={formData.village} onValueChange={(value) => setFormData({ ...formData, village: value })}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Pilih kampung anda" />
                  </SelectTrigger>
                  <SelectContent>
                    {villages.map((village) => (
                      <SelectItem key={village} value={village}>{village}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Pilih kampung yang anda tinggal untuk kelulusan.
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="password">Kata Laluan</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={6}
                className="bg-background"
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Memuatkan..." : "Daftar"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            <span className="text-muted-foreground">Sudah ada akaun? </span>
            <Button
              variant="link"
              className="p-0 h-auto font-semibold"
              onClick={() => navigate("/login")}
            >
              Log Masuk
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;