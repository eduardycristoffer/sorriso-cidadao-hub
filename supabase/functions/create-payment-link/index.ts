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
    const vegaApiKey = Deno.env.get('VEGA_CHECKOUT_API_KEY')!;

    if (!vegaApiKey) {
      throw new Error('VEGA_CHECKOUT_API_KEY não configurada');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const data: CreatePaymentRequest = await req.json();

    console.log('Criando link de pagamento:', data);

    // Validar dados
    if (!data.nome || !data.valor) {
      throw new Error('Nome e valor são obrigatórios');
    }

    // Criar cobrança PIX via Vega Checkout API
    const vegaPayload = {
      customer: {
        name: data.cliente_nome || 'Cliente',
        email: data.cliente_email || 'cliente@email.com',
      },
      products: [
        {
          name: data.nome,
          quantity: 1,
          price: data.valor, // em centavos
        }
      ],
      payment_method: 'pix',
      notification_url: `${supabaseUrl}/functions/v1/checkout-webhook`,
    };

    console.log('Enviando para Vega Checkout:', vegaPayload);

    const vegaResponse = await fetch('https://api.vegacheckout.com.br/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${vegaApiKey}`,
      },
      body: JSON.stringify(vegaPayload),
    });

    const vegaData = await vegaResponse.json();
    console.log('Resposta Vega Checkout:', vegaData);

    if (!vegaResponse.ok) {
      throw new Error(vegaData.message || 'Erro ao criar cobrança no Vega Checkout');
    }

    // Salvar link no banco
    const { data: paymentLink, error: dbError } = await supabase
      .from('payment_links')
      .insert({
        nome: data.nome,
        descricao: data.descricao || null,
        valor: data.valor,
        transaction_token: vegaData.transaction_token || vegaData.order_id,
        pix_code: vegaData.pix?.copy_paste || vegaData.pix_copy_paste,
        qr_code_url: vegaData.pix?.qr_code_url || vegaData.qr_code_url,
        status: 'pending',
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
          vega_response: vegaData
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
