import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import TopNavigation from "@/components/TopNavigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { BookOpen, Monitor, Building2, Loader2, Calendar, Clock, CalendarDays } from "lucide-react";
import LibraryBookingForm from "@/components/facility/LibraryBookingForm";
import PusatITBookingForm from "@/components/facility/PusatITBookingForm";
import HallBookingForm from "@/components/facility/HallBookingForm";
import MyBookings from "@/components/facility/MyBookings";
import FacilityCalendar from "@/components/facility/FacilityCalendar";
import BookingSuccessAnimation from "@/components/facility/BookingSuccessAnimation";
import FacilityPayment from "@/components/facility/FacilityPayment";
import FacilityPaymentReceipt from "@/components/facility/FacilityPaymentReceipt";

interface Facility {
  id: string;
  village: string;
  facility_type: 'library' | 'pusat_it' | 'hall';
  name: string;
  description: string | null;
  is_active: boolean;
}

interface FacilityResource {
  id: string;
  facility_id: string;
  name: string;
  resource_type: string;
  capacity: number | null;
  is_active: boolean;
}

interface BookingSuccessData {
  bookingId: string;
  facilityName: string;
  resourceName: string;
  bookingDate: string;
  bookingTime: string;
}

const FacilityBooking = () => {
  const navigate = useNavigate();
  const { user, profile, isLoading: authLoading } = useAuth();
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [resources, setResources] = useState<FacilityResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [activeTab, setActiveTab] = useState("facilities");
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [successData, setSuccessData] = useState<BookingSuccessData | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [paidAmount, setPaidAmount] = useState(50);

  const userVillage = profile?.village || profile?.address;

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
      return;
    }

    if (profile?.approval_status === "pending") {
      navigate("/dashboard");
      return;
    }

    if (userVillage) {
      initializeFacilitiesAndFetch();
    }
  }, [user, profile, authLoading, userVillage]);

  const initializeFacilitiesAndFetch = async () => {
    if (!userVillage) return;

    setLoading(true);
    try {
      // Initialize facilities for this village if they don't exist
      await supabase.rpc('initialize_village_facilities', { _village: userVillage });

      // Fetch facilities
      const { data: facilitiesData, error: facilitiesError } = await supabase
        .from('facilities')
        .select('*')
        .eq('village', userVillage)
        .eq('is_active', true);

      if (facilitiesError) throw facilitiesError;
      setFacilities(facilitiesData || []);

      // Fetch resources for all facilities
      if (facilitiesData && facilitiesData.length > 0) {
        const facilityIds = facilitiesData.map(f => f.id);
        const { data: resourcesData, error: resourcesError } = await supabase
          .from('facility_resources')
          .select('*')
          .in('facility_id', facilityIds)
          .eq('is_active', true);

        if (resourcesError) throw resourcesError;
        setResources(resourcesData || []);
      }
    } catch (error: any) {
      console.error('Error fetching facilities:', error);
      toast({
        title: "Ralat",
        description: "Gagal memuatkan kemudahan",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getFacilityIcon = (type: string) => {
    switch (type) {
      case 'library': return <BookOpen className="h-8 w-8" />;
      case 'pusat_it': return <Monitor className="h-8 w-8" />;
      case 'hall': return <Building2 className="h-8 w-8" />;
      default: return <Building2 className="h-8 w-8" />;
    }
  };

  const getFacilityResources = (facilityId: string) => {
    return resources.filter(r => r.facility_id === facilityId);
  };

  const handleBookingSuccess = (data: BookingSuccessData) => {
    setSuccessData(data);
    setShowSuccessAnimation(true);
    setSelectedFacility(null);
  };

  const handlePayNow = () => {
    setShowSuccessAnimation(false);
    setShowPayment(true);
  };

  const handlePayLater = () => {
    setShowSuccessAnimation(false);
    setSuccessData(null);
    toast({
      title: "Tempahan Disahkan",
      description: "Anda boleh membayar kemudian melalui halaman 'Tempahan Saya'."
    });
    setActiveTab("my-bookings");
  };

  const handlePaymentSuccess = () => {
    setShowPayment(false);
    setShowReceipt(true);
  };

  const handleReceiptClose = () => {
    setShowReceipt(false);
    setSuccessData(null);
    setActiveTab("my-bookings");
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNavigation />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Tempahan Kemudahan</h1>
          <p className="text-muted-foreground">Tempah kemudahan kampung anda secara automatik</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-lg grid-cols-3">
            <TabsTrigger value="facilities" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Kemudahan
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Kalendar
            </TabsTrigger>
            <TabsTrigger value="my-bookings" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Tempahan Saya
            </TabsTrigger>
          </TabsList>

          <TabsContent value="facilities" className="space-y-6">
            {selectedFacility ? (
              <div className="space-y-4">
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedFacility(null)}
                  className="mb-4"
                >
                  ← Kembali ke Senarai Kemudahan
                </Button>

                {selectedFacility.facility_type === 'library' && (
                  <LibraryBookingForm
                    facility={selectedFacility}
                    resources={getFacilityResources(selectedFacility.id)}
                    onSuccess={handleBookingSuccess}
                    onCancel={() => setSelectedFacility(null)}
                  />
                )}

                {selectedFacility.facility_type === 'pusat_it' && (
                  <PusatITBookingForm
                    facility={selectedFacility}
                    resources={getFacilityResources(selectedFacility.id)}
                    onSuccess={handleBookingSuccess}
                    onCancel={() => setSelectedFacility(null)}
                  />
                )}

                {selectedFacility.facility_type === 'hall' && (
                  <HallBookingForm
                    facility={selectedFacility}
                    resources={getFacilityResources(selectedFacility.id)}
                    onSuccess={handleBookingSuccess}
                    onCancel={() => setSelectedFacility(null)}
                  />
                )}
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {facilities.map((facility) => (
                  <Card key={facility.id} className="hover:shadow-lg transition-shadow cursor-pointer group">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="p-3 bg-primary/10 rounded-xl text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                          {getFacilityIcon(facility.facility_type)}
                        </div>
                        <Badge variant="outline" className="capitalize">
                          {facility.facility_type === 'pusat_it' ? 'Pusat IT' : 
                           facility.facility_type === 'library' ? 'Perpustakaan' : 'Dewan'}
                        </Badge>
                      </div>
                      <CardTitle className="mt-4">{facility.name}</CardTitle>
                      <CardDescription>{facility.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                        <Clock className="h-4 w-4" />
                        <span>{getFacilityResources(facility.id).length} sumber tersedia</span>
                      </div>
                      <Button 
                        className="w-full"
                        onClick={() => setSelectedFacility(facility)}
                      >
                        Tempah Sekarang
                      </Button>
                    </CardContent>
                  </Card>
                ))}

                {facilities.length === 0 && (
                  <div className="col-span-full text-center py-12">
                    <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Tiada Kemudahan</h3>
                    <p className="text-muted-foreground">
                      Tiada kemudahan tersedia di kampung anda buat masa ini.
                    </p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="calendar">
            <FacilityCalendar village={userVillage || ''} />
          </TabsContent>

          <TabsContent value="my-bookings">
            <MyBookings village={userVillage || ''} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Success Animation with Pay Now / Pay Later options */}
      {successData && showSuccessAnimation && (
        <BookingSuccessAnimation
          isVisible={showSuccessAnimation}
          onClose={handlePayLater}
          onPayNow={handlePayNow}
          onPayLater={handlePayLater}
          facilityName={successData.facilityName}
          resourceName={successData.resourceName}
          bookingDate={successData.bookingDate}
          bookingTime={successData.bookingTime}
        />
      )}

      {/* Payment Modal */}
      {successData && showPayment && (
        <FacilityPayment
          bookingId={successData.bookingId}
          facilityName={successData.facilityName}
          resourceName={successData.resourceName}
          bookingDate={successData.bookingDate}
          bookingTime={successData.bookingTime}
          totalAmount={50}
          onSuccess={handlePaymentSuccess}
          onCancel={() => {
            setShowPayment(false);
            handlePayLater();
          }}
        />
      )}

      {/* Receipt Modal */}
      {successData && showReceipt && (
        <FacilityPaymentReceipt
          bookingId={successData.bookingId}
          facilityName={successData.facilityName}
          resourceName={successData.resourceName}
          bookingDate={successData.bookingDate}
          bookingTime={successData.bookingTime}
          amountPaid={paidAmount}
          userName={profile?.name || 'Pengguna'}
          onClose={handleReceiptClose}
          onReturnHome={handleReceiptClose}
        />
      )}
    </div>
  );
};

export default FacilityBooking;
