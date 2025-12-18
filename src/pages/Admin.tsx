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
import { Mail, Lock, ArrowLeft, LogOut, Users, FileText, Calendar, Settings, Plus, Edit, Phone, MapPin, Clock, Check, X, Eye, EyeOff, DollarSign, PieChart, Trash2, UserPlus, History, CalendarDays, ClipboardList, TrendingUp, BarChart3 } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import logoSorrisoCidadao from "@/assets/logo-sorriso-cidadao.png";
import { IconPicker, IconDisplay } from "@/components/IconPicker";

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
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [procedureToDelete, setProcedureToDelete] = useState(null);
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

  // Estados para Dependentes
  const [selectedUsuario, setSelectedUsuario] = useState<any>(null);
  const [dependentesDialog, setDependentesDialog] = useState(false);
  const [dependentes, setDependentes] = useState([]);
  const [dependentesLoading, setDependentesLoading] = useState(false);
  const [newDependenteDialog, setNewDependenteDialog] = useState(false);
  const [newDependente, setNewDependente] = useState({
    nome: '',
    cpf: '',
    data_nascimento: '',
    parentesco: ''
  });
  const [addDependenteDialogOpen, setAddDependenteDialogOpen] = useState(false);
  const [selectedUsuarioIdForDependente, setSelectedUsuarioIdForDependente] = useState('');

  // Estados para Histórico de Assinaturas
  const [historicoDialog, setHistoricoDialog] = useState(false);
  const [historicoUsuario, setHistoricoUsuario] = useState<any>(null);
  const [historicoAssinaturas, setHistoricoAssinaturas] = useState<any[]>([]);
  const [historicoLoading, setHistoricoLoading] = useState(false);
  const [addHistoricoDialog, setAddHistoricoDialog] = useState(false);
  const [newHistorico, setNewHistorico] = useState({
    valor: '',
    data_inicio: '',
    data_fim: '',
    metodo_pagamento: '',
    observacoes: ''
  });

  // Estados para Configurações
  const [configuracoes, setConfiguracoes] = useState<any[]>([]);
  const [configLoading, setConfigLoading] = useState(false);
  const [mesesAssinatura, setMesesAssinatura] = useState('12');
  const [savingConfig, setSavingConfig] = useState(false);

  // Estados para Histórico de Procedimentos
  const [procedimentosDialog, setProcedimentosDialog] = useState(false);
  const [procedimentosUsuario, setProcedimentosUsuario] = useState<any>(null);
  const [historicoProcedimentos, setHistoricoProcedimentos] = useState<any[]>([]);
  const [procedimentosLoading, setProcedimentosLoading] = useState(false);

  // Estados para Adicionar Procedimento ao Cliente
  const [addProcedimentoDialog, setAddProcedimentoDialog] = useState(false);
  const [addProcedimentoUsuario, setAddProcedimentoUsuario] = useState<any>(null);
  const [usarProcedimentoManual, setUsarProcedimentoManual] = useState(false);
  const [clinicas, setClinicas] = useState<any[]>([]);
  const [dentistas, setDentistas] = useState<any[]>([]);
  const [newOrdemServico, setNewOrdemServico] = useState({
    procedimento_id: '',
    nome_procedimento_manual: '',
    valor_pago: '',
    clinica_id: '',
    dentista_id: '',
    data_solicitada: '',
    status: 'realizada',
    observacoes_internas: ''
  });

  // Estados para LTV e Relatórios
  const [clienteLtv, setClienteLtv] = useState<any>(null);
  const [relatorioClientes, setRelatorioClientes] = useState<any>(null);
  const [relatorioLoading, setRelatorioLoading] = useState(false);

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

  // Função auxiliar para chamar edge function admin
  const callAdminOperation = async (action: string, data: any = {}) => {
    const { data: response, error } = await supabase.functions.invoke('admin-operations', {
      body: { action, data }
    });
    
    if (error) throw error;
    if (!response.success) throw new Error(response.error);
    return response.data;
  };

  const loadDashboardData = async () => {
    console.log("Iniciando carregamento dos dados do dashboard...");
    try {
      // Carregar dados via edge function (usando service_role)
      const [usuariosData, ordensData, procedimentosData, categoriasData, configData] = await Promise.all([
        callAdminOperation('list_usuarios'),
        callAdminOperation('list_ordens'),
        callAdminOperation('list_procedimentos'),
        callAdminOperation('list_categorias'),
        callAdminOperation('list_configuracoes'),
      ]);

      console.log("Dados carregados via edge function");

      setUsuarios(usuariosData || []);
      setOrdensServico(ordensData || []);
      setProcedimentos(procedimentosData || []);
      setCategorias(categoriasData || []);
      setConfiguracoes(configData || []);
      
      // Extrair valor de meses_assinatura
      const mesesConfig = configData?.find((c: any) => c.chave === 'meses_assinatura');
      if (mesesConfig) {
        setMesesAssinatura(mesesConfig.valor);
      }

      setUsuarios(usuariosData || []);
      setOrdensServico(ordensData || []);
      setProcedimentos(procedimentosData || []);
      setCategorias(categoriasData || []);
      
      console.log("Estados atualizados com sucesso");
      console.log("Total de procedimentos no estado:", procedimentosData?.length || 0);

      // Calcular estatísticas
      const totalUsuarios = usuariosData?.length || 0;
      const assinaturasAtivas = usuariosData?.filter((u: any) => u.assinatura_status === 'ATIVA').length || 0;
      const totalOS = ordensData?.length || 0;
      const ordensConfirmadas = ordensData?.filter((o: any) => o.status === 'confirmada').length || 0;
      const ordensPendentes = ordensData?.filter((o: any) => o.status === 'solicitada' || o.status === 'em_analise').length || 0;
      const ordensCanceladas = ordensData?.filter((o: any) => o.status === 'cancelada').length || 0;
      const ordensRealizadas = ordensData?.filter((o: any) => o.status === 'realizada').length || 0;
      const ordensEmAnalise = ordensData?.filter((o: any) => o.status === 'em_analise').length || 0;
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

      // Atualizar via edge function
      await callAdminOperation('update_procedimento', {
        id: procedureId,
        ...updateData
      });

      console.log("Atualização bem-sucedida");

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
      await callAdminOperation('delete_procedimento', { id: procedureId });

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

      await callAdminOperation('create_categoria', {
        nome: newCategoria.nome,
        icone: newCategoria.icone,
        ordem: newCategoria.ordem ? parseInt(newCategoria.ordem) : categorias.length + 1,
      });

      await loadDashboardData();
      setNewCategoriaDialog(false);
      setNewCategoria({ nome: '', icone: '', ordem: '' });
      
      toast({
        title: "Sucesso",
        description: "Categoria criada com sucesso!",
      });
    } catch (error: any) {
      console.error("Erro ao criar categoria:", error);
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

      await callAdminOperation('update_categoria', {
        id: categoriaId,
        ...updateData
      });

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
      const procedimentosUsandoCategoria = procedimentos.filter(
        (p: any) => p.categoria_id === categoriaId
      );

      if (procedimentosUsandoCategoria.length > 0) {
        toast({
          title: "Erro",
          description: `Não é possível excluir a categoria "${categoriaNome}" pois existem ${procedimentosUsandoCategoria.length} procedimento(s) usando ela.`,
          variant: "destructive",
        });
        return;
      }

      await callAdminOperation('delete_categoria', { id: categoriaId });

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

      await callAdminOperation('create_procedimento', {
        nome: newProcedure.nome,
        categoria_id: newProcedure.categoria_id,
        preco_min: parseFloat(newProcedure.preco_min),
        preco_max: newProcedure.preco_max && newProcedure.preco_max !== '' ? parseFloat(newProcedure.preco_max) : null,
        observacoes: newProcedure.observacoes || null,
      });

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
      await callAdminOperation('update_usuario', { id: userId, role: newRole });

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
      await callAdminOperation('update_usuario', { id: userId, ativo: !currentStatus });

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
      const updateData: any = { id: ordemId, status: newStatus };
      if (dataConfirmada) {
        updateData.data_confirmada = dataConfirmada;
      }

      await callAdminOperation('update_ordem', updateData);

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
      // Validar campos obrigatórios
      if (!newUser.nome || !newUser.email || !newUser.password) {
        toast({
          title: "Erro",
          description: "Nome, email e senha são obrigatórios",
          variant: "destructive",
        });
        return;
      }

      // Criar usuário via edge function (usa auth.admin.createUser sem rate limit)
      const result = await callAdminOperation('create_usuario', {
        nome: newUser.nome,
        email: newUser.email,
        password: newUser.password,
        telefone: newUser.telefone || null,
        cpf: newUser.cpf ? newUser.cpf.replace(/\D/g, '') : null,
        role: newUser.role || 'cliente'
      });

      console.log('Usuário criado:', result);

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

  const handleActivateSubscription = async (userId: string) => {
    try {
      await callAdminOperation('update_usuario', { 
        id: userId, 
        assinatura_status: 'ATIVA' 
      });

      toast({
        title: "Sucesso",
        description: "Assinatura ativada com sucesso!",
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

  // Funções para Dependentes
  const loadDependentes = async (usuarioId: string) => {
    try {
      setDependentesLoading(true);
      const data = await callAdminOperation('list_dependentes', { usuario_id: usuarioId });
      setDependentes(data || []);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao carregar dependentes",
        variant: "destructive",
      });
    } finally {
      setDependentesLoading(false);
    }
  };

  const handleOpenDependentes = async (usuario: any) => {
    setSelectedUsuario(usuario);
    setDependentesDialog(true);
    await loadDependentes(usuario.id);
  };

  const handleCreateDependente = async () => {
    try {
      if (!newDependente.nome) {
        toast({
          title: "Erro",
          description: "Nome do dependente é obrigatório",
          variant: "destructive",
        });
        return;
      }

      await callAdminOperation('create_dependente', {
        usuario_id: selectedUsuario.id,
        nome: newDependente.nome,
        cpf: newDependente.cpf || null,
        data_nascimento: newDependente.data_nascimento || null,
        parentesco: newDependente.parentesco || null,
      });

      toast({
        title: "Sucesso",
        description: "Dependente adicionado com sucesso!",
      });

      setNewDependenteDialog(false);
      setNewDependente({ nome: '', cpf: '', data_nascimento: '', parentesco: '' });
      await loadDependentes(selectedUsuario.id);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar dependente",
        variant: "destructive",
      });
    }
  };

  // Função para adicionar dependente direto (com seleção de usuário)
  const handleAddDependenteDirect = async () => {
    try {
      if (!selectedUsuarioIdForDependente) {
        toast({
          title: "Erro",
          description: "Selecione um usuário pagante",
          variant: "destructive",
        });
        return;
      }

      if (!newDependente.nome) {
        toast({
          title: "Erro",
          description: "Nome do dependente é obrigatório",
          variant: "destructive",
        });
        return;
      }

      await callAdminOperation('create_dependente', {
        usuario_id: selectedUsuarioIdForDependente,
        nome: newDependente.nome,
        cpf: newDependente.cpf || null,
        data_nascimento: newDependente.data_nascimento || null,
        parentesco: newDependente.parentesco || null,
      });

      toast({
        title: "Sucesso",
        description: "Dependente adicionado com sucesso!",
      });

      setAddDependenteDialogOpen(false);
      setNewDependente({ nome: '', cpf: '', data_nascimento: '', parentesco: '' });
      setSelectedUsuarioIdForDependente('');
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar dependente",
        variant: "destructive",
      });
    }
  };

  const handleDeleteDependente = async (dependenteId: string, nome: string) => {
    try {
      await callAdminOperation('delete_dependente', { id: dependenteId });
      
      toast({
        title: "Sucesso",
        description: `Dependente "${nome}" removido com sucesso!`,
      });

      await loadDependentes(selectedUsuario.id);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao remover dependente",
        variant: "destructive",
      });
    }
  };

  // Funções para Histórico de Assinaturas
  const loadHistoricoAssinaturas = async (usuarioId: string) => {
    try {
      setHistoricoLoading(true);
      const data = await callAdminOperation('list_historico_assinaturas', { usuario_id: usuarioId });
      setHistoricoAssinaturas(data || []);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao carregar histórico",
        variant: "destructive",
      });
    } finally {
      setHistoricoLoading(false);
    }
  };

  const handleOpenHistorico = async (usuario: any) => {
    setHistoricoUsuario(usuario);
    setHistoricoDialog(true);
    await loadHistoricoAssinaturas(usuario.id);
  };

  const handleCreateHistorico = async () => {
    try {
      if (!newHistorico.valor || !newHistorico.data_inicio || !newHistorico.data_fim) {
        toast({
          title: "Erro",
          description: "Valor, data início e data fim são obrigatórios",
          variant: "destructive",
        });
        return;
      }

      await callAdminOperation('create_historico_assinatura', {
        usuario_id: historicoUsuario.id,
        valor: parseFloat(newHistorico.valor),
        data_inicio: newHistorico.data_inicio,
        data_fim: newHistorico.data_fim,
        metodo_pagamento: newHistorico.metodo_pagamento || null,
        observacoes: newHistorico.observacoes || null,
      });

      toast({
        title: "Sucesso",
        description: "Pagamento registrado e validade atualizada!",
      });

      setAddHistoricoDialog(false);
      setNewHistorico({ valor: '', data_inicio: '', data_fim: '', metodo_pagamento: '', observacoes: '' });
      await loadHistoricoAssinaturas(historicoUsuario.id);
      loadDashboardData(); // Recarregar para atualizar validade na tabela
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao registrar pagamento",
        variant: "destructive",
      });
    }
  };

  const handleUpdateValidade = async (usuarioId: string, novaValidade: string) => {
    try {
      await callAdminOperation('update_usuario_validade', {
        id: usuarioId,
        assinatura_validade: novaValidade,
      });

      toast({
        title: "Sucesso",
        description: "Validade atualizada!",
      });

      loadDashboardData();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar validade",
        variant: "destructive",
      });
    }
  };

  // Funções para Histórico de Procedimentos
  const loadHistoricoProcedimentos = async (usuarioId: string) => {
    try {
      setProcedimentosLoading(true);
      const data = await callAdminOperation('list_historico_procedimentos', { usuario_id: usuarioId });
      setHistoricoProcedimentos(data || []);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao carregar procedimentos",
        variant: "destructive",
      });
    } finally {
      setProcedimentosLoading(false);
    }
  };

  const handleOpenProcedimentos = async (usuario: any) => {
    setProcedimentosUsuario(usuario);
    setProcedimentosDialog(true);
    await Promise.all([
      loadHistoricoProcedimentos(usuario.id),
      loadClienteLtv(usuario.id)
    ]);
  };

  // Carregar LTV do cliente
  const loadClienteLtv = async (usuarioId: string) => {
    try {
      const data = await callAdminOperation('get_cliente_ltv', { usuario_id: usuarioId });
      setClienteLtv(data);
    } catch (error: any) {
      console.error('Erro ao carregar LTV:', error);
    }
  };

  // Carregar clínicas e dentistas
  const loadClinicasDentistas = async () => {
    try {
      const [clinicasData, dentistasData] = await Promise.all([
        callAdminOperation('list_clinicas'),
        callAdminOperation('list_dentistas')
      ]);
      setClinicas(clinicasData || []);
      setDentistas(dentistasData || []);
    } catch (error: any) {
      console.error('Erro ao carregar clínicas/dentistas:', error);
    }
  };

  // Abrir dialog de adicionar procedimento
  const handleOpenAddProcedimento = async (usuario: any) => {
    setAddProcedimentoUsuario(usuario);
    setAddProcedimentoDialog(true);
    setUsarProcedimentoManual(false);
    setNewOrdemServico({
      procedimento_id: '',
      nome_procedimento_manual: '',
      valor_pago: '',
      clinica_id: '',
      dentista_id: '',
      data_solicitada: new Date().toISOString().split('T')[0],
      status: 'realizada',
      observacoes_internas: ''
    });
    await loadClinicasDentistas();
  };

  // Criar ordem de serviço (atrelar procedimento)
  const handleCreateOrdemServico = async () => {
    try {
      if (!newOrdemServico.valor_pago) {
        toast({
          title: "Erro",
          description: "Valor pago é obrigatório",
          variant: "destructive",
        });
        return;
      }

      if (!usarProcedimentoManual && !newOrdemServico.procedimento_id) {
        toast({
          title: "Erro",
          description: "Selecione um procedimento ou digite manualmente",
          variant: "destructive",
        });
        return;
      }

      if (usarProcedimentoManual && !newOrdemServico.nome_procedimento_manual) {
        toast({
          title: "Erro",
          description: "Digite o nome do procedimento",
          variant: "destructive",
        });
        return;
      }

      await callAdminOperation('create_ordem_servico', {
        cliente_id: addProcedimentoUsuario.id,
        procedimento_id: usarProcedimentoManual ? null : newOrdemServico.procedimento_id,
        nome_procedimento_manual: usarProcedimentoManual ? newOrdemServico.nome_procedimento_manual : null,
        valor_pago: parseFloat(newOrdemServico.valor_pago),
        clinica_id: newOrdemServico.clinica_id || null,
        dentista_id: newOrdemServico.dentista_id || null,
        data_solicitada: newOrdemServico.data_solicitada || new Date().toISOString(),
        data_confirmada: newOrdemServico.data_solicitada || new Date().toISOString(),
        status: newOrdemServico.status,
        observacoes_internas: newOrdemServico.observacoes_internas || null,
      });

      toast({
        title: "Sucesso",
        description: "Procedimento registrado com sucesso!",
      });

      setAddProcedimentoDialog(false);
      loadDashboardData();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao registrar procedimento",
        variant: "destructive",
      });
    }
  };

  // Carregar relatório de clientes
  const loadRelatorioClientes = async () => {
    try {
      setRelatorioLoading(true);
      const data = await callAdminOperation('list_relatorio_clientes');
      setRelatorioClientes(data);
    } catch (error: any) {
      console.error('Erro ao carregar relatório:', error);
    } finally {
      setRelatorioLoading(false);
    }
  };

  // Funções para Configurações
  const loadConfiguracoes = async () => {
    try {
      setConfigLoading(true);
      const data = await callAdminOperation('list_configuracoes');
      setConfiguracoes(data || []);
      
      // Extrair valor de meses_assinatura
      const mesesConfig = data?.find((c: any) => c.chave === 'meses_assinatura');
      if (mesesConfig) {
        setMesesAssinatura(mesesConfig.valor);
      }
    } catch (error: any) {
      console.error('Erro ao carregar configurações:', error);
    } finally {
      setConfigLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    try {
      setSavingConfig(true);
      
      await callAdminOperation('update_configuracao', {
        chave: 'meses_assinatura',
        valor: mesesAssinatura,
      });

      toast({
        title: "Sucesso",
        description: "Configuração salva com sucesso!",
      });

      loadConfiguracoes();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar configuração",
        variant: "destructive",
      });
    } finally {
      setSavingConfig(false);
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
          <ScrollArea className="w-full whitespace-nowrap">
            <TabsList className="inline-flex w-full md:grid md:grid-cols-8 gap-1">
              <TabsTrigger value="dashboard" className="text-xs md:text-sm">
                <Settings className="h-4 w-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">Dashboard</span>
              </TabsTrigger>
              <TabsTrigger value="usuarios" className="text-xs md:text-sm">
                <Users className="h-4 w-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">Usuários</span>
              </TabsTrigger>
              <TabsTrigger value="ordens" className="text-xs md:text-sm">
                <FileText className="h-4 w-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">Ordens</span>
              </TabsTrigger>
              <TabsTrigger value="relatorios" className="text-xs md:text-sm" onClick={() => loadRelatorioClientes()}>
                <BarChart3 className="h-4 w-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">Relatórios</span>
              </TabsTrigger>
              <TabsTrigger value="procedimentos" className="text-xs md:text-sm">
                <Calendar className="h-4 w-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">Procedimentos</span>
              </TabsTrigger>
              <TabsTrigger value="categorias" className="text-xs md:text-sm">
                <FileText className="h-4 w-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">Categorias</span>
              </TabsTrigger>
              <TabsTrigger value="configuracoes" className="text-xs md:text-sm">
                <Settings className="h-4 w-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">Config</span>
              </TabsTrigger>
            </TabsList>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

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
                <div className="flex gap-2">
                  {/* Botão Adicionar Dependente */}
                  <Dialog open={addDependenteDialogOpen} onOpenChange={setAddDependenteDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Adicionar Dependente
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Adicionar Dependente</DialogTitle>
                        <DialogDescription>
                          Selecione o usuário pagante e preencha os dados do dependente
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Usuário Pagante *</Label>
                          <Select value={selectedUsuarioIdForDependente} onValueChange={setSelectedUsuarioIdForDependente}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o usuário" />
                            </SelectTrigger>
                            <SelectContent>
                              {usuarios.map((u: any) => (
                                <SelectItem key={u.id} value={u.id}>
                                  {u.nome} - {u.email}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Nome do Dependente *</Label>
                          <Input
                            value={newDependente.nome}
                            onChange={(e) => setNewDependente({...newDependente, nome: e.target.value})}
                            placeholder="Digite o nome completo"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>CPF</Label>
                          <Input
                            value={newDependente.cpf}
                            onChange={(e) => setNewDependente({...newDependente, cpf: e.target.value})}
                            placeholder="000.000.000-00"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Data de Nascimento</Label>
                          <Input
                            type="date"
                            value={newDependente.data_nascimento}
                            onChange={(e) => setNewDependente({...newDependente, data_nascimento: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Parentesco</Label>
                          <Select 
                            value={newDependente.parentesco} 
                            onValueChange={(value) => setNewDependente({...newDependente, parentesco: value})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o parentesco" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="filho">Filho(a)</SelectItem>
                              <SelectItem value="conjuge">Cônjuge</SelectItem>
                              <SelectItem value="pai">Pai</SelectItem>
                              <SelectItem value="mae">Mãe</SelectItem>
                              <SelectItem value="irmao">Irmão(ã)</SelectItem>
                              <SelectItem value="outro">Outro</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => {
                          setAddDependenteDialogOpen(false);
                          setNewDependente({ nome: '', cpf: '', data_nascimento: '', parentesco: '' });
                          setSelectedUsuarioIdForDependente('');
                        }}>
                          Cancelar
                        </Button>
                        <Button onClick={handleAddDependenteDirect} variant="primary_cta">
                          Adicionar Dependente
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  {/* Botão Criar Usuário */}
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
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>CPF</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Validade</TableHead>
                      <TableHead>Ativo</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                   <TableBody>
                      {usuarios.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center text-muted-foreground">
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
                              <Select 
                                value={usuario.role} 
                                onValueChange={(value) => handleUpdateUserRole(usuario.id, value)}
                              >
                                <SelectTrigger className="w-28">
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
                                {usuario.assinatura_status !== 'ATIVA' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleActivateSubscription(usuario.id)}
                                    className="h-6 px-2 text-xs"
                                  >
                                    Ativar
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                {usuario.assinatura_validade ? (
                                  <span className="text-sm">
                                    {format(new Date(usuario.assinatura_validade), 'dd/MM/yyyy')}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground text-sm">-</span>
                                )}
                                <Input
                                  type="date"
                                  className="h-7 text-xs w-32"
                                  defaultValue={usuario.assinatura_validade ? usuario.assinatura_validade.split('T')[0] : ''}
                                  onBlur={(e) => {
                                    if (e.target.value) {
                                      handleUpdateValidade(usuario.id, e.target.value);
                                    }
                                  }}
                                />
                              </div>
                            </TableCell>
                            <TableCell>
                              <Switch
                                checked={usuario.ativo}
                                onCheckedChange={() => handleToggleUserStatus(usuario.id, usuario.ativo)}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1 flex-wrap">
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => handleOpenAddProcedimento(usuario)}
                                  title="Adicionar Procedimento"
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleOpenHistorico(usuario)}
                                  title="Ver Histórico de Pagamentos"
                                >
                                  <History className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleOpenProcedimentos(usuario)}
                                  title="Ver Histórico de Procedimentos"
                                >
                                  <ClipboardList className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleOpenDependentes(usuario)}
                                  title="Gerenciar Dependentes"
                                >
                                  <UserPlus className="h-4 w-4" />
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

          {/* Relatórios */}
          <TabsContent value="relatorios" className="space-y-6">
            {/* Cards de Métricas */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    R$ {relatorioClientes?.totais?.ltv_total?.toFixed(2).replace('.', ',') || '0,00'}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Assinaturas + Procedimentos
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Assinaturas</CardTitle>
                  <DollarSign className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    R$ {relatorioClientes?.totais?.assinaturas?.toFixed(2).replace('.', ',') || '0,00'}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Receita com cartões
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Procedimentos</CardTitle>
                  <DollarSign className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    R$ {relatorioClientes?.totais?.procedimentos?.toFixed(2).replace('.', ',') || '0,00'}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Receita com atendimentos
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    R$ {relatorioClientes?.totais?.ticket_medio?.toFixed(2).replace('.', ',') || '0,00'}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Por transação
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">LTV Médio</CardTitle>
                  <BarChart3 className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">
                    R$ {relatorioClientes?.totais?.ltv_medio?.toFixed(2).replace('.', ',') || '0,00'}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Por cliente
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Tabela de Faturamento por Cliente */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Faturamento por Cliente</CardTitle>
                  <CardDescription>Ranking de clientes por LTV (Lifetime Value)</CardDescription>
                </div>
                <Button variant="outline" onClick={loadRelatorioClientes} disabled={relatorioLoading}>
                  {relatorioLoading ? "Carregando..." : "Atualizar"}
                </Button>
              </CardHeader>
              <CardContent>
                {relatorioLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Carregando relatório...</div>
                ) : !relatorioClientes?.clientes ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Clique em "Atualizar" para carregar o relatório
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>#</TableHead>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead className="text-right">Assinaturas</TableHead>
                          <TableHead className="text-right">Procedimentos</TableHead>
                          <TableHead className="text-right">LTV Total</TableHead>
                          <TableHead className="text-right">Ticket Médio</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {relatorioClientes.clientes.filter((c: any) => c.ltv > 0).map((cliente: any, index: number) => (
                          <TableRow key={cliente.id}>
                            <TableCell className="font-medium text-muted-foreground">{index + 1}</TableCell>
                            <TableCell className="font-medium">{cliente.nome}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{cliente.email}</TableCell>
                            <TableCell className="text-right text-blue-600">
                              R$ {cliente.assinaturas_valor?.toFixed(2).replace('.', ',')}
                            </TableCell>
                            <TableCell className="text-right text-green-600">
                              R$ {cliente.procedimentos_valor?.toFixed(2).replace('.', ',')}
                            </TableCell>
                            <TableCell className="text-right font-bold">
                              R$ {cliente.ltv?.toFixed(2).replace('.', ',')}
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground">
                              R$ {cliente.ticket_medio?.toFixed(2).replace('.', ',')}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Resumo de vendas via webhook */}
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Vendas (Webhook)</CardTitle>
                <CardDescription>Usuários cadastrados via pagamento online</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Data</TableHead>
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
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
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
                                     setProcedureToDelete(proc);
                                     setDeleteDialog(true);
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
            
            {/* Dialog de confirmação para excluir procedimento */}
            <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirmar Exclusão</DialogTitle>
                  <DialogDescription>
                    Tem certeza que deseja excluir o procedimento "{procedureToDelete?.nome}"?
                    Esta ação não pode ser desfeita.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDeleteDialog(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    variant="destructive"
                    onClick={() => {
                      if (procedureToDelete) {
                        handleDeleteProcedure(procedureToDelete.id, procedureToDelete.nome);
                        setDeleteDialog(false);
                        setProcedureToDelete(null);
                      }
                    }}
                  >
                    Excluir
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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
                        <IconPicker
                          value={newCategoria.icone}
                          onChange={(value) => setNewCategoria({...newCategoria, icone: value})}
                        />
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
                              <IconPicker
                                value={editingCategoriaValues.icone}
                                onChange={(value) => setEditingCategoriaValues({...editingCategoriaValues, icone: value})}
                              />
                            ) : (
                              <div className="flex items-center gap-2">
                                <IconDisplay name={cat.icone} className="h-5 w-5" />
                                <span className="text-muted-foreground text-xs">{cat.icone}</span>
                              </div>
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
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Configurações do Sistema
                </CardTitle>
                <CardDescription>
                  Configure os parâmetros da plataforma
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Período da Assinatura */}
                <div className="border rounded-lg p-6 space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg">Período da Assinatura</h3>
                    <p className="text-sm text-muted-foreground">
                      Define a validade dos novos cartões após a aprovação do pagamento
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="meses">Meses de validade:</Label>
                      <Input
                        id="meses"
                        type="number"
                        min="1"
                        max="60"
                        value={mesesAssinatura}
                        onChange={(e) => setMesesAssinatura(e.target.value)}
                        className="w-24"
                      />
                      <span className="text-muted-foreground">meses</span>
                    </div>
                    <Button 
                      onClick={handleSaveConfig}
                      disabled={savingConfig}
                      variant="primary_cta"
                    >
                      {savingConfig ? "Salvando..." : "Salvar"}
                    </Button>
                  </div>

                  <div className="bg-muted/50 rounded-md p-4 text-sm">
                    <p className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-primary" />
                      <strong>Como funciona:</strong>
                    </p>
                    <ul className="mt-2 space-y-1 ml-6 list-disc text-muted-foreground">
                      <li>Quando um pagamento é aprovado via webhook, o sistema calcula automaticamente a validade</li>
                      <li>Validade = Data da compra + {mesesAssinatura} meses</li>
                      <li>Exemplo: Compra em 18/12/2025 → Validade até 18/12/{parseInt(mesesAssinatura) >= 12 ? 2025 + Math.floor(parseInt(mesesAssinatura) / 12) : 2025}/{parseInt(mesesAssinatura) % 12 || 12}</li>
                      <li>Esta configuração afeta apenas <strong>novas compras</strong> aprovadas após a alteração</li>
                    </ul>
                  </div>
                </div>

                {/* Informações do Sistema */}
                <div className="border rounded-lg p-6 space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg">Informações</h3>
                    <p className="text-sm text-muted-foreground">
                      Dados gerais da configuração
                    </p>
                  </div>
                  
                  {configLoading ? (
                    <p className="text-muted-foreground">Carregando...</p>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      {configuracoes.map((config: any) => (
                        <div key={config.id} className="flex justify-between items-center p-3 bg-muted/30 rounded">
                          <div>
                            <p className="font-medium">{config.chave}</p>
                            <p className="text-xs text-muted-foreground">{config.descricao}</p>
                          </div>
                          <Badge variant="outline">{config.valor}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialog de Dependentes */}
        <Dialog open={dependentesDialog} onOpenChange={setDependentesDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Dependentes de {selectedUsuario?.nome}</DialogTitle>
              <DialogDescription>Gerenciar dependentes vinculados ao usuário</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex justify-end">
                <Dialog open={newDependenteDialog} onOpenChange={setNewDependenteDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm"><Plus className="h-4 w-4 mr-2" />Adicionar Dependente</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Novo Dependente</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div><Label>Nome</Label><Input value={newDependente.nome} onChange={(e) => setNewDependente({...newDependente, nome: e.target.value})} placeholder="Nome completo" /></div>
                      <div><Label>CPF</Label><Input value={newDependente.cpf} onChange={(e) => setNewDependente({...newDependente, cpf: e.target.value})} placeholder="000.000.000-00" /></div>
                      <div><Label>Data de Nascimento</Label><Input type="date" value={newDependente.data_nascimento} onChange={(e) => setNewDependente({...newDependente, data_nascimento: e.target.value})} /></div>
                      <div><Label>Parentesco</Label>
                        <Select value={newDependente.parentesco} onValueChange={(v) => setNewDependente({...newDependente, parentesco: v})}>
                          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="filho">Filho(a)</SelectItem>
                            <SelectItem value="conjuge">Cônjuge</SelectItem>
                            <SelectItem value="pai">Pai</SelectItem>
                            <SelectItem value="mae">Mãe</SelectItem>
                            <SelectItem value="outro">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setNewDependenteDialog(false)}>Cancelar</Button>
                      <Button onClick={handleCreateDependente}>Salvar</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              {dependentesLoading ? (
                <p className="text-center text-muted-foreground">Carregando...</p>
              ) : dependentes.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">Nenhum dependente cadastrado</p>
              ) : (
                <Table>
                  <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>CPF</TableHead><TableHead>Nascimento</TableHead><TableHead>Parentesco</TableHead><TableHead>Ações</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {dependentes.map((dep: any) => (
                      <TableRow key={dep.id}>
                        <TableCell className="font-medium">{dep.nome}</TableCell>
                        <TableCell>{dep.cpf || '-'}</TableCell>
                        <TableCell>{dep.data_nascimento ? new Date(dep.data_nascimento).toLocaleDateString('pt-BR') : '-'}</TableCell>
                        <TableCell className="capitalize">{dep.parentesco || '-'}</TableCell>
                        <TableCell><Button size="sm" variant="destructive" onClick={() => handleDeleteDependente(dep.id, dep.nome)}><Trash2 className="h-4 w-4" /></Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog de Histórico de Assinaturas */}
        <Dialog open={historicoDialog} onOpenChange={setHistoricoDialog}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Histórico de Pagamentos - {historicoUsuario?.nome}</DialogTitle>
              <DialogDescription>
                Registro de pagamentos e períodos de assinatura
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  Validade atual: {historicoUsuario?.assinatura_validade 
                    ? format(new Date(historicoUsuario.assinatura_validade), 'dd/MM/yyyy')
                    : 'Não definida'}
                </div>
                <Dialog open={addHistoricoDialog} onOpenChange={setAddHistoricoDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="primary_cta">
                      <Plus className="h-4 w-4 mr-2" />
                      Registrar Pagamento
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Registrar Pagamento</DialogTitle>
                      <DialogDescription>
                        Adicione um novo registro de pagamento. A validade será atualizada automaticamente.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Valor (R$) *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={newHistorico.valor}
                          onChange={(e) => setNewHistorico({...newHistorico, valor: e.target.value})}
                          placeholder="59.90"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Data Início *</Label>
                          <Input
                            type="date"
                            value={newHistorico.data_inicio}
                            onChange={(e) => setNewHistorico({...newHistorico, data_inicio: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Data Fim *</Label>
                          <Input
                            type="date"
                            value={newHistorico.data_fim}
                            onChange={(e) => setNewHistorico({...newHistorico, data_fim: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Método de Pagamento</Label>
                        <Select 
                          value={newHistorico.metodo_pagamento} 
                          onValueChange={(value) => setNewHistorico({...newHistorico, metodo_pagamento: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o método" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pix">PIX</SelectItem>
                            <SelectItem value="cartao">Cartão</SelectItem>
                            <SelectItem value="dinheiro">Dinheiro</SelectItem>
                            <SelectItem value="transferencia">Transferência</SelectItem>
                            <SelectItem value="manual">Manual</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Observações</Label>
                        <Textarea
                          value={newHistorico.observacoes}
                          onChange={(e) => setNewHistorico({...newHistorico, observacoes: e.target.value})}
                          placeholder="Observações adicionais..."
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => {
                        setAddHistoricoDialog(false);
                        setNewHistorico({ valor: '', data_inicio: '', data_fim: '', metodo_pagamento: '', observacoes: '' });
                      }}>
                        Cancelar
                      </Button>
                      <Button onClick={handleCreateHistorico} variant="primary_cta">
                        Registrar Pagamento
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {historicoLoading ? (
                <div className="text-center py-8 text-muted-foreground">Carregando histórico...</div>
              ) : historicoAssinaturas.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">Nenhum registro de pagamento encontrado</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data Pagamento</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Período</TableHead>
                      <TableHead>Método</TableHead>
                      <TableHead>Observações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historicoAssinaturas.map((hist: any) => (
                      <TableRow key={hist.id}>
                        <TableCell>
                          {hist.data_pagamento 
                            ? format(new Date(hist.data_pagamento), 'dd/MM/yyyy HH:mm', { locale: ptBR })
                            : '-'}
                        </TableCell>
                        <TableCell className="font-medium text-green-600">
                          R$ {parseFloat(hist.valor).toFixed(2).replace('.', ',')}
                        </TableCell>
                        <TableCell>
                          {format(new Date(hist.data_inicio), 'dd/MM/yyyy')} - {format(new Date(hist.data_fim), 'dd/MM/yyyy')}
                        </TableCell>
                        <TableCell className="capitalize">
                          {hist.metodo_pagamento || '-'}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate" title={hist.observacoes}>
                          {hist.observacoes || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog de Histórico de Procedimentos */}
        <Dialog open={procedimentosDialog} onOpenChange={setProcedimentosDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Histórico de Procedimentos - {procedimentosUsuario?.nome}</DialogTitle>
              <DialogDescription>
                Registro de ordens de serviço e procedimentos realizados
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {/* Cards de LTV */}
              {clienteLtv && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      R$ {clienteLtv.total?.toFixed(2).replace('.', ',')}
                    </div>
                    <div className="text-xs text-muted-foreground">LTV Total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">
                      R$ {clienteLtv.assinaturas?.toFixed(2).replace('.', ',')}
                    </div>
                    <div className="text-xs text-muted-foreground">Assinaturas ({clienteLtv.qtd_assinaturas})</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">
                      R$ {clienteLtv.procedimentos?.toFixed(2).replace('.', ',')}
                    </div>
                    <div className="text-xs text-muted-foreground">Procedimentos ({clienteLtv.qtd_procedimentos})</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold">
                      {clienteLtv.qtd_procedimentos + clienteLtv.qtd_assinaturas}
                    </div>
                    <div className="text-xs text-muted-foreground">Total Transações</div>
                  </div>
                </div>
              )}

              {procedimentosLoading ? (
                <div className="text-center py-8 text-muted-foreground">Carregando procedimentos...</div>
              ) : historicoProcedimentos.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">Nenhum procedimento registrado</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Procedimento</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Valor Pago</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Clínica</TableHead>
                        <TableHead>Dentista</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {historicoProcedimentos.map((proc: any) => (
                        <TableRow key={proc.id}>
                          <TableCell className="font-medium">
                            {proc.nome_procedimento_manual || proc.procedimentos?.nome || '-'}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(proc.status)}
                          </TableCell>
                          <TableCell className="text-right font-medium text-green-600">
                            {proc.valor_pago 
                              ? `R$ ${parseFloat(proc.valor_pago).toFixed(2).replace('.', ',')}`
                              : '-'}
                          </TableCell>
                          <TableCell>
                            {proc.data_solicitada 
                              ? format(new Date(proc.data_solicitada), 'dd/MM/yyyy', { locale: ptBR })
                              : '-'}
                          </TableCell>
                          <TableCell>
                            {proc.clinicas?.nome || '-'}
                          </TableCell>
                          <TableCell>
                            {proc.dentistas?.nome || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              <div className="text-sm text-muted-foreground text-right">
                Total: {historicoProcedimentos.length} procedimento(s)
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog de Adicionar Procedimento ao Cliente */}
        <Dialog open={addProcedimentoDialog} onOpenChange={setAddProcedimentoDialog}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Registrar Procedimento</DialogTitle>
              <DialogDescription>
                Atrelar procedimento ao cliente: {addProcedimentoUsuario?.nome}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {/* Toggle para procedimento manual */}
              <div className="flex items-center space-x-2">
                <Switch
                  id="manual-mode"
                  checked={usarProcedimentoManual}
                  onCheckedChange={setUsarProcedimentoManual}
                />
                <Label htmlFor="manual-mode">Digitar nome manualmente</Label>
              </div>

              {usarProcedimentoManual ? (
                <div className="space-y-2">
                  <Label>Nome do Procedimento *</Label>
                  <Input
                    value={newOrdemServico.nome_procedimento_manual}
                    onChange={(e) => setNewOrdemServico({...newOrdemServico, nome_procedimento_manual: e.target.value})}
                    placeholder="Ex: Extração dente siso"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Procedimento *</Label>
                  <Select 
                    value={newOrdemServico.procedimento_id} 
                    onValueChange={(value) => setNewOrdemServico({...newOrdemServico, procedimento_id: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o procedimento" />
                    </SelectTrigger>
                    <SelectContent>
                      {procedimentos.map((proc: any) => (
                        <SelectItem key={proc.id} value={proc.id}>
                          {proc.nome} - R$ {proc.preco_min?.toFixed(2)}
                          {proc.preco_max && ` a R$ ${proc.preco_max.toFixed(2)}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>Valor Pago (R$) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newOrdemServico.valor_pago}
                  onChange={(e) => setNewOrdemServico({...newOrdemServico, valor_pago: e.target.value})}
                  placeholder="0,00"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Clínica</Label>
                  <Select 
                    value={newOrdemServico.clinica_id} 
                    onValueChange={(value) => setNewOrdemServico({...newOrdemServico, clinica_id: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {clinicas.map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.nome} - {c.cidade}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Dentista</Label>
                  <Select 
                    value={newOrdemServico.dentista_id} 
                    onValueChange={(value) => setNewOrdemServico({...newOrdemServico, dentista_id: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {dentistas.map((d: any) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data</Label>
                  <Input
                    type="date"
                    value={newOrdemServico.data_solicitada}
                    onChange={(e) => setNewOrdemServico({...newOrdemServico, data_solicitada: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select 
                    value={newOrdemServico.status} 
                    onValueChange={(value) => setNewOrdemServico({...newOrdemServico, status: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="realizada">Realizada</SelectItem>
                      <SelectItem value="confirmada">Confirmada</SelectItem>
                      <SelectItem value="solicitada">Solicitada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea
                  value={newOrdemServico.observacoes_internas}
                  onChange={(e) => setNewOrdemServico({...newOrdemServico, observacoes_internas: e.target.value})}
                  placeholder="Observações internas..."
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddProcedimentoDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateOrdemServico} variant="primary_cta">
                Registrar Procedimento
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Admin;