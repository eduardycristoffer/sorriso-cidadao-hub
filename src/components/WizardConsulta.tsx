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
  endereco: string;
  horario_funcionamento: string;
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
  const [dataHorario, setDataHorario] = useState("");
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
        setDataHorario("");
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
      setProcedimentos(data || []);
    } catch (error) {
      console.error("Error loading procedimentos:", error);
    }
  };

  const loadClinicas = async () => {
    try {
      const { data, error } = await supabase
        .from("clinicas")
        .select("id, nome, cidade, endereco, horario_funcionamento")
        .eq("status", "ATIVA")
        .eq("ativo", true)
        .order("nome");

      if (error) throw error;
      setClinicas(data || []);
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
    if (!procedimento || !clinica || !dataHorario) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("ordens_servico")
        .insert({
          cliente_id: clienteId,
          procedimento_id: procedimento.id,
          clinica_id: clinica.id,
          data_solicitada: new Date(dataHorario).toISOString(),
          observacoes_cliente: observacoes,
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">{proc.nome}</h4>
                          <p className="text-sm text-muted-foreground">
                            {formatPrice(proc.preco_min, proc.preco_max)}
                          </p>
                        </div>
                        {procedimento?.id === proc.id && (
                          <CheckCircle2 className="h-5 w-5 text-primary" />
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
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">{cli.nome}</h4>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {cli.cidade} - {cli.endereco}
                            </p>
                            <p className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {cli.horario_funcionamento}
                            </p>
                          </div>
                        </div>
                        {clinica?.id === cli.id && (
                          <CheckCircle2 className="h-5 w-5 text-primary" />
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
                <CardTitle>Data e Horário Preferidos</CardTitle>
                <CardDescription>
                  Informe quando você gostaria de realizar o procedimento
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="datetime">Data e Horário</Label>
                  <Input
                    id="datetime"
                    type="datetime-local"
                    value={dataHorario}
                    onChange={(e) => setDataHorario(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Esta é uma sugestão. A clínica confirmará a disponibilidade.
                  </p>
                </div>
                <div>
                  <Label htmlFor="observacoes">Observações (opcional)</Label>
                  <Textarea
                    id="observacoes"
                    placeholder="Informações adicionais sobre sua solicitação..."
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    rows={3}
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
                      {procedimento?.nome} - {procedimento && formatPrice(procedimento.preco_min, procedimento.preco_max)}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium">Clínica</h4>
                    <p className="text-sm text-muted-foreground">
                      {clinica?.nome} - {clinica?.cidade}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium">Data e Horário Sugeridos</h4>
                    <p className="text-sm text-muted-foreground">
                      {dataHorario && new Date(dataHorario).toLocaleString("pt-BR")}
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
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Anterior
            </Button>

            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              {currentStep < 4 ? (
                <Button
                  onClick={handleNext}
                  disabled={
                    (currentStep === 1 && !procedimento) ||
                    (currentStep === 2 && !clinica) ||
                    (currentStep === 3 && !dataHorario)
                  }
                >
                  Próximo
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={loading}>
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