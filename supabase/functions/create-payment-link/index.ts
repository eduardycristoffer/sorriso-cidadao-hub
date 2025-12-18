import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreatePaymentRequest {
  nome: string;
  descricao?: string;
  valor: number; // em centavos
  cliente_email?: string;
  cliente_nome?: string;
  cliente_id?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const vegaApiKey = Deno.env.get('VEGA_CHECKOUT_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const data: CreatePaymentRequest = await req.json();

    console.log('Criando link de pagamento:', data);

    // Validar dados
    if (!data.nome || !data.valor) {
      throw new Error('Nome e valor são obrigatórios');
    }

    let pixCode = null;
    let qrCodeUrl = null;
    let transactionToken = `LOCAL_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    let vegaResponse = null;

  // Tentar chamar API Vega se a key estiver configurada
    if (vegaApiKey) {
      try {
        // Criar cobrança PIX via Vega Checkout API
        // URL correta baseada no domínio do cliente: sorrisocidadao.com
        const apiUrl = 'https://checkout.sorrisocidadao.com/api/checkout';
        
        const vegaPayload = {
          customer: {
            name: data.cliente_nome || 'Cliente',
            email: data.cliente_email || 'cliente@email.com',
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
            payment_value: data.valor, // em centavos
            freight_value: 0,
            discount_value: 0,
            external_code: `LINK_${Date.now()}`,
            currency: 'BRL'
          },
          products: [{
            name: data.nome,
            price: data.valor,
            quantity: 1,
            code: `PROD_${Date.now()}`,
            is_digital: true,
            description: data.descricao || ''
          }],
          notification_url: `${supabaseUrl}/functions/v1/checkout-webhook`
        };

        console.log('Enviando para Vega Checkout:', JSON.stringify(vegaPayload));

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'api-key': vegaApiKey,
          },
          body: JSON.stringify(vegaPayload),
        });

        const responseText = await response.text();
        console.log('Resposta Vega (raw):', responseText);

        if (response.ok) {
          vegaResponse = JSON.parse(responseText);
          console.log('Resposta Vega Checkout:', vegaResponse);
          
          // Parse response baseado na estrutura da API PIX da Vega
          transactionToken = vegaResponse.data?.transaction_token || vegaResponse.transaction_token || transactionToken;
          pixCode = vegaResponse.data?.pix_copy_paste || vegaResponse.pix_copy_paste || vegaResponse.pix?.copy_paste;
          qrCodeUrl = vegaResponse.data?.qr_code_url || vegaResponse.qr_code_url || vegaResponse.pix?.qr_code_url;
        } else {
          console.error('Erro na resposta Vega:', response.status, responseText);
        }
      } catch (vegaError) {
        console.error('Erro ao chamar API Vega:', vegaError);
        // Continua sem Vega - cria link local
      }
    }

    // Se não conseguiu gerar via Vega, cria um registro local
    // O usuário pode copiar o link e usar externamente
    if (!pixCode) {
      console.log('Gerando link local (sem integração Vega ativa)');
      pixCode = `PIX_PENDENTE_${transactionToken}`;
    }

    // Salvar link no banco
    const { data: paymentLink, error: dbError } = await supabase
      .from('payment_links')
      .insert({
        nome: data.nome,
        descricao: data.descricao || null,
        valor: data.valor,
        transaction_token: transactionToken,
        pix_code: pixCode,
        qr_code_url: qrCodeUrl,
        status: vegaResponse ? 'pending' : 'manual',
        cliente_id: data.cliente_id || null,
        cliente_email: data.cliente_email || null,
        cliente_nome: data.cliente_nome || null,
        created_by: 'admin',
      })
      .select()
      .single();

    if (dbError) {
      console.error('Erro ao salvar payment link:', dbError);
      throw dbError;
    }

    console.log('Payment link criado:', paymentLink);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: {
          ...paymentLink,
          vega_integrated: !!vegaResponse,
          message: vegaResponse 
            ? 'Link PIX gerado via Vega Checkout' 
            : 'Link de pagamento criado localmente. Configure a integração Vega para gerar PIX automático.'
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Erro ao criar payment link:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
