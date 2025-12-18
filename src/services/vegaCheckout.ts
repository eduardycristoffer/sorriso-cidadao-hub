// Serviço para chamar a API Vega Checkout diretamente do frontend
// Isso permite que o IP usado seja o do navegador do admin, não do Supabase

interface VegaPaymentRequest {
  nome: string;
  descricao?: string;
  valor: number; // em centavos
  clienteEmail?: string;
  clienteNome?: string;
}

interface VegaPaymentResponse {
  success: boolean;
  transactionToken?: string;
  pixCode?: string;
  qrCodeUrl?: string;
  error?: string;
}

const VEGA_API_URL = 'https://checkout.sorrisocidadao.com/api/checkout';
const VEGA_API_KEY = 'SlybOxqFhLTW40cfyDEqC8DCfbqPi8ggZuSCj9IfGzpgLO07dyhvPqd7svBeAGIj';

export async function createVegaPayment(request: VegaPaymentRequest): Promise<VegaPaymentResponse> {
  console.log('[VegaCheckout Frontend] Iniciando chamada à API Vega...', request);
  
  const payload = {
    customer: {
      name: request.clienteNome || 'Cliente',
      email: request.clienteEmail || 'cliente@email.com',
      document: '',
      phone: '',
      address: {
        street: '',
        number: '',
        district: '',
        city: '',
        state: '',
        zipcode: ''
      }
    },
    payment: {
      method: 'pix',
      payment_value: request.valor, // em centavos
      freight_value: 0,
      discount_value: 0,
      external_code: `LINK_${Date.now()}`,
      currency: 'BRL'
    },
    products: [{
      name: request.nome,
      price: request.valor,
      quantity: 1,
      code: `PROD_${Date.now()}`,
      is_digital: true,
      description: request.descricao || ''
    }],
    notification_url: `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/checkout-webhook`
  };

  console.log('[VegaCheckout Frontend] Payload:', JSON.stringify(payload, null, 2));

  try {
    const response = await fetch(VEGA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': VEGA_API_KEY,
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    console.log('[VegaCheckout Frontend] Resposta raw:', responseText);
    console.log('[VegaCheckout Frontend] Status:', response.status);

    if (!response.ok) {
      console.error('[VegaCheckout Frontend] Erro na resposta:', response.status, responseText);
      return {
        success: false,
        error: `Erro ${response.status}: ${responseText}`
      };
    }

    const vegaData = JSON.parse(responseText);
    console.log('[VegaCheckout Frontend] Resposta parsed:', vegaData);

    // Parse response baseado na estrutura da API PIX da Vega
    const transactionToken = vegaData.data?.transaction_token || vegaData.transaction_token;
    const pixCode = vegaData.data?.pix_copy_paste || vegaData.pix_copy_paste || vegaData.pix?.copy_paste;
    const qrCodeUrl = vegaData.data?.qr_code_url || vegaData.qr_code_url || vegaData.pix?.qr_code_url;

    return {
      success: true,
      transactionToken,
      pixCode,
      qrCodeUrl
    };
  } catch (error: any) {
    console.error('[VegaCheckout Frontend] Erro ao chamar API:', error);
    return {
      success: false,
      error: error.message || 'Erro desconhecido ao chamar API Vega'
    };
  }
}
