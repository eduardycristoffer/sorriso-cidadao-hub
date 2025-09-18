import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const FAQ = () => {
  const faqs = [
    {
      question: "Como usar o Cartão Sorriso Cidadão?",
      answer: "Após a assinatura, você receberá um e-mail com link de acesso à sua área logada. Lá você pode consultar a tabela de preços, escolher procedimentos e agendar consultas em nossas clínicas parceiras."
    },
    {
      question: "O Cartão é um plano odontológico?",
      answer: "Não, o Cartão Sorriso Cidadão é um clube de descontos e cartão de vantagens odontológicas. Não é um plano de saúde, mas sim um programa que oferece descontos em procedimentos em clínicas credenciadas."
    },
    {
      question: "Como faço para agendar uma consulta?",
      answer: "Na sua área logada, você pode navegar pelos procedimentos, escolher o que precisa e selecionar uma clínica parceira. O sistema mostrará as opções de data e horário disponíveis para agendamento."
    },
    {
      question: "Posso cancelar minha assinatura?",
      answer: "Sim, você pode cancelar sua assinatura a qualquer momento através da sua área logada ou entrando em contato com nosso suporte pelo WhatsApp."
    },
    {
      question: "Há período de carência?",
      answer: "Não há carência! Assim que sua assinatura for ativada, você já pode agendar consultas e aproveitar todos os descontos disponíveis."
    },
    {
      question: "Quais cidades são atendidas?",
      answer: "Atualmente atendemos principalmente Goiás (Anápolis, Goiânia) e Distrito Federal (Brasília), mas estamos expandindo nossa rede. Consulte nossa página de Parceiros para ver todas as clínicas disponíveis."
    },
    {
      question: "Como funciona o pagamento dos procedimentos?",
      answer: "Você paga diretamente na clínica pelos procedimentos realizados, já com o desconto do cartão aplicado. Muitas clínicas oferecem parcelamento em até 12x no cartão de crédito."
    }
  ];

  return (
    <section id="duvidas" className="py-20 bg-background">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Dúvidas Frequentes
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Tire todas as suas dúvidas sobre o Cartão Sorriso Cidadão
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="border border-border rounded-lg px-6 shadow-card hover:shadow-card-hover transition-shadow"
              >
                <AccordionTrigger className="text-left hover:no-underline py-6">
                  <span className="font-semibold text-foreground">
                    {faq.question}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-6 text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* Still have questions CTA */}
        <div className="text-center mt-12">
          <div className="bg-gradient-card rounded-2xl p-8 border max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-foreground mb-4">
              Ainda tem dúvidas?
            </h3>
            <p className="text-muted-foreground mb-6">
              Entre em contato conosco pelo WhatsApp e tire todas as suas dúvidas
            </p>
            <a 
              href="https://wa.me/5562999999999" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-success hover:bg-success-hover text-success-foreground px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              <span>💬</span>
              Falar no WhatsApp
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};