import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft, ChevronRight, Calendar, MapPin, Clock, CheckCircle2 } from "lucide-react";

interface Procedimento {
  id: string;
  nome: string;
  preco_min: number;
  preco_max: number | null;
}

interface Clinica {
  id: string;
  nome: string;
  cidade: string;
  endereco: string | null;
  telefone: string | null;
}

interface WizardConsultaProps {
  isOpen: boolean;
  onClose: () => void;
  procedimentoSelecionado?: Procedimento | null;
  clienteId: string;
  onSuccess: () => void;
}

const WizardConsulta = ({ 
  isOpen, 
  onClose, 
  procedimentoSelecionado, 
  clienteId,
  onSuccess 
}: WizardConsultaProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [procedimento, setProcedimento] = useState<Procedimento | null>(procedimentoSelecionado || null);
  const [clinica, setClinica] = useState<Clinica | null>(null);
  const [dataConsulta, setDataConsulta] = useState("");
  const [periodoConsulta, setPeriodoConsulta] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [procedimentos, setProcedimentos] = useState<Procedimento[]>([]);
  const [clinicas, setClinicas] = useState<Clinica[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadProcedimentos();
      loadClinicas();
      // Reset wizard when opening
      if (!procedimentoSelecionado) {
        setCurrentStep(1);
        setProcedimento(null);
        setClinica(null);
        setDataConsulta("");
        setPeriodoConsulta("");
        setObservacoes("");
      } else {
        setCurrentStep(2); // Skip to clinica selection if procedimento is pre-selected
      }
    }
  }, [isOpen, procedimentoSelecionado]);

  const loadProcedimentos = async () => {
    try {
      const { data, error } = await supabase
        .from("procedimentos")
        .select("id, nome, preco_min, preco_max")
        .eq("ativo", true)
        .order("nome");

      if (error) throw error;
      
      // Ordenar para que "Avaliação Gratuita" apareça primeiro
      const sortedData = (data || []).sort((a, b) => {
        if (a.nome === 'Avaliação Gratuita') return -1;
        if (b.nome === 'Avaliação Gratuita') return 1;
        return a.nome.localeCompare(b.nome);
      });
      
      setProcedimentos(sortedData);
    } catch (error) {
      console.error("Error loading procedimentos:", error);
    }
  };

  const loadClinicas = async () => {
    try {
      const { data, error } = await supabase
        .from("clinicas")
        .select("id, nome, cidade, endereco, telefone")
        .eq("ativo", true)
        .order("nome");

      if (error) throw error;
      setClinicas(data || []);
      
      // Pré-selecionar clínica de Anápolis
      const anapolisClinica = data?.find(c => c.cidade === 'Anápolis');
      if (anapolisClinica) {
        setClinica(anapolisClinica);
      }
    } catch (error) {
      console.error("Error loading clinicas:", error);
    }
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!procedimento || !clinica || !dataConsulta || !periodoConsulta) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Get current user from auth
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("Usuário não autenticado");
      }

      // Get user record from usuarios table
      const { data: userData, error: userError } = await supabase
        .from("usuarios")
        .select("id")
        .eq("auth_user_id", user.id)
        .single();

      if (userError || !userData) {
        throw new Error("Usuário não encontrado no sistema");
      }

      const { error } = await supabase
        .from("ordens_servico")
        .insert({
          cliente_id: userData.id,
          procedimento_id: procedimento.id,
          clinica_id: clinica.id,
          data_solicitada: new Date(dataConsulta).toISOString(),
          observacoes_cliente: `Período preferido: ${periodoConsulta}. ${observacoes}`,
          status: "solicitada"
        });

      if (error) throw error;

      toast({
        title: "Consulta solicitada com sucesso!",
        description: "Você receberá uma confirmação em breve.",
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error creating ordem:", error);
      toast({
        title: "Erro",
        description: "Erro ao solicitar consulta. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (preco_min: number, preco_max: number | null) => {
    if (!preco_max) {
      return `R$ ${preco_min.toFixed(2).replace(".", ",")}`;
    }
    return `R$ ${preco_min.toFixed(2).replace(".", ",")} – R$ ${preco_max.toFixed(2).replace(".", ",")}`;
  };

  const filteredProcedimentos = procedimentos.filter(proc => 
    proc.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return "Selecionar Procedimento";
      case 2: return "Escolher Clínica";
      case 3: return "Data e Horário";
      case 4: return "Confirmação";
      default: return "";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto mx-4 sm:mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Solicitar Consulta - {getStepTitle()}
          </DialogTitle>
          <DialogDescription>
            Passo {currentStep} de 4
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`flex-1 h-2 rounded ${
                  step <= currentStep ? "bg-primary" : "bg-gray-200"
                }`}
              />
            ))}
          </div>

          {/* Step 1: Procedimento */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Escolha o Procedimento</CardTitle>
                <CardDescription>
                  Selecione o procedimento que você deseja realizar
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="search">Buscar procedimento</Label>
                  <Input
                    id="search"
                    placeholder="Digite o nome do procedimento..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {filteredProcedimentos.map((proc) => (
                    <div
                      key={proc.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        procedimento?.id === proc.id
                          ? "border-primary bg-primary/5"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => setProcedimento(proc)}
                    >
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm sm:text-base">{proc.nome}</h4>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            Preço exclusivo
                          </p>
                        </div>
                        {procedimento?.id === proc.id && (
                          <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Clínica */}
          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Escolha a Clínica</CardTitle>
                <CardDescription>
                  Selecione a clínica onde deseja realizar o procedimento
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {clinicas.map((cli) => (
                    <div
                      key={cli.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        clinica?.id === cli.id
                          ? "border-primary bg-primary/5"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => setClinica(cli)}
                    >
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm sm:text-base">{cli.nome}</h4>
                          <div className="text-xs sm:text-sm text-muted-foreground space-y-1">
                            <p className="flex items-start gap-1">
                              <MapPin className="h-3 w-3 mt-0.5 shrink-0" />
                              <span className="break-words">{cli.cidade}{cli.endereco ? ` - ${cli.endereco}` : ''}</span>
                            </p>
                            {cli.telefone && (
                              <p className="flex items-start gap-1">
                                <Clock className="h-3 w-3 mt-0.5 shrink-0" />
                                <span className="break-words">{cli.telefone}</span>
                              </p>
                            )}
                          </div>
                        </div>
                        {clinica?.id === cli.id && (
                          <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Data e Horário */}
          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>Data e Período Preferidos</CardTitle>
                <CardDescription>
                  Informe quando você gostaria de realizar o procedimento
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="data">Data da Consulta</Label>
                    <Input
                      id="data"
                      type="date"
                      value={dataConsulta}
                      onChange={(e) => setDataConsulta(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div>
                    <Label htmlFor="periodo">Período</Label>
                    <Select value={periodoConsulta} onValueChange={setPeriodoConsulta}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar período" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MANHA">Manhã</SelectItem>
                        <SelectItem value="TARDE">Tarde</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Esta é uma preferência. A clínica confirmará a disponibilidade e horário exato.
                </p>
                <div>
                  <Label htmlFor="observacoes">Observações (opcional)</Label>
                  <Textarea
                    id="observacoes"
                    placeholder="Informações adicionais sobre sua solicitação..."
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Confirmação */}
          {currentStep === 4 && (
            <Card>
              <CardHeader>
                <CardTitle>Confirmar Solicitação</CardTitle>
                <CardDescription>
                  Revise os dados antes de enviar sua solicitação
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium">Procedimento</h4>
                    <p className="text-sm text-muted-foreground">
                      {procedimento?.nome} - Preço exclusivo
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium">Clínica</h4>
                    <p className="text-sm text-muted-foreground">
                      {clinica?.nome} - {clinica?.cidade}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium">Data e Período Preferidos</h4>
                    <p className="text-sm text-muted-foreground">
                      {dataConsulta && new Date(dataConsulta).toLocaleDateString("pt-BR")} - {periodoConsulta === "MANHA" ? "Manhã" : "Tarde"}
                    </p>
                  </div>
                  {observacoes && (
                    <div>
                      <h4 className="font-medium">Observações</h4>
                      <p className="text-sm text-muted-foreground">{observacoes}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Navigation Buttons */}
          <div className="flex flex-col sm:flex-row justify-between gap-3">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="w-full sm:w-auto"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Anterior
            </Button>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
                Cancelar
              </Button>
              {currentStep < 4 ? (
                <Button
                  onClick={handleNext}
                  disabled={
                    (currentStep === 1 && !procedimento) ||
                    (currentStep === 2 && !clinica) ||
                    (currentStep === 3 && (!dataConsulta || !periodoConsulta))
                  }
                  className="w-full sm:w-auto"
                >
                  Próximo
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={loading} className="w-full sm:w-auto">
                  {loading ? "Enviando..." : "Confirmar Solicitação"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WizardConsulta;