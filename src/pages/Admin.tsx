import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, Users, CreditCard, Settings } from "lucide-react";
import logoSorrisoCidadao from "@/assets/logo-sorriso-cidadao.png";

const Admin = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = "/entrar";
        return;
      }

      // Check if user is admin (you can add more sophisticated role checking here)
      if (user.email !== "eduardy@tryade.com") {
        toast({
          title: "Acesso negado",
          description: "Você não tem permissão para acessar esta área.",
          variant: "destructive",
        });
        window.location.href = "/";
        return;
      }

      setUser(user);
    } catch (error) {
      console.error("Error checking user:", error);
      window.location.href = "/entrar";
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = "/";
    } catch (error) {
      toast({
        title: "Erro ao sair",
        description: "Tente novamente.",
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <img 
                src={logoSorrisoCidadao} 
                alt="Sorriso Cidadão" 
                className="h-8 w-auto"
              />
              <span className="text-xl font-bold text-gray-900">Painel Admin</span>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary">
                Administrador
              </Badge>
              <span className="text-sm text-gray-600">{user?.email}</span>
              <Button onClick={handleLogout} variant="outline" size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Painel Administrativo</h1>
          <p className="text-gray-600 mt-2">Gerencie o sistema Sorriso Cidadão</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,234</div>
              <p className="text-xs text-muted-foreground">+20% em relação ao mês passado</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cartões Ativos</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">856</div>
              <p className="text-xs text-muted-foreground">+15% em relação ao mês passado</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ 51.290</div>
              <p className="text-xs text-muted-foreground">+12% em relação ao mês passado</p>
            </CardContent>
          </Card>
        </div>

        {/* Management Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciar Usuários</CardTitle>
              <CardDescription>
                Visualize e gerencie todos os usuários do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button className="w-full" variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  Ver Todos os Usuários
                </Button>
                <Button className="w-full" variant="outline">
                  Usuários Ativos
                </Button>
                <Button className="w-full" variant="outline">
                  Novos Cadastros
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Gerenciar Cartões</CardTitle>
              <CardDescription>
                Controle de cartões e assinaturas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button className="w-full" variant="outline">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Ver Todos os Cartões
                </Button>
                <Button className="w-full" variant="outline">
                  Cartões Vencidos
                </Button>
                <Button className="w-full" variant="outline">
                  Renovações Pendentes
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Relatórios</CardTitle>
              <CardDescription>
                Acesse relatórios detalhados do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button className="w-full" variant="outline">
                  Relatório de Vendas
                </Button>
                <Button className="w-full" variant="outline">
                  Relatório de Usuários
                </Button>
                <Button className="w-full" variant="outline">
                  Relatório Financeiro
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Configurações</CardTitle>
              <CardDescription>
                Configurações gerais do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button className="w-full" variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Configurações Gerais
                </Button>
                <Button className="w-full" variant="outline">
                  Preços e Planos
                </Button>
                <Button className="w-full" variant="outline">
                  Notificações
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Admin;