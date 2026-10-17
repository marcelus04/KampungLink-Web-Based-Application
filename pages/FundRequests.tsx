import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, DollarSign, Upload, Heart, CheckCircle2, Archive, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import ImageUpload from "@/components/ImageUpload";
import DonationReceipt from "@/components/DonationReceipt";

interface CampaignWithProfile {
  id: string;
  title: string;
  description: string;
  target_amount: number;
  current_amount: number;
  photo_url?: string | null;
  created_at: string;
  user_id: string;
  status: string;
  requester_name?: string;
}

const FundRequests = () => {
  const [campaigns, setCampaigns] = useState<CampaignWithProfile[]>([]);
  const [archivedCampaigns, setArchivedCampaigns] = useState<CampaignWithProfile[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [donatingCampaignId, setDonatingCampaignId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    target_amount: "",
    photo_url: null as string | null,
  });
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [donationData, setDonationData] = useState<{
    id: string;
    amount: number;
    campaignTitle: string;
    donorName?: string;
    date: Date;
  } | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, isAdmin, isLoading } = useAuth();

  // Get user's village (admin uses address, others use village)
  const userVillage = isAdmin ? profile?.address : profile?.village;

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login");
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    if (user && profile && userVillage) {
      fetchCampaigns();
    }
  }, [user, profile, userVillage]);

  // Real-time subscription for fund_requests updates
  useEffect(() => {
    if (!userVillage) return;

    const channel = supabase
      .channel('fund-requests-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'fund_requests'
        },
        () => {
          // Refetch campaigns when any change occurs
          fetchCampaigns();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userVillage]);

  const fetchCampaigns = async () => {
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
      setCampaigns([]);
      setArchivedCampaigns([]);
      setIsLoadingData(false);
      return;
    }

    // Fetch active and completed campaigns
    const { data: activeData, error: activeError } = await supabase
      .from("fund_requests")
      .select("*")
      .in("status", ["active", "completed"])
      .in("user_id", villageUserIds)
      .order("created_at", { ascending: false });

    // Fetch archived campaigns for admin
    const { data: archivedData } = await supabase
      .from("fund_requests")
      .select("*")
      .eq("status", "cancelled")
      .in("user_id", villageUserIds)
      .order("created_at", { ascending: false });

    if (!activeError && activeData) {
      const campaignsWithNames = activeData.map(c => ({
        ...c,
        requester_name: userNameMap.get(c.user_id) || "Pemohon"
      }));
      setCampaigns(campaignsWithNames);
    }

    if (archivedData) {
      const archivedWithNames = archivedData.map(c => ({
        ...c,
        requester_name: userNameMap.get(c.user_id) || "Pemohon"
      }));
      setArchivedCampaigns(archivedWithNames);
    }

    setIsLoadingData(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);

    const { error } = await supabase.from("fund_requests").insert({
      user_id: user.id,
      title: formData.title,
      description: formData.description,
      target_amount: parseFloat(formData.target_amount),
      photo_url: formData.photo_url,
    });

    if (error) {
      toast({ variant: "destructive", title: "Ralat", description: "Gagal memulakan kempen." });
    } else {
      toast({ title: "Kempen dimulakan!", description: "Permintaan dana anda telah disiarkan." });
      setFormData({ title: "", description: "", target_amount: "", photo_url: null });
      setShowForm(false);
      fetchCampaigns();
    }
    setIsSubmitting(false);
  };

  const handleDonate = async (campaignId: string, amount: number) => {
    if (!user) return;

    const campaign = campaigns.find((c) => c.id === campaignId);
    if (!campaign) return;

    // Check if campaign is still accepting donations
    const progress = (Number(campaign.current_amount) / Number(campaign.target_amount)) * 100;
    if (progress >= 100 || campaign.status === "completed") {
      toast({ 
        title: "Sasaran Tercapai!", 
        description: "Kempen ini telah mencapai sasaran dana. Terima kasih atas sokongan!" 
      });
      return;
    }

    setDonatingCampaignId(campaignId);

    try {
      // Use the secure RPC function
      const { data: donationId, error } = await supabase.rpc("create_user_donation", {
        _fund_request_id: campaignId,
        _user_id: user.id,
        _amount: amount,
      });

      if (error) {
        // Check if it's the "fund goal reached" error
        if (error.message.includes("Fund Goal Reached")) {
          toast({ 
            title: "Sasaran Tercapai!", 
            description: "Kempen ini telah mencapai sasaran dana. Terima kasih atas sokongan!" 
          });
          fetchCampaigns();
          return;
        }
        throw error;
      }

      // Show receipt
      setDonationData({
        id: donationId as string,
        amount,
        campaignTitle: campaign.title,
        donorName: profile?.name,
        date: new Date(),
      });
      setReceiptOpen(true);

      toast({ title: "Terima kasih!", description: `Sumbangan RM${amount} telah direkodkan.` });
      fetchCampaigns();
    } catch (error: any) {
      console.error("Donation error:", error);
      toast({ variant: "destructive", title: "Ralat", description: "Gagal merekodkan sumbangan." });
    } finally {
      setDonatingCampaignId(null);
    }
  };

  const handleArchive = async (campaignId: string) => {
    try {
      const { error } = await supabase.rpc("archive_fund_request", {
        _fund_request_id: campaignId,
      });

      if (error) throw error;

      toast({ title: "Berjaya", description: "Kempen telah diarkibkan." });
      fetchCampaigns();
    } catch (error: any) {
      console.error("Archive error:", error);
      toast({ variant: "destructive", title: "Ralat", description: "Gagal mengarkibkan kempen." });
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const renderCampaignCard = (campaign: CampaignWithProfile, showArchiveButton: boolean = false) => {
    const progress = (Number(campaign.current_amount) / Number(campaign.target_amount)) * 100;
    const isFullyFunded = progress >= 100 || campaign.status === "completed";
    const remaining = Math.max(0, Number(campaign.target_amount) - Number(campaign.current_amount));

    return (
      <Card key={campaign.id} className="overflow-hidden">
        {campaign.photo_url && (
          <div className="aspect-video w-full overflow-hidden relative">
            <img
              src={campaign.photo_url}
              alt={campaign.title}
              className="w-full h-full object-cover"
            />
            {isFullyFunded && (
              <div className="absolute inset-0 bg-primary/80 flex items-center justify-center">
                <div className="text-center text-primary-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-2" />
                  <p className="font-bold text-lg">Sasaran Tercapai!</p>
                </div>
              </div>
            )}
          </div>
        )}
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>{campaign.title}</CardTitle>
              <CardDescription>👤 {campaign.requester_name}</CardDescription>
            </div>
            <div className="flex gap-2">
              {isFullyFunded ? (
                <Badge className="bg-primary text-primary-foreground">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Tercapai
                </Badge>
              ) : (
                <Badge variant="secondary">Aktif</Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm mb-4 line-clamp-3">{campaign.description}</p>
          
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Sasaran Dana:</span>
              <span className="font-semibold">RM{Number(campaign.target_amount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Dana Terkumpul:</span>
              <span className="font-semibold text-primary">RM{Number(campaign.current_amount).toFixed(2)}</span>
            </div>
            {!isFullyFunded && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Baki Diperlukan:</span>
                <span className="font-semibold">RM{remaining.toFixed(2)}</span>
              </div>
            )}
            <Progress value={Math.min(progress, 100)} className="h-3" />
            <p className="text-xs text-center font-medium">
              {Math.min(progress, 100).toFixed(1)}% tercapai
            </p>
          </div>

          {isFullyFunded ? (
            <div className="bg-primary/10 rounded-lg p-4 text-center">
              <CheckCircle2 className="h-8 w-8 mx-auto text-primary mb-2" />
              <p className="font-semibold text-primary">Fund Goal Reached</p>
              <p className="text-sm text-muted-foreground">Thanks for your donation!</p>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                className="flex-1" 
                onClick={() => handleDonate(campaign.id, 10)}
                disabled={donatingCampaignId === campaign.id}
              >
                {donatingCampaignId === campaign.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Heart className="h-4 w-4 mr-1" />
                    RM10
                  </>
                )}
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="flex-1" 
                onClick={() => handleDonate(campaign.id, 50)}
                disabled={donatingCampaignId === campaign.id}
              >
                {donatingCampaignId === campaign.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Heart className="h-4 w-4 mr-1" />
                    RM50
                  </>
                )}
              </Button>
              <Button 
                size="sm" 
                className="flex-1" 
                onClick={() => handleDonate(campaign.id, 100)}
                disabled={donatingCampaignId === campaign.id}
              >
                {donatingCampaignId === campaign.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Heart className="h-4 w-4 mr-1" />
                    RM100
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Admin Archive Button */}
          {showArchiveButton && isAdmin && isFullyFunded && campaign.status !== "cancelled" && (
            <Button 
              variant="outline" 
              className="w-full mt-3 gap-2"
              onClick={() => handleArchive(campaign.id)}
            >
              <Archive className="h-4 w-4" />
              Arkibkan Kempen
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10">
      <header className="bg-card border-b border-border sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Permintaan Dana</h1>
            <p className="text-sm text-muted-foreground">{userVillage || "Bantu komuniti"}</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Button onClick={() => setShowForm(!showForm)} className="mb-6">
          <DollarSign className="mr-2 h-4 w-4" />
          {showForm ? "Tutup Borang" : "Mulakan Kempen Dana"}
        </Button>

        {showForm && (
          <Card className="mb-8 max-w-2xl">
            <CardHeader>
              <CardTitle>Borang Kempen Dana</CardTitle>
              <CardDescription>Minta bantuan kewangan daripada komuniti</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Tajuk Kempen</Label>
                  <Input
                    id="title"
                    placeholder="Contoh: Bantuan Perubatan, Dana Rumah"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="target_amount">Jumlah Sasaran (RM)</Label>
                  <Input
                    id="target_amount"
                    type="number"
                    placeholder="5000"
                    value={formData.target_amount}
                    onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Penerangan</Label>
                  <Textarea
                    id="description"
                    placeholder="Terangkan tujuan dan keperluan dana..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={5}
                    required
                  />
                </div>
                <ImageUpload
                  onImageUploaded={(url) => setFormData({ ...formData, photo_url: url })}
                  currentImageUrl={formData.photo_url}
                  label="Gambar Kempen"
                  folder="fund-requests"
                />
                <Button type="submit" disabled={isSubmitting}>
                  <Upload className="mr-2 h-4 w-4" />
                  {isSubmitting ? "Menyiarkan..." : "Siarkan Kempen"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {isAdmin ? (
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
              <TabsTrigger value="active">Kempen Aktif</TabsTrigger>
              <TabsTrigger value="archived">Arkib</TabsTrigger>
            </TabsList>

            <TabsContent value="active">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {isLoadingData ? (
                  <div className="col-span-full flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : campaigns.length === 0 ? (
                  <Card className="col-span-full">
                    <CardContent className="py-12 text-center">
                      <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">Tiada kempen dana aktif.</p>
                    </CardContent>
                  </Card>
                ) : (
                  campaigns.map((campaign) => renderCampaignCard(campaign, true))
                )}
              </div>
            </TabsContent>

            <TabsContent value="archived">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {archivedCampaigns.length === 0 ? (
                  <Card className="col-span-full">
                    <CardContent className="py-12 text-center">
                      <Archive className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">Tiada kempen dalam arkib.</p>
                    </CardContent>
                  </Card>
                ) : (
                  archivedCampaigns.map((campaign) => (
                    <Card key={campaign.id} className="overflow-hidden opacity-75">
                      {campaign.photo_url && (
                        <div className="aspect-video w-full overflow-hidden">
                          <img
                            src={campaign.photo_url}
                            alt={campaign.title}
                            className="w-full h-full object-cover grayscale"
                          />
                        </div>
                      )}
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle>{campaign.title}</CardTitle>
                            <CardDescription>👤 {campaign.requester_name}</CardDescription>
                          </div>
                          <Badge variant="outline">Diarkibkan</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Jumlah Terkumpul:</span>
                            <span className="font-semibold">RM{Number(campaign.current_amount).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Sasaran:</span>
                            <span>RM{Number(campaign.target_amount).toFixed(2)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {isLoadingData ? (
              <div className="col-span-full flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : campaigns.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="py-12 text-center">
                  <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Tiada kempen dana aktif.</p>
                </CardContent>
              </Card>
            ) : (
              campaigns.map((campaign) => renderCampaignCard(campaign, false))
            )}
          </div>
        )}

        {/* Donation Receipt */}
        {donationData && (
          <DonationReceipt
            open={receiptOpen}
            onClose={() => setReceiptOpen(false)}
            onDashboard={() => navigate("/dashboard")}
            donation={donationData}
          />
        )}
      </main>
    </div>
  );
};

export default FundRequests;
