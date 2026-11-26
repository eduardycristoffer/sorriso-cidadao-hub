# sorriso-cidadao-hub

# Projeto: Cartão Sorriso Cidadão – Landing + Área do Cliente + Admin

## Objetivo

Criar um site/app completo que venda o **Cartão Sorriso Cidadão** por um **checkout externo**. Após a compra, um **webhook** ativa o acesso do cliente (ENVIADO pelo meu checkout) e libera a **área logada** com: tabela de preços de procedimentos, solicitação de consulta e acompanhamento de ordens de serviço. Incluir **painel administrativo** com gestão de usuários, clínicas parceiras, dentistas, tabela de procedimentos e OS.

## Stack e padrões (deixe pronto no Lovable)

* Front-end: Next.js + TailwindCSS (mobile-first, leve, acessível).
* Auth: Magic link por e-mail + opção de senha. Persistência via JWT/Session.
* Banco (integrado do Lovable): tabelas conforme o schema abaixo.
* APIs internas: /api/webhooks/checkout, /api/auth, /api/consultas, /api/procedimentos, /api/clinicas, /api/usuarios, /api/os.
* RBAC (papéis): `admin`, `operador`, `dentista`, `cliente`.
* Auditoria: created\_at, updated\_at, created\_by, updated\_by em todas as tabelas.
* LGPD: consent flag e política de privacidade; coleta só do necessário.

## Paleta & identidade

* Cores base (conforme arte):
  Amarelo #F4C319, Azul #1849C6, Verde #2FA84F, Vermelho #E42824, Preto #000, Branco #FFF.
* Tipografia: Poppins / Montserrat.
* Ícones: estilos “smile/odontologia” (SVGs simples).
* Use as peças anexas como referência visual do herói e seções (cards de benefícios, depoimentos, 60% OFF, etc.).&#x20;

---

## Páginas & Fluxos

### 1) Landing Page “/”

**Header (sticky)**

* Logo “Sorriso Cidadão”
* Menu âncoras: Benefícios, Procedimentos, Como funciona, Depoimentos, Parceiros, Dúvidas
* Botões: **Entrar** (vai para /entrar) e **Assinar agora** (abre **checkout externo** em nova aba)

**Hero**

* Headline: “Tenha acesso à saúde bucal com qualidade e economia”
* Sub: “Até 60% de desconto em procedimentos odontológicos”
* CTA primário: **Assinar agora** → link do checkout externo (parametrizável por ENV)
* CTA secundário: **Ver procedimentos e valores** → âncora (se usuário não logado, mostrar tabela exemplo simplificada + call-to-login)

**Faixa de benefícios (3 a 5 cards)**

* “Atendimento humanizado”
* “Pagamento facilitado em até 12x no cartão”
* “Rede de clínicas parceiras”
* “Dentistas credenciados”
* “Transparência e economia”

**Lista de categorias com ícones**
Dentística, Endodontia (Endo), Cirurgia, Periodontia, Clareamento, Prótese, Avaliação, Clínicas parceiras

**Seção “Como funciona” (3 passos)**

1. Assine o Cartão (checkout externo)
2. Ative seu acesso (via e-mail — webhook cria usuário)
3. Agende sua consulta na clínica parceira

**Depoimentos & Números**

* “+15 mil pessoas atendidas”
* 1–3 depoimentos com nome/cidade

**Oferta/escassez**

* “Vagas limitadas para procedimentos com até 60% OFF”
* “Promoção válida até \[inserir data]”
* Preço do cartão (exemplo visual do cartão e parcelamento **12× de R\$ 7,39** ou **R\$ 88,68 à vista**) — deixar os valores como variáveis/ENV.

**FAQ (5–7 perguntas)**

* Como usar o Cartão?
* O Cartão é plano odontológico? (responder que é **clube de descontos** / **cartão de vantagens**; não é plano de saúde)
* Como agendo?
* Posso cancelar?
* Há carência?
* Quais cidades atendidas? (link para página Parceiros)

**Footer**

* Links: Política de Privacidade, Termos, Contato (WhatsApp), Rede social.

---

### 2) Autenticação “/entrar”

* E-mail (obrigatório) + “Enviar link de acesso” ou login por senha.
* Após login, redirecionar para **/cliente**.

---

### 3) Área do Cliente “/cliente”

**Dashboard**

* Boas-vindas com nome.
* Status da assinatura (ATIVA / PENDENTE).
* CTA: **Solicitar consulta**.

**Tabela de Procedimentos e Valores (com busca e filtros)**

> Mostrar as categorias e valores abaixo (salvar no banco e exibir em UI com busca por nome/categoria, botão “Solicitar”):

**Dentística**

* Classe I — R\$ 90,00
* Classe II — R\$ 110,00
* Classe III — R\$ 120,00
* Classe IV — R\$ 150,00
* Classe V — R\$ 90,00
* Reconstrução — **R\$ 150,00 a R\$ 200,00**
* Bloco direto — **R\$ 250,00 a R\$ 300,00**

**Endo (Endodontia)**

* Unirradicular — R\$ 450,00
* Birradicular — R\$ 500,00
* Trirradicular — R\$ 550,00

**Cirurgia**

* Exo simples — R\$ 120,00
* Exo raiz — R\$ 150,00
* Exo 3º molar — **R\$ 250,00 a R\$ 350,00**

**Periodontia**

* Profilaxia — R\$ 100,00
* Raspagem — R\$ 150,00
* Raspagem moderada — **R\$ 250,00 a R\$ 300,00**
* Raspagem severa — R\$ 400,00

**Clareamento**

* Clareamento caseiro — R\$ 600,00
* Clareamento consultório — R\$ 1.300,00

**Prótese**

* Prótese Total — **R\$ 750,00 cada**
* PPR com Grampo — **R\$ 900,00 cada**
* Prótese flexível — R\$ 1.300,00
* Pino — R\$ 250,00
* Coroa artglass — R\$ 750,00
* Coroa porcelana — R\$ 1.100,00
* E-MAXX — R\$ 1.250,00

> Observações visuais em UI para itens “entre X e Y” (faixa de preço).

**Solicitar consulta (wizard em modal ou página)**

1. Escolher **procedimento**
2. Escolher **clínica parceira** (mostrar mapa/lista com cidade/horário)
3. Sugerir datas/horários (agenda da clínica)
4. Confirmar dados e **enviar** → gera **Ordem de Serviço (OS)** com status `solicitada`.
5. E-mail/WhatsApp de confirmação ao cliente; notificação para clínica/operador.

**Minhas consultas & OS**

* Lista paginada com status (solicitada, confirmada, realizada, cancelada).
* Detalhe da OS com chat/comentários simples (cliente ↔ operador/dentista).

---

### 4) Página Parceiros “/parceiros”

* Lista de **clínicas credenciadas** (cidade, bairro, contato, botões “Ver no mapa” e “Solicitar consulta”).
* Formulário “Quero credenciar minha clínica” (gera lead para admin).

---

### 5) Painel Admin “/admin”

**Acesso**: somente `admin` e `operador`.

**Módulos**

* **Dashboard:** métricas (novas vendas via webhook, usuários ativos, consultas/OS por status).
* **Usuários/Clientes:** CRUD, busca por e-mail/nome, status assinatura, reenvio de link de acesso.
* **Clínicas Parceiras:** CRUD (nome, CNPJ/CPF, responsável, cidade/UF, endereço, WhatsApp, e-mail, horários, geo coords, status).
* **Dentistas:** CRUD + vínculo a clínica + CRO + especialidades.
* **Procedimentos & Preços:** CRUD por categoria; suporte a preço fixo ou **faixa** (min/max).
* **Ordens de Serviço (Consultas):**

  * Ver/editar status: `solicitada`, `em análise`, `confirmada`, `realizada`, `cancelada`.
  * Atribuir clínica/dentista, data/hora, observações internas, anexos.
  * Timeline da OS (log).
* **Relatórios/Exportação:** CSV de usuários, consultas, OS, clínicas.
* **Configurações:** URLs do checkout, segredo do webhook, e-mail remetente, WhatsApp, textos legais, banner/hero.

---

## Integração com Checkout Externo (Webhook)

**Variáveis de ambiente**

* `CHECKOUT_URL` (link do botão “Assinar agora”)
* `WEBHOOK_SECRET` (validação HMAC)
* `POSTBACK_WHITELIST` (IPs/domínios permitidos)

**Endpoint**

* `POST /api/webhooks/checkout`

* **Payload esperado** (exemplo):

  ```json
  {
    "event": "purchase.approved",
    "order_id": "abc123",
    "product": "cartao_sorriso_cidadao",
    "amount": 88.68,
    "installments": 12,
    "buyer": {
      "name": "Nome Sobrenome",
      "email": "email@exemplo.com",
      "phone": "+55...",
      "doc": "CPF"
    },
    "metadata": {
      "utm_source": "meta",
      "city": "Anápolis"
    },
    "signature": "hmac-sha256"
  }
  ```

* **Ações**:

  1. Validar assinatura/HMAC e origem.
  2. Se `product == cartao_sorriso_cidadao` e status aprovado, **criar/atualizar usuário** (`cliente`) com `assinatura_status = 'ATIVA'`, `order_id` e data.
  3. Disparar e-mail com **magic link** para ativar senha e acessar **/cliente**.
  4. Logar no `webhook_events`.

* **Reprocessamento idempotente** por `order_id`.

---

## Banco de Dados (SQL – crie tabelas)

```sql
-- Usuários
CREATE TABLE usuarios (
  id UUID PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  telefone TEXT,
  cpf TEXT,
  role TEXT CHECK (role IN ('admin','operador','dentista','cliente')) DEFAULT 'cliente',
  assinatura_status TEXT CHECK (assinatura_status IN ('ATIVA','PENDENTE','CANCELADA')) DEFAULT 'PENDENTE',
  order_id TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Clínicas parceiras
CREATE TABLE clinicas (
  id UUID PRIMARY KEY,
  nome TEXT NOT NULL,
  documento TEXT,
  responsavel TEXT,
  email TEXT,
  whatsapp TEXT,
  endereco TEXT,
  cidade TEXT,
  uf CHAR(2),
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  horario_funcionamento TEXT,
  status TEXT CHECK (status IN ('ATIVA','INATIVA')) DEFAULT 'ATIVA',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Dentistas
CREATE TABLE dentistas (
  id UUID PRIMARY KEY,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  clinica_id UUID REFERENCES clinicas(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  cro TEXT,
  especialidades TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Categorias de procedimento
CREATE TABLE categorias (
  id UUID PRIMARY KEY,
  nome TEXT NOT NULL, -- Dentística, Endodontia, etc.
  ordem INT DEFAULT 0
);

-- Procedimentos
CREATE TABLE procedimentos (
  id UUID PRIMARY KEY,
  categoria_id UUID REFERENCES categorias(id),
  nome TEXT NOT NULL,
  preco_min NUMERIC(10,2),
  preco_max NUMERIC(10,2),
  observacoes TEXT,
  ativo BOOLEAN DEFAULT TRUE
);

-- Ordens de Serviço / Consultas
CREATE TABLE ordens_servico (
  id UUID PRIMARY KEY,
  cliente_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  clinica_id UUID REFERENCES clinicas(id),
  dentista_id UUID REFERENCES dentistas(id),
  procedimento_id UUID REFERENCES procedimentos(id),
  data_solicitada TIMESTAMP,
  data_confirmada TIMESTAMP,
  status TEXT CHECK (status IN ('solicitada','em análise','confirmada','realizada','cancelada')) DEFAULT 'solicitada',
  observacoes_cliente TEXT,
  observacoes_internas TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Eventos do Webhook
CREATE TABLE webhook_events (
  id UUID PRIMARY KEY,
  order_id TEXT,
  event TEXT,
  payload JSONB,
  processed_at TIMESTAMP DEFAULT NOW(),
  status TEXT CHECK (status IN ('ok','ignored','error')) DEFAULT 'ok'
);
```

### Sementes (seed) – categorias & procedimentos

* **Categorias**: Dentística, Endodontia, Cirurgia, Periodontia, Clareamento, Prótese.
* **Procedimentos**: inserir todos os listados acima; onde há “entre X e Y”, grave `preco_min = X`, `preco_max = Y`. Onde o preço é fixo, grave apenas `preco_min` e deixe `preco_max` nulo.

---

## Endpoints (resumo)

* `POST /api/webhooks/checkout` – recebe compra, ativa usuário.
* `GET /api/procedimentos?categoria=...&q=...` – lista/busca.
* `POST /api/consultas` – cria OS (cliente logado).
* `GET /api/consultas/mine` – minhas OS.
* `PATCH /api/os/:id` – atualizar status/atribuições (admin/operador).
* `GET /api/clinicas` – lista clínicas.
* `POST /api/clinicas` (admin).
* `POST /api/auth/magic-link` – enviar link.
* `POST /api/auth/set-password` – definir senha após magic.

---

## Regras de UI/Permissões

* **Cliente**: vê tabela de preços, solicita consulta, acompanha OS.
* **Operador**: gerencia OS, agenda, comunica cliente, edita procedimentos (opcional).
* **Admin**: tudo.
* **Dentista**: vê agenda própria, atualiza status de OS atribuída, adiciona observações.

---

## Notificações

* E-mail transacional (cliente: ativação, confirmação de consulta, atualização de status).
* E-mail/WhatsApp para clínica/operador quando há nova OS.
* Webhook opcional de saída (postback) para meu CRM com eventos principais.

---

## Segurança & Conformidades

* Rate limit no endpoint de webhook.
* Sanitização e validação de inputs (e-mail, CPF).
* Logs e auditoria por usuário.
* Política de privacidade/termos visíveis.

---

## Configurações que quero como ENV no Lovable

* `CHECKOUT_URL`
* `WEBHOOK_SECRET`
* `EMAIL_FROM`, `SMTP_*` (ou provedor nativo)
* `WHATSAPP_URL` (contato)
* `PROMO_DEADLINE` (data na LP)
* `CARD_PRICE_AVISTA`, `CARD_PRICE_12X` (exibir 12× R\$ 7,39 e R\$ 88,68 à vista, editável)

---

## Entregáveis visuais mínimos

* **Header** com botões **Entrar** e **Assinar agora**.
* **Hero** com cartão e slogan; selo “Até 60% OFF”.
* **Cards de benefícios** (ícones).
* **Bloco “Como funciona”** em 3 passos.
* **Depoimentos** e **número de atendidos**.
* **Tabela de procedimentos (na área logada)** com busca/filtros e botão “Solicitar”.
* **Wizard de solicitação**.
* **Painel Admin** com os módulos listados.
* **Página Parceiros** com clínicas (grid + mapa).
* **Footer** com legal/contato.

---

### Observações finais

* O **checkout é externo**: o botão “Assinar agora” **apenas redireciona**. A **ativação** acontece **exclusivamente** pelo **webhook**.
* Deixe **componentes e textos editáveis** no CMS/Config.
* Capriche em UX mobile (tudo pensado para celular).
* Implementar **mascara de valores** e badges para “faixa de preço”.
* Preparar **export CSV** das OS e usuários no Admin.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://sorriso-cidadao-hub.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/14d35ce7-73dd-4e6c-99d1-e21ac6534f2d).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
