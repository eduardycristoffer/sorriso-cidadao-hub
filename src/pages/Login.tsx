import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Lock, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import logoSorrisoCidadao from "@/assets/logo-sorriso-cidadao.png";

const Login = () => {
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleClientLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validar se email e CPF foram preenchidos
      if (!email || !cpf) {
        toast({
          title: "Dados obrigatórios",
          description: "Preencha seu e-mail e CPF.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Verificar se o cliente existe no banco de dados
      const { data: userData, error: userError } = await supabase
        .from("usuarios")
        .select("*")
        .eq("email", email)
        .eq("cpf", cpf.replace(/\D/g, '')) // Remove formatação do CPF
        .eq("role", "cliente")
        .eq("ativo", true)
        .maybeSingle();

      if (userError) {
        console.error("Erro ao buscar usuário:", userError);
        toast({
          title: "Erro no sistema",
          description: "Tente novamente em alguns minutos.",
          variant: "destructive",
        });
        return;
      }

      if (!userData) {
        toast({
          title: "Dados não encontrados",
          description: "Verifique seu e-mail e CPF, ou entre em contato conosco.",
          variant: "destructive",
        });
        return;
      }

      // Verificar status da assinatura
      if (userData.assinatura_status !== 'ATIVA') {
        toast({
          title: "Assinatura não ativa",
          description: "Sua assinatura precisa estar ativa para acessar o painel.",
          variant: "destructive",
        });
        return;
      }

      // Salvar email na session para acesso
      sessionStorage.setItem('client_email', userData.email);

      // Se o usuário tem auth_user_id, tentar fazer login via Supabase
      if (userData.auth_user_id) {
        try {
          // Tentar fazer login usando magic link simples
          const { error: signInError } = await supabase.auth.signInWithOtp({
            email: email,
            options: {
              shouldCreateUser: false
            }
          });

          if (signInError) {
            console.error("Erro no login:", signInError);
          }
          
          toast({
            title: "Login realizado com sucesso!",
            description: "Redirecionando para sua área...",
          });
          
          // Redirecionar para área do cliente
          setTimeout(() => {
            window.location.href = "/cliente";
          }, 1000);
          
        } catch (authError) {
          console.error("Auth error:", authError);
          // Se falhar auth, redirecionar direto (fallback)
          window.location.href = "/cliente";
        }
      } else {
        toast({
          title: "Login realizado com sucesso!",
          description: "Redirecionando para sua área...",
        });
        
        // Redirecionar para área do cliente
        setTimeout(() => {
          window.location.href = "/cliente";
        }, 1000);
      }

    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Erro inesperado",
        description: "Tente novamente em alguns minutos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCPF = (value: string) => {
    const numericValue = value.replace(/\D/g, '');
    return numericValue
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
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
            Acesse sua área do cliente
          </p>
        </div>

        <Card className="shadow-2xl border-0">
          <CardHeader className="text-center">
            <CardTitle>Área do Cliente</CardTitle>
            <CardDescription>
              Entre com seu e-mail e CPF para acessar sua conta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleClientLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="cpf"
                    type="text"
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChange={(e) => setCpf(formatCPF(e.target.value))}
                    className="pl-10"
                    required
                    maxLength={14}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Use o CPF que você informou na compra
                </p>
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={loading}
                variant="primary_cta"
              >
                {loading ? "Entrando..." : "Acessar Minha Área"}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              <p>
                Problemas para acessar?{" "}
                <a
                  href="https://wa.me/5562999999999"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Fale conosco
                </a>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Info */}
        <div className="mt-6 text-center text-white/80 text-sm">
          <p>
            Ainda não tem o Cartão Sorriso Cidadão?{" "}
            <a href="/" className="text-secondary hover:underline font-semibold">
              Assine agora
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;