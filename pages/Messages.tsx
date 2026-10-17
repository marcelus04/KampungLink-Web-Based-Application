import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Send, MessageSquare, Pencil, Trash2, X, Check, Reply, CornerDownRight, ImageIcon, Loader2, Crown, MapPin, Calendar, Pin, PinOff, Bell, Users, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { ms } from "date-fns/locale";
import AdminAnnouncementsTab from "@/components/AdminAnnouncementsTab";

interface MessageWithProfile {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  reply_to: string | null;
  image_url?: string | null;
  is_pinned?: boolean;
  sender_name?: string;
  sender_village?: string;
  reply_to_content?: string;
  reply_to_name?: string;
  is_ketua?: boolean;
  is_admin?: boolean;
}

interface KetuaInfo {
  ketua_name: string;
  ketua_id: string;
}

type TabType = "all" | "admin";

const Messages = () => {
  const [messages, setMessages] = useState<MessageWithProfile[]>([]);
  const [pinnedMessage, setPinnedMessage] = useState<MessageWithProfile | null>(null);
  const [ketuaInfo, setKetuaInfo] = useState<KetuaInfo | null>(null);
  const [adminUserIds, setAdminUserIds] = useState<Set<string>>(new Set());
  const [newMessage, setNewMessage] = useState("");
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [replyingTo, setReplyingTo] = useState<MessageWithProfile | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isPinning, setIsPinning] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
      console.log("[Messages] Fetching for village:", userVillage);
      fetchKetuaInfo();
      fetchMessages();

      // Subscribe to realtime messages
      const channel = supabase
        .channel("messages-channel")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "messages" },
          () => {
            fetchMessages();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, profile, userVillage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchKetuaInfo = async () => {
    if (!userVillage) return;

    console.log("[Messages] Fetching Ketua info for village:", userVillage);
    const { data, error } = await supabase.rpc("get_village_ketua", {
      _village: userVillage
    });

    if (!error && data && data.length > 0) {
      console.log("[Messages] Ketua found:", data[0]);
      setKetuaInfo(data[0]);
    } else {
      console.log("[Messages] No Ketua found or error:", error);
    }
  };

  const fetchMessages = async () => {
    if (!userVillage) {
      console.log("[Messages] No village set, skipping fetch");
      setIsLoadingData(false);
      return;
    }

    // Get residents from the same village
    const { data: villageResidents, error: resError } = await supabase
      .from("profiles")
      .select("user_id, name, village")
      .eq("village", userVillage)
      .eq("approval_status", "approved");

    console.log("[Messages] Village residents query result:", villageResidents?.length, "Error:", resError);

    // Get admins/JKKK who have this village as their address
    const { data: villageAdmins, error: adminError } = await supabase
      .from("profiles")
      .select("user_id, name, address")
      .eq("address", userVillage)
      .eq("approval_status", "approved");

    console.log("[Messages] Village admins query result:", villageAdmins?.length, "Error:", adminError);

    // Get all admin/jkkk user IDs for this village
    const { data: adminRoles } = await supabase
      .from("user_roles")
      .select("user_id, role")
      .in("role", ["admin", "jkkk"]);
    
    const adminIds = new Set(adminRoles?.map(r => r.user_id) || []);
    setAdminUserIds(adminIds);
    console.log("[Messages] Admin user IDs:", adminIds.size);

    // Get Ketua Kampung for this village
    const { data: ketuaData } = await supabase.rpc("get_village_ketua", {
      _village: userVillage
    });
    const ketuaId = ketuaData?.[0]?.ketua_id;

    console.log("[Messages] Ketua ID:", ketuaId);

    // Build user map - combine all village users
    const allVillageUsers = [
      ...(villageResidents?.map(u => ({ user_id: u.user_id, name: u.name, village: u.village })) || []),
      ...(villageAdmins?.map(u => ({ user_id: u.user_id, name: u.name, village: u.address })) || [])
    ];
    
    // Always include current user to ensure their messages show
    if (user && profile) {
      const currentUserVillage = isAdmin ? profile.address : profile.village;
      if (!allVillageUsers.some(u => u.user_id === user.id)) {
        allVillageUsers.push({
          user_id: user.id,
          name: profile.name || "Pengguna",
          village: currentUserVillage || userVillage
        });
        console.log("[Messages] Added current user to village users list");
      }
    }

    const villageUserIds = [...new Set(allVillageUsers.map(u => u.user_id))];
    const userDataMap = new Map(allVillageUsers.map(u => [u.user_id, { name: u.name, village: u.village }]));

    console.log("[Messages] Total village user IDs:", villageUserIds.length);
    console.log("[Messages] User IDs:", villageUserIds);

    if (villageUserIds.length === 0) {
      setMessages([]);
      setIsLoadingData(false);
      return;
    }

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .in("user_id", villageUserIds)
      .order("created_at", { ascending: true });

    console.log("[Messages] Messages fetched:", data?.length, "Error:", error);

    if (!error && data) {
      // Create a map of message id to message for quick lookup
      const messageMap = new Map(data.map(m => [m.id, m]));
      
      const messagesWithProfiles = data.map(m => {
        const replyToMessage = m.reply_to ? messageMap.get(m.reply_to) : null;
        return {
          ...m,
          sender_name: userDataMap.get(m.user_id)?.name || "Pengguna",
          sender_village: userDataMap.get(m.user_id)?.village || userVillage,
          reply_to_content: replyToMessage?.content || null,
          reply_to_name: replyToMessage ? (userDataMap.get(replyToMessage.user_id)?.name || "Pengguna") : null,
          is_ketua: m.user_id === ketuaId,
          is_pinned: (m as any).is_pinned || false,
          is_admin: adminIds.has(m.user_id)
        };
      });

      // Find pinned message
      const pinned = messagesWithProfiles.find(m => m.is_pinned);
      if (pinned) {
        console.log("[Messages] Pinned message found:", pinned);
        setPinnedMessage(pinned);
      } else {
        setPinnedMessage(null);
      }

      // All messages (except pinned) go to the regular list
      setMessages(messagesWithProfiles.filter(m => !m.is_pinned));
    }
    setIsLoadingData(false);
  };

  const handleTogglePin = async (messageId: string, currentPinned: boolean) => {
    if (!isAdmin) return;
    
    setIsPinning(true);
    const { error } = await supabase
      .from("messages")
      .update({ is_pinned: !currentPinned })
      .eq("id", messageId);

    if (error) {
      console.error("[Messages] Pin error:", error);
      toast({
        variant: "destructive",
        title: "Ralat",
        description: "Gagal mengemas kini status pin.",
      });
    } else {
      toast({
        title: currentPinned ? "Dinyahpin" : "Dipin",
        description: currentPinned ? "Mesej telah dinyahpin." : "Mesej telah dipin di bahagian atas.",
      });
      fetchMessages();
    }
    setIsPinning(false);
  };

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !imageUrl) || !user) return;

    const { error } = await supabase.from("messages").insert({
      user_id: user.id,
      content: newMessage.trim() || (imageUrl ? "📷 Gambar" : ""),
      reply_to: replyingTo?.id || null,
      image_url: imageUrl,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Ralat",
        description: "Gagal menghantar mesej.",
      });
    } else {
      setNewMessage("");
      setReplyingTo(null);
      setImageUrl(null);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast({ variant: "destructive", title: "Ralat", description: "Sila pilih fail imej sahaja." });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ variant: "destructive", title: "Ralat", description: "Saiz fail melebihi 5MB." });
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/messages/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("uploads")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("uploads")
        .getPublicUrl(fileName);

      setImageUrl(publicUrl);
    } catch (error) {
      toast({ variant: "destructive", title: "Ralat", description: "Gagal memuat naik gambar." });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleEditMessage = async (messageId: string) => {
    if (!editContent.trim()) return;

    const { error } = await supabase
      .from("messages")
      .update({ content: editContent.trim() })
      .eq("id", messageId);

    if (error) {
      toast({
        variant: "destructive",
        title: "Ralat",
        description: "Gagal mengedit mesej.",
      });
    } else {
      toast({ title: "Berjaya!", description: "Mesej telah dikemaskini." });
      setEditingId(null);
      setEditContent("");
      fetchMessages();
    }
  };

  const confirmDelete = (messageId: string) => {
    setMessageToDelete(messageId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteMessage = async () => {
    if (!messageToDelete) return;

    const { error } = await supabase
      .from("messages")
      .delete()
      .eq("id", messageToDelete);

    if (error) {
      toast({
        variant: "destructive",
        title: "Ralat",
        description: "Gagal memadam mesej.",
      });
    } else {
      toast({ title: "Dipadam", description: "Mesej telah dipadam." });
      fetchMessages();
    }
    setDeleteDialogOpen(false);
    setMessageToDelete(null);
  };

  const startEditing = (message: MessageWithProfile) => {
    setEditingId(message.id);
    setEditContent(message.content);
    setReplyingTo(null);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditContent("");
  };

  const startReplying = (message: MessageWithProfile) => {
    setReplyingTo(message);
    setEditingId(null);
    inputRef.current?.focus();
  };

  const cancelReplying = () => {
    setReplyingTo(null);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString("ms-MY", { hour: "2-digit", minute: "2-digit" });
    } else if (diffDays === 1) {
      return `Semalam, ${date.toLocaleTimeString("ms-MY", { hour: "2-digit", minute: "2-digit" })}`;
    } else {
      return date.toLocaleDateString("ms-MY", { day: "numeric", month: "short" }) + 
        `, ${date.toLocaleTimeString("ms-MY", { hour: "2-digit", minute: "2-digit" })}`;
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-blue-500/20 flex items-center justify-center animate-pulse">
            <MessageSquare className="h-6 w-6 text-blue-500" />
          </div>
          <p className="text-sm text-muted-foreground">Memuatkan mesej...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-card/90 backdrop-blur-xl border-b border-border/50 sticky top-0 z-10 shadow-soft">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="rounded-xl">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-soft">
              <MessageSquare className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold">Mesej Komuniti</h1>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {userVillage || "Berbual dengan penduduk"}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 flex-1 flex flex-col max-w-4xl">
        {/* Pinned Message - Large Prominent Card */}
        {pinnedMessage && (
          <Card className="mb-6 bg-gradient-to-br from-primary/5 via-primary/10 to-accent/5 border-2 border-primary/30 dark:border-primary/40 overflow-hidden animate-fade-in shadow-lg">
            <CardHeader className="pb-3 bg-gradient-to-r from-primary/10 to-transparent">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-soft">
                    <Pin className="h-7 w-7 text-primary-foreground" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle className="text-lg font-display">Mesej Dipin</CardTitle>
                      <Badge variant="default" className="text-xs">
                        <Pin className="h-3 w-3 mr-1" />
                        Penting
                      </Badge>
                      {pinnedMessage.is_ketua && (
                        <Badge variant="warning" className="text-xs">
                          <Crown className="h-3 w-3 mr-1" />
                          Ketua
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                      <span className="font-semibold">{pinnedMessage.sender_name}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {pinnedMessage.sender_village || userVillage}
                      </span>
                    </p>
                  </div>
                </div>
                {isAdmin && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTogglePin(pinnedMessage.id, true)}
                    disabled={isPinning}
                    className="rounded-xl gap-2"
                  >
                    {isPinning ? <Loader2 className="h-4 w-4 animate-spin" /> : <PinOff className="h-4 w-4" />}
                    Nyahpin
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="text-base leading-relaxed mb-4">{pinnedMessage.content}</p>
              {pinnedMessage.image_url && (
                <img
                  src={pinnedMessage.image_url}
                  alt="Pinned message"
                  className="rounded-xl max-h-64 w-full object-cover mb-4 shadow-soft cursor-pointer"
                  onClick={() => window.open(pinnedMessage.image_url!, "_blank")}
                />
              )}
              <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t border-border/50">
                <Calendar className="h-4 w-4" />
                {format(new Date(pinnedMessage.created_at), "d MMM yyyy, HH:mm", { locale: ms })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Message Tabs */}
        <div className="flex gap-2 mb-4">
          <Button
            variant={activeTab === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("all")}
            className="rounded-xl gap-2 flex-1 sm:flex-none"
          >
            <Users className="h-4 w-4" />
            Semua Mesej
          </Button>
          <Button
            variant={activeTab === "admin" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("admin")}
            className="rounded-xl gap-2 flex-1 sm:flex-none"
          >
            <Bell className="h-4 w-4" />
            Mesej Admin
          </Button>
        </div>

        {/* Tab Content */}
        {activeTab === "admin" ? (
          <div className="flex-1 mb-4 overflow-y-auto max-h-[60vh]">
            <AdminAnnouncementsTab userVillage={userVillage || ""} />
          </div>
        ) : (
        <div className="flex-1 space-y-3 mb-4 overflow-y-auto max-h-[55vh]">
          {isLoadingData ? (
            <div className="flex justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-blue-500/20 flex items-center justify-center animate-pulse">
                  <MessageSquare className="h-5 w-5 text-blue-500" />
                </div>
                <p className="text-sm text-muted-foreground">Memuatkan perbualan...</p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-16 text-center">
                <div className="h-20 w-20 rounded-3xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="h-10 w-10 opacity-30" />
                </div>
                <p className="font-display font-bold text-lg mb-1">Tiada Mesej</p>
                <p className="text-sm text-muted-foreground">Mulakan perbualan dengan penduduk kampung!</p>
              </CardContent>
            </Card>
          ) : (
            messages.map((message, index) => {
              const isOwn = message.user_id === user.id;
              const isEditing = editingId === message.id;

              return (
                <Card
                  key={message.id}
                  className={`transition-all duration-300 animate-fade-in ${
                    isOwn ? "ml-auto max-w-[85%]" : "max-w-[85%]"
                  } ${message.is_admin ? "border-primary/30 dark:border-primary/40 bg-primary/5 dark:bg-primary/10" : ""} ${message.is_ketua && !message.is_admin ? "border-amber-200/50 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-950/20" : ""}`}
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <CardContent className="p-4">
                    {/* Reply reference */}
                    {message.reply_to_content && (
                      <div className="flex items-start gap-2 mb-3 p-2.5 bg-muted/50 rounded-xl border-l-3 border-primary/50">
                        <CornerDownRight className="h-3 w-3 mt-1 text-muted-foreground flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-primary/70">{message.reply_to_name}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2">{message.reply_to_content}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-soft ${
                        message.is_admin 
                          ? "bg-gradient-to-br from-primary to-primary/80" 
                          : message.is_ketua 
                            ? "bg-gradient-to-br from-amber-500 to-orange-500" 
                            : "bg-gradient-to-br from-primary/20 to-primary/10"
                      }`}>
                        {message.is_admin ? (
                          <Shield className="h-5 w-5 text-primary-foreground" />
                        ) : message.is_ketua ? (
                          <Crown className="h-5 w-5 text-white" />
                        ) : (
                          <span className="text-sm font-bold text-primary">
                            {(message.sender_name || "?").charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className="font-semibold text-sm">{message.sender_name}</p>
                          {message.is_admin && (
                            <Badge variant="default" className="text-[10px] px-1.5 py-0">
                              <Shield className="h-3 w-3 mr-0.5" />
                              Admin
                            </Badge>
                          )}
                          {message.is_ketua && !message.is_admin && (
                            <Badge variant="warning" className="text-[10px] px-1.5 py-0">
                              Ketua
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">{formatTime(message.created_at)}</span>
                        </div>
                        
                        {isEditing ? (
                          <div className="flex gap-2 items-center mt-2">
                            <Input
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              className="flex-1"
                              autoFocus
                            />
                            <Button size="icon" variant="ghost" onClick={() => handleEditMessage(message.id)} className="rounded-xl">
                              <Check className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={cancelEditing} className="rounded-xl">
                              <X className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <p className="text-sm leading-relaxed">{message.content}</p>
                            {message.image_url && (
                              <img
                                src={message.image_url}
                                alt="Message image"
                                className="mt-2 rounded-xl max-h-48 object-cover cursor-pointer shadow-soft"
                                onClick={() => window.open(message.image_url!, "_blank")}
                              />
                            )}
                          </>
                        )}

                        {!isEditing && (
                          <div className="flex gap-1 mt-2 flex-wrap">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-xs rounded-lg"
                              onClick={() => startReplying(message)}
                            >
                              <Reply className="h-3 w-3 mr-1" />
                              Balas
                            </Button>
                            {isAdmin && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-xs rounded-lg text-primary hover:text-primary"
                                onClick={() => handleTogglePin(message.id, false)}
                                disabled={isPinning}
                              >
                                {isPinning ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Pin className="h-3 w-3 mr-1" />}
                                Pin
                              </Button>
                            )}
                            {isOwn && (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 px-2 text-xs rounded-lg"
                                  onClick={() => startEditing(message)}
                                >
                                  <Pencil className="h-3 w-3 mr-1" />
                                  Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 px-2 text-xs text-destructive hover:text-destructive rounded-lg"
                                  onClick={() => confirmDelete(message.id)}
                                >
                                  <Trash2 className="h-3 w-3 mr-1" />
                                  Padam
                                </Button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
        )}

        {/* Message Input - Only show on All Messages tab */}
        {activeTab === "all" && (
          <div className="sticky bottom-0 bg-background pt-4 border-t border-border/50">
            {/* Reply preview */}
            {replyingTo && (
              <div className="flex items-center gap-2 mb-3 p-3 bg-muted/50 rounded-xl">
                <Reply className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold">Membalas {replyingTo.sender_name}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">{replyingTo.content}</p>
                </div>
                <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg" onClick={cancelReplying}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Image preview */}
            {imageUrl && (
              <div className="relative inline-block mb-3">
                <img src={imageUrl} alt="Preview" className="max-h-20 rounded-xl border shadow-soft" />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                  onClick={() => setImageUrl(null)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}

            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="rounded-xl"
              >
                {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
              </Button>
              <Input
                ref={inputRef}
                placeholder={replyingTo ? "Taip balasan anda..." : "Taip mesej anda..."}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                className="flex-1"
              />
              <Button onClick={handleSendMessage} disabled={!newMessage.trim() && !imageUrl} className="rounded-xl gap-2">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">Padam Mesej?</AlertDialogTitle>
            <AlertDialogDescription>
              Adakah anda pasti mahu memadam mesej ini? Tindakan ini tidak boleh dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteMessage} className="bg-destructive hover:bg-destructive/90 rounded-xl">
              Padam
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Messages;
