import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export const Procedures = () => {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categories = [
    { id: "all", name: "Todos", icon: "🦷" },
    { id: "dentistica", name: "Dentística", icon: "⚕️" },
    { id: "endodontia", name: "Endodontia", icon: "🔧" },
    { id: "cirurgia", name: "Cirurgia", icon: "✂️" },
    { id: "periodontia", name: "Periodontia", icon: "🪥" },
    { id: "clareamento", name: "Clareamento", icon: "✨" },
    { id: "protese", name: "Prótese", icon: "👑" }
  ];

  const procedures = [
    { category: "dentistica", name: "Classe I", price: "R$ 90,00", originalPrice: "R$ 150,00" },
    { category: "dentistica", name: "Classe II", price: "R$ 110,00", originalPrice: "R$ 180,00" },
    { category: "dentistica", name: "Reconstrução", price: "R$ 150,00 - R$ 200,00", originalPrice: "R$ 300,00" },
    { category: "endodontia", name: "Unirradicular", price: "R$ 450,00", originalPrice: "R$ 750,00" },
    { category: "endodontia", name: "Birradicular", price: "R$ 500,00", originalPrice: "R$ 850,00" },
    { category: "cirurgia", name: "Exo simples", price: "R$ 120,00", originalPrice: "R$ 200,00" },
    { category: "cirurgia", name: "Exo 3º molar", price: "R$ 250,00 - R$ 350,00", originalPrice: "R$ 600,00" },
    { category: "periodontia", name: "Profilaxia", price: "R$ 100,00", originalPrice: "R$ 180,00" },
    { category: "periodontia", name: "Raspagem", price: "R$ 150,00", originalPrice: "R$ 300,00" },
    { category: "clareamento", name: "Clareamento caseiro", price: "R$ 600,00", originalPrice: "R$ 1.200,00" },
    { category: "clareamento", name: "Clareamento consultório", price: "R$ 1.300,00", originalPrice: "R$ 2.500,00" },
    { category: "protese", name: "Prótese Total", price: "R$ 750,00", originalPrice: "R$ 1.500,00" },
    { category: "protese", name: "Coroa porcelana", price: "R$ 1.100,00", originalPrice: "R$ 2.200,00" }
  ];

  const filteredProcedures = selectedCategory === "all" 
    ? procedures 
    : procedures.filter(p => p.category === selectedCategory);

  const scrollToLogin = () => {
    window.location.href = "/entrar";
  };

  return (
    <section id="procedimentos" className="py-20 bg-background">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Procedimentos e Valores
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Confira alguns dos nossos procedimentos com descontos de até 60%
          </p>
          <Badge variant="secondary" className="mt-4 text-lg px-4 py-2">
            💰 Economia garantida
          </Badge>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              onClick={() => setSelectedCategory(category.id)}
              className="gap-2"
            >
              <span>{category.icon}</span>
              {category.name}
            </Button>
          ))}
        </div>

        {/* Procedures Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {filteredProcedures.map((procedure, index) => (
            <Card key={index} className="group hover:shadow-card-hover transition-all duration-300 hover:scale-105">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{procedure.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground line-through">
                      {procedure.originalPrice}
                    </span>
                    <Badge variant="destructive" className="text-xs">
                      ATÉ 60% OFF
                    </Badge>
                  </div>
                  <div className="text-2xl font-bold text-success">
                    {procedure.price}
                  </div>
                  <Button 
                    variant="primary_cta" 
                    size="sm" 
                    className="w-full mt-3"
                    onClick={scrollToLogin}
                  >
                    Agendar consulta
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center bg-gradient-card rounded-2xl p-8 border">
          <h3 className="text-2xl font-bold text-foreground mb-4">
            Quer ver a tabela completa de preços?
          </h3>
          <p className="text-muted-foreground mb-6">
            Faça login para acessar todos os procedimentos e valores especiais
          </p>
          <Button variant="hero" size="lg" onClick={scrollToLogin}>
            Entrar na minha conta
          </Button>
        </div>
      </div>
    </section>
  );
};