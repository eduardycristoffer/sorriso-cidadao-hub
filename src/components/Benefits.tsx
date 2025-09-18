import { Card, CardContent } from "@/components/ui/card";
import { Heart, CreditCard, MapPin, Users, Shield } from "lucide-react";

export const Benefits = () => {
  const benefits = [
    {
      icon: Heart,
      title: "Atendimento humanizado",
      description: "Profissionais qualificados focados no seu bem-estar"
    },
    {
      icon: CreditCard,
      title: "Pagamento facilitado",
      description: "Parcelamento em até 12x no cartão de crédito"
    },
    {
      icon: MapPin,
      title: "Rede de clínicas parceiras",
      description: "Mais de 100 clínicas credenciadas em todo o país"
    },
    {
      icon: Users,
      title: "Dentistas credenciados",
      description: "Profissionais experientes e especializados"
    },
    {
      icon: Shield,
      title: "Transparência e economia",
      description: "Preços claros e economia real nos procedimentos"
    }
  ];

  return (
    <section id="beneficios" className="py-20 bg-gradient-card">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Por que escolher o Cartão Sorriso Cidadão?
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Mais de 15 mil pessoas já confiam em nossos serviços para cuidar da saúde bucal
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <Card 
              key={index}
              className="group hover:shadow-card-hover transition-all duration-300 hover:scale-105 bg-card border-0 shadow-card"
            >
              <CardContent className="p-6 text-center">
                <div className="mb-4 flex justify-center">
                  <div className="p-3 rounded-full bg-gradient-primary group-hover:scale-110 transition-transform duration-300">
                    <benefit.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {benefit.title}
                </h3>
                <p className="text-muted-foreground">
                  {benefit.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};