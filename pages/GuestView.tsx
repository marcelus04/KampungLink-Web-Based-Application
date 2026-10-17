import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeToggle } from "@/components/ThemeToggle";
import { supabase } from "@/integrations/supabase/client";
import { Bell, LogIn, UserPlus, AlertTriangle, Calendar, Package, DollarSign, MapPin, Target, Heart, MessageSquare, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { ms } from "date-fns/locale";
import logo from "@/assets/logo.png";
import GuestDonationDialog from "@/components/GuestDonationDialog";
import DonationReceipt from "@/components/DonationReceipt";
import GuestContactSellerDialog from "@/components/GuestContactSellerDialog";

interface Announcement {
  id: string;
  title: string;
  content: string;
  category: string | null;
  is_urgent: boolean | null;
  created_at: string;
  image_url: string | null;
}

interface MarketplaceItem {
  id: string;
  title: string;
  description: string;
  price: number;
  photo_url: string | null;
  is_sold: boolean | null;
  created_at: string;
  seller_id: string;
}

interface FundRequest {
  id: string;
  title: string;
  description: string;
  target_amount: number;
  current_amount: number | null;
  photo_url: string | null;
  status: string;
  created_at: string;
}

interface Village {
  village: string;
}

const GuestView = () => {
  const navigate = useNavigate();
  const [villages, setVillages] = useState<Village[]>([]);
  const [selectedVillage, setSelectedVillage] = useState<string>("");
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [marketplaceItems, setMarketplaceItems] = useState<MarketplaceItem[]>([]);
  const [fundRequests, setFundRequests] = useState<FundRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("announcements");
  const [donationDialogOpen, setDonationDialogOpen] = useState(false);
  const [selectedFund, setSelectedFund] = useState<FundRequest | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [donationData, setDonationData] = useState<{
    id: string;
    amount: number;
    campaignTitle: string;
    donorName?: string;
    donorEmail?: string;
    date: Date;
  } | null>(null);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MarketplaceItem | null>(null);

  const handleContactSeller = (item: MarketplaceItem) => {
    setSelectedItem(item);
    setContactDialogOpen(true);
  };

  const handleDonateClick = (fund: FundRequest) => {
    setSelectedFund(fund);
    setDonationDialogOpen(true);
  };

  const handleDonationSuccess = (donation: typeof donationData) => {
    setDonationDialogOpen(false);
    setDonationData(donation);
    setReceiptOpen(true);
    // Refresh fund requests
    fetchVillageData();
  };

  useEffect(() => {
    fetchVillages();
  }, []);

  useEffect(() => {
    if (selectedVillage) {
      fetchVillageData();
    }
  }, [selectedVillage]);

  const fetchVillages = async () => {
    setIsLoading(true);
    try {
      // Use public function to get villages (bypasses RLS)
      const { data, error } = await supabase.rpc("get_public_villages");

      if (error) {
        console.error("Error fetching villages:", error);
      } else if (data) {
        setVillages(data.filter((d: { village_name: string | null }) => d.village_name).map((d: { village_name: string }) => ({ village: d.village_name })));
      }
    } catch (error) {
      console.error("Error fetching villages:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchVillageData = async () => {
    if (!selectedVillage) return;
    
    setIsLoading(true);
    try {
      // Use public RPC functions to fetch village data (bypasses RLS)
      const [announcementsResult, marketplaceResult, fundResult] = await Promise.all([
        supabase.rpc("get_public_announcements", { _village: selectedVillage }),
        supabase.rpc("get_public_marketplace", { _village: selectedVillage }),
        supabase.rpc("get_public_fund_requests", { _village: selectedVillage })
      ]);

      setAnnouncements(announcementsResult.data || []);
      setMarketplaceItems(marketplaceResult.data || []);
      setFundRequests(fundResult.data || []);
    } catch (error) {
      console.error("Error fetching village data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryLabel = (category: string | null) => {
    switch (category) {
      case "urgent": return "Penting";
      case "event": return "Acara";
      case "info": return "Maklumat";
      default: return "Umum";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ms-MY", {
      style: "currency",
      currency: "MYR",
    }).format(amount);
  };

  const getProgressPercentage = (current: number | null, target: number) => {
    if (!current) return 0;
    return Math.min((current / target) * 100, 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-md border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
              <img src={logo} alt="KampungLink" className="h-9" />
              <div>
                <span className="font-semibold text-lg hidden sm:inline">KampungLink</span>
                <Badge variant="secondary" className="ml-2 text-xs">Tetamu</Badge>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button variant="outline" size="sm" onClick={() => navigate("/login")} className="gap-2">
                <LogIn className="h-4 w-4" />
                <span className="hidden sm:inline">Log Masuk</span>
              </Button>
              <Button size="sm" onClick={() => navigate("/register")} className="gap-2">
                <UserPlus className="h-4 w-4" />
                <span className="hidden sm:inline">Daftar</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Village Selection */}
        <Card className="mb-8 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold mb-2">Selamat Datang, Tetamu!</h1>
                <p className="text-muted-foreground">
                  Pilih kampung untuk melihat maklumat awam
                </p>
              </div>
              <div className="w-full md:w-64">
                <Select value={selectedVillage} onValueChange={setSelectedVillage}>
                  <SelectTrigger className="bg-background">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <SelectValue placeholder="Pilih kampung" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {villages.map((v) => (
                      <SelectItem key={v.village} value={v.village}>
                        {v.village}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {!selectedVillage ? (
          /* Prompt to select village */
          <Card className="text-center py-16">
            <CardContent>
              <MapPin className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
              <h2 className="text-xl font-semibold mb-2">Pilih Kampung</h2>
              <p className="text-muted-foreground mb-6">
                Sila pilih kampung di atas untuk melihat pengumuman, pasar, dan permintaan dana
              </p>
              <Button variant="outline" onClick={() => navigate("/register")} className="gap-2">
                <UserPlus className="h-4 w-4" />
                Atau Daftar Akaun untuk Akses Penuh
              </Button>
            </CardContent>
          </Card>
        ) : (
          /* Village Content */
          <>
            <div className="mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                {selectedVillage}
              </h2>
              <p className="text-sm text-muted-foreground">Maklumat awam kampung</p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="bg-card/50 border w-full justify-start overflow-x-auto">
                <TabsTrigger value="announcements" className="gap-2">
                  <Bell className="h-4 w-4" />
                  Pengumuman
                </TabsTrigger>
                <TabsTrigger value="marketplace" className="gap-2">
                  <Package className="h-4 w-4" />
                  Pasar
                </TabsTrigger>
                <TabsTrigger value="fund" className="gap-2">
                  <DollarSign className="h-4 w-4" />
                  Dana
                </TabsTrigger>
              </TabsList>

              {/* Announcements Tab */}
              <TabsContent value="announcements">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="h-5 w-5 text-primary" />
                      Pengumuman Awam
                    </CardTitle>
                    <CardDescription>Berita dan pengumuman terkini dari kampung</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : announcements.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Bell className="h-12 w-12 mx-auto mb-4 opacity-30" />
                        <p>Tiada pengumuman buat masa ini</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {announcements.map((announcement) => (
                          <div
                            key={announcement.id}
                            className={`p-4 rounded-lg border transition-all ${
                              announcement.is_urgent 
                                ? "bg-destructive/5 border-destructive/20" 
                                : "bg-muted/30"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              {announcement.image_url && (
                                <img 
                                  src={announcement.image_url} 
                                  alt="" 
                                  className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                                />
                              )}
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  {announcement.is_urgent && (
                                    <Badge variant="destructive" className="gap-1 text-xs">
                                      <AlertTriangle className="h-3 w-3" />
                                      Penting
                                    </Badge>
                                  )}
                                  <Badge variant="outline">{getCategoryLabel(announcement.category)}</Badge>
                                </div>
                                <h3 className="font-semibold mb-1">{announcement.title}</h3>
                                <p className="text-sm text-muted-foreground line-clamp-2">{announcement.content}</p>
                                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                  <Calendar className="h-3 w-3" />
                                  {format(new Date(announcement.created_at), "d MMM yyyy", { locale: ms })}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Marketplace Tab */}
              <TabsContent value="marketplace">
                <div className="space-y-6">
                  {/* Business Ordering CTA */}
                  <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div>
                          <h3 className="font-semibold text-lg">Pesan dari Perniagaan Kampung</h3>
                          <p className="text-sm text-muted-foreground">
                            Beli dan pesan terus dari perniagaan tempatan dengan sistem pesanan seperti Grab
                          </p>
                        </div>
                        <Button onClick={() => navigate(`/marketplace?village=${encodeURIComponent(selectedVillage)}`)} className="gap-2 whitespace-nowrap">
                          <Package className="h-4 w-4" />
                          Lihat Perniagaan
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Regular Marketplace Items */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5 text-primary" />
                        Pasar Kampung
                      </CardTitle>
                      <CardDescription>Barang untuk dijual oleh penduduk</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                      ) : marketplaceItems.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                          <Package className="h-12 w-12 mx-auto mb-4 opacity-30" />
                          <p>Tiada barang untuk dijual buat masa ini</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {marketplaceItems.map((item) => (
                            <div
                              key={item.id}
                              className="p-4 rounded-lg border bg-card hover:shadow-md transition-all"
                            >
                              {item.photo_url && (
                                <img 
                                  src={item.photo_url} 
                                  alt={item.title} 
                                  className="w-full h-40 rounded-lg object-cover mb-3"
                                />
                              )}
                              <h3 className="font-semibold line-clamp-1">{item.title}</h3>
                              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{item.description}</p>
                              <div className="flex items-center justify-between mt-3">
                                <span className="font-bold text-primary">{formatCurrency(item.price)}</span>
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(item.created_at), "d MMM", { locale: ms })}
                                </span>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full mt-3 gap-2"
                                onClick={() => handleContactSeller(item)}
                              >
                                <MessageSquare className="h-4 w-4" />
                                Hubungi Penjual
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Fund Requests Tab */}
              <TabsContent value="fund">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-primary" />
                      Permintaan Dana
                    </CardTitle>
                    <CardDescription>Kempen bantuan kewangan dari penduduk</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : fundRequests.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-30" />
                        <p>Tiada permintaan dana aktif buat masa ini</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {fundRequests.map((fund) => {
                          const progress = getProgressPercentage(fund.current_amount, fund.target_amount);
                          const isFullyFunded = progress >= 100 || fund.status === "completed";
                          
                          return (
                            <div
                              key={fund.id}
                              className="p-4 rounded-lg border bg-card hover:shadow-md transition-all"
                            >
                              <div className="flex items-start gap-4">
                                {fund.photo_url && (
                                  <div className="relative">
                                    <img 
                                      src={fund.photo_url} 
                                      alt={fund.title} 
                                      className={`w-24 h-24 rounded-lg object-cover flex-shrink-0 ${isFullyFunded ? "opacity-75" : ""}`}
                                    />
                                    {isFullyFunded && (
                                      <div className="absolute inset-0 bg-primary/60 rounded-lg flex items-center justify-center">
                                        <CheckCircle2 className="h-8 w-8 text-primary-foreground" />
                                      </div>
                                    )}
                                  </div>
                                )}
                                <div className="flex-1">
                                  <div className="flex items-start justify-between gap-2">
                                    <h3 className="font-semibold">{fund.title}</h3>
                                    {isFullyFunded && (
                                      <Badge className="bg-primary text-primary-foreground flex-shrink-0">
                                        <CheckCircle2 className="h-3 w-3 mr-1" />
                                        Tercapai
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{fund.description}</p>
                                  
                                  {/* Progress Bar */}
                                  <div className="mt-3">
                                    <div className="flex justify-between text-sm mb-1">
                                      <span className="font-medium text-primary">
                                        {formatCurrency(fund.current_amount || 0)}
                                      </span>
                                      <span className="text-muted-foreground flex items-center gap-1">
                                        <Target className="h-3 w-3" />
                                        {formatCurrency(fund.target_amount)}
                                      </span>
                                    </div>
                                    <div className="w-full bg-muted rounded-full h-2">
                                      <div 
                                        className="bg-primary h-2 rounded-full transition-all"
                                        style={{ width: `${Math.min(progress, 100)}%` }}
                                      />
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {Math.min(progress, 100).toFixed(0)}% tercapai
                                    </p>
                                  </div>

                                  {isFullyFunded ? (
                                    <div className="mt-3 bg-primary/10 rounded-lg p-3 text-center">
                                      <CheckCircle2 className="h-6 w-6 mx-auto text-primary mb-1" />
                                      <p className="font-semibold text-primary text-sm">Fund Goal Reached</p>
                                      <p className="text-xs text-muted-foreground">Thanks for your donation!</p>
                                    </div>
                                  ) : (
                                    <div className="mt-3 flex gap-2">
                                      <Button 
                                        size="sm" 
                                        variant="outline" 
                                        className="flex-1"
                                        onClick={() => handleDonateClick(fund)}
                                      >
                                        <Heart className="h-4 w-4 mr-1" />
                                        RM10
                                      </Button>
                                      <Button 
                                        size="sm" 
                                        variant="outline" 
                                        className="flex-1"
                                        onClick={() => handleDonateClick(fund)}
                                      >
                                        <Heart className="h-4 w-4 mr-1" />
                                        RM50
                                      </Button>
                                      <Button 
                                        size="sm" 
                                        className="flex-1"
                                        onClick={() => handleDonateClick(fund)}
                                      >
                                        <Heart className="h-4 w-4 mr-1" />
                                        Sumbang
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* CTA to Register */}
            <Card className="mt-8 bg-gradient-to-r from-secondary/10 to-secondary/5 border-secondary/20">
              <CardContent className="p-6 text-center">
                <h3 className="font-semibold mb-2">Ingin Akses Penuh?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Daftar akaun untuk menghantar mesej, membuat laporan, dan banyak lagi
                </p>
                <Button onClick={() => navigate("/register")} className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  Daftar Sekarang
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </main>

      {/* Guest Donation Dialog */}
      <GuestDonationDialog
        open={donationDialogOpen}
        onClose={() => setDonationDialogOpen(false)}
        fund={selectedFund}
        onSuccess={handleDonationSuccess}
      />

      {/* Donation Receipt */}
      {donationData && (
        <DonationReceipt
          open={receiptOpen}
          onClose={() => setReceiptOpen(false)}
          onDashboard={() => navigate("/")}
          donation={donationData}
        />
      )}

      {/* Guest Contact Seller Dialog */}
      {selectedItem && (
        <GuestContactSellerDialog
          open={contactDialogOpen}
          onOpenChange={setContactDialogOpen}
          itemId={selectedItem.id}
          itemTitle={selectedItem.title}
          sellerId={selectedItem.seller_id}
        />
      )}

      {/* Footer */}
      <footer className="border-t bg-card mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} KampungLink. Hak Cipta Terpelihara.</p>
        </div>
      </footer>
    </div>
  );
};

export default GuestView;
