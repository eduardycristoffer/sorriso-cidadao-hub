import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  User, 
  CreditCard, 
  Calendar, 
  Search, 
  Filter,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import logoSorrisoCidadao from "@/assets/logo-sorriso-cidadao.png";
import WizardConsulta from "@/components/WizardConsulta";

interface Usuario {
  id: string;
  nome: string;
  email: string;
  assinatura_status: string;
  ativo: boolean;
}

interface Categoria {
  id: string;
  nome: string;
  icone: string;
}

interface Procedimento {
  id: string;
  nome: string;
  preco_min: number;
  preco_max: number | null;
  categoria_id: string;
  categorias: Categoria;
}

interface OrdemServico {
  id: string;
  data_solicitada: string;
  status: string;
  observacoes_cliente: string;
  procedimentos: { nome: string };
  clinicas: { nome: string; cidade: string };
}

const Cliente = () => {
  const [user, setUser] = useState<Usuario | null>(null);
  const [procedimentos, setProcedimentos] = useState<Procedimento[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [wizardOpen, setWizardOpen] = useState(false);
  const [selectedProcedimento, setSelectedProcedimento] = useState<Procedimento | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const checkUser = async () => {
    try {
      // Primeiro, tentar obter usuário autenticado
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      let userData = null;
      
      if (authUser) {
        // Se tem usuário autenticado, buscar pelos dados do auth
        let { data, error } = await supabase
          .from("usuarios")
          .select("*")
          .eq("auth_user_id", authUser.id)
          .eq("ativo", true)
          .maybeSingle();

        // Se não encontrou pelo auth_user_id, buscar pelo email e atualizar
        if (!data || error) {
          const { data: emailData } = await supabase
            .from("usuarios")
            .select("*")
            .eq("email", authUser.email)
            .eq("ativo", true)
            .maybeSingle();

          if (emailData) {
            // Atualizar com o auth_user_id correto
            await supabase
              .from("usuarios")
              .update({ auth_user_id: authUser.id })
              .eq("id", emailData.id);
            
            userData = { ...emailData, auth_user_id: authUser.id };
          }
        } else {
          userData = data;
        }
      }
      
      // Se não encontrou via auth, verificar se tem dados na URL ou session storage
      if (!userData) {
        // Tentar buscar pelo email salvo na session
        const savedEmail = sessionStorage.getItem('client_email');
        if (savedEmail) {
          const { data, error } = await supabase
            .from("usuarios")
            .select("*")
            .eq("email", savedEmail)
            .eq("ativo", true)
            .maybeSingle();

          if (!error && data) {
            userData = data;
          }
        }
      }

      if (!userData) {
        navigate("/entrar");
        return;
      }

      if (userData.assinatura_status !== 'ATIVA') {
        toast({
          title: "Assinatura não ativa",
          description: "Sua assinatura precisa estar ativa para acessar o painel.",
          variant: "destructive",
        });
        navigate("/entrar");
        return;
      }

      // Salvar email na session para próximas tentativas
      sessionStorage.setItem('client_email', userData.email);
      
      setUser(userData);
    } catch (error) {
      console.error("Error checking user:", error);
      navigate("/entrar");
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    try {
      // Carregar procedimentos com categorias
      const { data: procData, error: procError } = await supabase
        .from("procedimentos")
        .select(`
          *,
          categorias (
            id,
            nome,
            icone
          )
        `)
        .eq("ativo", true)
        .order("nome");

      if (procError) throw procError;
      setProcedimentos(procData || []);

      // Carregar categorias
      const { data: catData, error: catError } = await supabase
        .from("categorias")
        .select("*")
        .order("ordem", { ascending: true });

      if (catError) throw catError;
      setCategorias(catData || []);

      // Carregar ordens de serviço do usuário
      const { data: ordensData, error: ordensError } = await supabase
        .from("ordens_servico")
        .select(`
          *,
          procedimentos (nome),
          clinicas (nome, cidade)
        `)
        .eq("cliente_id", user?.id)
        .order("created_at", { ascending: false });

      if (ordensError) throw ordensError;
      setOrdens(ordensData || []);

    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      ATIVA: { label: "Ativa", variant: "default" as const, icon: CheckCircle2 },
      PENDENTE: { label: "Pendente", variant: "secondary" as const, icon: AlertCircle },
      VENCIDA: { label: "Vencida", variant: "destructive" as const, icon: XCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDENTE;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const formatPrice = (preco_min: number, preco_max: number | null) => {
    if (!preco_max) {
      return `R$ ${preco_min.toFixed(2).replace(".", ",")}`;
    }
    return (
      <div className="flex items-center gap-2">
        <span>R$ {preco_min.toFixed(2).replace(".", ",")} – R$ {preco_max.toFixed(2).replace(".", ",")}</span>
        <Badge variant="outline" className="text-xs">faixa</Badge>
      </div>
    );
  };

  const filteredProcedimentos = procedimentos.filter(proc => {
    const matchesSearch = proc.nome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || proc.categoria_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSolicitarConsulta = (procedimento?: Procedimento) => {
    setSelectedProcedimento(procedimento || null);
    setWizardOpen(true);
  };

  const handleWizardSuccess = () => {
    loadData(); // Recarregar dados após criar ordem
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleCancelConsulta = async (ordemId: string) => {
    try {
      const { error } = await supabase
        .from("ordens_servico")
        .update({ status: "cancelada" })
        .eq("id", ordemId);

      if (error) throw error;

      toast({
        title: "Consulta cancelada",
        description: "Sua consulta foi cancelada com sucesso.",
      });

      loadData(); // Reload data to show updated status
    } catch (error) {
      console.error("Error canceling consultation:", error);
      toast({
        title: "Erro",
        description: "Erro ao cancelar consulta. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const getIconEmoji = (iconName: string) => {
    const iconMap = {
      'tooth': '🦷',
      'drill': '🦷',
      'scissors': '🦷', 
      'brush': '🦷',
      'sparkles': '✨',
      'crown': '👑',
      'stethoscope': '🩺'
    };
    return iconMap[iconName] || '🦷';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <img 
                src={logoSorrisoCidadao} 
                alt="Sorriso Cidadão" 
                className="h-6 sm:h-8 w-auto"
              />
              <span className="text-base sm:text-xl font-bold text-gray-900 hidden sm:block">Área do Cliente</span>
              <span className="text-sm font-bold text-gray-900 sm:hidden">Cliente</span>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <span className="text-xs sm:text-sm text-gray-600 hidden sm:block">Olá, {user?.nome}</span>
              <span className="text-xs text-gray-600 sm:hidden">Olá, {user?.nome?.split(' ')[0]}</span>
              <Button onClick={handleLogout} variant="outline" size="sm" className="text-xs sm:text-sm">
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b overflow-x-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-4 sm:space-x-8 min-w-max">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                activeTab === "dashboard"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab("consultas")}
              className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                activeTab === "consultas"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Minhas Consultas
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {activeTab === "dashboard" && (
          <div className="space-y-6 sm:space-y-8">
            {/* Status Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Status da Assinatura</CardTitle>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xl sm:text-2xl font-bold">{getStatusBadge(user?.assinatura_status || "PENDENTE")}</div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Cartão Sorriso Cidadão
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ações Rápidas</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={() => handleSolicitarConsulta()}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    <span className="text-sm sm:text-base">Solicitar Consulta</span>
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    Escolha um procedimento abaixo e solicite sua consulta
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Procedimentos */}
            <Card>
              <CardHeader>
                <div className="flex flex-col space-y-4">
                  <div>
                    <CardTitle className="text-lg sm:text-xl">Procedimentos Disponíveis</CardTitle>
                    <CardDescription className="text-sm">
                      Escolha um procedimento e solicite sua consulta
                    </CardDescription>
                  </div>
                  <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar procedimento..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8 text-sm"
                      />
                    </div>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="w-full sm:w-48">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas as categorias</SelectItem>
                        {categorias.map((categoria) => (
                          <SelectItem key={categoria.id} value={categoria.id}>
                            {categoria.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0 sm:p-6">
                {/* Desktop Table */}
                <div className="hidden sm:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Procedimento</TableHead>
                        <TableHead>Preço</TableHead>
                        <TableHead className="text-right">Ação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProcedimentos.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                            {procedimentos.length === 0 ? "Carregando procedimentos..." : "Nenhum procedimento encontrado"}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredProcedimentos.map((procedimento) => (
                          <TableRow key={procedimento.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span>{getIconEmoji(procedimento.categorias?.icone) || "📋"}</span>
                                <span className="font-medium">{procedimento.categorias?.nome}</span>
                              </div>
                            </TableCell>
                            <TableCell>{procedimento.nome}</TableCell>
                            <TableCell>{formatPrice(procedimento.preco_min, procedimento.preco_max)}</TableCell>
                            <TableCell className="text-right">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleSolicitarConsulta(procedimento)}
                              >
                                Solicitar
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Cards */}
                <div className="sm:hidden space-y-3 p-4">
                  {filteredProcedimentos.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      {procedimentos.length === 0 ? "Carregando procedimentos..." : "Nenhum procedimento encontrado"}
                    </div>
                  ) : (
                    filteredProcedimentos.map((procedimento) => (
                      <Card key={procedimento.id} className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{getIconEmoji(procedimento.categorias?.icone) || "📋"}</span>
                            <div>
                              <p className="text-xs text-muted-foreground">{procedimento.categorias?.nome}</p>
                              <p className="font-medium text-sm">{procedimento.nome}</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-semibold text-primary">
                              {formatPrice(procedimento.preco_min, procedimento.preco_max)}
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleSolicitarConsulta(procedimento)}
                              className="text-xs"
                            >
                              Solicitar
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "consultas" && (
          <div className="space-y-4 sm:space-y-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Minhas Consultas</h2>
              <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">Acompanhe o status das suas solicitações</p>
            </div>

            <Card>
              <CardContent className="p-0 sm:p-6">
                {/* Desktop Table */}
                <div className="hidden sm:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Clínica</TableHead>
                        <TableHead>Procedimento</TableHead>
                        <TableHead>Data Solicitada</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ordens.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>Você ainda não tem consultas agendadas</p>
                            <Button 
                              className="mt-4" 
                              onClick={() => setActiveTab("dashboard")}
                            >
                              Solicitar Primeira Consulta
                            </Button>
                          </TableCell>
                        </TableRow>
                      ) : (
                        ordens.map((ordem) => (
                          <TableRow key={ordem.id}>
                            <TableCell className="font-mono text-sm">
                              {ordem.id.slice(0, 8)}...
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{ordem.clinicas?.nome}</div>
                                <div className="text-sm text-muted-foreground flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {ordem.clinicas?.cidade}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{ordem.procedimentos?.nome}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3 text-muted-foreground" />
                                {new Date(ordem.data_solicitada).toLocaleDateString("pt-BR")}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={
                                ordem.status === "confirmada" ? "default" :
                                ordem.status === "realizada" ? "secondary" :
                                ordem.status === "cancelada" ? "destructive" :
                                "outline"
                              }>
                                {ordem.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {ordem.status === "solicitada" && (
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => handleCancelConsulta(ordem.id)}
                                >
                                  Cancelar
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Cards */}
                <div className="sm:hidden space-y-3 p-4">
                  {ordens.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Você ainda não tem consultas agendadas</p>
                      <Button 
                        className="mt-4" 
                        onClick={() => setActiveTab("dashboard")}
                        size="sm"
                      >
                        Solicitar Primeira Consulta
                      </Button>
                    </div>
                  ) : (
                    ordens.map((ordem) => (
                      <Card key={ordem.id} className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <p className="font-mono text-xs text-muted-foreground">
                                #{ordem.id.slice(0, 8)}...
                              </p>
                              <p className="font-medium text-sm">{ordem.procedimentos?.nome}</p>
                            </div>
                            <Badge variant={
                              ordem.status === "confirmada" ? "default" :
                              ordem.status === "realizada" ? "secondary" :
                              ordem.status === "cancelada" ? "destructive" :
                              "outline"
                            } className="text-xs">
                              {ordem.status}
                            </Badge>
                          </div>
                          
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              <span className="font-medium">{ordem.clinicas?.nome}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              <span>{new Date(ordem.data_solicitada).toLocaleDateString("pt-BR")}</span>
                            </div>
                          </div>

                          {ordem.status === "solicitada" && (
                            <div className="pt-2 border-t">
                              <Button 
                                variant="destructive" 
                                size="sm" 
                                className="w-full text-xs"
                                onClick={() => handleCancelConsulta(ordem.id)}
                              >
                                Cancelar Consulta
                              </Button>
                            </div>
                          )}
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Wizard */}
      <WizardConsulta
        isOpen={wizardOpen}
        onClose={() => setWizardOpen(false)}
        procedimentoSelecionado={selectedProcedimento}
        clienteId={user?.id || ""}
        onSuccess={handleWizardSuccess}
      />
    </div>
  );
};

export default Cliente;