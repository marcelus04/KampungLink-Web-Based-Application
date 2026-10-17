import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  MessageSquare, 
  AlertTriangle, 
  Search, 
  DollarSign, 
  Users, 
  MapPin, 
  Sparkles,
  ArrowRight,
  TreePine,
  Store,
  Building2
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import VillageSelection from "@/components/VillageSelection";
import PendingApproval from "@/components/PendingApproval";
import RejectedStatus from "@/components/RejectedStatus";
import TopNavigation from "@/components/TopNavigation";
import { AnnouncementBoard } from "@/components/AnnouncementBoard";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, profile, role, isAdmin, hasAdminAccess, isLoading, signOut, refreshProfile } = useAuth();
  const [showVillageSelection, setShowVillageSelection] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login");
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    if (!isLoading && user && profile && !isAdmin) {
      if (!profile.village) {
        setShowVillageSelection(true);
      }
    }
  }, [user, profile, isAdmin, isLoading]);

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const handleVillageSelectionComplete = async () => {
    await refreshProfile();
    setShowVillageSelection(false);
  };

  const handleRetryVillageSelection = async () => {
    setShowVillageSelection(true);
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center animate-pulse">
            <TreePine className="h-6 w-6 text-primary" />
          </div>
          <p className="text-muted-foreground animate-pulse">Memuatkan...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin && showVillageSelection) {
    return (
      <VillageSelection
        userId={user.id}
        onComplete={handleVillageSelectionComplete}
      />
    );
  }

  if (!isAdmin && profile?.village && profile?.approval_status === "pending") {
    return (
      <PendingApproval
        village={profile.village}
        onSignOut={handleLogout}
      />
    );
  }

  if (!isAdmin && profile?.approval_status === "rejected") {
    return (
      <RejectedStatus
        village={profile.village || ""}
        onRetry={handleRetryVillageSelection}
        onSignOut={handleLogout}
      />
    );
  }

  const quickLinks = [
    { title: "Mesej", description: "Sembang komuniti", icon: MessageSquare, path: "/messages", gradient: "from-blue-500 to-blue-600" },
    { title: "Laporan", description: "Laporkan isu", icon: AlertTriangle, path: "/reports", gradient: "from-amber-500 to-orange-500" },
    { title: "Cari & Jumpa", description: "Barang hilang", icon: Search, path: "/lost-found", gradient: "from-purple-500 to-violet-600" },
    { title: "Pasar", description: "Beli & Jual", icon: Store, path: "/marketplace", gradient: "from-emerald-500 to-teal-600" },
    { title: "Dana", description: "Sumbangan", icon: DollarSign, path: "/fund-requests", gradient: "from-rose-500 to-pink-600" },
    { title: "Kemudahan", description: "Tempah fasiliti", icon: Building2, path: "/facility-booking", gradient: "from-indigo-500 to-blue-600" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <TopNavigation />

      <main className="container mx-auto px-4 py-8">
        {/* Welcome Hero Section */}
        <div className="relative mb-8 p-8 rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/10 border border-primary/20 overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-secondary/20 to-transparent rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-primary mb-2">
              <Sparkles className="h-5 w-5" />
              <span className="text-sm font-semibold">Selamat Kembali</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">
              {profile?.name?.split(" ")[0] || "Pengguna"}!
            </h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {isAdmin 
                ? `Ketua Kampung • ${profile?.address}` 
                : role === "jkkk" 
                ? `JKKK • ${profile?.village}` 
                : `Penduduk • ${profile?.village}`}
            </p>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="mb-8">
          <h2 className="text-lg font-display font-bold mb-4 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Akses Pantas
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {quickLinks.map((link, index) => (
              <Card
                key={link.path}
                className="group cursor-pointer hover:shadow-hover hover:-translate-y-1 transition-all duration-300 border-0 bg-card overflow-hidden animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => navigate(link.path)}
              >
                <CardContent className="p-5">
                  <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${link.gradient} flex items-center justify-center mb-4 shadow-soft group-hover:scale-110 transition-transform duration-300`}>
                    <link.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-display font-bold text-base mb-1">{link.title}</h3>
                  <p className="text-xs text-muted-foreground">{link.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Announcement Board */}
          <div className="lg:col-span-2">
            <AnnouncementBoard limit={6} />
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Village Info Card */}
            <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20 overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
                    <MapPin className="h-4 w-4 text-primary" />
                  </div>
                  <CardTitle className="text-base">Maklumat Kampung</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-sm text-muted-foreground">Kampung</span>
                    <span className="text-sm font-semibold">{isAdmin ? profile?.address : profile?.village}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <span className="status-chip status-chip-active">
                      {profile?.approval_status === "approved" ? "Aktif" : "Menunggu"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-muted-foreground">Peranan</span>
                    <span className="text-sm font-semibold">
                      {isAdmin ? "Ketua Kampung" : role === "jkkk" ? "JKKK" : "Penduduk"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Admin Quick Access */}
            {hasAdminAccess && (
              <Card 
                className="group cursor-pointer hover:shadow-hover transition-all duration-300 bg-gradient-to-br from-secondary/10 to-transparent border-secondary/30 overflow-hidden"
                onClick={() => navigate("/admin")}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-xl bg-secondary/20 flex items-center justify-center">
                        <Users className="h-4 w-4 text-secondary" />
                      </div>
                      <CardTitle className="text-base">Panel Pentadbir</CardTitle>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </div>
                  <CardDescription>Akses khas untuk {isAdmin ? "Ketua Kampung" : "JKKK"}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Lihat statistik, luluskan penduduk baru, dan urus komuniti anda.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Seller Portal Quick Access */}
            <Card 
              className="group cursor-pointer hover:shadow-hover transition-all duration-300 bg-gradient-to-br from-cyan-500/10 to-transparent border-cyan-500/30 overflow-hidden"
              onClick={() => navigate("/marketplace")}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                      <Store className="h-4 w-4 text-cyan-500" />
                    </div>
                    <CardTitle className="text-base">Perniagaan Saya</CardTitle>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </div>
                <CardDescription>Urus perniagaan anda</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Lihat pesanan, analitik jualan, dan urus item perniagaan.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
