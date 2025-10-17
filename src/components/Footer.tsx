import { Heart } from "lucide-react";
import logoSorrisoCidadao from "@/assets/logo-sorriso-cidadao.png";

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-primary text-primary-foreground py-12">
      <div className="container">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <img 
                src={logoSorrisoCidadao} 
                alt="Sorriso Cidadão" 
                className="h-8 w-auto brightness-0 invert"
              />
            </div>
            <p className="text-primary-foreground/80 mb-4 max-w-md">
              Democratizando o acesso à saúde bucal de qualidade através de descontos especiais 
              em procedimentos odontológicos.
            </p>
            <div className="flex items-center gap-2 text-sm text-primary-foreground/60">
              <span>Feito com</span>
              <Heart className="h-4 w-4 fill-red-500 text-red-500" />
              <span>para o seu sorriso</span>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold mb-4">Links Úteis</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/80">
              <li>
                <a href="#procedimentos" className="hover:text-secondary transition-colors">
                  Procedimentos
                </a>
              </li>
              <li>
                <a href="/parceiros" className="hover:text-secondary transition-colors">
                  Clínicas Parceiras
                </a>
              </li>
              <li>
                <a href="#como-funciona" className="hover:text-secondary transition-colors">
                  Como Funciona
                </a>
              </li>
              <li>
                <a href="#duvidas" className="hover:text-secondary transition-colors">
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Contato</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/80">
              <li>
                <a 
                  href="https://api.whatsapp.com/send/?phone=556231900695&text&type=phone_number&app_absent=0" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-secondary transition-colors"
                >
                  💬 WhatsApp
                </a>
              </li>
              <li>
                <a 
                  href="mailto:contato@sorrisocidadao.com" 
                  className="hover:text-secondary transition-colors"
                >
                  ✉️ E-mail
                </a>
              </li>
              <li>
                <a 
                  href="https://instagram.com/sorrisocidadao" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-secondary transition-colors"
                >
                  📸 Instagram
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-primary-foreground/20 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-primary-foreground/60">
            © {currentYear} Sorriso Cidadão. Todos os direitos reservados.
          </div>
          <div className="flex gap-6 text-sm">
            <a 
              href="/politica-privacidade" 
              className="text-primary-foreground/80 hover:text-secondary transition-colors"
            >
              Política de Privacidade
            </a>
            <a 
              href="/termos-uso" 
              className="text-primary-foreground/80 hover:text-secondary transition-colors"
            >
              Termos de Uso
            </a>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-6 p-4 bg-primary-foreground/10 rounded-lg">
          <p className="text-xs text-primary-foreground/70 text-center">
            O Cartão Sorriso Cidadão é um programa de descontos odontológicos, não sendo um plano de saúde. 
            Os valores e condições podem variar conforme a clínica parceira escolhida.
          </p>
        </div>
      </div>
    </footer>
  );
};