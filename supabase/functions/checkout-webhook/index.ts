import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CheckoutWebhookData {
  // Formato padrão (v1)
  transaction_token?: string;
  order_id?: string;
  status?: 'approved' | 'pending' | 'cancelled' | 'failed';
  // Formato API PIX (pode ter typo no docs: tansaction_token)
  tansaction_token?: string;
  payment_status?: 'approved' | 'pending' | 'cancelled' | 'failed';
  customer?: {
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
  approved_at?: string;
  created_at?: string;
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

    // Definir order_id baseado nos dados recebidos (suporta ambos formatos)
    // Nota: API PIX pode enviar "tansaction_token" (com typo)
    const orderId = webhookData.order_id || webhookData.transaction_token || webhookData.tansaction_token;
    
    // Normalizar status (suporta ambos formatos: status e payment_status)
    const status = webhookData.status || webhookData.payment_status || 'pending';
    
    // Se for webhook de atualização de status PIX (sem customer), apenas atualiza payment_link
    if (!webhookData.customer?.email && orderId) {
      console.log('Webhook de atualização PIX recebido para:', orderId);
      
      // Registrar evento
      await supabase
        .from('webhook_events')
        .insert({
          order_id: orderId,
          event: `pix_${status}`,
          payload: webhookData,
          status: 'ok'
        });

      // Atualizar status do payment_link
      const paymentLinkStatus = status === 'approved' ? 'paid' 
        : status === 'cancelled' || status === 'failed' ? 'failed' 
        : 'pending';

      await supabase
        .from('payment_links')
        .update({ 
          status: paymentLinkStatus,
          updated_at: new Date().toISOString()
        })
        .eq('transaction_token', orderId);
      
      console.log(`Payment link ${orderId} atualizado para status: ${paymentLinkStatus}`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Webhook PIX processado',
          order_id: orderId,
          status: status
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }
    
    // Validar dados obrigatórios para webhook completo
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
        event: `checkout_${status}`,
        payload: webhookData,
        status: 'ok'
      });

    // Atualizar status do payment_link se existir
    const paymentLinkStatus = status === 'approved' ? 'paid' 
      : status === 'cancelled' || status === 'failed' ? 'failed' 
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
    if (status === 'approved') {
      assinaturaStatus = 'ATIVA';
    } else if (status === 'cancelled' || status === 'failed') {
      assinaturaStatus = 'CANCELADA';
    }

    // Buscar configuração de meses para assinatura (padrão 12)
    let mesesAssinatura = 12;
    try {
      const { data: configData } = await supabase
        .from('configuracoes')
        .select('valor')
        .eq('chave', 'meses_assinatura')
        .maybeSingle();
      
      if (configData?.valor) {
        mesesAssinatura = parseInt(configData.valor) || 12;
      }
      console.log(`Configuração de meses: ${mesesAssinatura}`);
    } catch (configError) {
      console.log('Usando meses padrão (12):', configError);
    }

    // Calcular data de validade baseada na data da compra
    const dataCompra = new Date(webhookData.approved_at || webhookData.created_at || new Date().toISOString());
    const dataValidade = new Date(dataCompra);
    dataValidade.setMonth(dataValidade.getMonth() + mesesAssinatura);

    console.log(`Data da compra: ${dataCompra.toISOString()}`);
    console.log(`Data de validade calculada (+${mesesAssinatura} meses): ${dataValidade.toISOString()}`);

    // Verificar se o usuário já existe pelo email
    const { data: existingUser } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', webhookData.customer.email)
      .maybeSingle();

    let usuarioId: string | null = null;

    if (existingUser) {
      usuarioId = existingUser.id;
      
      // Atualizar usuário existente
      const updateData: any = {
        nome: webhookData.customer.name,
        cpf: cpf,
        telefone: webhookData.customer.phone,
        assinatura_status: assinaturaStatus,
        order_id: orderId,
        updated_at: new Date().toISOString()
      };

      // Se aprovado, atualizar validade
      if (status === 'approved') {
        updateData.assinatura_validade = dataValidade.toISOString();
      }

      const { error: updateError } = await supabase
        .from('usuarios')
        .update(updateData)
        .eq('email', webhookData.customer.email);

      if (updateError) {
        throw updateError;
      }

      console.log(`Usuário atualizado: ${webhookData.customer.email}`);
    } else {
      // Criar novo usuário
      const insertData: any = {
        nome: webhookData.customer.name,
        email: webhookData.customer.email,
        cpf: cpf,
        telefone: webhookData.customer.phone,
        role: 'cliente',
        assinatura_status: assinaturaStatus,
        order_id: orderId,
        ativo: true
      };

      // Se aprovado, definir validade
      if (status === 'approved') {
        insertData.assinatura_validade = dataValidade.toISOString();
      }

      const { data: newUser, error: insertError } = await supabase
        .from('usuarios')
        .insert(insertData)
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      usuarioId = newUser?.id;
      console.log(`Novo usuário criado: ${webhookData.customer.email}`);
    }

    // Se a compra foi aprovada, registrar no histórico de assinaturas
    if (status === 'approved' && usuarioId) {
      const valorCompra = (webhookData.total_price || webhookData.amount || 0) / 100; // Centavos para reais
      const metodoPagamento = webhookData.method || webhookData.payment_method || 'pix';

      const { error: historicoError } = await supabase
        .from('historico_assinaturas')
        .insert({
          usuario_id: usuarioId,
          valor: valorCompra,
          data_pagamento: dataCompra.toISOString(),
          data_inicio: dataCompra.toISOString().split('T')[0],
          data_fim: dataValidade.toISOString().split('T')[0],
          metodo_pagamento: metodoPagamento,
          observacoes: `Pagamento automático via webhook - Order: ${orderId}`
        });

      if (historicoError) {
        console.error('Erro ao registrar histórico:', historicoError);
        // Não bloquear o webhook por erro no histórico
      } else {
        console.log(`Histórico de assinatura registrado - Valor: R$ ${valorCompra.toFixed(2)}, Período: ${dataCompra.toISOString().split('T')[0]} até ${dataValidade.toISOString().split('T')[0]}`);
      }

      console.log(`Compra aprovada para ${webhookData.customer!.email} - Assinatura ativada até ${dataValidade.toISOString().split('T')[0]}`);
    } else if (status === 'failed' || status === 'cancelled') {
      console.log(`Compra ${status} para ${webhookData.customer!.email}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Webhook processado com sucesso',
        order_id: orderId,
        status: status,
        validade: status === 'approved' ? dataValidade.toISOString() : null
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
