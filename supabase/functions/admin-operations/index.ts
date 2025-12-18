import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, data } = await req.json();
    console.log(`Admin operation: ${action}`, data);

    let result;

    switch (action) {
      // CRIAR USUÁRIO COM AUTH ADMIN (sem rate limit)
      case 'create_usuario':
        console.log('Criando usuário:', data.email);
        
        // Criar usuário no Auth usando admin API (sem rate limit de email)
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
          email: data.email,
          password: data.password,
          email_confirm: true, // Auto-confirmar email
          user_metadata: {
            nome: data.nome
          }
        });

        if (authError) {
          console.error('Erro ao criar usuário no Auth:', authError);
          throw authError;
        }

        console.log('Usuário criado no Auth:', authUser.user?.id);

        // Inserir na tabela usuarios
        const { data: newUsuario, error: createUserError } = await supabase
          .from('usuarios')
          .insert({
            nome: data.nome,
            email: data.email,
            telefone: data.telefone || null,
            cpf: data.cpf || null,
            role: data.role || 'cliente',
            auth_user_id: authUser.user?.id,
            ativo: true,
            assinatura_status: 'PENDENTE'
          })
          .select()
          .single();

        if (createUserError) {
          console.error('Erro ao inserir usuário na tabela:', createUserError);
          // Tentar deletar o usuário do Auth se falhou inserir na tabela
          await supabase.auth.admin.deleteUser(authUser.user!.id);
          throw createUserError;
        }

        result = { user: newUsuario, auth_user_id: authUser.user?.id };
        console.log('Usuário criado com sucesso:', newUsuario);
        break;

      // CATEGORIAS
      case 'create_categoria':
        const { data: newCategoria, error: createCatError } = await supabase
          .from('categorias')
          .insert({
            nome: data.nome,
            icone: data.icone,
            ordem: data.ordem || 1,
          })
          .select()
          .single();
        
        if (createCatError) throw createCatError;
        result = newCategoria;
        console.log('Categoria criada:', newCategoria);
        break;

      case 'update_categoria':
        const { data: updatedCategoria, error: updateCatError } = await supabase
          .from('categorias')
          .update({
            nome: data.nome,
            icone: data.icone,
            ordem: data.ordem,
            updated_at: new Date().toISOString(),
          })
          .eq('id', data.id)
          .select()
          .single();
        
        if (updateCatError) throw updateCatError;
        result = updatedCategoria;
        console.log('Categoria atualizada:', updatedCategoria);
        break;

      case 'delete_categoria':
        const { error: deleteCatError } = await supabase
          .from('categorias')
          .delete()
          .eq('id', data.id);
        
        if (deleteCatError) throw deleteCatError;
        result = { success: true };
        console.log('Categoria deletada:', data.id);
        break;

      // PROCEDIMENTOS
      case 'create_procedimento':
        const { data: newProc, error: createProcError } = await supabase
          .from('procedimentos')
          .insert({
            nome: data.nome,
            categoria_id: data.categoria_id,
            preco_min: data.preco_min,
            preco_max: data.preco_max || null,
            observacoes: data.observacoes || null,
            ativo: true,
          })
          .select()
          .single();
        
        if (createProcError) throw createProcError;
        result = newProc;
        console.log('Procedimento criado:', newProc);
        break;

      case 'update_procedimento':
        const updateData: any = { updated_at: new Date().toISOString() };
        if (data.nome !== undefined) updateData.nome = data.nome;
        if (data.categoria_id !== undefined) updateData.categoria_id = data.categoria_id;
        if (data.preco_min !== undefined) updateData.preco_min = data.preco_min;
        if (data.preco_max !== undefined) updateData.preco_max = data.preco_max;
        if (data.observacoes !== undefined) updateData.observacoes = data.observacoes;
        if (data.ativo !== undefined) updateData.ativo = data.ativo;

        const { data: updatedProc, error: updateProcError } = await supabase
          .from('procedimentos')
          .update(updateData)
          .eq('id', data.id)
          .select()
          .single();
        
        if (updateProcError) throw updateProcError;
        result = updatedProc;
        console.log('Procedimento atualizado:', updatedProc);
        break;

      case 'delete_procedimento':
        // Soft delete - apenas desativa
        const { data: deletedProc, error: deleteProcError } = await supabase
          .from('procedimentos')
          .update({ ativo: false, updated_at: new Date().toISOString() })
          .eq('id', data.id)
          .select()
          .single();
        
        if (deleteProcError) throw deleteProcError;
        result = deletedProc;
        console.log('Procedimento desativado:', data.id);
        break;

      // USUARIOS
      case 'update_usuario':
        const userUpdateData: any = { updated_at: new Date().toISOString() };
        if (data.role !== undefined) userUpdateData.role = data.role;
        if (data.ativo !== undefined) userUpdateData.ativo = data.ativo;
        if (data.assinatura_status !== undefined) userUpdateData.assinatura_status = data.assinatura_status;

        const { data: updatedUser, error: updateUserError } = await supabase
          .from('usuarios')
          .update(userUpdateData)
          .eq('id', data.id)
          .select()
          .single();
        
        if (updateUserError) throw updateUserError;
        result = updatedUser;
        console.log('Usuário atualizado:', updatedUser);
        break;

      // ORDENS DE SERVICO
      case 'update_ordem':
        const ordemUpdateData: any = { updated_at: new Date().toISOString() };
        if (data.status !== undefined) ordemUpdateData.status = data.status;
        if (data.clinica_id !== undefined) ordemUpdateData.clinica_id = data.clinica_id;
        if (data.dentista_id !== undefined) ordemUpdateData.dentista_id = data.dentista_id;
        if (data.data_confirmada !== undefined) ordemUpdateData.data_confirmada = data.data_confirmada;
        if (data.observacoes_internas !== undefined) ordemUpdateData.observacoes_internas = data.observacoes_internas;

        const { data: updatedOrdem, error: updateOrdemError } = await supabase
          .from('ordens_servico')
          .update(ordemUpdateData)
          .eq('id', data.id)
          .select()
          .single();
        
        if (updateOrdemError) throw updateOrdemError;
        result = updatedOrdem;
        console.log('Ordem atualizada:', updatedOrdem);
        break;

      // DEPENDENTES
      case 'create_dependente':
        const { data: newDep, error: createDepError } = await supabase
          .from('dependentes')
          .insert({
            usuario_id: data.usuario_id,
            nome: data.nome,
            cpf: data.cpf || null,
            data_nascimento: data.data_nascimento || null,
            parentesco: data.parentesco || null,
            ativo: true,
          })
          .select()
          .single();
        
        if (createDepError) throw createDepError;
        result = newDep;
        console.log('Dependente criado:', newDep);
        break;

      case 'update_dependente':
        const depUpdateData: any = { updated_at: new Date().toISOString() };
        if (data.nome !== undefined) depUpdateData.nome = data.nome;
        if (data.cpf !== undefined) depUpdateData.cpf = data.cpf;
        if (data.data_nascimento !== undefined) depUpdateData.data_nascimento = data.data_nascimento;
        if (data.parentesco !== undefined) depUpdateData.parentesco = data.parentesco;
        if (data.ativo !== undefined) depUpdateData.ativo = data.ativo;

        const { data: updatedDep, error: updateDepError } = await supabase
          .from('dependentes')
          .update(depUpdateData)
          .eq('id', data.id)
          .select()
          .single();
        
        if (updateDepError) throw updateDepError;
        result = updatedDep;
        console.log('Dependente atualizado:', updatedDep);
        break;

      case 'delete_dependente':
        const { error: deleteDepError } = await supabase
          .from('dependentes')
          .delete()
          .eq('id', data.id);
        
        if (deleteDepError) throw deleteDepError;
        result = { success: true };
        console.log('Dependente deletado:', data.id);
        break;

      case 'list_dependentes':
        const { data: dependentes, error: listDepError } = await supabase
          .from('dependentes')
          .select('*')
          .eq('usuario_id', data.usuario_id)
          .eq('ativo', true)
          .order('nome');
        
        if (listDepError) throw listDepError;
        result = dependentes;
        break;

      // HISTÓRICO DE ASSINATURAS
      case 'list_historico_assinaturas':
        const { data: historico, error: listHistError } = await supabase
          .from('historico_assinaturas')
          .select('*')
          .eq('usuario_id', data.usuario_id)
          .order('data_pagamento', { ascending: false });
        
        if (listHistError) throw listHistError;
        result = historico;
        break;

      case 'create_historico_assinatura':
        const { data: newHist, error: createHistError } = await supabase
          .from('historico_assinaturas')
          .insert({
            usuario_id: data.usuario_id,
            valor: data.valor,
            data_inicio: data.data_inicio,
            data_fim: data.data_fim,
            metodo_pagamento: data.metodo_pagamento || null,
            observacoes: data.observacoes || null,
          })
          .select()
          .single();
        
        if (createHistError) throw createHistError;
        
        // Atualizar validade do usuário
        const { error: updateValidadeError } = await supabase
          .from('usuarios')
          .update({ 
            assinatura_validade: data.data_fim,
            assinatura_status: 'ATIVA',
            updated_at: new Date().toISOString()
          })
          .eq('id', data.usuario_id);
        
        if (updateValidadeError) throw updateValidadeError;
        
        result = newHist;
        console.log('Histórico criado e validade atualizada:', newHist);
        break;

      case 'update_usuario_validade':
        const { data: updatedValidade, error: updateValError } = await supabase
          .from('usuarios')
          .update({ 
            assinatura_validade: data.assinatura_validade,
            updated_at: new Date().toISOString()
          })
          .eq('id', data.id)
          .select()
          .single();
        
        if (updateValError) throw updateValError;
        result = updatedValidade;
        console.log('Validade atualizada:', updatedValidade);
        break;

      // PAYMENT LINKS
      case 'list_payment_links':
        const { data: paymentLinks, error: listPayError } = await supabase
          .from('payment_links')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (listPayError) throw listPayError;
        result = paymentLinks;
        break;

      case 'update_payment_link':
        const payUpdateData: any = { updated_at: new Date().toISOString() };
        if (data.status !== undefined) payUpdateData.status = data.status;

        const { data: updatedPay, error: updatePayError } = await supabase
          .from('payment_links')
          .update(payUpdateData)
          .eq('id', data.id)
          .select()
          .single();
        
        if (updatePayError) throw updatePayError;
        result = updatedPay;
        console.log('Payment link atualizado:', updatedPay);
        break;

      case 'save_payment_link':
        // Salvar payment link gerado pelo frontend (chamada Vega direto do browser)
        const { data: savedPayLink, error: savePayError } = await supabase
          .from('payment_links')
          .insert({
            nome: data.nome,
            descricao: data.descricao || null,
            valor: data.valor,
            transaction_token: data.transaction_token,
            pix_code: data.pix_code,
            qr_code_url: data.qr_code_url || null,
            status: data.status || 'pending',
            cliente_id: data.cliente_id || null,
            cliente_email: data.cliente_email || null,
            cliente_nome: data.cliente_nome || null,
            created_by: 'admin',
          })
          .select()
          .single();
        
        if (savePayError) throw savePayError;
        result = savedPayLink;
        console.log('Payment link salvo (frontend):', savedPayLink, 'Vega integrado:', data.vega_integrated);
        break;

      // LISTAR DADOS (para admin)
      case 'list_usuarios':
        const { data: usuarios, error: listUsersError } = await supabase
          .from('usuarios')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (listUsersError) throw listUsersError;
        result = usuarios;
        break;

      case 'list_ordens':
        const { data: ordens, error: listOrdensError } = await supabase
          .from('ordens_servico')
          .select(`
            *,
            usuarios:cliente_id(nome, email, telefone),
            clinicas:clinica_id(nome, cidade),
            procedimentos:procedimento_id(nome),
            dentistas:dentista_id(nome)
          `)
          .order('created_at', { ascending: false });
        
        if (listOrdensError) throw listOrdensError;
        result = ordens;
        break;

      case 'list_procedimentos':
        const { data: procedimentos, error: listProcError } = await supabase
          .from('procedimentos')
          .select(`*, categorias(nome)`)
          .eq('ativo', true)
          .order('nome');
        
        if (listProcError) throw listProcError;
        result = procedimentos;
        break;

      case 'list_categorias':
        const { data: categorias, error: listCatError } = await supabase
          .from('categorias')
          .select('*')
          .order('ordem');
        
        if (listCatError) throw listCatError;
        result = categorias;
        break;

      // CONFIGURAÇÕES
      case 'list_configuracoes':
        const { data: configs, error: listConfigError } = await supabase
          .from('configuracoes')
          .select('*')
          .order('chave');
        
        if (listConfigError) throw listConfigError;
        result = configs;
        break;

      case 'update_configuracao':
        const { data: updatedConfig, error: updateConfigError } = await supabase
          .from('configuracoes')
          .update({
            valor: data.valor,
            updated_at: new Date().toISOString()
          })
          .eq('chave', data.chave)
          .select()
          .single();
        
        if (updateConfigError) throw updateConfigError;
        result = updatedConfig;
        console.log('Configuração atualizada:', updatedConfig);
        break;

      // HISTÓRICO DE PROCEDIMENTOS
      case 'list_historico_procedimentos':
        const { data: ordensUsuario, error: listOrdensUsuarioError } = await supabase
          .from('ordens_servico')
          .select(`
            *,
            procedimentos:procedimento_id(nome, preco_min, preco_max),
            clinicas:clinica_id(nome, cidade),
            dentistas:dentista_id(nome)
          `)
          .eq('cliente_id', data.usuario_id)
          .order('created_at', { ascending: false });
        
        if (listOrdensUsuarioError) throw listOrdensUsuarioError;
        result = ordensUsuario;
        console.log('Histórico de procedimentos:', ordensUsuario?.length);
        break;

      // CRIAR ORDEM DE SERVIÇO (ATRELAR PROCEDIMENTO AO CLIENTE)
      case 'create_ordem_servico':
        const { data: novaOrdem, error: createOrdemError } = await supabase
          .from('ordens_servico')
          .insert({
            cliente_id: data.cliente_id,
            procedimento_id: data.procedimento_id || null,
            nome_procedimento_manual: data.nome_procedimento_manual || null,
            clinica_id: data.clinica_id || null,
            dentista_id: data.dentista_id || null,
            data_solicitada: data.data_solicitada || new Date().toISOString(),
            data_confirmada: data.data_confirmada || null,
            status: data.status || 'realizada',
            valor_pago: data.valor_pago || null,
            observacoes_cliente: data.observacoes_cliente || null,
            observacoes_internas: data.observacoes_internas || null,
          })
          .select()
          .single();
        
        if (createOrdemError) throw createOrdemError;
        result = novaOrdem;
        console.log('Ordem de serviço criada:', novaOrdem);
        break;

      // ATUALIZAR VALOR PAGO EM ORDEM
      case 'update_ordem_valor':
        const { data: ordemAtualizada, error: updateOrdemValorError } = await supabase
          .from('ordens_servico')
          .update({
            valor_pago: data.valor_pago,
            updated_at: new Date().toISOString()
          })
          .eq('id', data.id)
          .select()
          .single();
        
        if (updateOrdemValorError) throw updateOrdemValorError;
        result = ordemAtualizada;
        console.log('Valor da ordem atualizado:', ordemAtualizada);
        break;

      // CALCULAR LTV DO CLIENTE
      case 'get_cliente_ltv':
        // Buscar valores de ordens de serviço
        const { data: ordensLtv, error: ordensLtvError } = await supabase
          .from('ordens_servico')
          .select('valor_pago')
          .eq('cliente_id', data.usuario_id)
          .not('valor_pago', 'is', null);
        
        if (ordensLtvError) throw ordensLtvError;

        // Buscar valores de assinaturas
        const { data: assinaturasLtv, error: assinaturasLtvError } = await supabase
          .from('historico_assinaturas')
          .select('valor')
          .eq('usuario_id', data.usuario_id);
        
        if (assinaturasLtvError) throw assinaturasLtvError;

        const totalProcedimentos = ordensLtv?.reduce((acc, o) => acc + (parseFloat(o.valor_pago) || 0), 0) || 0;
        const totalAssinaturas = assinaturasLtv?.reduce((acc, a) => acc + (parseFloat(a.valor) || 0), 0) || 0;
        const ltvTotal = totalProcedimentos + totalAssinaturas;

        result = {
          procedimentos: totalProcedimentos,
          assinaturas: totalAssinaturas,
          total: ltvTotal,
          qtd_procedimentos: ordensLtv?.length || 0,
          qtd_assinaturas: assinaturasLtv?.length || 0
        };
        console.log('LTV calculado:', result);
        break;

      // RELATÓRIO DE CLIENTES COM LTV
      case 'list_relatorio_clientes':
        // Buscar todos os usuários com seus dados
        const { data: usuariosRelatorio, error: usuariosRelatorioError } = await supabase
          .from('usuarios')
          .select('id, nome, email, assinatura_status')
          .order('nome');
        
        if (usuariosRelatorioError) throw usuariosRelatorioError;

        // Buscar todas as ordens com valores
        const { data: todasOrdens, error: todasOrdensError } = await supabase
          .from('ordens_servico')
          .select('cliente_id, valor_pago');
        
        if (todasOrdensError) throw todasOrdensError;

        // Buscar todas as assinaturas
        const { data: todasAssinaturas, error: todasAssinaturasError } = await supabase
          .from('historico_assinaturas')
          .select('usuario_id, valor');
        
        if (todasAssinaturasError) throw todasAssinaturasError;

        // Calcular LTV por cliente
        const relatorioClientes = usuariosRelatorio?.map(usuario => {
          const ordensCliente = todasOrdens?.filter(o => o.cliente_id === usuario.id) || [];
          const assinaturasCliente = todasAssinaturas?.filter(a => a.usuario_id === usuario.id) || [];
          
          const totalProcedimentosCliente = ordensCliente.reduce((acc, o) => acc + (parseFloat(o.valor_pago) || 0), 0);
          const totalAssinaturasCliente = assinaturasCliente.reduce((acc, a) => acc + (parseFloat(a.valor) || 0), 0);
          const ltvCliente = totalProcedimentosCliente + totalAssinaturasCliente;
          const qtdTransacoes = ordensCliente.filter(o => o.valor_pago).length + assinaturasCliente.length;

          return {
            ...usuario,
            procedimentos_valor: totalProcedimentosCliente,
            assinaturas_valor: totalAssinaturasCliente,
            ltv: ltvCliente,
            qtd_transacoes: qtdTransacoes,
            ticket_medio: qtdTransacoes > 0 ? ltvCliente / qtdTransacoes : 0
          };
        });

        // Ordenar por LTV decrescente
        relatorioClientes?.sort((a, b) => b.ltv - a.ltv);

        // Calcular totais
        const totalGeralProcedimentos = relatorioClientes?.reduce((acc, c) => acc + c.procedimentos_valor, 0) || 0;
        const totalGeralAssinaturas = relatorioClientes?.reduce((acc, c) => acc + c.assinaturas_valor, 0) || 0;
        const totalGeralLtv = totalGeralProcedimentos + totalGeralAssinaturas;
        const totalTransacoes = relatorioClientes?.reduce((acc, c) => acc + c.qtd_transacoes, 0) || 0;
        const ticketMedioGeral = totalTransacoes > 0 ? totalGeralLtv / totalTransacoes : 0;
        const ltvMedioCliente = relatorioClientes?.length > 0 ? totalGeralLtv / relatorioClientes.length : 0;

        result = {
          clientes: relatorioClientes,
          totais: {
            procedimentos: totalGeralProcedimentos,
            assinaturas: totalGeralAssinaturas,
            ltv_total: totalGeralLtv,
            ticket_medio: ticketMedioGeral,
            ltv_medio: ltvMedioCliente,
            total_clientes: relatorioClientes?.length || 0
          }
        };
        console.log('Relatório de clientes:', result.totais);
        break;

      // LISTAR CLÍNICAS
      case 'list_clinicas':
        const { data: clinicasData, error: listClinicasError } = await supabase
          .from('clinicas')
          .select('*')
          .eq('ativo', true)
          .order('nome');
        
        if (listClinicasError) throw listClinicasError;
        result = clinicasData;
        break;

      // LISTAR TODAS CLÍNICAS (incluindo inativas)
      case 'list_all_clinicas':
        const { data: allClinicasData, error: listAllClinicasError } = await supabase
          .from('clinicas')
          .select('*')
          .order('nome');
        
        if (listAllClinicasError) throw listAllClinicasError;
        result = allClinicasData;
        break;

      // CRIAR CLÍNICA
      case 'create_clinica':
        const { data: newClinica, error: createClinicaError } = await supabase
          .from('clinicas')
          .insert({
            nome: data.nome,
            cidade: data.cidade,
            estado: data.estado || 'GO',
            endereco: data.endereco || null,
            telefone: data.telefone || null,
            email: data.email || null,
            ativo: true,
          })
          .select()
          .single();
        
        if (createClinicaError) throw createClinicaError;
        result = newClinica;
        console.log('Clínica criada:', newClinica);
        break;

      // ATUALIZAR CLÍNICA
      case 'update_clinica':
        const clinicaUpdateData: any = { updated_at: new Date().toISOString() };
        if (data.nome !== undefined) clinicaUpdateData.nome = data.nome;
        if (data.cidade !== undefined) clinicaUpdateData.cidade = data.cidade;
        if (data.estado !== undefined) clinicaUpdateData.estado = data.estado;
        if (data.endereco !== undefined) clinicaUpdateData.endereco = data.endereco;
        if (data.telefone !== undefined) clinicaUpdateData.telefone = data.telefone;
        if (data.email !== undefined) clinicaUpdateData.email = data.email;
        if (data.ativo !== undefined) clinicaUpdateData.ativo = data.ativo;

        const { data: updatedClinica, error: updateClinicaError } = await supabase
          .from('clinicas')
          .update(clinicaUpdateData)
          .eq('id', data.id)
          .select()
          .single();
        
        if (updateClinicaError) throw updateClinicaError;
        result = updatedClinica;
        console.log('Clínica atualizada:', updatedClinica);
        break;

      // EXCLUIR CLÍNICA (soft delete)
      case 'delete_clinica':
        const { data: deletedClinica, error: deleteClinicaError } = await supabase
          .from('clinicas')
          .update({ ativo: false, updated_at: new Date().toISOString() })
          .eq('id', data.id)
          .select()
          .single();
        
        if (deleteClinicaError) throw deleteClinicaError;
        result = deletedClinica;
        console.log('Clínica desativada:', data.id);
        break;

      // ATUALIZAR ORDEM COM PROPOSTA ADMIN
      case 'update_ordem_proposta':
        const { data: ordemProposta, error: updateOrdemPropostaError } = await supabase
          .from('ordens_servico')
          .update({
            data_proposta_admin: data.data_proposta_admin,
            status: 'aguardando_cliente',
            observacoes_internas: data.observacoes_internas || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', data.id)
          .select()
          .single();
        
        if (updateOrdemPropostaError) throw updateOrdemPropostaError;
        result = ordemProposta;
        console.log('Proposta enviada para cliente:', ordemProposta);
        break;

      // LISTAR DENTISTAS
      case 'list_dentistas':
        const { data: dentistasData, error: listDentistasError } = await supabase
          .from('dentistas')
          .select('*, clinicas(nome)')
          .eq('ativo', true)
          .order('nome');
        
        if (listDentistasError) throw listDentistasError;
        result = dentistasData;
        break;

      default:
        throw new Error(`Ação desconhecida: ${action}`);
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Erro na operação admin:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
