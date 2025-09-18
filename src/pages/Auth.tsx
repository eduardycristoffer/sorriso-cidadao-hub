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
  const [email, setEmail] = useState("eduardy");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validar credenciais fixas do admin
      if (email !== "eduardy" || password !== "@Tryade2025") {
        toast({
          title: "Credenciais inválidas",
          description: "Usuário ou senha incorretos.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Fazer login com o email correto no Supabase
      const adminEmail = "eduardy@tryade.com";
      let { error: signInError } = await supabase.auth.signInWithPassword({
        email: adminEmail,
        password,
      });

      // Se der erro, criar a conta admin
      if (signInError && signInError.message.includes("Invalid login credentials")) {
        const { error: signUpError } = await supabase.auth.signUp({
          email: adminEmail,
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

        // Tentar logar novamente após criar a conta
        const { error: retrySignInError } = await supabase.auth.signInWithPassword({
          email: adminEmail,
          password,
        });

        if (retrySignInError) {
          console.error("Retry signIn error:", retrySignInError);
          toast({
            title: "Erro no login",
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

      // Verificar e atualizar dados do admin no banco
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: userData, error: userError } = await supabase
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

      toast({
        title: "Login realizado com sucesso!",
        description: "Redirecionando para o painel administrativo...",
      });
      
      window.location.href = "/admin";

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
                disabled={loading}
                variant="primary_cta"
              >
                {loading ? "Entrando..." : "Acessar Painel"}
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

        {/* Info */}
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
};

export default Auth;