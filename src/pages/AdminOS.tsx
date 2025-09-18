import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
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

const AdminOS = () => {
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [clinicas, setClinicas] = useState<Clinica[]>([]);
  const [dentistas, setDentistas] = useState<Dentista[]>([]);
  const [loading, setLoading] = useState(true);
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
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

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
      console.error("Error loading data:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
      clinica_id: ordem.clinicas ? "" : "", // TODO: Get actual ID
      dentista_id: ordem.dentistas?.nome ? "" : "", // TODO: Get actual ID
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
      loadData();
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

      loadData();
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  return (
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
  );
};

export default AdminOS;