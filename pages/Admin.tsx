import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, AlertTriangle, TrendingUp, Check, X, UserCheck, Home, Users, BarChart3, Search, Building2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AdminFamilyManagement } from "@/components/AdminFamilyManagement";
import AdminFacilityManagement from "@/components/AdminFacilityManagement";
import { DemographicsChart } from "@/components/DemographicsChart";
import { VillagerSearch } from "@/components/VillagerSearch";
import TopNavigation from "@/components/TopNavigation";

interface PendingUser {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string | null;
  village: string | null;
}

const Admin = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingReports: 0,
    announcements: 0,
    fundRequests: 0,
    pendingApprovals: 0,
    totalFamilies: 0,
  });
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [processingUser, setProcessingUser] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user, profile, isAdmin, hasAdminAccess, isLoading } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login");
      return;
    }
    // Allow both admin and JKKK to access admin panel
    if (!isLoading && !hasAdminAccess) {
      navigate("/dashboard");
      return;
    }
  }, [user, hasAdminAccess, isLoading, navigate]);

  useEffect(() => {
    if (user && hasAdminAccess && profile) {
      fetchStats();
      // Only Ketua Kampung (admin) can approve users
      if (isAdmin) {
        fetchPendingUsers();
      }
    }
  }, [user, hasAdminAccess, isAdmin, profile]);

  // Get the user's village (admin uses address, JKKK uses village)
  const userVillage = isAdmin ? profile?.address : profile?.village;

  const fetchStats = async () => {
    if (!userVillage) {
      setIsLoadingStats(false);
      return;
    }

    // Get user IDs from same village for filtering (residents who selected this village)
    const { data: villageResidents } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("village", userVillage)
      .eq("approval_status", "approved");

    // Also get admins/JKKK who have this village as their address
    const { data: villageAdmins } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("address", userVillage)
      .eq("approval_status", "approved");

    const residentIds = villageResidents?.map(u => u.user_id) || [];
    const adminIds = villageAdmins?.map(u => u.user_id) || [];
    const villageUserIds = [...new Set([...residentIds, ...adminIds])];

    const [profilesRes, reportsRes, announcementsRes, fundRequestsRes, pendingRes, familiesRes] = await Promise.all([
      // Count approved users in this village (residents only for display)
      supabase.from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("village", userVillage)
        .eq("approval_status", "approved"),
      // Count pending reports from village users
      supabase.from("reports")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending")
        .in("user_id", villageUserIds.length > 0 ? villageUserIds : ['']),
      // Count announcements from village users
      supabase.from("announcements")
        .select("id", { count: "exact", head: true })
        .in("user_id", villageUserIds.length > 0 ? villageUserIds : ['']),
      // Count active fund requests from village users
      supabase.from("fund_requests")
        .select("id", { count: "exact", head: true })
        .eq("status", "active")
        .in("user_id", villageUserIds.length > 0 ? villageUserIds : ['']),
      // Count pending approvals for this village
      supabase.from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("approval_status", "pending")
        .eq("village", userVillage),
      // Count families in this village
      supabase.from("families")
        .select("id", { count: "exact", head: true })
        .eq("village", userVillage),
    ]);

    setStats({
      totalUsers: profilesRes.count || 0,
      pendingReports: reportsRes.count || 0,
      announcements: announcementsRes.count || 0,
      fundRequests: fundRequestsRes.count || 0,
      pendingApprovals: pendingRes.count || 0,
      totalFamilies: familiesRes.count || 0,
    });
    setIsLoadingStats(false);
  };


  const fetchPendingUsers = async () => {
    if (!userVillage) return;

    // Get users who selected this village and are pending
    const { data } = await supabase
      .from("profiles")
      .select("id, user_id, name, email, phone, village")
      .eq("village", userVillage)
      .eq("approval_status", "pending");

    if (data) {
      setPendingUsers(data);
    }
  };

  const handleApproval = async (userId: string, approved: boolean) => {
    setProcessingUser(userId);

    const { error } = await supabase
      .from("profiles")
      .update({
        approval_status: approved ? "approved" : "rejected",
        approved_by: user?.id,
      })
      .eq("user_id", userId);

    if (error) {
      toast({
        variant: "destructive",
        title: "Ralat",
        description: "Gagal memproses permohonan.",
      });
    } else {
      toast({
        title: approved ? "Diluluskan!" : "Ditolak",
        description: approved
          ? "Penduduk telah diluluskan untuk menyertai kampung."
          : "Permohonan penduduk telah ditolak.",
      });
      // Refresh the list
      fetchPendingUsers();
      fetchStats();
    }

    setProcessingUser(null);
  };

  if (isLoading || !user || !hasAdminAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10">
      <TopNavigation />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold">Panel Pentadbir</h1>
          <p className="text-muted-foreground">
            {isAdmin ? "Ketua Kampung" : "JKKK"} • {userVillage || "Tiada kampung"}
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-card/50 border">
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Gambaran
            </TabsTrigger>
            <TabsTrigger value="demographics" className="gap-2">
              <Users className="h-4 w-4" />
              Demografi
            </TabsTrigger>
            <TabsTrigger value="search" className="gap-2">
              <Search className="h-4 w-4" />
              Carian
            </TabsTrigger>
            <TabsTrigger value="families" className="gap-2">
              <Home className="h-4 w-4" />
              Keluarga
            </TabsTrigger>
            <TabsTrigger value="facilities" className="gap-2">
              <Building2 className="h-4 w-4" />
              Kemudahan
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <Card className="bg-card/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{isLoadingStats ? "..." : stats.totalUsers}</p>
                      <p className="text-xs text-muted-foreground">Penduduk</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {isAdmin && (
                <Card className="bg-amber-500/10 border-amber-500/20">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-500/20 rounded-lg">
                        <UserCheck className="h-4 w-4 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-amber-600">{isLoadingStats ? "..." : stats.pendingApprovals}</p>
                        <p className="text-xs text-muted-foreground">Menunggu</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card className="bg-card/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-destructive/10 rounded-lg">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{isLoadingStats ? "..." : stats.pendingReports}</p>
                      <p className="text-xs text-muted-foreground">Laporan</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Bell className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{isLoadingStats ? "..." : stats.announcements}</p>
                      <p className="text-xs text-muted-foreground">Pengumuman</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-secondary/20 rounded-lg">
                      <TrendingUp className="h-4 w-4 text-secondary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{isLoadingStats ? "..." : stats.fundRequests}</p>
                      <p className="text-xs text-muted-foreground">Dana Aktif</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-accent/20 rounded-lg">
                      <Home className="h-4 w-4 text-accent" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{isLoadingStats ? "..." : stats.totalFamilies}</p>
                      <p className="text-xs text-muted-foreground">Keluarga</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Pending Approvals - Only for Ketua Kampung */}
            {isAdmin && pendingUsers.length > 0 && (
              <Card className="border-amber-500/30 bg-amber-500/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <UserCheck className="h-5 w-5 text-amber-600" />
                    Permohonan Penduduk Menunggu
                  </CardTitle>
                  <CardDescription>
                    Penduduk yang memohon untuk menyertai kampung anda
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {pendingUsers.map((pendingUser) => (
                      <div
                        key={pendingUser.id}
                        className="flex items-center justify-between p-4 border rounded-lg bg-card"
                      >
                        <div>
                          <p className="font-medium">{pendingUser.name}</p>
                          <p className="text-sm text-muted-foreground">{pendingUser.email}</p>
                          {pendingUser.phone && (
                            <p className="text-sm text-muted-foreground">{pendingUser.phone}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => handleApproval(pendingUser.user_id, false)}
                            disabled={processingUser === pendingUser.user_id}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Tolak
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleApproval(pendingUser.user_id, true)}
                            disabled={processingUser === pendingUser.user_id}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Luluskan
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5" onClick={() => navigate("/announcements")}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Bell className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Pengumuman</p>
                    <p className="text-sm text-muted-foreground">Buat pengumuman</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5" onClick={() => navigate("/reports")}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="p-3 bg-destructive/10 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <p className="font-medium">Laporan</p>
                    <p className="text-sm text-muted-foreground">Semak laporan</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5" onClick={() => navigate("/marketplace")}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="p-3 bg-secondary/20 rounded-lg">
                    <Users className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <p className="font-medium">Pasar</p>
                    <p className="text-sm text-muted-foreground">Lihat aktiviti</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5" onClick={() => navigate("/fund-requests")}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="p-3 bg-accent/20 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="font-medium">Dana</p>
                    <p className="text-sm text-muted-foreground">Kempen aktif</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Demographics Tab */}
          <TabsContent value="demographics">
            {userVillage && <DemographicsChart village={userVillage} />}
          </TabsContent>

          {/* Search Tab */}
          <TabsContent value="search">
            {userVillage && <VillagerSearch village={userVillage} />}
          </TabsContent>

          {/* Families Tab */}
          <TabsContent value="families">
            {userVillage && <AdminFamilyManagement village={userVillage} />}
          </TabsContent>

          {/* Facilities Tab */}
          <TabsContent value="facilities">
            {userVillage && <AdminFacilityManagement village={userVillage} />}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
