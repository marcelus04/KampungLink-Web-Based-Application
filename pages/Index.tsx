import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Facebook, Mail, Phone, MapPin, Eye, Sparkles, Users, ShoppingBag, AlertCircle, Search, Heart, ArrowRight, Leaf, Home } from "lucide-react";
import logo from "@/assets/logo.png";
import villageHero from "@/assets/village-hero.jpg";

const Index = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && user) {
      navigate("/dashboard");
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <Leaf className="absolute inset-0 m-auto h-6 w-6 text-primary animate-pulse" />
        </div>
      </div>
    );
  }

  const features = [
    { icon: Sparkles, title: "Pengumuman", desc: "Berita terkini kampung", color: "from-primary to-primary/60" },
    { icon: Users, title: "Komuniti", desc: "Berhubung sesama penduduk", color: "from-secondary to-secondary/60" },
    { icon: ShoppingBag, title: "Pasar", desc: "Ekonomi tempatan", color: "from-accent to-accent/60" },
    { icon: AlertCircle, title: "Laporan", desc: "Laporkan masalah", color: "from-destructive to-destructive/60" },
    { icon: Search, title: "Kehilangan", desc: "Cari barang hilang", color: "from-primary to-secondary" },
    { icon: Heart, title: "Dana", desc: "Bantuan kewangan", color: "from-accent to-primary" },
  ];

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
        {/* Animated Background Blobs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -left-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl animate-blob" />
          <div className="absolute top-20 -right-20 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-blob animation-delay-2000" style={{ animationDelay: "2s" }} />
          <div className="absolute -bottom-20 left-1/3 w-72 h-72 bg-accent/20 rounded-full blur-3xl animate-blob animation-delay-4000" style={{ animationDelay: "4s" }} />
        </div>

        {/* Background Image with Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 dark:opacity-20"
          style={{ backgroundImage: `url(${villageHero})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/60 to-background" />
        
        {/* Theme Toggle */}
        <div className="absolute top-6 right-6 z-20 animate-fade-in" style={{ animationDelay: "0.8s", animationFillMode: "backwards" }}>
          <ThemeToggle />
        </div>

        {/* Floating Elements */}
        <div className="absolute top-1/4 left-[10%] animate-float opacity-60">
          <div className="w-12 h-12 rounded-2xl bg-primary/20 backdrop-blur-sm flex items-center justify-center">
            <Home className="h-6 w-6 text-primary" />
          </div>
        </div>
        <div className="absolute top-1/3 right-[15%] animate-float-delayed opacity-60">
          <div className="w-10 h-10 rounded-xl bg-secondary/20 backdrop-blur-sm flex items-center justify-center">
            <Users className="h-5 w-5 text-secondary" />
          </div>
        </div>
        <div className="absolute bottom-1/3 left-[20%] animate-float-slow opacity-60">
          <div className="w-8 h-8 rounded-lg bg-accent/20 backdrop-blur-sm flex items-center justify-center">
            <Leaf className="h-4 w-4 text-accent" />
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 text-center px-4 max-w-4xl">
          <div className="animate-scale-in" style={{ animationDuration: "0.6s" }}>
            <img 
              src={logo} 
              alt="KampungLink Logo" 
              className="h-28 md:h-36 mx-auto mb-8 pointer-events-none drop-shadow-2xl" 
            />
          </div>
          
          <h1 
            className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 animate-fade-in leading-tight"
            style={{ animationDelay: "0.2s", animationFillMode: "backwards" }}
          >
            Selamat Datang ke{" "}
            <span className="text-gradient">KampungLink</span>
          </h1>
          
          <p 
            className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-fade-in leading-relaxed"
            style={{ animationDelay: "0.4s", animationFillMode: "backwards" }}
          >
            Platform komuniti pintar yang menghubungkan penduduk kampung untuk kehidupan yang lebih harmoni
          </p>
          
          <div 
            className="flex gap-4 justify-center flex-wrap animate-fade-in"
            style={{ animationDelay: "0.6s", animationFillMode: "backwards" }}
          >
            <Button 
              size="lg" 
              onClick={() => navigate("/login")} 
              className="rounded-full px-8 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-1 transition-all duration-300 group"
            >
              Log Masuk
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={() => navigate("/register")} 
              className="rounded-full px-8 glass hover:bg-primary/10 hover:-translate-y-1 transition-all duration-300"
            >
              Daftar Akaun
            </Button>
            <Button 
              size="lg" 
              variant="ghost" 
              onClick={() => navigate("/guest")} 
              className="rounded-full gap-2 hover:-translate-y-1 transition-all duration-300"
            >
              <Eye className="h-4 w-4" />
              Lihat Sebagai Tetamu
            </Button>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-2">
            <div className="w-1.5 h-2.5 bg-muted-foreground/50 rounded-full animate-pulse" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-4 relative">
        {/* Background Decoration */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/30 to-background" />
        
        <div className="max-w-6xl mx-auto relative">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              Ciri-ciri Utama
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Mengapa Pilih <span className="text-gradient">KampungLink</span>?
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Semua yang anda perlukan untuk pengurusan kampung yang efisien dalam satu platform
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {features.map((feature, index) => (
              <div 
                key={feature.title}
                className="group relative p-6 rounded-2xl glass hover-lift cursor-pointer overflow-hidden"
                style={{ 
                  animationDelay: `${index * 0.1}s`,
                  animationFillMode: "backwards" 
                }}
              >
                {/* Gradient Background on Hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5" />
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-block mb-6">
            <span className="text-5xl">🏡</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Sertai Komuniti Kami
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto text-lg">
            Bersama kita membina kampung yang lebih maju dan bersatu padu
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button 
              size="lg" 
              onClick={() => navigate("/register")} 
              className="rounded-full px-10 shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
            >
              Mula Sekarang
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              size="lg" 
              variant="ghost" 
              onClick={() => navigate("/login")} 
              className="rounded-full px-8 hover:-translate-y-1 transition-all duration-300"
            >
              Sudah Ada Akaun?
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card/50 backdrop-blur-sm border-t py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            {/* Brand */}
            <div className="md:col-span-1">
              <img src={logo} alt="KampungLink" className="h-14 mb-4" />
              <p className="text-sm text-muted-foreground leading-relaxed">
                Platform pengurusan kampung pintar untuk masyarakat luar bandar Malaysia.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-bold mb-4 text-foreground">Pautan Pantas</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <button onClick={() => navigate("/login")} className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group">
                    <ArrowRight className="h-3 w-3 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    Log Masuk
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate("/register")} className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group">
                    <ArrowRight className="h-3 w-3 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    Daftar Akaun
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate("/guest")} className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group">
                    <ArrowRight className="h-3 w-3 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    Lihat Sebagai Tetamu
                  </button>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-bold mb-4 text-foreground">Hubungi Kami</h4>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-3 text-muted-foreground group">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Phone className="h-4 w-4 text-primary" />
                  </div>
                  <span>+60 12-345 6789</span>
                </li>
                <li className="flex items-center gap-3 text-muted-foreground group">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Mail className="h-4 w-4 text-primary" />
                  </div>
                  <span>info@kampunglink.my</span>
                </li>
                <li className="flex items-start gap-3 text-muted-foreground group">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors flex-shrink-0">
                    <MapPin className="h-4 w-4 text-primary" />
                  </div>
                  <span>Pejabat KampungLink,<br />Kuala Lumpur, Malaysia</span>
                </li>
              </ul>
            </div>

            {/* Social */}
            <div>
              <h4 className="font-bold mb-4 text-foreground">Media Sosial</h4>
              <div className="flex gap-3">
                <a 
                  href="https://facebook.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground hover:-translate-y-1 transition-all duration-300"
                >
                  <Facebook className="h-5 w-5" />
                </a>
                <a 
                  href="https://twitter.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground hover:-translate-y-1 transition-all duration-300"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                <a 
                  href="https://instagram.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground hover:-translate-y-1 transition-all duration-300"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>
                <a 
                  href="https://wa.me/60123456789" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground hover:-translate-y-1 transition-all duration-300"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-12 pt-8 border-t text-center">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} KampungLink. Hak Cipta Terpelihara.
            </p>
            <p className="mt-2 text-xs text-muted-foreground/60">
              Dibina dengan ❤️ untuk komuniti luar bandar Malaysia
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;