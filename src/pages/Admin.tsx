import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  LogOut, 
  Users, 
  CreditCard, 
  Settings, 
  FileText,
  Search,
  Filter,
  Edit,
  Download,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle
} from "lucide-react";
import logoSorrisoCidadao from "@/assets/logo-sorriso-cidadao.png";

interface OrdemServico {
  id: string;
  data_solicitada: string;
  data_confirmada: string | null;
  status: string;
  observacoes_cliente: string;
  observacoes_internas: string;
  created_at: string;
  usuarios: {
    nome: string;
    email: string;
    telefone: string;
  };
  procedimentos: {
    nome: string;
  };
  clinicas: {
    nome: string;
    cidade: string;
  };
  dentistas: {
    nome: string;
  } | null;
}

interface Clinica {
  id: string;
  nome: string;
  cidade: string;
}

interface Dentista {
  id: string;
  nome: string;
}

const Admin = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  
  // OS State
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [clinicas, setClinicas] = useState<Clinica[]>([]);
  const [dentistas, setDentistas] = useState<Dentista[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [cidadeFilter, setCidadeFilter] = useState("all");
  const [clinicaFilter, setClinicaFilter] = useState("all");
  const [editingOS, setEditingOS] = useState<OrdemServico | null>(null);
  const [editFormData, setEditFormData] = useState({
    status: "",
    clinica_id: "",
    dentista_id: "",
    data_confirmada: "",
    observacoes_internas: ""
  });

  const { toast } = useToast();

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user && activeTab === "os") {
      loadOSData();
    }
  }, [user, activeTab]);

  const checkUser = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        window.location.href = "/entrar";
        return;
      }

      const { data: userData, error } = await supabase
        .from("usuarios")
        .select("*")
        .eq("auth_user_id", authUser.id)
        .single();

      if (error || !userData) {
        // Tentar buscar por email se não encontrar por auth_user_id
        const { data: userByEmail, error: emailError } = await supabase
          .from("usuarios")
          .select("*")
          .eq("email", authUser.email)
          .single();

        if (emailError || !userByEmail) {
          toast({
            title: "Erro",
            description: "Usuário não encontrado no sistema.",
            variant: "destructive",
          });
          window.location.href = "/entrar";
          return;
        }

        // Atualizar o auth_user_id se encontrou por email
        await supabase
          .from("usuarios")
          .update({ auth_user_id: authUser.id })
          .eq("email", authUser.email);

        setUser(userByEmail);
      } else {
        setUser(userData);
      }

      // Check if user is admin
      const userToCheck = userData || await supabase
        .from("usuarios")
        .select("*")
        .eq("email", authUser.email)
        .single()
        .then(res => res.data);

      if (!userToCheck || !["admin", "operador"].includes(userToCheck.role)) {
        toast({
          title: "Acesso negado",
          description: "Você não tem permissão para acessar esta área.",
          variant: "destructive",
        });
        window.location.href = "/";
        return;
      }

    } catch (error) {
      console.error("Error checking user:", error);
      window.location.href = "/entrar";
    } finally {
      setLoading(false);
    }
  };

  const loadOSData = async () => {
    try {
      // Carregar ordens de serviço
      const { data: ordensData, error: ordensError } = await supabase
        .from("ordens_servico")
        .select(`
          *,
          usuarios (nome, email, telefone),
          procedimentos (nome),
          clinicas (nome, cidade),
          dentistas (nome)
        `)
        .order("created_at", { ascending: false });

      if (ordensError) throw ordensError;
      setOrdens(ordensData || []);

      // Carregar clínicas
      const { data: clinicasData, error: clinicasError } = await supabase
        .from("clinicas")
        .select("id, nome, cidade")
        .eq("ativo", true)
        .order("nome");

      if (clinicasError) throw clinicasError;
      setClinicas(clinicasData || []);

      // Carregar dentistas
      const { data: dentistasData, error: dentistasError } = await supabase
        .from("dentistas")
        .select("id, nome")
        .order("nome");

      if (dentistasError) throw dentistasError;
      setDentistas(dentistasData || []);

    } catch (error) {
      console.error("Error loading OS data:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados das ordens de serviço.",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = "/";
    } catch (error) {
      toast({
        title: "Erro ao sair",
        description: "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      solicitada: { label: "Solicitada", variant: "secondary" as const, icon: Clock },
      "em análise": { label: "Em Análise", variant: "outline" as const, icon: AlertCircle },
      confirmada: { label: "Confirmada", variant: "default" as const, icon: CheckCircle2 },
      realizada: { label: "Realizada", variant: "secondary" as const, icon: CheckCircle2 },
      cancelada: { label: "Cancelada", variant: "destructive" as const, icon: XCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.solicitada;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const openEditDialog = (ordem: OrdemServico) => {
    setEditingOS(ordem);
    setEditFormData({
      status: ordem.status,
      clinica_id: "",
      dentista_id: "",
      data_confirmada: ordem.data_confirmada ? ordem.data_confirmada.slice(0, 16) : "",
      observacoes_internas: ordem.observacoes_internas || ""
    });
  };

  const handleSaveChanges = async () => {
    if (!editingOS) return;

    try {
      const updateData: any = {
        status: editFormData.status,
        observacoes_internas: editFormData.observacoes_internas
      };

      if (editFormData.clinica_id) {
        updateData.clinica_id = editFormData.clinica_id;
      }

      if (editFormData.dentista_id) {
        updateData.dentista_id = editFormData.dentista_id;
      }

      if (editFormData.data_confirmada) {
        updateData.data_confirmada = new Date(editFormData.data_confirmada).toISOString();
      }

      const { error } = await supabase
        .from("ordens_servico")
        .update(updateData)
        .eq("id", editingOS.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Ordem de serviço atualizada com sucesso.",
      });

      setEditingOS(null);
      loadOSData();
    } catch (error) {
      console.error("Error updating OS:", error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar ordem de serviço.",
        variant: "destructive",
      });
    }
  };

  const handleQuickAction = async (id: string, action: "confirmar" | "cancelar") => {
    try {
      const updateData = action === "confirmar" 
        ? { status: "confirmada", data_confirmada: new Date().toISOString() }
        : { status: "cancelada" };

      const { error } = await supabase
        .from("ordens_servico")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Ordem ${action === "confirmar" ? "confirmada" : "cancelada"} com sucesso.`,
      });

      loadOSData();
    } catch (error) {
      console.error("Error updating OS:", error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar ordem de serviço.",
        variant: "destructive",
      });
    }
  };

  const exportToCSV = () => {
    const headers = [
      "Código",
      "Cliente",
      "Email",
      "Telefone",
      "Clínica",
      "Cidade",
      "Procedimento",
      "Data Solicitada",
      "Data Confirmada",
      "Status",
      "Observações Cliente",
      "Observações Internas"
    ];

    const csvData = filteredOrdens.map(ordem => [
      ordem.id.slice(0, 8),
      ordem.usuarios.nome,
      ordem.usuarios.email,
      ordem.usuarios.telefone || "",
      ordem.clinicas?.nome || "",
      ordem.clinicas?.cidade || "",
      ordem.procedimentos.nome,
      new Date(ordem.data_solicitada).toLocaleDateString("pt-BR"),
      ordem.data_confirmada ? new Date(ordem.data_confirmada).toLocaleDateString("pt-BR") : "",
      ordem.status,
      ordem.observacoes_cliente || "",
      ordem.observacoes_internas || ""
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `ordens_servico_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredOrdens = ordens.filter(ordem => {
    const matchesSearch = ordem.usuarios.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ordem.procedimentos.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ordem.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || ordem.status === statusFilter;
    const matchesCidade = cidadeFilter === "all" || ordem.clinicas?.cidade === cidadeFilter;
    const matchesClinica = clinicaFilter === "all" || ordem.clinicas?.nome === clinicaFilter;

    return matchesSearch && matchesStatus && matchesCidade && matchesClinica;
  });

  const cidades = [...new Set(ordens.map(o => o.clinicas?.cidade).filter(Boolean))];
  const clinicasNomes = [...new Set(ordens.map(o => o.clinicas?.nome).filter(Boolean))];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-white">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <img 
                src={logoSorrisoCidadao} 
                alt="Sorriso Cidadão" 
                className="h-8 w-auto"
              />
              <span className="text-xl font-bold text-gray-900">Painel Admin</span>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary">
                Administrador
              </Badge>
              <span className="text-sm text-gray-600">{user?.email}</span>
              <Button onClick={handleLogout} variant="outline" size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "dashboard"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab("os")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "os"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Ordens de Serviço
            </button>
            <button
              onClick={() => setActiveTab("usuarios")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "usuarios"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Usuários
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "dashboard" && (
          <div>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Painel Administrativo</h1>
              <p className="text-gray-600 mt-2">Gerencie o sistema Sorriso Cidadão</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">1,234</div>
                  <p className="text-xs text-muted-foreground">+20% em relação ao mês passado</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Cartões Ativos</CardTitle>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">856</div>
                  <p className="text-xs text-muted-foreground">+15% em relação ao mês passado</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
                  <Settings className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">R$ 51.290</div>
                  <p className="text-xs text-muted-foreground">+12% em relação ao mês passado</p>
                </CardContent>
              </Card>
            </div>

            {/* Management Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Gerenciar Usuários</CardTitle>
                  <CardDescription>
                    Visualize e gerencie todos os usuários do sistema
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Button className="w-full" variant="outline">
                      <Users className="h-4 w-4 mr-2" />
                      Ver Todos os Usuários
                    </Button>
                    <Button className="w-full" variant="outline">
                      Usuários Ativos
                    </Button>
                    <Button className="w-full" variant="outline">
                      Novos Cadastros
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Gerenciar Cartões</CardTitle>
                  <CardDescription>
                    Controle de cartões e assinaturas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Button className="w-full" variant="outline">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Ver Todos os Cartões
                    </Button>
                    <Button className="w-full" variant="outline">
                      Cartões Vencidos
                    </Button>
                    <Button className="w-full" variant="outline">
                      Renovações Pendentes
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Relatórios</CardTitle>
                  <CardDescription>
                    Acesse relatórios detalhados do sistema
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Button className="w-full" variant="outline">
                      Relatório de Vendas
                    </Button>
                    <Button className="w-full" variant="outline">
                      Relatório de Usuários
                    </Button>
                    <Button className="w-full" variant="outline">
                      Relatório Financeiro
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Configurações</CardTitle>
                  <CardDescription>
                    Configurações gerais do sistema
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Button className="w-full" variant="outline">
                      <Settings className="h-4 w-4 mr-2" />
                      Configurações Gerais
                    </Button>
                    <Button className="w-full" variant="outline">
                      Preços e Planos
                    </Button>
                    <Button className="w-full" variant="outline">
                      Notificações
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === "os" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Ordens de Serviço</h1>
                <p className="text-gray-600 mt-2">Gerencie todas as consultas e solicitações</p>
              </div>
              <Button onClick={exportToCSV}>
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
            </div>

            {/* Filtros */}
            <Card>
              <CardHeader>
                <CardTitle>Filtros</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por cliente, procedimento ou código..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os status</SelectItem>
                      <SelectItem value="solicitada">Solicitada</SelectItem>
                      <SelectItem value="em análise">Em Análise</SelectItem>
                      <SelectItem value="confirmada">Confirmada</SelectItem>
                      <SelectItem value="realizada">Realizada</SelectItem>
                      <SelectItem value="cancelada">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={cidadeFilter} onValueChange={setCidadeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Cidade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as cidades</SelectItem>
                      {cidades.map((cidade) => (
                        <SelectItem key={cidade} value={cidade!}>
                          {cidade}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={clinicaFilter} onValueChange={setClinicaFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Clínica" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as clínicas</SelectItem>
                      {clinicasNomes.map((clinica) => (
                        <SelectItem key={clinica} value={clinica!}>
                          {clinica}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm("");
                      setStatusFilter("all");
                      setCidadeFilter("all");
                      setClinicaFilter("all");
                    }}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Limpar
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Tabela */}
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Contato</TableHead>
                      <TableHead>Clínica</TableHead>
                      <TableHead>Procedimento</TableHead>
                      <TableHead>Data Solicitada</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrdens.map((ordem) => (
                      <TableRow key={ordem.id}>
                        <TableCell className="font-mono text-sm">
                          {ordem.id.slice(0, 8)}...
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{ordem.usuarios.nome}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              {ordem.usuarios.email}
                            </div>
                            {ordem.usuarios.telefone && (
                              <div className="flex items-center gap-1 text-sm">
                                <Phone className="h-3 w-3 text-muted-foreground" />
                                {ordem.usuarios.telefone}
                              </div>
                            )}
                          </div>
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
                        <TableCell>{ordem.procedimentos.nome}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {new Date(ordem.data_solicitada).toLocaleDateString("pt-BR")}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(ordem.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditDialog(ordem)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            {ordem.status === "solicitada" && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleQuickAction(ordem.id, "confirmar")}
                                >
                                  Confirmar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleQuickAction(ordem.id, "cancelar")}
                                >
                                  Cancelar
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {filteredOrdens.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhuma ordem de serviço encontrada
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Dialog de Edição */}
            <Dialog open={!!editingOS} onOpenChange={(open) => !open && setEditingOS(null)}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Editar Ordem de Serviço</DialogTitle>
                  <DialogDescription>
                    {editingOS && `Cliente: ${editingOS.usuarios.nome} - Procedimento: ${editingOS.procedimentos.nome}`}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select value={editFormData.status} onValueChange={(value) => setEditFormData({...editFormData, status: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="solicitada">Solicitada</SelectItem>
                        <SelectItem value="em análise">Em Análise</SelectItem>
                        <SelectItem value="confirmada">Confirmada</SelectItem>
                        <SelectItem value="realizada">Realizada</SelectItem>
                        <SelectItem value="cancelada">Cancelada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="clinica">Clínica</Label>
                    <Select value={editFormData.clinica_id} onValueChange={(value) => setEditFormData({...editFormData, clinica_id: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar clínica" />
                      </SelectTrigger>
                      <SelectContent>
                        {clinicas.map((clinica) => (
                          <SelectItem key={clinica.id} value={clinica.id}>
                            {clinica.nome} - {clinica.cidade}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="dentista">Dentista</Label>
                    <Select value={editFormData.dentista_id} onValueChange={(value) => setEditFormData({...editFormData, dentista_id: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar dentista" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Nenhum</SelectItem>
                        {dentistas.map((dentista) => (
                          <SelectItem key={dentista.id} value={dentista.id}>
                            {dentista.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="data_confirmada">Data Confirmada</Label>
                    <Input
                      id="data_confirmada"
                      type="datetime-local"
                      value={editFormData.data_confirmada}
                      onChange={(e) => setEditFormData({...editFormData, data_confirmada: e.target.value})}
                    />
                  </div>

                  <div>
                    <Label htmlFor="observacoes_internas">Observações Internas</Label>
                    <Textarea
                      id="observacoes_internas"
                      value={editFormData.observacoes_internas}
                      onChange={(e) => setEditFormData({...editFormData, observacoes_internas: e.target.value})}
                      rows={3}
                    />
                  </div>

                  {editingOS?.observacoes_cliente && (
                    <div>
                      <Label>Observações do Cliente</Label>
                      <div className="p-3 bg-gray-50 rounded-md text-sm">
                        {editingOS.observacoes_cliente}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setEditingOS(null)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleSaveChanges}>
                      Salvar Alterações
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {activeTab === "usuarios" && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Gerenciar Usuários</h2>
            <p className="text-gray-600 mb-4">Em desenvolvimento...</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Admin;