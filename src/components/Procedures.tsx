import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Lock, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Procedures = () => {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [categories, setCategories] = useState([]);
  const [procedures, setProcedures] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Carregar categorias
      const { data: categoriesData } = await supabase
        .from("categorias")
        .select("*")
        .order("ordem");

      // Carregar procedimentos com categoria
      const { data: proceduresData } = await supabase
        .from("procedimentos")
        .select(`
          *,
          categorias(nome, icone)
        `)
        .eq("ativo", true);

      if (categoriesData) {
        const allCategories = [
          { id: "all", name: "Todos", icon: "🦷" },
          ...categoriesData.map(cat => ({
            id: cat.id,
            name: cat.nome,
            icon: getIconEmoji(cat.icone)
          }))
        ];
        setCategories(allCategories);
      }

      if (proceduresData) {
        const formattedProcedures = proceduresData.map(proc => ({
          id: proc.id,
          category: proc.categoria_id,
          name: proc.nome,
          preco_min: proc.preco_min,
          preco_max: proc.preco_max,
          categoria_nome: proc.categorias?.nome,
          discount: calculateDiscount(proc.preco_min, proc.preco_max),
          popularity: getPopularity(proc.nome)
        }));
        setProcedures(formattedProcedures);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const getIconEmoji = (iconName: string) => {
    const iconMap = {
      'tooth': '🦷',
      'drill': '🦷',
      'scissors': '🦷', 
      'brush': '🦷',
      'sparkles': '✨',
      'crown': '👑',
      'stethoscope': '🩺'
    };
    return iconMap[iconName] || '🦷';
  };

  const calculateDiscount = (preco_min: number, preco_max: number) => {
    // Simular desconto baseado no preço
    const avgPrice = preco_max ? (preco_min + preco_max) / 2 : preco_min;
    if (avgPrice <= 150) return "40%";
    if (avgPrice <= 300) return "45%";
    if (avgPrice <= 600) return "50%";
    return "55%";
  };

  const getPopularity = (name: string) => {
    // Simular popularidade baseada no nome do procedimento
    const highDemand = ['Classe I', 'Profilaxia', 'Exo simples', 'Clareamento'];
    const popular = ['Classe II', 'Raspagem', 'Unirradicular'];
    
    if (highDemand.some(item => name.includes(item))) return "Muito procurado";
    if (popular.some(item => name.includes(item))) return "Popular";
    return "Procurado";
  };

  const filteredProcedures = selectedCategory === "all" 
    ? procedures 
    : procedures.filter(p => p.category === selectedCategory);

  const formatPrice = (proc: any) => {
    if (proc.preco_max && proc.preco_max !== proc.preco_min) {
      return `R$ ${proc.preco_min?.toFixed(2)} – R$ ${proc.preco_max?.toFixed(2)}`;
    }
    return `R$ ${proc.preco_min?.toFixed(2)}`;
  };

  const handleCheckout = () => {
    window.open("https://checkout.sorrisocidadao.com/VCCL1O8SCA33", "_blank");
  };


  const getPopularityColor = (popularity: string) => {
    switch(popularity) {
      case "Muito procurado": return "bg-success text-success-foreground";
      case "Popular": return "bg-secondary text-secondary-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <section id="procedimentos" className="py-12 md:py-20 bg-background">
      <div className="container px-4">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3 md:mb-4">
            Procedimentos Disponíveis
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-4">
            Veja alguns dos procedimentos com descontos exclusivos para portadores do cartão
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center items-center">
            <Badge variant="secondary" className="text-base md:text-lg px-4 py-2">
              💰 Até 60% de desconto
            </Badge>
            <Badge variant="outline" className="text-sm px-3 py-1">
              <Lock className="h-3 w-3 mr-1" />
              Valores exclusivos para portadores
            </Badge>
          </div>
        </div>

        {/* Category Filters - Mobile Scrollable */}
        <div className="mb-8 md:mb-12">
          <div className="flex gap-2 md:gap-3 overflow-x-auto pb-2 md:justify-center scrollbar-hide">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                onClick={() => setSelectedCategory(category.id)}
                className="gap-2 flex-shrink-0 text-xs md:text-sm px-3 md:px-4 py-2"
                size="sm"
              >
                <span className="text-sm md:text-base">{category.icon}</span>
                <span className="whitespace-nowrap">{category.name}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Procedures Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-12">
          {loading ? (
            <div className="col-span-full text-center py-8">Carregando procedimentos...</div>
          ) : filteredProcedures.length === 0 ? (
            <div className="col-span-full text-center py-8 text-muted-foreground">Nenhum procedimento encontrado</div>
          ) : (
            filteredProcedures.map((procedure, index) => (
              <Card key={procedure.id || index} className="group hover:shadow-card-hover transition-all duration-300 hover:scale-[1.02]">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base md:text-lg leading-tight">{procedure.name}</CardTitle>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`text-xs px-2 py-1 ${getPopularityColor(procedure.popularity)}`}
                    >
                      {procedure.popularity}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">{procedure.categoria_nome}</div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Hidden Price - Exclusive for cardholders */}
                  <div className="relative">
                    <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-4 border border-primary/20">
                      <div className="text-center">
                        <div className="text-lg md:text-xl font-bold text-muted-foreground">
                          💳 Preço exclusivo
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Valor exclusivo para portadores
                        </div>
                      </div>
                    </div>
                    
                    {/* Discount Badge */}
                    <div className="absolute -top-2 -right-2">
                      <Badge variant="destructive" className="text-sm md:text-base font-bold px-2 md:px-3 py-1 shadow-lg">
                        -{procedure.discount}
                      </Badge>
                    </div>
                  </div>

                  <Button 
                    variant="primary_cta" 
                    size="sm" 
                    className="w-full text-xs md:text-sm"
                    onClick={handleCheckout}
                  >
                    <Eye className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                    Solicitar
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Main CTA Section */}
        <div className="bg-gradient-hero rounded-2xl p-6 md:p-8 text-center text-white">
          <div className="max-w-3xl mx-auto">
            <h3 className="text-2xl md:text-3xl font-bold mb-3 md:mb-4">
              Quer ver todos os valores?
            </h3>
            <p className="text-base md:text-lg text-white/90 mb-6 md:mb-8">
              Assine o Cartão Sorriso Cidadão e tenha acesso à tabela completa de preços 
              com descontos de até 60% em mais de 100 procedimentos
            </p>
            
            {/* Benefits Icons */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 md:mb-8">
              <div className="flex flex-col items-center text-center">
                <div className="bg-white/20 rounded-full p-3 mb-2">
                  <span className="text-xl md:text-2xl">💰</span>
                </div>
                <span className="text-xs md:text-sm">Até 60% OFF</span>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="bg-white/20 rounded-full p-3 mb-2">
                  <span className="text-xl md:text-2xl">🏥</span>
                </div>
                <span className="text-xs md:text-sm">100+ Clínicas</span>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="bg-white/20 rounded-full p-3 mb-2">
                  <span className="text-xl md:text-2xl">⚡</span>
                </div>
                <span className="text-xs md:text-sm">Sem carência</span>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="bg-white/20 rounded-full p-3 mb-2">
                  <span className="text-xl md:text-2xl">💳</span>
                </div>
                <span className="text-xs md:text-sm">12x no cartão</span>
              </div>
            </div>


            <Button 
              variant="hero" 
              size="xl"
              onClick={handleCheckout}
              className="w-full sm:w-auto text-base md:text-lg px-8 md:px-12 py-3 md:py-4 bg-secondary hover:bg-secondary-hover text-secondary-foreground font-bold"
            >
              Assinar Cartão Sorriso Cidadão
            </Button>
            
            <p className="text-xs md:text-sm text-white/70 mt-3">
              Ativação imediata • Sem taxa de adesão • Sem fidelidade
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};