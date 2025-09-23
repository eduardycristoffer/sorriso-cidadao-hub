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
import { Mail, Lock, ArrowLeft, LogOut, Users, FileText, Calendar, Settings, Plus, Edit, Phone, MapPin, Clock, Check, X, Eye, EyeOff, DollarSign, PieChart, Trash2 } from "lucide-react";
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
  const [editingValues, setEditingValues] = useState({ nome: '', categoria_id: '', preco_min: '', preco_max: '' });
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
    ordensPendentes: 0,
    ordensCanceladas: 0,
    ordensRealizadas: 0,
    ordensEmAnalise: 0
  });
  
  // Estados para gerenciar categorias
  const [editingCategoria, setEditingCategoria] = useState(null);
  const [editingCategoriaValues, setEditingCategoriaValues] = useState({ nome: '', icone: '', ordem: '' });
  const [newCategoriaDialog, setNewCategoriaDialog] = useState(false);
  const [newCategoria, setNewCategoria] = useState({
    nome: '',
    icone: '',
    ordem: ''
  });

  const [createUserDialog, setCreateUserDialog] = useState(false);
  const [newUser, setNewUser] = useState({
    nome: '',
    email: '',
    telefone: '',
    cpf: '',
    role: 'cliente',
    password: ''
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
      // Verificar credenciais válidas (sem usar Supabase auth)
      const validCredentials = [
        { email: "eduardy", password: "@Tryade2025" },
        { email: "novaodontologiaanapolis@gmail.com", password: "@novaodonto2025" },
        { email: "rodrigo", password: "@novaodonto2025" }
      ];

      const validCredential = validCredentials.find(cred => 
        cred.email === email && cred.password === password
      );

      if (!validCredential) {
        toast({
          title: "Credenciais inválidas",
          description: "Usuário ou senha incorretos.",
          variant: "destructive",
        });
        setLoginLoading(false);
        return;
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
        description: "Ocorreu um erro inesperado.",
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
    console.log("Iniciando carregamento dos dados do dashboard...");
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

      // Carregar procedimentos e categorias (apenas ativos)
      console.log("Carregando procedimentos...");
      const { data: procedimentosData, error: procError } = await supabase
        .from("procedimentos")
        .select(`
          *,
          categorias(nome)
        `)
        .eq("ativo", true)
        .order("nome");

      if (procError) {
        console.error("Erro ao carregar procedimentos:", procError);
      } else {
        console.log("Procedimentos carregados:", procedimentosData);
      }

      const { data: categoriasData } = await supabase
        .from("categorias")
        .select("*")
        .order("ordem");

      setUsuarios(usuariosData || []);
      setOrdensServico(ordensData || []);
      setProcedimentos(procedimentosData || []);
      setCategorias(categoriasData || []);
      
      console.log("Estados atualizados com sucesso");
      console.log("Total de procedimentos no estado:", procedimentosData?.length || 0);

      // Calcular estatísticas
      const totalUsuarios = usuariosData?.length || 0;
      const assinaturasAtivas = usuariosData?.filter(u => u.assinatura_status === 'ATIVA').length || 0;
      const totalOS = ordensData?.length || 0;
      const ordensConfirmadas = ordensData?.filter(o => o.status === 'confirmada').length || 0;
      const ordensPendentes = ordensData?.filter(o => o.status === 'solicitada' || o.status === 'em_analise').length || 0;
      const ordensCanceladas = ordensData?.filter(o => o.status === 'cancelada').length || 0;
      const ordensRealizadas = ordensData?.filter(o => o.status === 'realizada').length || 0;
      const ordensEmAnalise = ordensData?.filter(o => o.status === 'em_analise').length || 0;
      const faturamentoMensal = assinaturasAtivas * 59.90;
      const faturamentoLiquido = faturamentoMensal * 0.85; // Considerando 15% de taxas

      setStats({
        totalUsuarios,
        assinaturasAtivas,
        ordensServico: totalOS,
        faturamentoMensal,
        faturamentoLiquido,
        ordensConfirmadas,
        ordensPendentes,
        ordensCanceladas,
        ordensRealizadas,
        ordensEmAnalise
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
    console.log("Iniciando atualização do procedimento:", procedureId, newData);
    
    try {
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      // Se está editando nome
      if (newData.nome !== undefined) {
        if (!newData.nome.trim()) {
          toast({
            title: "Erro",
            description: "Nome do procedimento é obrigatório",
            variant: "destructive",
          });
          return;
        }
        updateData.nome = newData.nome.trim();
      }

      // Se está editando categoria
      if (newData.categoria_id !== undefined) {
        if (!newData.categoria_id) {
          toast({
            title: "Erro",
            description: "Categoria é obrigatória",
            variant: "destructive",
          });
          return;
        }
        updateData.categoria_id = newData.categoria_id;
      }

      // Se está editando preços
      if (newData.preco_min !== undefined) {
        if (!newData.preco_min || isNaN(parseFloat(newData.preco_min))) {
          toast({
            title: "Erro",
            description: "Preço mínimo deve ser um valor válido",
            variant: "destructive",
          });
          return;
        }
        updateData.preco_min = parseFloat(newData.preco_min);
        updateData.preco_max = newData.preco_max && newData.preco_max !== '' ? parseFloat(newData.preco_max) : null;
      }

      console.log("Dados para atualização:", updateData);

      // Atualizar no banco de dados
      const { data, error } = await supabase
        .from("procedimentos")
        .update(updateData)
        .eq("id", procedureId)
        .select();

      if (error) {
        console.error("Erro do Supabase:", error);
        throw error;
      }

      console.log("Atualização bem-sucedida:", data);

      // Atualizar estado local imediatamente
      setProcedimentos(currentProcedimentos => 
        currentProcedimentos.map(proc => 
          proc.id === procedureId 
            ? { 
                ...proc, 
                ...updateData
              }
            : proc
        )
      );

      setEditingProcedure(null);
      setEditingValues({ nome: '', categoria_id: '', preco_min: '', preco_max: '' });
      
      toast({
        title: "Sucesso",
        description: "Procedimento atualizado com sucesso!",
      });

      // Recarregar dados em background para garantir sincronização
      setTimeout(() => {
        console.log("Recarregando dados em background...");
        loadDashboardData();
      }, 500);
      
    } catch (error: any) {
      console.error("Erro ao atualizar procedimento:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar procedimento",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProcedure = async (procedureId: string, procedureName: string) => {
    try {
      const { error } = await supabase
        .from("procedimentos")
        .update({ ativo: false })
        .eq("id", procedureId);

      if (error) throw error;

      // Remover do estado local
      setProcedimentos(currentProcedimentos => 
        currentProcedimentos.filter(proc => proc.id !== procedureId)
      );
      
      toast({
        title: "Sucesso",
        description: `Procedimento "${procedureName}" foi desativado com sucesso!`,
      });

      // Recarregar dados em background
      setTimeout(() => {
        loadDashboardData();
      }, 500);
      
    } catch (error: any) {
      console.error("Erro ao excluir procedimento:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir procedimento",
        variant: "destructive",
      });
    }
  };

  // Funções para gerenciar categorias
  const handleCreateCategoria = async () => {
    try {
      if (!newCategoria.nome || !newCategoria.icone) {
        toast({
          title: "Erro",
          description: "Nome e ícone são obrigatórios",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from("categorias")
        .insert({
          nome: newCategoria.nome,
          icone: newCategoria.icone,
          ordem: newCategoria.ordem ? parseInt(newCategoria.ordem) : categorias.length + 1,
        });

      if (error) throw error;

      await loadDashboardData();
      setNewCategoriaDialog(false);
      setNewCategoria({ nome: '', icone: '', ordem: '' });
      
      toast({
        title: "Sucesso",
        description: "Categoria criada com sucesso!",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar categoria",
        variant: "destructive",
      });
    }
  };

  const handleUpdateCategoria = async (categoriaId: string, newData: any) => {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (newData.nome !== undefined) {
        if (!newData.nome.trim()) {
          toast({
            title: "Erro",
            description: "Nome da categoria é obrigatório",
            variant: "destructive",
          });
          return;
        }
        updateData.nome = newData.nome.trim();
      }

      if (newData.icone !== undefined) {
        if (!newData.icone.trim()) {
          toast({
            title: "Erro",
            description: "Ícone é obrigatório",
            variant: "destructive",
          });
          return;
        }
        updateData.icone = newData.icone.trim();
      }

      if (newData.ordem !== undefined) {
        updateData.ordem = parseInt(newData.ordem) || 1;
      }

      const { error } = await supabase
        .from("categorias")
        .update(updateData)
        .eq("id", categoriaId);

      if (error) throw error;

      setCategorias(currentCategorias => 
        currentCategorias.map(cat => 
          cat.id === categoriaId 
            ? { ...cat, ...updateData }
            : cat
        )
      );

      setEditingCategoria(null);
      setEditingCategoriaValues({ nome: '', icone: '', ordem: '' });
      
      toast({
        title: "Sucesso",
        description: "Categoria atualizada com sucesso!",
      });

      setTimeout(() => {
        loadDashboardData();
      }, 500);
      
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar categoria",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCategoria = async (categoriaId: string, categoriaNome: string) => {
    try {
      // Verificar se existem procedimentos usando esta categoria
      const { data: procedimentosUsandoCategoria, error: checkError } = await supabase
        .from("procedimentos")
        .select("id")
        .eq("categoria_id", categoriaId)
        .eq("ativo", true);

      if (checkError) throw checkError;

      if (procedimentosUsandoCategoria && procedimentosUsandoCategoria.length > 0) {
        toast({
          title: "Erro",
          description: `Não é possível excluir a categoria "${categoriaNome}" pois existem ${procedimentosUsandoCategoria.length} procedimento(s) usando ela.`,
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from("categorias")
        .delete()
        .eq("id", categoriaId);

      if (error) throw error;

      setCategorias(currentCategorias => 
        currentCategorias.filter(cat => cat.id !== categoriaId)
      );
      
      toast({
        title: "Sucesso",
        description: `Categoria "${categoriaNome}" foi excluída com sucesso!`,
      });

      setTimeout(() => {
        loadDashboardData();
      }, 500);
      
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir categoria",
        variant: "destructive",
      });
    }
  };

  const handleCreateProcedure = async () => {
    try {
      // Validar campos obrigatórios
      if (!newProcedure.nome || !newProcedure.categoria_id || !newProcedure.preco_min) {
        toast({
          title: "Erro",
          description: "Preencha todos os campos obrigatórios (Nome, Categoria e Preço Mínimo)",
          variant: "destructive",
        });
        return;
      }

      if (isNaN(parseFloat(newProcedure.preco_min))) {
        toast({
          title: "Erro",
          description: "Preço mínimo deve ser um valor válido",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from("procedimentos")
        .insert({
          nome: newProcedure.nome,
          categoria_id: newProcedure.categoria_id,
          preco_min: parseFloat(newProcedure.preco_min),
          preco_max: newProcedure.preco_max && newProcedure.preco_max !== '' ? parseFloat(newProcedure.preco_max) : null,
          observacoes: newProcedure.observacoes || null,
          ativo: true
        });

      if (error) throw error;

      // Recarregar dados e limpar form
      await loadDashboardData();
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
      console.error("Erro ao criar procedimento:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar procedimento",
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

  const handleCreateUser = async () => {
    try {
      // Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (authError) throw authError;

      // Criar entrada na tabela usuarios
      const { error: dbError } = await supabase
        .from("usuarios")
        .insert({
          nome: newUser.nome,
          email: newUser.email,
          telefone: newUser.telefone,
          cpf: newUser.cpf,
          role: newUser.role,
          auth_user_id: authData.user?.id,
          ativo: true
        });

      if (dbError) throw dbError;

      // Recarregar dados e limpar form
      loadDashboardData();
      setCreateUserDialog(false);
      setNewUser({
        nome: '',
        email: '',
        telefone: '',
        cpf: '',
        role: 'cliente',
        password: ''
      });
      
      toast({
        title: "Sucesso",
        description: "Usuário criado com sucesso!",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleActivateSubscription = async (email) => {
    try {
      const { error } = await supabase
        .from('usuarios')
        .update({ 
          assinatura_status: 'ATIVA',
          updated_at: new Date().toISOString()
        })
        .eq('email', email);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Assinatura ativada para ${email}!`,
      });
      
      loadDashboardData();
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
          <TabsList className="grid w-full grid-cols-7">
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
            <TabsTrigger value="vendas">
              <DollarSign className="h-4 w-4 mr-2" />
              Vendas
            </TabsTrigger>
            <TabsTrigger value="procedimentos">
              <Calendar className="h-4 w-4 mr-2" />
              Procedimentos
            </TabsTrigger>
            <TabsTrigger value="categorias">
              <FileText className="h-4 w-4 mr-2" />
              Categorias
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

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Realizadas</CardTitle>
                  <Check className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{stats.ordensRealizadas}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Em Análise</CardTitle>
                  <Clock className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">{stats.ordensEmAnalise}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Canceladas</CardTitle>
                  <X className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{stats.ordensCanceladas}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Faturamento Bruto</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">R$ {stats.faturamentoMensal.toFixed(2)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Faturamento Líquido</CardTitle>
                  <DollarSign className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">R$ {stats.faturamentoLiquido.toFixed(2)}</div>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Status das Ordens</CardTitle>
                  <CardDescription>Distribuição por status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{stats.ordensRealizadas}</div>
                        <div className="text-sm text-muted-foreground">Realizadas</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{stats.ordensConfirmadas}</div>
                        <div className="text-sm text-muted-foreground">Confirmadas</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">{stats.ordensEmAnalise}</div>
                        <div className="text-sm text-muted-foreground">Em Análise</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">{stats.ordensPendentes}</div>
                        <div className="text-sm text-muted-foreground">Pendentes</div>
                      </div>
                    </div>
                    <div className="text-center border-t pt-4">
                      <div className="text-2xl font-bold text-red-600">{stats.ordensCanceladas}</div>
                      <div className="text-sm text-muted-foreground">Canceladas</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Resumo de Status</CardTitle>
                  <CardDescription>Barras de progresso por categoria</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Realizadas</span>
                      <span className="font-bold text-green-600">{stats.ordensRealizadas}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full" 
                        style={{ 
                          width: `${stats.ordensServico > 0 ? (stats.ordensRealizadas / stats.ordensServico) * 100 : 0}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Confirmadas</span>
                      <span className="font-bold text-blue-600">{stats.ordensConfirmadas}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full" 
                        style={{ 
                          width: `${stats.ordensServico > 0 ? (stats.ordensConfirmadas / stats.ordensServico) * 100 : 0}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Pendentes</span>
                      <span className="font-bold text-yellow-600">{stats.ordensPendentes}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-yellow-500 h-2 rounded-full" 
                        style={{ 
                          width: `${stats.ordensServico > 0 ? (stats.ordensPendentes / stats.ordensServico) * 100 : 0}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Canceladas</span>
                      <span className="font-bold text-red-600">{stats.ordensCanceladas}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-red-500 h-2 rounded-full" 
                        style={{ 
                          width: `${stats.ordensServico > 0 ? (stats.ordensCanceladas / stats.ordensServico) * 100 : 0}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Usuários */}
          <TabsContent value="usuarios" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Usuários Cadastrados</CardTitle>
                  <CardDescription>
                    Gerenciar usuários, roles e status de ativação
                  </CardDescription>
                </div>
                <Dialog open={createUserDialog} onOpenChange={setCreateUserDialog}>
                  <DialogTrigger asChild>
                    <Button variant="primary_cta">
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Usuário
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Criar Novo Usuário</DialogTitle>
                      <DialogDescription>
                        Preencha os dados do novo usuário
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="nome">Nome Completo</Label>
                        <Input
                          id="nome"
                          value={newUser.nome}
                          onChange={(e) => setNewUser({ ...newUser, nome: e.target.value })}
                          placeholder="Digite o nome completo"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={newUser.email}
                          onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                          placeholder="Digite o email"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">Senha</Label>
                        <Input
                          id="password"
                          type="password"
                          value={newUser.password}
                          onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                          placeholder="Digite a senha"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="telefone">Telefone</Label>
                        <Input
                          id="telefone"
                          value={newUser.telefone}
                          onChange={(e) => setNewUser({ ...newUser, telefone: e.target.value })}
                          placeholder="Digite o telefone"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cpf">CPF</Label>
                        <Input
                          id="cpf"
                          value={newUser.cpf}
                          onChange={(e) => setNewUser({ ...newUser, cpf: e.target.value })}
                          placeholder="Digite o CPF"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="role">Tipo de Usuário</Label>
                        <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cliente">Cliente</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="operador">Operador</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setCreateUserDialog(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleCreateUser} variant="primary_cta">
                        Criar Usuário
                      </Button>
                    </DialogFooter>
                   </DialogContent>
                 </Dialog>
               </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>CPF</TableHead>
                      <TableHead>Order ID</TableHead>
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
                          <TableCell colSpan={10} className="text-center text-muted-foreground">
                            Nenhum usuário encontrado
                          </TableCell>
                        </TableRow>
                      ) : (
                        usuarios.map((usuario: any) => (
                          <TableRow key={usuario.id}>
                            <TableCell className="font-medium">{usuario.nome}</TableCell>
                            <TableCell>{usuario.email}</TableCell>
                            <TableCell>{usuario.telefone || '-'}</TableCell>
                            <TableCell>{usuario.cpf || '-'}</TableCell>
                            <TableCell>
                              <code className="text-xs bg-muted px-1 py-0.5 rounded">
                                {usuario.order_id || '-'}
                              </code>
                            </TableCell>
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
                                {usuario.assinatura_status !== 'ATIVA' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleActivateSubscription(usuario.email)}
                                    className="h-6 px-2 text-xs"
                                  >
                                    Ativar
                                  </Button>
                                )}
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

          {/* Vendas */}
          <TabsContent value="vendas" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">R$ {stats.faturamentoMensal.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Faturamento mensal bruto
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Receita Líquida</CardTitle>
                  <DollarSign className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">R$ {stats.faturamentoLiquido.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Após descontos e taxas
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Assinaturas Vendidas</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.assinaturasAtivas}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Planos ativos
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">R$ 59,90</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Valor por assinatura
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Histórico de Vendas</CardTitle>
                  <CardDescription>Usuários cadastrados via webhook</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usuarios.filter(u => u.order_id).map((usuario: any) => (
                        <TableRow key={usuario.id}>
                          <TableCell className="font-medium">{usuario.nome}</TableCell>
                          <TableCell>{usuario.email}</TableCell>
                          <TableCell>
                            <code className="text-xs bg-muted px-1 py-0.5 rounded">
                              {usuario.order_id}
                            </code>
                          </TableCell>
                          <TableCell>
                            {getAssinaturaStatusBadge(usuario.assinatura_status)}
                          </TableCell>
                          <TableCell>
                            {new Date(usuario.created_at).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell>
                            <span className="font-bold text-green-600">R$ 59,90</span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Métricas de Conversão</CardTitle>
                  <CardDescription>Performance das vendas</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Taxa de Conversão</span>
                      <span className="font-bold">
                        {stats.totalUsuarios > 0 ? ((stats.assinaturasAtivas / stats.totalUsuarios) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full" 
                        style={{ 
                          width: `${stats.totalUsuarios > 0 ? (stats.assinaturasAtivas / stats.totalUsuarios) * 100 : 0}%` 
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Assinaturas Ativas</span>
                      <span className="font-bold">{stats.assinaturasAtivas}/{stats.totalUsuarios}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full" 
                        style={{ 
                          width: `${stats.totalUsuarios > 0 ? (stats.assinaturasAtivas / stats.totalUsuarios) * 100 : 0}%` 
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-green-600">{stats.assinaturasAtivas}</div>
                        <div className="text-xs text-muted-foreground">Vendas Realizadas</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-blue-600">{stats.totalUsuarios - stats.assinaturasAtivas}</div>
                        <div className="text-xs text-muted-foreground">Leads Pendentes</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
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
                          <TableCell className="font-medium">
                            {editingProcedure === proc.id ? (
                              <Input
                                value={editingValues.nome}
                                onChange={(e) => setEditingValues({...editingValues, nome: e.target.value})}
                                className="w-full"
                                placeholder="Nome do procedimento"
                              />
                            ) : (
                              proc.nome
                            )}
                          </TableCell>
                          <TableCell>
                            {editingProcedure === proc.id ? (
                              <Select 
                                value={editingValues.categoria_id} 
                                onValueChange={(value) => setEditingValues({...editingValues, categoria_id: value})}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Selecione uma categoria" />
                                </SelectTrigger>
                                <SelectContent>
                                  {categorias.map((cat: any) => (
                                    <SelectItem key={cat.id} value={cat.id}>{cat.nome}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              proc.categorias?.nome
                            )}
                          </TableCell>
                           <TableCell>
                             {editingProcedure === proc.id ? (
                               <Input
                                 type="number"
                                 step="0.01"
                                 value={editingValues.preco_min}
                                 onChange={(e) => setEditingValues({...editingValues, preco_min: e.target.value})}
                                 className="w-24"
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
                                 value={editingValues.preco_max}
                                 onChange={(e) => setEditingValues({...editingValues, preco_max: e.target.value})}
                                 className="w-24"
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
                                      console.log("Botão Salvar clicado para procedimento:", proc.id);
                                      console.log("Valores editados:", editingValues);
                                      
                                      // Verifica se há alterações antes de salvar
                                      if (!editingValues.nome.trim()) {
                                        toast({
                                          title: "Erro",
                                          description: "Nome do procedimento é obrigatório",
                                          variant: "destructive",
                                        });
                                        return;
                                      }
                                      
                                       handleUpdateProcedure(proc.id, {
                                         nome: editingValues.nome.trim(),
                                         categoria_id: editingValues.categoria_id,
                                         preco_min: editingValues.preco_min,
                                         preco_max: editingValues.preco_max || null
                                       });
                                    }}
                                  >
                                    Salvar
                                  </Button>
                                 <Button
                                   size="sm"
                                   variant="outline"
                                     onClick={() => {
                                       setEditingProcedure(null);
                                       setEditingValues({ nome: '', categoria_id: '', preco_min: '', preco_max: '' });
                                     }}
                                 >
                                   Cancelar
                                 </Button>
                              </div>
                             ) : (
                               <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setEditingProcedure(proc.id);
                                      setEditingValues({
                                        nome: proc.nome || '',
                                        categoria_id: proc.categoria_id || '',
                                        preco_min: proc.preco_min?.toString() || '',
                                        preco_max: proc.preco_max?.toString() || ''
                                      });
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => {
                                    if (confirm(`Tem certeza que deseja excluir o procedimento "${proc.nome}"?`)) {
                                      handleDeleteProcedure(proc.id, proc.nome);
                                    }
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                               </div>
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

          {/* Categorias */}
          <TabsContent value="categorias" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Gerenciar Categorias</CardTitle>
                  <CardDescription>
                    Criar, editar e excluir categorias de procedimentos
                  </CardDescription>
                </div>
                <Dialog open={newCategoriaDialog} onOpenChange={setNewCategoriaDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Categoria
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Criar Nova Categoria</DialogTitle>
                      <DialogDescription>
                        Adicionar uma nova categoria ao sistema
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="nome">Nome da Categoria</Label>
                        <Input
                          id="nome"
                          value={newCategoria.nome}
                          onChange={(e) => setNewCategoria({...newCategoria, nome: e.target.value})}
                          placeholder="Ex: Clareamento"
                        />
                      </div>
                      <div>
                        <Label htmlFor="icone">Ícone</Label>
                        <Input
                          id="icone"
                          value={newCategoria.icone}
                          onChange={(e) => setNewCategoria({...newCategoria, icone: e.target.value})}
                          placeholder="Ex: sparkles"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Use nomes de ícones do Lucide React
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="ordem">Ordem (Opcional)</Label>
                        <Input
                          id="ordem"
                          type="number"
                          value={newCategoria.ordem}
                          onChange={(e) => setNewCategoria({...newCategoria, ordem: e.target.value})}
                          placeholder="1"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setNewCategoriaDialog(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleCreateCategoria}>
                        Criar Categoria
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Ícone</TableHead>
                      <TableHead>Ordem</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categorias.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                          Nenhuma categoria encontrada
                        </TableCell>
                      </TableRow>
                    ) : (
                      categorias.map((cat: any) => (
                        <TableRow key={cat.id}>
                          <TableCell className="font-medium">
                            {editingCategoria === cat.id ? (
                              <Input
                                value={editingCategoriaValues.nome}
                                onChange={(e) => setEditingCategoriaValues({...editingCategoriaValues, nome: e.target.value})}
                                className="w-full"
                                placeholder="Nome da categoria"
                              />
                            ) : (
                              cat.nome
                            )}
                          </TableCell>
                          <TableCell>
                            {editingCategoria === cat.id ? (
                              <Input
                                value={editingCategoriaValues.icone}
                                onChange={(e) => setEditingCategoriaValues({...editingCategoriaValues, icone: e.target.value})}
                                className="w-full"
                                placeholder="Ícone"
                              />
                            ) : (
                              cat.icone
                            )}
                          </TableCell>
                          <TableCell>
                            {editingCategoria === cat.id ? (
                              <Input
                                type="number"
                                value={editingCategoriaValues.ordem}
                                onChange={(e) => setEditingCategoriaValues({...editingCategoriaValues, ordem: e.target.value})}
                                className="w-20"
                                placeholder="1"
                              />
                            ) : (
                              cat.ordem
                            )}
                          </TableCell>
                          <TableCell>
                            {editingCategoria === cat.id ? (
                              <div className="flex gap-2">
                                 <Button
                                   size="sm"
                                   onClick={() => {
                                     handleUpdateCategoria(cat.id, {
                                       nome: editingCategoriaValues.nome,
                                       icone: editingCategoriaValues.icone,
                                       ordem: editingCategoriaValues.ordem
                                     });
                                   }}
                                 >
                                   Salvar
                                 </Button>
                                 <Button
                                   size="sm"
                                   variant="outline"
                                    onClick={() => {
                                      setEditingCategoria(null);
                                      setEditingCategoriaValues({ nome: '', icone: '', ordem: '' });
                                    }}
                                 >
                                   Cancelar
                                 </Button>
                              </div>
                            ) : (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setEditingCategoria(cat.id);
                                     setEditingCategoriaValues({
                                       nome: cat.nome || '',
                                       icone: cat.icone || '',
                                       ordem: cat.ordem?.toString() || ''
                                     });
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => {
                                    if (confirm(`Tem certeza que deseja excluir a categoria "${cat.nome}"?`)) {
                                      handleDeleteCategoria(cat.id, cat.nome);
                                    }
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
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