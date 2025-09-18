import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Lock, ArrowLeft, LogOut, Users, FileText, Calendar, Settings, Plus, Edit, Phone, MapPin, Clock, Check, X, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import logoSorrisoCidadao from "@/assets/logo-sorriso-cidadao.png";

const Admin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [email, setEmail] = useState("eduardy");
  const [password, setPassword] = useState("");
  const { toast } = useToast();

  // Estados para dados do painel
  const [usuarios, setUsuarios] = useState([]);
  const [ordensServico, setOrdensServico] = useState([]);
  const [procedimentos, setProcedimentos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [editingProcedure, setEditingProcedure] = useState(null);
  const [newProcedureDialog, setNewProcedureDialog] = useState(false);
  const [selectedOrdem, setSelectedOrdem] = useState(null);
  const [ordemDialog, setOrdemDialog] = useState(false);
  const [newProcedure, setNewProcedure] = useState({
    nome: '',
    categoria_id: '',
    preco_min: '',
    preco_max: '',
    observacoes: ''
  });
  const [stats, setStats] = useState({
    totalUsuarios: 0,
    assinaturasAtivas: 0,
    ordensServico: 0,
    faturamentoMensal: 0,
    faturamentoLiquido: 0,
    ordensConfirmadas: 0,
    ordensPendentes: 0
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Verificar se é admin
        const { data: userData } = await supabase
          .from("usuarios")
          .select("*")
          .eq("auth_user_id", user.id)
          .eq("role", "admin")
          .maybeSingle();

        if (userData) {
          setIsAuthenticated(true);
          loadDashboardData();
        }
      }
    } catch (error) {
      console.error("Erro ao verificar autenticação:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);

    try {
      if (email !== "eduardy" || password !== "@Tryade2025") {
        toast({
          title: "Credenciais inválidas",
          description: "Usuário ou senha incorretos.",
          variant: "destructive",
        });
        setLoginLoading(false);
        return;
      }

      const adminEmail = "eduardy@tryade.com";
      let { error: signInError } = await supabase.auth.signInWithPassword({
        email: adminEmail,
        password,
      });

      if (signInError && signInError.message.includes("Invalid login credentials")) {
        const { error: signUpError } = await supabase.auth.signUp({
          email: adminEmail,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/admin`
          }
        });

        if (signUpError) {
          throw signUpError;
        }

        const { error: retrySignInError } = await supabase.auth.signInWithPassword({
          email: adminEmail,
          password,
        });

        if (retrySignInError) {
          throw retrySignInError;
        }
      } else if (signInError) {
        throw signInError;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: userData } = await supabase
          .from("usuarios")
          .select("*")
          .eq("email", adminEmail)
          .maybeSingle();

        if (userData && !userData.auth_user_id) {
          await supabase
            .from("usuarios")
            .update({ auth_user_id: user.id })
            .eq("email", adminEmail);
        }
      }

      setIsAuthenticated(true);
      loadDashboardData();
      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo ao painel administrativo.",
      });

    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "Erro no login",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado do sistema.",
    });
  };

  const loadDashboardData = async () => {
    try {
      // Carregar usuários
      const { data: usuariosData } = await supabase
        .from("usuarios")
        .select("*")
        .order("created_at", { ascending: false });

      // Carregar ordens de serviço
      const { data: ordensData } = await supabase
        .from("ordens_servico")
        .select(`
          *,
          usuarios:cliente_id(nome, email, telefone),
          clinicas:clinica_id(nome, cidade),
          procedimentos:procedimento_id(nome),
          dentistas:dentista_id(nome)
        `)
        .order("created_at", { ascending: false });

      // Carregar procedimentos e categorias
      const { data: procedimentosData } = await supabase
        .from("procedimentos")
        .select(`
          *,
          categorias(nome)
        `)
        .order("nome");

      const { data: categoriasData } = await supabase
        .from("categorias")
        .select("*")
        .order("ordem");

      setUsuarios(usuariosData || []);
      setOrdensServico(ordensData || []);
      setProcedimentos(procedimentosData || []);
      setCategorias(categoriasData || []);

      // Calcular estatísticas
      const totalUsuarios = usuariosData?.length || 0;
      const assinaturasAtivas = usuariosData?.filter(u => u.assinatura_status === 'ATIVA').length || 0;
      const totalOS = ordensData?.length || 0;
      const ordensConfirmadas = ordensData?.filter(o => o.status === 'confirmada' || o.status === 'realizada').length || 0;
      const ordensPendentes = ordensData?.filter(o => o.status === 'solicitada' || o.status === 'em_analise').length || 0;
      const faturamentoMensal = assinaturasAtivas * 59.90;
      const faturamentoLiquido = faturamentoMensal * 0.85; // Considerando 15% de taxas

      setStats({
        totalUsuarios,
        assinaturasAtivas,
        ordensServico: totalOS,
        faturamentoMensal,
        faturamentoLiquido,
        ordensConfirmadas,
        ordensPendentes
      });

    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do painel.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'solicitada': { label: 'Solicitada', variant: 'secondary' as const },
      'em_analise': { label: 'Em Análise', variant: 'outline' as const },
      'confirmada': { label: 'Confirmada', variant: 'default' as const },
      'realizada': { label: 'Realizada', variant: 'default' as const },
      'cancelada': { label: 'Cancelada', variant: 'destructive' as const },
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || { label: status, variant: 'secondary' as const };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const getAssinaturaStatusBadge = (status: string) => {
    const statusMap = {
      'ATIVA': { label: 'Ativa', variant: 'default' as const },
      'PENDENTE': { label: 'Pendente', variant: 'secondary' as const },
      'CANCELADA': { label: 'Cancelada', variant: 'destructive' as const },
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || { label: status, variant: 'secondary' as const };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const handleUpdateProcedure = async (procedureId: string, newData: any) => {
    try {
      const { error } = await supabase
        .from("procedimentos")
        .update({
          preco_min: parseFloat(newData.preco_min),
          preco_max: newData.preco_max ? parseFloat(newData.preco_max) : null
        })
        .eq("id", procedureId);

      if (error) throw error;

      // Recarregar dados
      loadDashboardData();
      setEditingProcedure(null);
      
      toast({
        title: "Sucesso",
        description: "Procedimento atualizado com sucesso!",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleCreateProcedure = async () => {
    try {
      const { error } = await supabase
        .from("procedimentos")
        .insert({
          nome: newProcedure.nome,
          categoria_id: newProcedure.categoria_id,
          preco_min: parseFloat(newProcedure.preco_min),
          preco_max: newProcedure.preco_max ? parseFloat(newProcedure.preco_max) : null,
          observacoes: newProcedure.observacoes || null
        });

      if (error) throw error;

      // Recarregar dados e limpar form
      loadDashboardData();
      setNewProcedureDialog(false);
      setNewProcedure({
        nome: '',
        categoria_id: '',
        preco_min: '',
        preco_max: '',
        observacoes: ''
      });
      
      toast({
        title: "Sucesso",
        description: "Procedimento criado com sucesso!",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from("usuarios")
        .update({ role: newRole })
        .eq("id", userId);

      if (error) throw error;

      loadDashboardData();
      toast({
        title: "Sucesso",
        description: "Role do usuário atualizada!",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("usuarios")
        .update({ ativo: !currentStatus })
        .eq("id", userId);

      if (error) throw error;

      loadDashboardData();
      toast({
        title: "Sucesso",
        description: `Usuário ${!currentStatus ? 'ativado' : 'desativado'} com sucesso!`,
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleUpdateOrdemStatus = async (ordemId: string, newStatus: string, dataConfirmada?: string) => {
    try {
      const updateData: any = { status: newStatus };
      if (dataConfirmada) {
        updateData.data_confirmada = dataConfirmada;
      }

      const { error } = await supabase
        .from("ordens_servico")
        .update(updateData)
        .eq("id", ordemId);

      if (error) throw error;

      loadDashboardData();
      setOrdemDialog(false);
      toast({
        title: "Sucesso",
        description: "Ordem de serviço atualizada!",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-white">Carregando...</div>
      </div>
    );
  }

  // Se não está autenticado, mostrar tela de login
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="absolute top-4 left-4 text-white hover:bg-white/20"
            >
              <a href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </a>
            </Button>
            
            <div className="flex items-center justify-center space-x-3 mb-4">
              <img 
                src={logoSorrisoCidadao} 
                alt="Sorriso Cidadão" 
                className="h-12 w-auto brightness-0 invert"
              />
            </div>
            <p className="text-white/90">
              Acesso administrativo
            </p>
          </div>

          <Card className="shadow-2xl border-0">
            <CardHeader className="text-center">
              <CardTitle>Painel Administrativo</CardTitle>
              <CardDescription>
                Entre com suas credenciais de administrador
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Usuário</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="text"
                      placeholder="usuário"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Digite sua senha"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loginLoading}
                  variant="primary_cta"
                >
                  {loginLoading ? "Entrando..." : "Acessar Painel"}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm text-muted-foreground">
                <p>
                  Problemas de acesso?{" "}
                  <a
                    href="https://wa.me/5562999999999"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Contate o suporte técnico
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="mt-6 text-center text-white/80 text-sm">
            <p>
              <a href="/" className="text-secondary hover:underline font-semibold">
                ← Voltar ao site
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Painel administrativo
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center space-x-3">
            <img 
              src={logoSorrisoCidadao} 
              alt="Sorriso Cidadão" 
              className="h-8 w-auto"
            />
            <span className="font-semibold text-lg">Painel Administrativo</span>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </header>

      <div className="container py-8">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard">
              <Settings className="h-4 w-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="usuarios">
              <Users className="h-4 w-4 mr-2" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="ordens">
              <FileText className="h-4 w-4 mr-2" />
              Ordens de Serviço
            </TabsTrigger>
            <TabsTrigger value="procedimentos">
              <Calendar className="h-4 w-4 mr-2" />
              Procedimentos
            </TabsTrigger>
            <TabsTrigger value="configuracoes">
              <Settings className="h-4 w-4 mr-2" />
              Configurações
            </TabsTrigger>
          </TabsList>

          {/* Dashboard */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalUsuarios}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Assinaturas Ativas</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.assinaturasAtivas}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ordens Confirmadas</CardTitle>
                  <Check className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.ordensConfirmadas}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ordens Pendentes</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.ordensPendentes}</div>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Faturamento Mensal Bruto</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">R$ {stats.faturamentoMensal.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.assinaturasAtivas} assinaturas × R$ 59,90
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Faturamento Líquido</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">R$ {stats.faturamentoLiquido.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Descontando 15% de taxas
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Usuários */}
          <TabsContent value="usuarios" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Usuários Cadastrados</CardTitle>
                <CardDescription>
                  Gerenciar usuários, roles e status de ativação
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>CPF</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status Assinatura</TableHead>
                      <TableHead>Ativo</TableHead>
                      <TableHead>Data Cadastro</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                   <TableBody>
                     {usuarios.length === 0 ? (
                       <TableRow>
                         <TableCell colSpan={8} className="text-center text-muted-foreground">
                           Nenhum usuário encontrado
                         </TableCell>
                       </TableRow>
                     ) : (
                       usuarios.map((usuario: any) => (
                         <TableRow key={usuario.id}>
                           <TableCell className="font-medium">{usuario.nome}</TableCell>
                           <TableCell>{usuario.email}</TableCell>
                           <TableCell>{usuario.cpf || '-'}</TableCell>
                           <TableCell>
                             <Select 
                               value={usuario.role} 
                               onValueChange={(value) => handleUpdateUserRole(usuario.id, value)}
                             >
                               <SelectTrigger className="w-32">
                                 <SelectValue />
                               </SelectTrigger>
                               <SelectContent>
                                 <SelectItem value="cliente">Cliente</SelectItem>
                                 <SelectItem value="admin">Admin</SelectItem>
                                 <SelectItem value="operador">Operador</SelectItem>
                               </SelectContent>
                             </Select>
                           </TableCell>
                           <TableCell>
                             <div className="flex items-center gap-2">
                               {getAssinaturaStatusBadge(usuario.assinatura_status)}
                               {!usuario.ativo && <EyeOff className="h-4 w-4 text-muted-foreground" />}
                             </div>
                           </TableCell>
                           <TableCell>
                             <Switch
                               checked={usuario.ativo}
                               onCheckedChange={() => handleToggleUserStatus(usuario.id, usuario.ativo)}
                             />
                           </TableCell>
                           <TableCell>
                             {new Date(usuario.created_at).toLocaleDateString('pt-BR')}
                           </TableCell>
                           <TableCell>
                             <div className="flex gap-2">
                               <Button
                                 size="sm"
                                 variant="outline"
                                 onClick={() => handleToggleUserStatus(usuario.id, usuario.ativo)}
                               >
                                 {usuario.ativo ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                               </Button>
                             </div>
                           </TableCell>
                         </TableRow>
                       ))
                     )}
                   </TableBody>
                 </Table>
               </CardContent>
           </Card>
         </TabsContent>

          {/* Ordens de Serviço */}
          <TabsContent value="ordens" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Ordens de Serviço</CardTitle>
                <CardDescription>
                  Gerenciamento de consultas e procedimentos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Contato</TableHead>
                      <TableHead>Procedimento</TableHead>
                      <TableHead>Clínica</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data Solicitada</TableHead>
                      <TableHead>Data Confirmada</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ordensServico.map((ordem: any) => (
                      <TableRow key={ordem.id}>
                        <TableCell className="font-medium">
                          {ordem.usuarios?.nome || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm">
                              <Mail className="h-3 w-3" />
                              {ordem.usuarios?.email || 'N/A'}
                            </div>
                            {ordem.usuarios?.telefone && (
                              <div className="flex items-center gap-1 text-sm">
                                <Phone className="h-3 w-3" />
                                {ordem.usuarios.telefone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{ordem.procedimentos?.nome || 'N/A'}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{ordem.clinicas?.nome || 'N/A'}</div>
                            {ordem.clinicas?.cidade && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <MapPin className="h-3 w-3" />
                                {ordem.clinicas.cidade}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(ordem.status)}
                        </TableCell>
                        <TableCell>
                          {ordem.data_solicitada 
                            ? new Date(ordem.data_solicitada).toLocaleDateString('pt-BR')
                            : new Date(ordem.created_at).toLocaleDateString('pt-BR')
                          }
                        </TableCell>
                        <TableCell>
                          {ordem.data_confirmada 
                            ? new Date(ordem.data_confirmada).toLocaleDateString('pt-BR')
                            : '-'
                          }
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedOrdem(ordem);
                              setOrdemDialog(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Dialog para editar ordem */}
            <Dialog open={ordemDialog} onOpenChange={setOrdemDialog}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Gerenciar Ordem de Serviço</DialogTitle>
                  <DialogDescription>
                    Atualizar status e informações da ordem
                  </DialogDescription>
                </DialogHeader>
                {selectedOrdem && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Cliente</Label>
                        <p className="text-sm">{selectedOrdem.usuarios?.nome}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Email</Label>
                        <p className="text-sm">{selectedOrdem.usuarios?.email}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Telefone</Label>
                        <p className="text-sm">{selectedOrdem.usuarios?.telefone || 'Não informado'}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Procedimento</Label>
                        <p className="text-sm">{selectedOrdem.procedimentos?.nome}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="status">Status</Label>
                        <Select 
                          value={selectedOrdem.status} 
                          onValueChange={(value) => setSelectedOrdem({...selectedOrdem, status: value})}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="solicitada">Solicitada</SelectItem>
                            <SelectItem value="em_analise">Em Análise</SelectItem>
                            <SelectItem value="confirmada">Confirmada</SelectItem>
                            <SelectItem value="realizada">Realizada</SelectItem>
                            <SelectItem value="cancelada">Cancelada</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="data_confirmada">Data Confirmada</Label>
                        <Input
                          type="date"
                          value={selectedOrdem.data_confirmada ? selectedOrdem.data_confirmada.split('T')[0] : ''}
                          onChange={(e) => setSelectedOrdem({...selectedOrdem, data_confirmada: e.target.value})}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="observacoes">Observações Internas</Label>
                      <Textarea
                        value={selectedOrdem.observacoes_internas || ''}
                        onChange={(e) => setSelectedOrdem({...selectedOrdem, observacoes_internas: e.target.value})}
                        placeholder="Observações internas sobre a ordem..."
                        rows={3}
                      />
                    </div>
                  </div>
                )}
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOrdemDialog(false)}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={() => handleUpdateOrdemStatus(
                      selectedOrdem.id, 
                      selectedOrdem.status, 
                      selectedOrdem.data_confirmada
                    )}
                  >
                    Salvar Alterações
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
           </TabsContent>

          {/* Procedimentos */}
          <TabsContent value="procedimentos" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Gerenciar Procedimentos</CardTitle>
                  <CardDescription>
                    Criar novos procedimentos e atualizar valores
                  </CardDescription>
                </div>
                <Dialog open={newProcedureDialog} onOpenChange={setNewProcedureDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Novo Procedimento
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Criar Novo Procedimento</DialogTitle>
                      <DialogDescription>
                        Adicionar um novo procedimento ao sistema
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="nome">Nome do Procedimento</Label>
                        <Input
                          id="nome"
                          value={newProcedure.nome}
                          onChange={(e) => setNewProcedure({...newProcedure, nome: e.target.value})}
                          placeholder="Ex: Limpeza Dental"
                        />
                      </div>
                      <div>
                        <Label htmlFor="categoria">Categoria</Label>
                        <Select 
                          value={newProcedure.categoria_id} 
                          onValueChange={(value) => setNewProcedure({...newProcedure, categoria_id: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma categoria" />
                          </SelectTrigger>
                          <SelectContent>
                            {categorias.map((cat: any) => (
                              <SelectItem key={cat.id} value={cat.id}>{cat.nome}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="preco_min">Preço Mínimo</Label>
                          <Input
                            id="preco_min"
                            type="number"
                            step="0.01"
                            value={newProcedure.preco_min}
                            onChange={(e) => setNewProcedure({...newProcedure, preco_min: e.target.value})}
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <Label htmlFor="preco_max">Preço Máximo (Opcional)</Label>
                          <Input
                            id="preco_max"
                            type="number"
                            step="0.01"
                            value={newProcedure.preco_max}
                            onChange={(e) => setNewProcedure({...newProcedure, preco_max: e.target.value})}
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="observacoes">Observações</Label>
                        <Textarea
                          id="observacoes"
                          value={newProcedure.observacoes}
                          onChange={(e) => setNewProcedure({...newProcedure, observacoes: e.target.value})}
                          placeholder="Descrição do procedimento..."
                          rows={3}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setNewProcedureDialog(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleCreateProcedure}>
                        Criar Procedimento
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Procedimento</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Preço Mínimo</TableHead>
                      <TableHead>Preço Máximo</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {procedimentos.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          Nenhum procedimento encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      procedimentos.map((proc: any) => (
                        <TableRow key={proc.id}>
                          <TableCell className="font-medium">{proc.nome}</TableCell>
                          <TableCell>{proc.categorias?.nome}</TableCell>
                          <TableCell>
                            {editingProcedure === proc.id ? (
                              <Input
                                type="number"
                                step="0.01"
                                defaultValue={proc.preco_min}
                                className="w-24"
                                id={`min-${proc.id}`}
                              />
                            ) : (
                              `R$ ${proc.preco_min?.toFixed(2)}`
                            )}
                          </TableCell>
                          <TableCell>
                            {editingProcedure === proc.id ? (
                              <Input
                                type="number"
                                step="0.01"
                                defaultValue={proc.preco_max || ''}
                                className="w-24"
                                id={`max-${proc.id}`}
                                placeholder="Opcional"
                              />
                            ) : (
                              proc.preco_max ? `R$ ${proc.preco_max?.toFixed(2)}` : '-'
                            )}
                          </TableCell>
                          <TableCell>
                            {editingProcedure === proc.id ? (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    const minInput = document.getElementById(`min-${proc.id}`) as HTMLInputElement;
                                    const maxInput = document.getElementById(`max-${proc.id}`) as HTMLInputElement;
                                    handleUpdateProcedure(proc.id, {
                                      preco_min: minInput.value,
                                      preco_max: maxInput.value || null
                                    });
                                  }}
                                >
                                  Salvar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingProcedure(null)}
                                >
                                  Cancelar
                                </Button>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingProcedure(proc.id)}
                              >
                                Editar
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Configurações */}
          <TabsContent value="configuracoes" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configurações do Sistema</CardTitle>
                <CardDescription>
                  Configurações gerais da plataforma
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Funcionalidades de configuração em desenvolvimento.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;