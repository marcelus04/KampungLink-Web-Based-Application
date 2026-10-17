import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ArrowLeft, Store, ShoppingCart, Plus, Minus, X, Receipt, 
  Loader2, Search, DollarSign, TrendingUp, Clock, CheckCircle,
  Edit, Trash2, ShoppingBag, BarChart3, Package, Download,
  ChevronRight, MapPin, AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import ImageUpload from "@/components/ImageUpload";
import { format } from "date-fns";
import { ms } from "date-fns/locale";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RePieChart, Pie, Cell, BarChart, Bar } from "recharts";

interface Business {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  user_id: string;
  village?: string;
  is_active?: boolean;
  created_at: string;
}

interface BusinessItem {
  id: string;
  business_id?: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category: string | null;
  is_available?: boolean;
}

interface CartItem extends BusinessItem {
  quantity: number;
  business_id: string;
  business_name: string;
}

interface OrderReceipt {
  orderId: string;
  businessName: string;
  items: CartItem[];
  totalAmount: number;
  amountPaid: number;
  buyerName: string;
  buyerRole: string;
  date: Date;
}

interface Order {
  id: string;
  guest_name: string | null;
  user_id: string | null;
  total_amount: number;
  amount_paid: number | null;
  status: string;
  created_at: string;
  items?: OrderItem[];
}

interface OrderItem {
  id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

const Marketplace = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user, profile, isAdmin, isLoading: authLoading } = useAuth();
  
  const villageParam = searchParams.get("village");
  const userVillage = isAdmin ? profile?.address : (profile?.village || villageParam);
  
  // View states
  const [currentView, setCurrentView] = useState<"businesses" | "menu" | "cart" | "checkout" | "receipt">("businesses");
  const [mainTab, setMainTab] = useState<"buy" | "my-business">("buy");
  
  // Data states
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [menuItems, setMenuItems] = useState<BusinessItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Checkout states
  const [receipt, setReceipt] = useState<OrderReceipt | null>(null);
  const [buyerName, setBuyerName] = useState("");
  const [buyerContact, setBuyerContact] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Seller states
  const [myBusiness, setMyBusiness] = useState<Business | null>(null);
  const [myItems, setMyItems] = useState<BusinessItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [sellerTab, setSellerTab] = useState("overview");
  const [showItemDialog, setShowItemDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<BusinessItem | null>(null);
  const [itemForm, setItemForm] = useState({ name: "", description: "", price: "", category: "", image_url: "" });
  const [showBusinessDialog, setShowBusinessDialog] = useState(false);
  const [businessForm, setBusinessForm] = useState({ name: "", description: "", image_url: "" });
  const [chartPeriod, setChartPeriod] = useState<"7" | "30" | "90">("7");

  // Determine user role for display
  const getUserRole = () => {
    if (!user) return "Tetamu";
    if (isAdmin) return "Admin";
    const role = profile?.approval_status === "approved" ? "Penduduk" : "Pengguna";
    return role;
  };

  useEffect(() => {
    if (userVillage) {
      fetchBusinesses();
    }
    if (user) {
      fetchMyBusiness();
    }
  }, [userVillage, user]);

  useEffect(() => {
    if (selectedBusiness) {
      fetchMenuItems(selectedBusiness.id);
    }
  }, [selectedBusiness]);

  useEffect(() => {
    if (myBusiness) {
      fetchMyItems();
      fetchOrders();
    }
  }, [myBusiness]);

  const fetchBusinesses = async () => {
    if (!userVillage) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc("get_public_businesses", { _village: userVillage });
      if (error) throw error;
      setBusinesses(data || []);
    } catch (error) {
      console.error("Error fetching businesses:", error);
      toast({ title: "Ralat memuatkan perniagaan", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMenuItems = async (businessId: string) => {
    try {
      const { data, error } = await supabase.rpc("get_business_items", { _business_id: businessId });
      if (error) throw error;
      setMenuItems(data || []);
    } catch (error) {
      console.error("Error fetching menu items:", error);
    }
  };

  const openBusinessMenu = (business: Business) => {
    setSelectedBusiness(business);
    setCurrentView("menu");
    setSearchQuery("");
  };

  const addToCart = (item: BusinessItem) => {
    if (!selectedBusiness) return;
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { 
        ...item, 
        quantity: 1, 
        business_id: selectedBusiness.id, 
        business_name: selectedBusiness.name 
      }];
    });
    toast({ title: "Ditambah ke troli", description: item.name });
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === itemId) {
        const newQty = Math.max(0, item.quantity + delta);
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(item => item.id !== itemId));
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ms-MY", { style: "currency", currency: "MYR" }).format(amount);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    
    const name = user ? (profile?.name || "Pengguna") : buyerName;
    if (!user && !name.trim()) {
      toast({ title: "Sila masukkan nama anda", variant: "destructive" });
      return;
    }
    
    const paid = parseFloat(amountPaid) || 0;
    if (paid <= 0) {
      toast({ title: "Sila masukkan jumlah bayaran", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      // Group cart items by business_id
      const itemsByBusiness = cart.reduce((acc, item) => {
        if (!acc[item.business_id]) acc[item.business_id] = [];
        acc[item.business_id].push(item);
        return acc;
      }, {} as Record<string, CartItem[]>);

      let firstOrderId = "";
      let firstBusinessName = "";
      
      for (const [businessId, businessItems] of Object.entries(itemsByBusiness)) {
        const businessTotal = businessItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const businessPaidRatio = businessTotal / totalAmount;
        const businessPaid = paid * businessPaidRatio;
        
        const itemsJson = businessItems.map(item => ({
          item_id: item.id,
          item_name: item.name,
          quantity: item.quantity,
          unit_price: item.price,
          subtotal: item.price * item.quantity
        }));

        const { data: orderId, error } = await supabase.rpc("create_business_order", {
          _business_id: businessId,
          _guest_name: user ? null : name,
          _guest_contact: user ? null : buyerContact,
          _total_amount: businessTotal,
          _amount_paid: businessPaid,
          _items: itemsJson
        });

        if (error) throw error;
        if (!firstOrderId) {
          firstOrderId = orderId;
          firstBusinessName = businessItems[0].business_name;
        }
      }

      setReceipt({
        orderId: firstOrderId,
        businessName: firstBusinessName,
        items: [...cart],
        totalAmount,
        amountPaid: paid,
        buyerName: name,
        buyerRole: getUserRole(),
        date: new Date()
      });
      
      setCart([]);
      setCurrentView("receipt");
      toast({ title: "Pesanan berjaya!", description: "Resit telah dijana" });
    } catch (error) {
      console.error("Error creating order:", error);
      toast({ title: "Ralat", description: "Gagal membuat pesanan", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Seller functions
  const fetchMyBusiness = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("businesses")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      setMyBusiness(data);
    } catch (error) {
      console.error("Error fetching business:", error);
    }
  };

  const fetchMyItems = async () => {
    if (!myBusiness) return;
    try {
      const { data, error } = await supabase
        .from("business_items")
        .select("*")
        .eq("business_id", myBusiness.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setMyItems(data || []);
    } catch (error) {
      console.error("Error fetching items:", error);
    }
  };

  const fetchOrders = async () => {
    if (!myBusiness) return;
    try {
      const { data, error } = await supabase
        .from("business_orders")
        .select("*")
        .eq("business_id", myBusiness.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      
      const ordersWithItems = await Promise.all((data || []).map(async (order) => {
        const { data: orderItems } = await supabase
          .from("business_order_items")
          .select("*")
          .eq("order_id", order.id);
        return { ...order, items: orderItems || [] };
      }));
      
      setOrders(ordersWithItems);
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  const createBusiness = async () => {
    if (!user || !userVillage) return;
    if (!businessForm.name.trim()) {
      toast({ title: "Sila masukkan nama perniagaan", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from("businesses")
        .insert({
          user_id: user.id,
          name: businessForm.name,
          description: businessForm.description,
          image_url: businessForm.image_url || null,
          village: userVillage
        })
        .select()
        .single();
      if (error) throw error;
      setMyBusiness(data);
      setShowBusinessDialog(false);
      setBusinessForm({ name: "", description: "", image_url: "" });
      toast({ title: "Perniagaan berjaya didaftarkan!" });
      fetchBusinesses();
    } catch (error) {
      console.error("Error creating business:", error);
      toast({ title: "Ralat", description: "Gagal mendaftarkan perniagaan", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateBusiness = async () => {
    if (!myBusiness) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("businesses")
        .update({
          name: businessForm.name,
          description: businessForm.description,
          image_url: businessForm.image_url || null
        })
        .eq("id", myBusiness.id);
      if (error) throw error;
      setMyBusiness({ ...myBusiness, ...businessForm });
      setShowBusinessDialog(false);
      toast({ title: "Perniagaan dikemaskini!" });
      fetchBusinesses();
    } catch (error) {
      toast({ title: "Ralat", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveItem = async () => {
    if (!myBusiness) return;
    if (!itemForm.name.trim() || !itemForm.price) {
      toast({ title: "Sila lengkapkan maklumat item", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      if (editingItem) {
        const { error } = await supabase
          .from("business_items")
          .update({
            name: itemForm.name,
            description: itemForm.description,
            price: parseFloat(itemForm.price),
            category: itemForm.category || null,
            image_url: itemForm.image_url || null
          })
          .eq("id", editingItem.id);
        if (error) throw error;
        toast({ title: "Item dikemaskini!" });
      } else {
        const { error } = await supabase
          .from("business_items")
          .insert({
            business_id: myBusiness.id,
            name: itemForm.name,
            description: itemForm.description,
            price: parseFloat(itemForm.price),
            category: itemForm.category || null,
            image_url: itemForm.image_url || null
          });
        if (error) throw error;
        toast({ title: "Item ditambah!" });
      }
      setShowItemDialog(false);
      setEditingItem(null);
      setItemForm({ name: "", description: "", price: "", category: "", image_url: "" });
      fetchMyItems();
    } catch (error) {
      toast({ title: "Ralat", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteItem = async (itemId: string) => {
    if (!confirm("Padam item ini?")) return;
    try {
      const { error } = await supabase.from("business_items").delete().eq("id", itemId);
      if (error) throw error;
      toast({ title: "Item dipadam!" });
      fetchMyItems();
    } catch (error) {
      toast({ title: "Ralat", variant: "destructive" });
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const { error } = await supabase
        .from("business_orders")
        .update({ status })
        .eq("id", orderId);
      if (error) throw error;
      toast({ title: "Status dikemaskini!" });
      fetchOrders();
    } catch (error) {
      toast({ title: "Ralat", variant: "destructive" });
    }
  };

  // Stats calculations
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === "pending").length;
  const completedOrders = orders.filter(o => o.status === "completed").length;
  const totalSales = orders.filter(o => o.status === "completed").reduce((sum, o) => sum + (o.amount_paid || 0), 0);
  
  const getDaysAgo = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date;
  };
  
  const periodDays = parseInt(chartPeriod);
  const periodOrders = orders.filter(o => new Date(o.created_at) >= getDaysAgo(periodDays));
  const periodSales = periodOrders.reduce((sum, o) => sum + (o.amount_paid || 0), 0);

  const salesData = (() => {
    const days = parseInt(chartPeriod);
    const data: { date: string; sales: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = format(date, "d/M");
      const daySales = orders
        .filter(o => format(new Date(o.created_at), "d/M") === dateStr)
        .reduce((sum, o) => sum + (o.amount_paid || 0), 0);
      data.push({ date: dateStr, sales: daySales });
    }
    return data;
  })();

  const statusData = [
    { name: "Selesai", value: completedOrders },
    { name: "Menunggu", value: pendingOrders }
  ];

  const topItemsData = (() => {
    const itemCounts: Record<string, { name: string; count: number }> = {};
    orders.forEach(order => {
      order.items?.forEach(item => {
        if (!itemCounts[item.item_name]) {
          itemCounts[item.item_name] = { name: item.item_name, count: 0 };
        }
        itemCounts[item.item_name].count += item.quantity;
      });
    });
    return Object.values(itemCounts).sort((a, b) => b.count - a.count).slice(0, 5);
  })();

  const filteredBusinesses = businesses.filter(b => 
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredMenuItems = menuItems.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Receipt View
  if (currentView === "receipt" && receipt) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10 p-4">
        <Card className="max-w-md mx-auto shadow-lg">
          <CardContent className="p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Receipt className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold">Resit Pesanan</h2>
              <p className="text-sm text-muted-foreground">#{receipt.orderId.slice(0, 8).toUpperCase()}</p>
            </div>
            
            <div className="bg-muted/50 rounded-lg p-3 mb-4">
              <p className="font-medium">{receipt.businessName}</p>
              <p className="text-xs text-muted-foreground">{format(receipt.date, "d MMMM yyyy, HH:mm", { locale: ms })}</p>
            </div>
            
            <div className="border-t border-b py-4 my-4 space-y-2">
              {receipt.items.map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="flex-1">{item.name} <span className="text-muted-foreground">x{item.quantity}</span></span>
                  <span className="font-medium">{formatCurrency(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span>Jumlah</span>
                <span className="font-semibold">{formatCurrency(receipt.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-primary">
                <span>Dibayar</span>
                <span className="font-bold">{formatCurrency(receipt.amountPaid)}</span>
              </div>
              {receipt.amountPaid < receipt.totalAmount && (
                <div className="flex justify-between text-destructive text-sm">
                  <span>Baki</span>
                  <span>{formatCurrency(receipt.totalAmount - receipt.amountPaid)}</span>
                </div>
              )}
            </div>
            
            <div className="bg-muted/30 rounded-lg p-3 text-sm">
              <p><span className="text-muted-foreground">Pembeli:</span> {receipt.buyerName}</p>
              <p><span className="text-muted-foreground">Peranan:</span> {receipt.buyerRole}</p>
            </div>
            
            <div className="mt-6 space-y-2">
              <Button className="w-full" onClick={() => window.print()}>
                <Download className="h-4 w-4 mr-2" />
                Simpan / Cetak Resit
              </Button>
              <Button variant="outline" className="w-full" onClick={() => {
                setCurrentView("businesses");
                setSelectedBusiness(null);
                setReceipt(null);
                navigate(user ? "/dashboard" : "/guest");
              }}>
                Kembali ke Utama
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Checkout View
  if (currentView === "checkout") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10 p-4">
        <Card className="max-w-md mx-auto shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <Button variant="ghost" size="icon" onClick={() => setCurrentView("cart")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h2 className="text-xl font-bold">Pembayaran</h2>
            </div>
            
            <div className="border rounded-lg p-4 mb-4 bg-muted/30">
              <h3 className="font-semibold mb-3">Ringkasan Pesanan</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>{item.name} <span className="text-muted-foreground">x{item.quantity}</span></span>
                    <span>{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t mt-3 pt-3 flex justify-between font-bold text-lg">
                <span>Jumlah</span>
                <span className="text-primary">{formatCurrency(totalAmount)}</span>
              </div>
            </div>
            
            {!user && (
              <div className="space-y-3 mb-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Nama Anda *</label>
                  <Input 
                    placeholder="Masukkan nama anda" 
                    value={buyerName} 
                    onChange={(e) => setBuyerName(e.target.value)} 
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Telefon / Email (pilihan)</label>
                  <Input 
                    placeholder="Untuk resit digital" 
                    value={buyerContact} 
                    onChange={(e) => setBuyerContact(e.target.value)} 
                  />
                </div>
              </div>
            )}
            
            <div className="space-y-2 mb-6">
              <label className="text-sm font-medium block">Jumlah Bayaran (RM) *</label>
              <Input 
                type="number" 
                placeholder="0.00" 
                value={amountPaid} 
                onChange={(e) => setAmountPaid(e.target.value)} 
                className="text-lg h-12"
              />
              <p className="text-xs text-muted-foreground">Masukkan jumlah yang anda bayar</p>
            </div>
            
            <Button className="w-full h-12" size="lg" onClick={handleCheckout} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
              Sahkan Pembayaran
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Cart View
  if (currentView === "cart") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10 p-4">
        <Card className="max-w-md mx-auto shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => setCurrentView(selectedBusiness ? "menu" : "businesses")}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <h2 className="text-xl font-bold">Troli Anda</h2>
              </div>
              <Badge variant="secondary">{cartCount} item</Badge>
            </div>
            
            {cart.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
                <p className="text-muted-foreground">Troli anda kosong</p>
                <Button variant="outline" className="mt-4" onClick={() => setCurrentView("businesses")}>
                  Mula Membeli
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-3 mb-6 max-h-[50vh] overflow-y-auto">
                  {cart.map(item => (
                    <div key={item.id} className="flex items-center gap-3 p-3 border rounded-xl bg-card">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="w-16 h-16 rounded-lg object-cover" />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                          <Package className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{item.name}</h4>
                        <p className="text-sm text-primary font-semibold">{formatCurrency(item.price)}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.id, -1)}>
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.id, 1)}>
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive ml-1" onClick={() => removeFromCart(item.id)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg font-bold mb-4">
                    <span>Jumlah</span>
                    <span className="text-primary">{formatCurrency(totalAmount)}</span>
                  </div>
                  <Button className="w-full h-12" size="lg" onClick={() => setCurrentView("checkout")}>
                    Teruskan ke Pembayaran
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Menu View (Business Items)
  if (currentView === "menu" && selectedBusiness) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10 pb-24">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-card/95 backdrop-blur border-b shadow-sm">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => {
                setCurrentView("businesses");
                setSelectedBusiness(null);
              }}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex-1 min-w-0">
                <h1 className="font-bold text-lg truncate">{selectedBusiness.name}</h1>
                <p className="text-xs text-muted-foreground truncate">{selectedBusiness.description || "Perniagaan Tempatan"}</p>
              </div>
              {selectedBusiness.image_url && (
                <img src={selectedBusiness.image_url} alt="" className="w-10 h-10 rounded-full object-cover" />
              )}
            </div>
            <div className="mt-3 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Cari menu..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="container mx-auto px-4 py-4">
          {filteredMenuItems.length === 0 ? (
            <div className="text-center py-16">
              <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
              <p className="text-muted-foreground text-lg">Tiada item dalam menu</p>
              <p className="text-sm text-muted-foreground mt-1">Perniagaan ini belum menambah produk</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filteredMenuItems.map(item => (
                <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-all duration-200 group">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="w-full h-32 object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="w-full h-32 bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                      <Package className="h-10 w-10 text-muted-foreground/50" />
                    </div>
                  )}
                  <CardContent className="p-3">
                    <h3 className="font-semibold text-sm line-clamp-1">{item.name}</h3>
                    {item.category && (
                      <Badge variant="outline" className="text-[10px] mt-1">{item.category}</Badge>
                    )}
                    {item.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{item.description}</p>
                    )}
                    <div className="flex items-center justify-between mt-3">
                      <span className="font-bold text-primary">{formatCurrency(item.price)}</span>
                      <Button size="sm" className="h-9 w-9 p-0 rounded-full" onClick={() => addToCart(item)}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Floating Cart Button */}
        {cartCount > 0 && (
          <div className="fixed bottom-4 left-4 right-4 z-50">
            <Button className="w-full h-14 text-base shadow-xl rounded-2xl" onClick={() => setCurrentView("cart")}>
              <ShoppingCart className="h-5 w-5 mr-2" />
              Lihat Troli ({cartCount}) - {formatCurrency(totalAmount)}
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Main Pasar View - Business List
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-card/95 backdrop-blur border-b shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(user ? "/dashboard" : "/guest")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="font-bold text-lg">Pasar Kampung</h1>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span>{userVillage || "Pilih kampung"}</span>
              </div>
            </div>
            <Badge variant="outline" className="text-xs">{getUserRole()}</Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4">
        <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as "buy" | "my-business")}>
          <TabsList className="w-full mb-4 h-12">
            <TabsTrigger value="buy" className="flex-1 gap-2 text-base">
              <ShoppingBag className="h-4 w-4" /> Beli
            </TabsTrigger>
            {user && (
              <TabsTrigger value="my-business" className="flex-1 gap-2 text-base">
                <Store className="h-4 w-4" /> Perniagaan Saya
              </TabsTrigger>
            )}
          </TabsList>

          {/* Buy Tab - Shows All Businesses */}
          <TabsContent value="buy" className="mt-0">
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Cari perniagaan..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                className="pl-10 h-11"
              />
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !userVillage ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="font-medium mb-2">Pilih kampung terlebih dahulu</p>
                  <p className="text-sm text-muted-foreground">Sila pilih kampung untuk melihat perniagaan</p>
                </CardContent>
              </Card>
            ) : businesses.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Store className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
                  <p className="text-lg font-medium mb-2">Tiada perniagaan di kampung ini</p>
                  <p className="text-sm text-muted-foreground mb-4">Jadilah yang pertama menjual di sini!</p>
                  {user && (
                    <Button onClick={() => setMainTab("my-business")}>
                      <Plus className="h-4 w-4 mr-2" />
                      Daftar Perniagaan
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : filteredBusinesses.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                  <p>Tiada perniagaan ditemui untuk "{searchQuery}"</p>
                  <Button variant="outline" className="mt-4" onClick={() => setSearchQuery("")}>
                    Padam Carian
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {filteredBusinesses.map(business => (
                  <Card 
                    key={business.id} 
                    className="overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200 active:scale-[0.98]"
                    onClick={() => openBusinessMenu(business)}
                  >
                    <div className="flex">
                      {business.image_url ? (
                        <img src={business.image_url} alt={business.name} className="w-24 h-24 object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0">
                          <Store className="h-8 w-8 text-primary/50" />
                        </div>
                      )}
                      <div className="p-3 flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{business.name}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {business.description || "Perniagaan tempatan"}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <Badge variant="secondary" className="text-[10px]">Buka</Badge>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Floating Cart Button */}
            {cartCount > 0 && (
              <div className="fixed bottom-4 left-4 right-4 z-50">
                <Button className="w-full h-14 text-base shadow-xl rounded-2xl" onClick={() => setCurrentView("cart")}>
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Lihat Troli ({cartCount}) - {formatCurrency(totalAmount)}
                </Button>
              </div>
            )}
          </TabsContent>

          {/* My Business Tab */}
          {user && (
            <TabsContent value="my-business" className="mt-0">
              {!myBusiness ? (
                <Card>
                  <CardHeader className="text-center pb-2">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Store className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle>Daftar Perniagaan Anda</CardTitle>
                    <CardDescription>Mula menjual produk dan perkhidmatan di kampung anda</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full" size="lg" onClick={() => setShowBusinessDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Daftar Sekarang
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {/* Business Header */}
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        {myBusiness.image_url ? (
                          <img src={myBusiness.image_url} alt="" className="w-14 h-14 rounded-lg object-cover" />
                        ) : (
                          <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Store className="h-6 w-6 text-primary" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold truncate">{myBusiness.name}</h3>
                          <p className="text-sm text-muted-foreground truncate">{myBusiness.description}</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => {
                          setBusinessForm({ 
                            name: myBusiness.name, 
                            description: myBusiness.description || "", 
                            image_url: myBusiness.image_url || "" 
                          });
                          setShowBusinessDialog(true);
                        }}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Seller Tabs */}
                  <Tabs value={sellerTab} onValueChange={setSellerTab}>
                    <TabsList className="w-full">
                      <TabsTrigger value="overview" className="flex-1 text-xs">Ringkasan</TabsTrigger>
                      <TabsTrigger value="orders" className="flex-1 text-xs">Pesanan</TabsTrigger>
                      <TabsTrigger value="products" className="flex-1 text-xs">Produk</TabsTrigger>
                      <TabsTrigger value="analytics" className="flex-1 text-xs">Analisis</TabsTrigger>
                    </TabsList>

                    {/* Overview Tab */}
                    <TabsContent value="overview" className="space-y-3 mt-4">
                      <div className="grid grid-cols-2 gap-3">
                        <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-2 text-primary mb-1">
                              <ShoppingBag className="h-4 w-4" />
                              <span className="text-xs font-medium">Jumlah Pesanan</span>
                            </div>
                            <p className="text-2xl font-bold">{totalOrders}</p>
                          </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-2 text-green-600 mb-1">
                              <DollarSign className="h-4 w-4" />
                              <span className="text-xs font-medium">Jumlah Jualan</span>
                            </div>
                            <p className="text-2xl font-bold">{formatCurrency(totalSales)}</p>
                          </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-2 text-amber-600 mb-1">
                              <Clock className="h-4 w-4" />
                              <span className="text-xs font-medium">Menunggu</span>
                            </div>
                            <p className="text-2xl font-bold">{pendingOrders}</p>
                          </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-2 text-blue-600 mb-1">
                              <CheckCircle className="h-4 w-4" />
                              <span className="text-xs font-medium">Selesai</span>
                            </div>
                            <p className="text-2xl font-bold">{completedOrders}</p>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Quick Actions */}
                      <Card>
                        <CardContent className="p-4">
                          <h4 className="font-semibold mb-3">Tindakan Pantas</h4>
                          <div className="grid grid-cols-2 gap-2">
                            <Button variant="outline" className="justify-start" onClick={() => setSellerTab("orders")}>
                              <Clock className="h-4 w-4 mr-2" />
                              Lihat Pesanan
                            </Button>
                            <Button variant="outline" className="justify-start" onClick={() => {
                              setEditingItem(null);
                              setItemForm({ name: "", description: "", price: "", category: "", image_url: "" });
                              setShowItemDialog(true);
                            }}>
                              <Plus className="h-4 w-4 mr-2" />
                              Tambah Produk
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    {/* Orders Tab */}
                    <TabsContent value="orders" className="mt-4">
                      {orders.length === 0 ? (
                        <Card>
                          <CardContent className="py-12 text-center">
                            <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                            <p className="text-muted-foreground">Tiada pesanan lagi</p>
                          </CardContent>
                        </Card>
                      ) : (
                        <div className="space-y-3">
                          {orders.map(order => (
                            <Card key={order.id}>
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-3">
                                  <div>
                                    <p className="font-semibold">{order.guest_name || "Pelanggan Berdaftar"}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {format(new Date(order.created_at), "d MMM yyyy, HH:mm", { locale: ms })}
                                    </p>
                                  </div>
                                  <Badge variant={order.status === "completed" ? "default" : "secondary"}>
                                    {order.status === "pending" ? "Menunggu" : "Selesai"}
                                  </Badge>
                                </div>
                                
                                <div className="space-y-1 text-sm border-t pt-3">
                                  {order.items?.map(item => (
                                    <div key={item.id} className="flex justify-between">
                                      <span>{item.item_name} x{item.quantity}</span>
                                      <span>{formatCurrency(item.subtotal)}</span>
                                    </div>
                                  ))}
                                </div>
                                
                                <div className="flex items-center justify-between mt-3 pt-3 border-t">
                                  <div>
                                    <p className="text-sm">Jumlah: <span className="font-bold">{formatCurrency(order.total_amount)}</span></p>
                                    <p className="text-xs text-muted-foreground">
                                      Dibayar: {formatCurrency(order.amount_paid || 0)}
                                    </p>
                                  </div>
                                  {order.status === "pending" && (
                                    <Button size="sm" onClick={() => updateOrderStatus(order.id, "completed")}>
                                      <CheckCircle className="h-4 w-4 mr-1" />
                                      Selesai
                                    </Button>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </TabsContent>

                    {/* Products Tab */}
                    <TabsContent value="products" className="mt-4">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-semibold">Produk ({myItems.length})</h4>
                        <Button size="sm" onClick={() => {
                          setEditingItem(null);
                          setItemForm({ name: "", description: "", price: "", category: "", image_url: "" });
                          setShowItemDialog(true);
                        }}>
                          <Plus className="h-4 w-4 mr-1" />
                          Tambah
                        </Button>
                      </div>
                      
                      {myItems.length === 0 ? (
                        <Card>
                          <CardContent className="py-12 text-center">
                            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                            <p className="text-muted-foreground">Tiada produk lagi</p>
                            <Button className="mt-4" onClick={() => {
                              setEditingItem(null);
                              setItemForm({ name: "", description: "", price: "", category: "", image_url: "" });
                              setShowItemDialog(true);
                            }}>
                              Tambah Produk Pertama
                            </Button>
                          </CardContent>
                        </Card>
                      ) : (
                        <div className="space-y-3">
                          {myItems.map(item => (
                            <Card key={item.id}>
                              <CardContent className="p-3">
                                <div className="flex gap-3">
                                  {item.image_url ? (
                                    <img src={item.image_url} alt="" className="w-16 h-16 rounded-lg object-cover" />
                                  ) : (
                                    <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                                      <Package className="h-6 w-6 text-muted-foreground" />
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <h5 className="font-medium truncate">{item.name}</h5>
                                    <p className="text-sm text-primary font-semibold">{formatCurrency(item.price)}</p>
                                    {item.category && (
                                      <Badge variant="outline" className="text-[10px] mt-1">{item.category}</Badge>
                                    )}
                                  </div>
                                  <div className="flex gap-1">
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                                      setEditingItem(item);
                                      setItemForm({
                                        name: item.name,
                                        description: item.description || "",
                                        price: item.price.toString(),
                                        category: item.category || "",
                                        image_url: item.image_url || ""
                                      });
                                      setShowItemDialog(true);
                                    }}>
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteItem(item.id)}>
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </TabsContent>

                    {/* Analytics Tab */}
                    <TabsContent value="analytics" className="mt-4 space-y-4">
                      {/* Period Selector */}
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">Analisis Jualan</h4>
                        <Select value={chartPeriod} onValueChange={(v) => setChartPeriod(v as "7" | "30" | "90")}>
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="7">7 Hari</SelectItem>
                            <SelectItem value="30">30 Hari</SelectItem>
                            <SelectItem value="90">90 Hari</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Sales Summary */}
                      <Card>
                        <CardContent className="p-4">
                          <p className="text-sm text-muted-foreground mb-1">Jualan {chartPeriod} Hari</p>
                          <p className="text-2xl font-bold text-primary">{formatCurrency(periodSales)}</p>
                          <p className="text-xs text-muted-foreground">{periodOrders.length} pesanan</p>
                        </CardContent>
                      </Card>

                      {/* Sales Over Time */}
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            Jualan Mengikut Masa
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={salesData}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                <XAxis dataKey="date" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                                <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" />
                                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                                <Line type="monotone" dataKey="sales" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Top Selling Items */}
                      {topItemsData.length > 0 && (
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <BarChart3 className="h-4 w-4" />
                              Produk Terlaris
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="h-48">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={topItemsData} layout="vertical">
                                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                  <XAxis type="number" tick={{ fontSize: 10 }} />
                                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={80} />
                                  <Tooltip />
                                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={4} />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Order Status Breakdown */}
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Status Pesanan</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                              <RePieChart>
                                <Pie
                                  data={statusData}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={40}
                                  outerRadius={70}
                                  paddingAngle={5}
                                  dataKey="value"
                                  label={({ name, value }) => `${name}: ${value}`}
                                >
                                  {statusData.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                  ))}
                                </Pie>
                                <Tooltip />
                              </RePieChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Business Dialog */}
      <Dialog open={showBusinessDialog} onOpenChange={setShowBusinessDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{myBusiness ? "Edit Perniagaan" : "Daftar Perniagaan"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Nama Perniagaan *</label>
              <Input 
                placeholder="cth: Kedai Makan Mak Cik"
                value={businessForm.name}
                onChange={(e) => setBusinessForm({ ...businessForm, name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Penerangan</label>
              <Input 
                placeholder="Makanan tradisional kampung"
                value={businessForm.description}
                onChange={(e) => setBusinessForm({ ...businessForm, description: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Logo / Gambar</label>
              <ImageUpload
                currentImageUrl={businessForm.image_url}
                onImageUploaded={(url) => setBusinessForm({ ...businessForm, image_url: url || "" })}
                folder="businesses"
              />
            </div>
            <Button 
              className="w-full" 
              onClick={myBusiness ? updateBusiness : createBusiness}
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {myBusiness ? "Kemaskini" : "Daftar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Item Dialog */}
      <Dialog open={showItemDialog} onOpenChange={setShowItemDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Produk" : "Tambah Produk"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Nama Produk *</label>
              <Input 
                placeholder="cth: Nasi Lemak Ayam"
                value={itemForm.name}
                onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Harga (RM) *</label>
              <Input 
                type="number"
                placeholder="0.00"
                value={itemForm.price}
                onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Kategori</label>
              <Input 
                placeholder="cth: Makanan, Minuman"
                value={itemForm.category}
                onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Penerangan</label>
              <Input 
                placeholder="Penerangan ringkas produk"
                value={itemForm.description}
                onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Gambar</label>
              <ImageUpload
                currentImageUrl={itemForm.image_url}
                onImageUploaded={(url) => setItemForm({ ...itemForm, image_url: url || "" })}
                folder="products"
              />
            </div>
            <Button 
              className="w-full" 
              onClick={saveItem}
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editingItem ? "Kemaskini" : "Tambah"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Marketplace;
