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
          created_at: string | null
          icone: string | null
          id: string
          nome: string
          ordem: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          icone?: string | null
          id?: string
          nome: string
          ordem?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          icone?: string | null
          id?: string
          nome?: string
          ordem?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      clinicas: {
        Row: {
          ativo: boolean | null
          cidade: string | null
          created_at: string | null
          created_by: string | null
          documento: string | null
          email: string | null
          endereco: string | null
          horario_funcionamento: string | null
          id: string
          lat: number | null
          lng: number | null
          nome: string
          responsavel: string | null
          status: string | null
          uf: string | null
          updated_at: string | null
          updated_by: string | null
          whatsapp: string | null
        }
        Insert: {
          ativo?: boolean | null
          cidade?: string | null
          created_at?: string | null
          created_by?: string | null
          documento?: string | null
          email?: string | null
          endereco?: string | null
          horario_funcionamento?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          nome: string
          responsavel?: string | null
          status?: string | null
          uf?: string | null
          updated_at?: string | null
          updated_by?: string | null
          whatsapp?: string | null
        }
        Update: {
          ativo?: boolean | null
          cidade?: string | null
          created_at?: string | null
          created_by?: string | null
          documento?: string | null
          email?: string | null
          endereco?: string | null
          horario_funcionamento?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          nome?: string
          responsavel?: string | null
          status?: string | null
          uf?: string | null
          updated_at?: string | null
          updated_by?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      dentistas: {
        Row: {
          ativo: boolean | null
          clinica_id: string | null
          created_at: string | null
          created_by: string | null
          cro: string | null
          especialidades: string | null
          id: string
          nome: string
          updated_at: string | null
          updated_by: string | null
          usuario_id: string | null
        }
        Insert: {
          ativo?: boolean | null
          clinica_id?: string | null
          created_at?: string | null
          created_by?: string | null
          cro?: string | null
          especialidades?: string | null
          id?: string
          nome: string
          updated_at?: string | null
          updated_by?: string | null
          usuario_id?: string | null
        }
        Update: {
          ativo?: boolean | null
          clinica_id?: string | null
          created_at?: string | null
          created_by?: string | null
          cro?: string | null
          especialidades?: string | null
          id?: string
          nome?: string
          updated_at?: string | null
          updated_by?: string | null
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dentistas_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dentistas_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      ordens_servico: {
        Row: {
          cliente_id: string | null
          clinica_id: string | null
          created_at: string | null
          created_by: string | null
          data_confirmada: string | null
          data_solicitada: string | null
          dentista_id: string | null
          id: string
          observacoes_cliente: string | null
          observacoes_internas: string | null
          procedimento_id: string | null
          status: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          cliente_id?: string | null
          clinica_id?: string | null
          created_at?: string | null
          created_by?: string | null
          data_confirmada?: string | null
          data_solicitada?: string | null
          dentista_id?: string | null
          id?: string
          observacoes_cliente?: string | null
          observacoes_internas?: string | null
          procedimento_id?: string | null
          status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          cliente_id?: string | null
          clinica_id?: string | null
          created_at?: string | null
          created_by?: string | null
          data_confirmada?: string | null
          data_solicitada?: string | null
          dentista_id?: string | null
          id?: string
          observacoes_cliente?: string | null
          observacoes_internas?: string | null
          procedimento_id?: string | null
          status?: string | null
          updated_at?: string | null
          updated_by?: string | null
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
      procedimentos: {
        Row: {
          ativo: boolean | null
          categoria_id: string | null
          created_at: string | null
          created_by: string | null
          id: string
          nome: string
          observacoes: string | null
          preco_max: number | null
          preco_min: number | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          ativo?: boolean | null
          categoria_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          preco_max?: number | null
          preco_min?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          ativo?: boolean | null
          categoria_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          preco_max?: number | null
          preco_min?: number | null
          updated_at?: string | null
          updated_by?: string | null
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
      usuarios: {
        Row: {
          assinatura_status: string | null
          ativo: boolean | null
          auth_user_id: string | null
          cpf: string | null
          created_at: string | null
          created_by: string | null
          email: string
          id: string
          nome: string
          order_id: string | null
          role: string | null
          telefone: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          assinatura_status?: string | null
          ativo?: boolean | null
          auth_user_id?: string | null
          cpf?: string | null
          created_at?: string | null
          created_by?: string | null
          email: string
          id?: string
          nome: string
          order_id?: string | null
          role?: string | null
          telefone?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          assinatura_status?: string | null
          ativo?: boolean | null
          auth_user_id?: string | null
          cpf?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string
          id?: string
          nome?: string
          order_id?: string | null
          role?: string | null
          telefone?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      webhook_events: {
        Row: {
          error_message: string | null
          event: string | null
          id: string
          order_id: string | null
          payload: Json | null
          processed_at: string | null
          status: string | null
        }
        Insert: {
          error_message?: string | null
          event?: string | null
          id?: string
          order_id?: string | null
          payload?: Json | null
          processed_at?: string | null
          status?: string | null
        }
        Update: {
          error_message?: string | null
          event?: string | null
          id?: string
          order_id?: string | null
          payload?: Json | null
          processed_at?: string | null
          status?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin_user: {
        Args: { user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
