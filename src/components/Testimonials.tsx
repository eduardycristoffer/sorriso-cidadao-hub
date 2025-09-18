import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";

export const Testimonials = () => {
  const testimonials = [
    {
      name: "Maria Silva",
      city: "Anápolis, GO",
      comment: "Economizei mais de R$ 800 no meu tratamento. O atendimento foi excelente e os profissionais muito qualificados.",
      rating: 5
    },
    {
      name: "João Santos",
      city: "Goiânia, GO",
      comment: "Fiz um clareamento dental por um preço incrível. Recomendo para todos que querem cuidar da saúde bucal gastando menos.",
      rating: 5
    },
    {
      name: "Ana Costa",
      city: "Brasília, DF",
      comment: "O cartão realmente funciona! Consegui fazer vários procedimentos com desconto e o pagamento foi facilitado.",
      rating: 5
    }
  ];

  const stats = [
    { number: "+15 mil", label: "Pessoas atendidas" },
    { number: "100+", label: "Clínicas parceiras" },
    { number: "60%", label: "Economia média" },
    { number: "4.9★", label: "Avaliação média" }
  ];

  return (
    <section id="depoimentos" className="py-20 bg-gradient-card">
      <div className="container">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">
                {stat.number}
              </div>
              <div className="text-muted-foreground">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            O que nossos clientes dizem
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Milhares de pessoas já transformaram seus sorrisos conosco
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="group hover:shadow-card-hover transition-all duration-300 hover:scale-105">
              <CardContent className="p-6">
                {/* Rating */}
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>

                {/* Comment */}
                <blockquote className="text-muted-foreground mb-4 italic">
                  "{testimonial.comment}"
                </blockquote>

                {/* Author */}
                <div className="border-t pt-4">
                  <div className="font-semibold text-foreground">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {testimonial.city}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Trust Badge */}
        <div className="text-center mt-12">
          <div className="inline-flex items-center gap-3 bg-success/10 text-success px-6 py-3 rounded-full">
            <div className="w-3 h-3 bg-success rounded-full animate-pulse"></div>
            <span className="font-semibold">
              Mais de 1.000 novos clientes este mês
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};