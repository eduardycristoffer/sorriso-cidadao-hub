export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      categorias: {
        Row: {
          created_at: string
          icone: string | null
          id: string
          nome: string
          ordem: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          icone?: string | null
          id?: string
          nome: string
          ordem?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          icone?: string | null
          id?: string
          nome?: string
          ordem?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      clinicas: {
        Row: {
          ativo: boolean | null
          cidade: string
          created_at: string
          email: string | null
          endereco: string | null
          estado: string | null
          id: string
          nome: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean | null
          cidade: string
          created_at?: string
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          nome: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean | null
          cidade?: string
          created_at?: string
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          nome?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      configuracoes: {
        Row: {
          chave: string
          created_at: string
          descricao: string | null
          id: string
          updated_at: string
          valor: string
        }
        Insert: {
          chave: string
          created_at?: string
          descricao?: string | null
          id?: string
          updated_at?: string
          valor: string
        }
        Update: {
          chave?: string
          created_at?: string
          descricao?: string | null
          id?: string
          updated_at?: string
          valor?: string
        }
        Relationships: []
      }
      dentistas: {
        Row: {
          ativo: boolean | null
          clinica_id: string | null
          created_at: string
          cro: string | null
          especialidade: string | null
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean | null
          clinica_id?: string | null
          created_at?: string
          cro?: string | null
          especialidade?: string | null
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean | null
          clinica_id?: string | null
          created_at?: string
          cro?: string | null
          especialidade?: string | null
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dentistas_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
        ]
      }
      dependentes: {
        Row: {
          ativo: boolean | null
          cpf: string | null
          created_at: string
          data_nascimento: string | null
          id: string
          nome: string
          parentesco: string | null
          updated_at: string
          usuario_id: string
        }
        Insert: {
          ativo?: boolean | null
          cpf?: string | null
          created_at?: string
          data_nascimento?: string | null
          id?: string
          nome: string
          parentesco?: string | null
          updated_at?: string
          usuario_id: string
        }
        Update: {
          ativo?: boolean | null
          cpf?: string | null
          created_at?: string
          data_nascimento?: string | null
          id?: string
          nome?: string
          parentesco?: string | null
          updated_at?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dependentes_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      historico_assinaturas: {
        Row: {
          created_at: string | null
          data_fim: string
          data_inicio: string
          data_pagamento: string | null
          id: string
          metodo_pagamento: string | null
          observacoes: string | null
          usuario_id: string
          valor: number
        }
        Insert: {
          created_at?: string | null
          data_fim: string
          data_inicio: string
          data_pagamento?: string | null
          id?: string
          metodo_pagamento?: string | null
          observacoes?: string | null
          usuario_id: string
          valor: number
        }
        Update: {
          created_at?: string | null
          data_fim?: string
          data_inicio?: string
          data_pagamento?: string | null
          id?: string
          metodo_pagamento?: string | null
          observacoes?: string | null
          usuario_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "historico_assinaturas_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      ordens_servico: {
        Row: {
          cliente_id: string
          clinica_id: string | null
          created_at: string
          data_confirmada: string | null
          data_proposta_admin: string | null
          data_solicitada: string
          dentista_id: string | null
          id: string
          nome_procedimento_manual: string | null
          observacoes_cliente: string | null
          observacoes_internas: string | null
          procedimento_id: string | null
          resposta_cliente: string | null
          status: string | null
          updated_at: string
          valor_pago: number | null
        }
        Insert: {
          cliente_id: string
          clinica_id?: string | null
          created_at?: string
          data_confirmada?: string | null
          data_proposta_admin?: string | null
          data_solicitada: string
          dentista_id?: string | null
          id?: string
          nome_procedimento_manual?: string | null
          observacoes_cliente?: string | null
          observacoes_internas?: string | null
          procedimento_id?: string | null
          resposta_cliente?: string | null
          status?: string | null
          updated_at?: string
          valor_pago?: number | null
        }
        Update: {
          cliente_id?: string
          clinica_id?: string | null
          created_at?: string
          data_confirmada?: string | null
          data_proposta_admin?: string | null
          data_solicitada?: string
          dentista_id?: string | null
          id?: string
          nome_procedimento_manual?: string | null
          observacoes_cliente?: string | null
          observacoes_internas?: string | null
          procedimento_id?: string | null
          resposta_cliente?: string | null
          status?: string | null
          updated_at?: string
          valor_pago?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ordens_servico_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordens_servico_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordens_servico_dentista_id_fkey"
            columns: ["dentista_id"]
            isOneToOne: false
            referencedRelation: "dentistas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordens_servico_procedimento_id_fkey"
            columns: ["procedimento_id"]
            isOneToOne: false
            referencedRelation: "procedimentos"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_links: {
        Row: {
          cliente_email: string | null
          cliente_id: string | null
          cliente_nome: string | null
          created_at: string
          created_by: string | null
          descricao: string | null
          id: string
          nome: string
          pix_code: string | null
          qr_code_url: string | null
          status: string | null
          transaction_token: string | null
          updated_at: string
          valor: number
        }
        Insert: {
          cliente_email?: string | null
          cliente_id?: string | null
          cliente_nome?: string | null
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          id?: string
          nome: string
          pix_code?: string | null
          qr_code_url?: string | null
          status?: string | null
          transaction_token?: string | null
          updated_at?: string
          valor: number
        }
        Update: {
          cliente_email?: string | null
          cliente_id?: string | null
          cliente_nome?: string | null
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          pix_code?: string | null
          qr_code_url?: string | null
          status?: string | null
          transaction_token?: string | null
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "payment_links_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      procedimentos: {
        Row: {
          ativo: boolean | null
          categoria_id: string | null
          created_at: string
          id: string
          nome: string
          observacoes: string | null
          preco_max: number | null
          preco_min: number
          updated_at: string
        }
        Insert: {
          ativo?: boolean | null
          categoria_id?: string | null
          created_at?: string
          id?: string
          nome: string
          observacoes?: string | null
          preco_max?: number | null
          preco_min: number
          updated_at?: string
        }
        Update: {
          ativo?: boolean | null
          categoria_id?: string | null
          created_at?: string
          id?: string
          nome?: string
          observacoes?: string | null
          preco_max?: number | null
          preco_min?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "procedimentos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      usuarios: {
        Row: {
          assinatura_status: string | null
          assinatura_validade: string | null
          ativo: boolean | null
          auth_user_id: string | null
          cpf: string | null
          created_at: string
          email: string
          id: string
          nome: string
          order_id: string | null
          role: string | null
          telefone: string | null
          updated_at: string
        }
        Insert: {
          assinatura_status?: string | null
          assinatura_validade?: string | null
          ativo?: boolean | null
          auth_user_id?: string | null
          cpf?: string | null
          created_at?: string
          email: string
          id?: string
          nome: string
          order_id?: string | null
          role?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          assinatura_status?: string | null
          assinatura_validade?: string | null
          ativo?: boolean | null
          auth_user_id?: string | null
          cpf?: string | null
          created_at?: string
          email?: string
          id?: string
          nome?: string
          order_id?: string | null
          role?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      webhook_events: {
        Row: {
          created_at: string
          error_message: string | null
          event: string
          id: string
          order_id: string | null
          payload: Json | null
          status: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          event: string
          id?: string
          order_id?: string | null
          payload?: Json | null
          status?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          event?: string
          id?: string
          order_id?: string | null
          payload?: Json | null
          status?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      buscar_cliente_por_email: {
        Args: { p_email: string }
        Returns: {
          assinatura_status: string
          assinatura_validade: string
          ativo: boolean
          email: string
          id: string
          nome: string
        }[]
      }
      criar_ordem_servico: {
        Args: {
          p_cliente_id: string
          p_clinica_id: string
          p_data_solicitada: string
          p_observacoes_cliente?: string
          p_procedimento_id: string
        }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      listar_ordens_cliente: {
        Args: { p_cliente_id: string }
        Returns: {
          cliente_id: string
          clinica_cidade: string
          clinica_id: string
          clinica_nome: string
          created_at: string
          data_confirmada: string
          data_proposta_admin: string
          data_solicitada: string
          dentista_id: string
          id: string
          observacoes_cliente: string
          procedimento_id: string
          procedimento_nome: string
          resposta_cliente: string
          status: string
          valor_pago: number
        }[]
      }
      responder_proposta_consulta: {
        Args: {
          p_nova_data_sugerida?: string
          p_ordem_id: string
          p_resposta: string
        }
        Returns: string
      }
      validar_cliente_login: {
        Args: { p_cpf: string; p_email: string }
        Returns: {
          assinatura_status: string
          assinatura_validade: string
          ativo: boolean
          auth_user_id: string
          cpf: string
          email: string
          id: string
          nome: string
          telefone: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
