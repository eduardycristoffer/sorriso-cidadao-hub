import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Mail, Lock, ArrowLeft, LogOut, Users, FileText, Calendar, Settings } from "lucide-react";
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
  const [stats, setStats] = useState({
    totalUsuarios: 0,
    assinaturasAtivas: 0,
    ordensServico: 0,
    faturamentoMensal: 0
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

      setUsuarios(usuariosData || []);
      setOrdensServico(ordensData || []);

      // Calcular estatísticas
      const totalUsuarios = usuariosData?.length || 0;
      const assinaturasAtivas = usuariosData?.filter(u => u.assinatura_status === 'ATIVA').length || 0;
      const totalOS = ordensData?.length || 0;

      setStats({
        totalUsuarios,
        assinaturasAtivas,
        ordensServico: totalOS,
        faturamentoMensal: assinaturasAtivas * 59.90
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
          <TabsList className="grid w-full grid-cols-4">
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
                  <CardTitle className="text-sm font-medium">Ordens de Serviço</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.ordensServico}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Faturamento Mensal</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">R$ {stats.faturamentoMensal.toFixed(2)}</div>
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
                  Lista de todos os usuários do sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>CPF</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data Cadastro</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usuarios.map((usuario: any) => (
                      <TableRow key={usuario.id}>
                        <TableCell className="font-medium">{usuario.nome}</TableCell>
                        <TableCell>{usuario.email}</TableCell>
                        <TableCell>{usuario.cpf || '-'}</TableCell>
                        <TableCell>
                          {getAssinaturaStatusBadge(usuario.assinatura_status)}
                        </TableCell>
                        <TableCell>
                          {new Date(usuario.created_at).toLocaleDateString('pt-BR')}
                        </TableCell>
                      </TableRow>
                    ))}
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
                      <TableHead>Procedimento</TableHead>
                      <TableHead>Clínica</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data Solicitação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ordensServico.map((ordem: any) => (
                      <TableRow key={ordem.id}>
                        <TableCell className="font-medium">
                          {ordem.usuarios?.nome || 'N/A'}
                        </TableCell>
                        <TableCell>{ordem.procedimentos?.nome || 'N/A'}</TableCell>
                        <TableCell>{ordem.clinicas?.nome || 'N/A'}</TableCell>
                        <TableCell>
                          {getStatusBadge(ordem.status)}
                        </TableCell>
                        <TableCell>
                          {new Date(ordem.created_at).toLocaleDateString('pt-BR')}
                        </TableCell>
                      </TableRow>
                    ))}
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