import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CheckoutWebhookData {
  transaction_token?: string;
  order_id?: string;
  status: 'approved' | 'pending' | 'cancelled' | 'failed';
  customer: {
    name: string;
    email: string;
    document?: string;
    cpf?: string;
    phone?: string;
  };
  total_price?: number;
  amount?: number;
  method?: string;
  payment_method?: string;
  transaction_id?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const webhookData: CheckoutWebhookData = await req.json();
    
    console.log('Webhook recebido:', JSON.stringify(webhookData, null, 2));

    // Definir order_id baseado nos dados recebidos
    const orderId = webhookData.order_id || webhookData.transaction_token;
    
    // Validar dados obrigatórios
    if (!orderId || !webhookData.customer?.email || !webhookData.customer?.name) {
      throw new Error('Dados obrigatórios faltando: order_id/transaction_token, email ou nome');
    }
    
    // Normalizar CPF
    const cpf = webhookData.customer.cpf || webhookData.customer.document;

    // Registrar evento do webhook
    await supabase
      .from('webhook_events')
      .insert({
        order_id: orderId,
        event: `checkout_${webhookData.status}`,
        payload: webhookData,
        status: 'ok'
      });

    // Atualizar status do payment_link se existir
    const paymentLinkStatus = webhookData.status === 'approved' ? 'paid' 
      : webhookData.status === 'cancelled' || webhookData.status === 'failed' ? 'failed' 
      : 'pending';

    const { data: existingPaymentLink } = await supabase
      .from('payment_links')
      .select('id')
      .eq('transaction_token', orderId)
      .maybeSingle();

    if (existingPaymentLink) {
      await supabase
        .from('payment_links')
        .update({ 
          status: paymentLinkStatus,
          updated_at: new Date().toISOString()
        })
        .eq('transaction_token', orderId);
      
      console.log(`Payment link ${orderId} atualizado para status: ${paymentLinkStatus}`);
    }

    // Definir status da assinatura baseado no status da compra
    let assinaturaStatus = 'PENDENTE';
    if (webhookData.status === 'approved') {
      assinaturaStatus = 'ATIVA';
    } else if (webhookData.status === 'cancelled' || webhookData.status === 'failed') {
      assinaturaStatus = 'CANCELADA';
    }

    // Verificar se o usuário já existe pelo email
    const { data: existingUser } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', webhookData.customer.email)
      .maybeSingle();

    if (existingUser) {
      // Atualizar usuário existente
      const { error: updateError } = await supabase
        .from('usuarios')
        .update({
          nome: webhookData.customer.name,
          cpf: cpf,
          telefone: webhookData.customer.phone,
          assinatura_status: assinaturaStatus,
          order_id: orderId,
          updated_at: new Date().toISOString()
        })
        .eq('email', webhookData.customer.email);

      if (updateError) {
        throw updateError;
      }

      console.log(`Usuário atualizado: ${webhookData.customer.email}`);
    } else {
      // Criar novo usuário
      const { error: insertError } = await supabase
        .from('usuarios')
        .insert({
          nome: webhookData.customer.name,
          email: webhookData.customer.email,
          cpf: cpf,
          telefone: webhookData.customer.phone,
          role: 'cliente',
          assinatura_status: assinaturaStatus,
          order_id: orderId,
          ativo: true
        });

      if (insertError) {
        throw insertError;
      }

      console.log(`Novo usuário criado: ${webhookData.customer.email}`);
    }

    // Se a compra foi aprovada, pode enviar email de boas-vindas (opcional)
    if (webhookData.status === 'approved') {
      console.log(`Compra aprovada para ${webhookData.customer.email} - Assinatura ativada`);
      // Aqui você pode adicionar lógica para enviar email de boas-vindas
    } else if (webhookData.status === 'failed' || webhookData.status === 'cancelled') {
      console.log(`Compra ${webhookData.status} para ${webhookData.customer.email}`);
      // Aqui você pode adicionar lógica para notificar sobre falha na compra
    }

    return new Response(
        JSON.stringify({ 
        success: true, 
        message: 'Webhook processado com sucesso',
        order_id: orderId,
        status: webhookData.status
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    console.error('Erro no webhook:', error);

    // Tentar registrar erro no banco
    try {
      const errorData = await req.clone().json();
      await supabase
        .from('webhook_events')
        .insert({
          order_id: errorData?.order_id || errorData?.transaction_token || 'unknown',
          event: 'webhook_error',
          payload: errorData,
          status: 'error',
          error_message: error.message
        });
    } catch (logError) {
      console.error('Erro ao registrar erro no banco:', logError);
    }

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json', 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);
