import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Lock, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import logoSorrisoCidadao from "@/assets/logo-sorriso-cidadao.png";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSignInWithEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Primeiro verifica se é o usuário admin específico
      if (email === "eduardy@tryade.com" && password === "@Tryade2025") {
        // Tentar logar com Supabase Auth
        let { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        // Se der erro, significa que o usuário não existe no Auth, então criar
        if (signInError && signInError.message.includes("Invalid login credentials")) {
          const { error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/admin`
            }
          });

          if (signUpError) {
            console.error("SignUp error:", signUpError);
            toast({
              title: "Erro ao criar conta admin",
              description: signUpError.message,
              variant: "destructive",
            });
            return;
          }

          // Após criar, tentar logar novamente
          const { error: retrySignInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (retrySignInError) {
            console.error("Retry signIn error:", retrySignInError);
            toast({
              title: "Erro no login após criação",
              description: retrySignInError.message,
              variant: "destructive",
            });
            return;
          }
        } else if (signInError) {
          console.error("SignIn error:", signInError);
          toast({
            title: "Erro ao fazer login",
            description: signInError.message,
            variant: "destructive",
          });
          return;
        }

        // Verificar se o usuário existe no banco e atualizar auth_user_id se necessário
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: userData, error: userError } = await supabase
            .from("usuarios")
            .select("*")
            .eq("email", email)
            .single();

          if (userData && !userData.auth_user_id) {
            await supabase
              .from("usuarios")
              .update({ auth_user_id: user.id })
              .eq("email", email);
          }
        }

        toast({
          title: "Login admin realizado com sucesso!",
          description: "Redirecionando para o painel...",
        });
        window.location.href = "/admin";
        return;
      }

      // Login normal para outros usuários
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          title: "Erro ao fazer login",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Login realizado com sucesso!",
          description: "Redirecionando para sua área...",
        });
        window.location.href = "/cliente";
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
            <CardTitle>Entrar na sua conta</CardTitle>
            <CardDescription>
              Acesse sua área do cliente com seu e-mail e CPF
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignInWithEmail} className="space-y-4">
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
                <p className="text-xs text-muted-foreground">
                  Clientes: use seu CPF | Admin: use sua senha
                </p>
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={loading}
                variant="primary_cta"
              >
                {loading ? "Entrando..." : "Entrar"}
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

export default Auth;