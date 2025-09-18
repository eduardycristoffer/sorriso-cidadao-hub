import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, Mail, Calendar } from "lucide-react";

export const HowItWorks = () => {
  const steps = [
    {
      icon: CreditCard,
      title: "1. Assine o Cartão",
      description: "Escolha o plano ideal e finalize a compra em nosso checkout seguro",
      color: "bg-gradient-primary"
    },
    {
      icon: Mail,
      title: "2. Ative seu acesso",
      description: "Receba o e-mail de ativação e acesse sua área logada",
      color: "bg-gradient-secondary"
    },
    {
      icon: Calendar,
      title: "3. Agende sua consulta",
      description: "Escolha a clínica parceira e marque seu atendimento",
      color: "bg-success"
    }
  ];

  const handleCheckout = () => {
    window.open("https://checkout-externo.com", "_blank");
  };

  return (
    <section id="como-funciona" className="py-20 bg-gradient-hero">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">
            Como funciona?
          </h2>
          <p className="text-xl text-white/90 max-w-3xl mx-auto">
            Em 3 passos simples você já pode economizar em seus procedimentos odontológicos
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {steps.map((step, index) => (
            <Card key={index} className="group hover:scale-105 transition-all duration-300 bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="p-8 text-center">
                <div className="mb-6 flex justify-center">
                  <div className={`p-4 rounded-full ${step.color} group-hover:scale-110 transition-transform duration-300`}>
                    <step.icon className="h-8 w-8 text-white" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-white mb-4">
                  {step.title}
                </h3>
                <p className="text-white/80">
                  {step.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-white mb-4">
              Pronto para começar?
            </h3>
            <p className="text-white/90 mb-6">
              Junte-se a mais de 15 mil pessoas que já economizam com o Cartão Sorriso Cidadão
            </p>
            <Button 
              variant="hero" 
              size="xl"
              onClick={handleCheckout}
              className="bg-secondary hover:bg-secondary-hover text-secondary-foreground"
            >
              Assinar agora por R$ 88,68
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};