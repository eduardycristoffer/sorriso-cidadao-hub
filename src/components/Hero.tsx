import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import cartaoHero from "@/assets/cartao-hero.jpg";

export const Hero = () => {
  const handleCheckout = () => {
    // TODO: Implementar link do checkout externo
    window.open("https://checkout-externo.com", "_blank");
  };

  const scrollToProcedimentos = () => {
    const element = document.querySelector("#procedimentos");
    element?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative overflow-hidden bg-gradient-hero py-20 lg:py-32">
      {/* Background Decoration */}
      <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]" />
      
      <div className="container relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="text-center lg:text-left space-y-8">
            {/* Badge */}
            <Badge variant="secondary" className="inline-flex items-center gap-2 px-4 py-2 text-lg font-semibold">
              <span className="text-2xl">🎯</span>
              Até 60% OFF
            </Badge>

            {/* Headlines */}
            <div className="space-y-3 md:space-y-4">
              <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-white leading-tight">
                Tenha acesso à 
                <span className="text-secondary"> saúde bucal</span>
                {" "}com qualidade e economia
              </h1>
              <p className="text-lg md:text-xl text-white/90 max-w-2xl">
                Mais de 15 mil pessoas já economizam em procedimentos odontológicos 
                com o Cartão Sorriso Cidadão
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center lg:justify-start">
              <Button 
                variant="hero" 
                size="xl"
                onClick={handleCheckout}
                className="text-lg md:text-xl px-8 md:px-10 py-3 md:py-4"
              >
                Assinar agora
              </Button>
              <Button 
                variant="outline" 
                size="xl"
                onClick={scrollToProcedimentos}
                className="text-lg md:text-xl px-8 md:px-10 py-3 md:py-4 bg-white/10 border-white/30 text-white hover:bg-white/20"
              >
                Ver procedimentos
              </Button>
            </div>

            {/* Pricing Info */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-white/20">
              <div className="text-center lg:text-left">
                <p className="text-white/80 mb-2 text-sm md:text-base">Parcelamento em até:</p>
                <div className="flex flex-col sm:flex-row gap-3 md:gap-4 items-center justify-center lg:justify-start">
                  <div className="text-white text-center">
                    <span className="text-2xl md:text-3xl font-bold">12x R$ 7,39</span>
                    <span className="text-white/80 ml-2 text-sm md:text-base">no cartão</span>
                  </div>
                  <div className="text-center">
                    <span className="text-white/80 text-sm">ou</span>
                  </div>
                  <div className="text-white text-center">
                    <span className="text-xl md:text-2xl font-semibold">R$ 59,90</span>
                    <span className="text-white/80 ml-2 text-sm md:text-base">à vista</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card Image */}
          <div className="relative">
            <div className="relative transform rotate-6 hover:rotate-3 transition-transform duration-500">
              <img 
                src={cartaoHero} 
                alt="Cartão Sorriso Cidadão" 
                className="w-full max-w-lg mx-auto rounded-2xl shadow-2xl"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl" />
            </div>
            
            {/* Floating Elements */}
            <div className="absolute -top-4 -right-4 bg-white rounded-full p-4 shadow-lg animate-bounce">
              <span className="text-2xl">😁</span>
            </div>
            <div className="absolute -bottom-4 -left-4 bg-secondary rounded-full p-3 shadow-lg">
              <span className="text-xl font-bold text-secondary-foreground">-60%</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};