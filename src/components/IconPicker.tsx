import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  Smile,
  Heart,
  Star,
  Sparkles,
  Zap,
  Shield,
  Crown,
  Award,
  Gift,
  Gem,
  Stethoscope,
  Syringe,
  Pill,
  Activity,
  HeartPulse,
  Bone,
  Brain,
  Eye,
  Ear,
  Hand,
  Footprints,
  Baby,
  User,
  Users,
  UserCheck,
  Scissors,
  Paintbrush,
  Palette,
  Brush,
  Droplets,
  Sun,
  Moon,
  Cloud,
  Leaf,
  Flower2,
  TreeDeciduous,
  Waves,
  Mountain,
  Home,
  Building,
  Building2,
  Clock,
  Calendar,
  CalendarCheck,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  HelpCircle,
  Search,
  Settings,
  Wrench,
  Hammer,
  Key,
  Lock,
  Unlock,
  Camera,
  Image,
  Video,
  Music,
  Headphones,
  Mic,
  Phone,
  Mail,
  MessageCircle,
  Send,
  Share,
  Download,
  Upload,
  Folder,
  File,
  FileText,
  Clipboard,
  BookOpen,
  GraduationCap,
  Lightbulb,
  Target,
  Flag,
  MapPin,
  Navigation,
  Compass,
  Globe,
  Plane,
  Car,
  Bike,
  Ship,
  Train,
  Bus,
  Rocket,
  Coffee,
  UtensilsCrossed,
  Pizza,
  Apple,
  Cake,
  IceCream,
  Wine,
  Beer,
  ShoppingBag,
  ShoppingCart,
  CreditCard,
  Wallet,
  DollarSign,
  PiggyBank,
  TrendingUp,
  BarChart,
  PieChart,
  LineChart,
  Package,
  Box,
  Archive,
  Trash2,
  Recycle,
  Battery,
  BatteryCharging,
  Wifi,
  Bluetooth,
  Monitor,
  Laptop,
  Smartphone,
  Tablet,
  Tv,
  Radio,
  Speaker,
  Printer,
  Mouse,
  Keyboard,
  Gamepad,
  Joystick,
  Dice1,
  Dice5,
  Trophy,
  Medal,
  Ticket,
  Tags,
  Bookmark,
  Bell,
  BellRing,
  Timer,
  Watch,
  Hourglass,
  Loader,
  RefreshCw,
  RotateCw,
  Repeat,
  Shuffle,
  Play,
  Pause,
  Square,
  Circle,
  Triangle,
  Pentagon,
  Hexagon,
  Octagon,
  Diamond,
  Asterisk,
  Hash,
  AtSign,
  Percent,
  Plus,
  Minus,
  X,
  Divide,
  Equal,
  LucideIcon
} from "lucide-react";

// Lista de ícones disponíveis para procedimentos odontológicos
const availableIcons = [
  { name: "smile", icon: Smile, label: "Sorriso" },
  { name: "sparkles", icon: Sparkles, label: "Brilho" },
  { name: "star", icon: Star, label: "Estrela" },
  { name: "heart", icon: Heart, label: "Coração" },
  { name: "stethoscope", icon: Stethoscope, label: "Estetoscópio" },
  { name: "syringe", icon: Syringe, label: "Seringa" },
  { name: "pill", icon: Pill, label: "Remédio" },
  { name: "activity", icon: Activity, label: "Atividade" },
  { name: "heart-pulse", icon: HeartPulse, label: "Pulso" },
  { name: "bone", icon: Bone, label: "Osso" },
  { name: "brain", icon: Brain, label: "Cérebro" },
  { name: "eye", icon: Eye, label: "Olho" },
  { name: "ear", icon: Ear, label: "Orelha" },
  { name: "hand", icon: Hand, label: "Mão" },
  { name: "baby", icon: Baby, label: "Bebê" },
  { name: "user", icon: User, label: "Usuário" },
  { name: "users", icon: Users, label: "Usuários" },
  { name: "user-check", icon: UserCheck, label: "Usuário OK" },
  { name: "scissors", icon: Scissors, label: "Tesoura" },
  { name: "paintbrush", icon: Paintbrush, label: "Pincel" },
  { name: "palette", icon: Palette, label: "Paleta" },
  { name: "brush", icon: Brush, label: "Escova" },
  { name: "droplets", icon: Droplets, label: "Gotas" },
  { name: "sun", icon: Sun, label: "Sol" },
  { name: "moon", icon: Moon, label: "Lua" },
  { name: "leaf", icon: Leaf, label: "Folha" },
  { name: "flower", icon: Flower2, label: "Flor" },
  { name: "shield", icon: Shield, label: "Escudo" },
  { name: "crown", icon: Crown, label: "Coroa" },
  { name: "award", icon: Award, label: "Prêmio" },
  { name: "gem", icon: Gem, label: "Diamante" },
  { name: "gift", icon: Gift, label: "Presente" },
  { name: "zap", icon: Zap, label: "Raio" },
  { name: "check-circle", icon: CheckCircle, label: "Check" },
  { name: "clock", icon: Clock, label: "Relógio" },
  { name: "calendar", icon: Calendar, label: "Calendário" },
  { name: "calendar-check", icon: CalendarCheck, label: "Agenda OK" },
  { name: "target", icon: Target, label: "Alvo" },
  { name: "lightbulb", icon: Lightbulb, label: "Ideia" },
  { name: "settings", icon: Settings, label: "Config" },
  { name: "wrench", icon: Wrench, label: "Ferramenta" },
  { name: "trophy", icon: Trophy, label: "Troféu" },
  { name: "medal", icon: Medal, label: "Medalha" },
  { name: "bookmark", icon: Bookmark, label: "Favorito" },
  { name: "bell", icon: Bell, label: "Sino" },
  { name: "dollar-sign", icon: DollarSign, label: "Dinheiro" },
  { name: "trending-up", icon: TrendingUp, label: "Crescimento" },
  { name: "pie-chart", icon: PieChart, label: "Gráfico" },
  { name: "package", icon: Package, label: "Pacote" },
];

interface IconPickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export const IconPicker = ({ value, onChange, className }: IconPickerProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredIcons = availableIcons.filter(
    (icon) =>
      icon.name.toLowerCase().includes(search.toLowerCase()) ||
      icon.label.toLowerCase().includes(search.toLowerCase())
  );

  const selectedIcon = availableIcons.find((icon) => icon.name === value);
  const SelectedIconComponent = selectedIcon?.icon;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-start gap-2", className)}
        >
          {SelectedIconComponent ? (
            <>
              <SelectedIconComponent className="h-4 w-4" />
              <span>{selectedIcon.label}</span>
            </>
          ) : (
            <span className="text-muted-foreground">Selecione um ícone...</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 z-50 bg-background border shadow-lg" align="start">
        <div className="p-3 border-b">
          <Input
            placeholder="Buscar ícone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8"
          />
        </div>
        <ScrollArea className="h-64">
          <div className="grid grid-cols-5 gap-1 p-2">
            {filteredIcons.map((iconItem) => {
              const IconComponent = iconItem.icon;
              return (
                <Button
                  key={iconItem.name}
                  variant={value === iconItem.name ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "h-10 w-10 p-0 flex items-center justify-center",
                    value === iconItem.name && "ring-2 ring-primary"
                  )}
                  onClick={() => {
                    onChange(iconItem.name);
                    setOpen(false);
                    setSearch("");
                  }}
                  title={iconItem.label}
                >
                  <IconComponent className="h-5 w-5" />
                </Button>
              );
            })}
          </div>
          {filteredIcons.length === 0 && (
            <p className="text-center text-muted-foreground py-4 text-sm">
              Nenhum ícone encontrado
            </p>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

// Componente para exibir ícone pelo nome
export const IconDisplay = ({ name, className }: { name: string; className?: string }) => {
  const iconItem = availableIcons.find((icon) => icon.name === name);
  if (!iconItem) {
    return <span className={className}>{name}</span>;
  }
  const IconComponent = iconItem.icon;
  return <IconComponent className={className} />;
};

export default IconPicker;
