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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          activity_date: string
          activity_type: string
          client_id: string | null
          created_at: string
          description: string | null
          id: string
          is_demo: boolean
          lead_id: string | null
          next_contact_at: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          activity_date?: string
          activity_type?: string
          client_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_demo?: boolean
          lead_id?: string | null
          next_contact_at?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          activity_date?: string
          activity_type?: string
          client_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_demo?: boolean
          lead_id?: string | null
          next_contact_at?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activities_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          company_id: string | null
          created_at: string
          email: string | null
          id: string
          is_demo: boolean
          lead_id: string | null
          monthly_value: number | null
          name: string
          notes: string | null
          owner_name: string | null
          phone: string | null
          start_date: string | null
          status: string
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_demo?: boolean
          lead_id?: string | null
          monthly_value?: number | null
          name: string
          notes?: string | null
          owner_name?: string | null
          phone?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_demo?: boolean
          lead_id?: string | null
          monthly_value?: number | null
          name?: string
          notes?: string | null
          owner_name?: string | null
          phone?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          address: string | null
          address_number: string | null
          city: string | null
          cnpj: string | null
          created_at: string
          district: string | null
          email: string | null
          facebook: string | null
          id: string
          instagram: string | null
          is_demo: boolean
          name: string
          niche: string | null
          notes: string | null
          owner_name: string | null
          phone: string | null
          state: string | null
          sub_niche: string | null
          trade_name: string | null
          updated_at: string
          website: string | null
          whatsapp: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          address_number?: string | null
          city?: string | null
          cnpj?: string | null
          created_at?: string
          district?: string | null
          email?: string | null
          facebook?: string | null
          id?: string
          instagram?: string | null
          is_demo?: boolean
          name: string
          niche?: string | null
          notes?: string | null
          owner_name?: string | null
          phone?: string | null
          state?: string | null
          sub_niche?: string | null
          trade_name?: string | null
          updated_at?: string
          website?: string | null
          whatsapp?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          address_number?: string | null
          city?: string | null
          cnpj?: string | null
          created_at?: string
          district?: string | null
          email?: string | null
          facebook?: string | null
          id?: string
          instagram?: string | null
          is_demo?: boolean
          name?: string
          niche?: string | null
          notes?: string | null
          owner_name?: string | null
          phone?: string | null
          state?: string | null
          sub_niche?: string | null
          trade_name?: string | null
          updated_at?: string
          website?: string | null
          whatsapp?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      generated_prompts: {
        Row: {
          audience: string | null
          channel: string
          city: string | null
          company: string | null
          content: string
          created_at: string
          goal: string | null
          id: string
          niche: string | null
          pain: string | null
          service: string | null
          title: string
          tone: string | null
          user_id: string | null
        }
        Insert: {
          audience?: string | null
          channel?: string
          city?: string | null
          company?: string | null
          content: string
          created_at?: string
          goal?: string | null
          id?: string
          niche?: string | null
          pain?: string | null
          service?: string | null
          title: string
          tone?: string | null
          user_id?: string | null
        }
        Update: {
          audience?: string | null
          channel?: string
          city?: string | null
          company?: string | null
          content?: string
          created_at?: string
          goal?: string | null
          id?: string
          niche?: string | null
          pain?: string | null
          service?: string | null
          title?: string
          tone?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          city: string | null
          company_id: string | null
          company_name: string | null
          created_at: string
          district: string | null
          email: string | null
          estimated_value: number | null
          first_contact_at: string | null
          id: string
          instagram: string | null
          is_demo: boolean
          last_contact_at: string | null
          name: string
          next_contact_at: string | null
          niche: string | null
          notes: string | null
          owner_name: string | null
          phone: string | null
          source: string | null
          state: string | null
          status: string
          updated_at: string
          website: string | null
          whatsapp: string | null
        }
        Insert: {
          city?: string | null
          company_id?: string | null
          company_name?: string | null
          created_at?: string
          district?: string | null
          email?: string | null
          estimated_value?: number | null
          first_contact_at?: string | null
          id?: string
          instagram?: string | null
          is_demo?: boolean
          last_contact_at?: string | null
          name: string
          next_contact_at?: string | null
          niche?: string | null
          notes?: string | null
          owner_name?: string | null
          phone?: string | null
          source?: string | null
          state?: string | null
          status?: string
          updated_at?: string
          website?: string | null
          whatsapp?: string | null
        }
        Update: {
          city?: string | null
          company_id?: string | null
          company_name?: string | null
          created_at?: string
          district?: string | null
          email?: string | null
          estimated_value?: number | null
          first_contact_at?: string | null
          id?: string
          instagram?: string | null
          is_demo?: boolean
          last_contact_at?: string | null
          name?: string
          next_contact_at?: string | null
          niche?: string | null
          notes?: string | null
          owner_name?: string | null
          phone?: string | null
          source?: string | null
          state?: string | null
          status?: string
          updated_at?: string
          website?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      niche_challenges: {
        Row: {
          content: string
          created_at: string
          id: string
          niche_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          niche_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          niche_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "niche_challenges_niche_id_fkey"
            columns: ["niche_id"]
            isOneToOne: false
            referencedRelation: "niches"
            referencedColumns: ["id"]
          },
        ]
      }
      niche_needs: {
        Row: {
          content: string
          created_at: string
          id: string
          niche_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          niche_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          niche_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "niche_needs_niche_id_fkey"
            columns: ["niche_id"]
            isOneToOne: false
            referencedRelation: "niches"
            referencedColumns: ["id"]
          },
        ]
      }
      niche_objections: {
        Row: {
          answer: string | null
          created_at: string
          id: string
          is_demo: boolean
          next_step: string | null
          niche_id: string | null
          objection: string
          question: string | null
          updated_at: string
        }
        Insert: {
          answer?: string | null
          created_at?: string
          id?: string
          is_demo?: boolean
          next_step?: string | null
          niche_id?: string | null
          objection: string
          question?: string | null
          updated_at?: string
        }
        Update: {
          answer?: string | null
          created_at?: string
          id?: string
          is_demo?: boolean
          next_step?: string | null
          niche_id?: string | null
          objection?: string
          question?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "niche_objections_niche_id_fkey"
            columns: ["niche_id"]
            isOneToOne: false
            referencedRelation: "niches"
            referencedColumns: ["id"]
          },
        ]
      }
      niche_pains: {
        Row: {
          content: string
          created_at: string
          id: string
          niche_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          niche_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          niche_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "niche_pains_niche_id_fkey"
            columns: ["niche_id"]
            isOneToOne: false
            referencedRelation: "niches"
            referencedColumns: ["id"]
          },
        ]
      }
      niches: {
        Row: {
          acquisition_channels: string | null
          audience: string | null
          category: string | null
          created_at: string
          description: string | null
          goals: string | null
          id: string
          is_demo: boolean
          name: string
          opportunities: string | null
          recommended_services: string | null
          sales_arguments: string | null
          solution: string | null
          updated_at: string
        }
        Insert: {
          acquisition_channels?: string | null
          audience?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          goals?: string | null
          id?: string
          is_demo?: boolean
          name: string
          opportunities?: string | null
          recommended_services?: string | null
          sales_arguments?: string | null
          solution?: string | null
          updated_at?: string
        }
        Update: {
          acquisition_channels?: string | null
          audience?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          goals?: string | null
          id?: string
          is_demo?: boolean
          name?: string
          opportunities?: string | null
          recommended_services?: string | null
          sales_arguments?: string | null
          solution?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      pricing_calculations: {
        Row: {
          commission_percent: number
          cost: number
          created_at: string
          discount_percent: number
          extra_costs: number
          hourly_rate: number
          hours: number
          id: string
          margin: number
          min_price: number
          name: string
          profit: number
          recommended_price: number
          sale_price: number
          service_id: string | null
          target_margin: number
          tax_percent: number
          tools_cost: number
          total_cost: number
          updated_at: string
        }
        Insert: {
          commission_percent?: number
          cost?: number
          created_at?: string
          discount_percent?: number
          extra_costs?: number
          hourly_rate?: number
          hours?: number
          id?: string
          margin?: number
          min_price?: number
          name: string
          profit?: number
          recommended_price?: number
          sale_price?: number
          service_id?: string | null
          target_margin?: number
          tax_percent?: number
          tools_cost?: number
          total_cost?: number
          updated_at?: string
        }
        Update: {
          commission_percent?: number
          cost?: number
          created_at?: string
          discount_percent?: number
          extra_costs?: number
          hourly_rate?: number
          hours?: number
          id?: string
          margin?: number
          min_price?: number
          name?: string
          profit?: number
          recommended_price?: number
          sale_price?: number
          service_id?: string | null
          target_margin?: number
          tax_percent?: number
          tools_cost?: number
          total_cost?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pricing_calculations_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          job_title: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id: string
          job_title?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          job_title?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      prompt_templates: {
        Row: {
          channel: string
          created_at: string
          id: string
          is_demo: boolean
          name: string
          template: string
          tone: string
          updated_at: string
        }
        Insert: {
          channel?: string
          created_at?: string
          id?: string
          is_demo?: boolean
          name: string
          template: string
          tone?: string
          updated_at?: string
        }
        Update: {
          channel?: string
          created_at?: string
          id?: string
          is_demo?: boolean
          name?: string
          template?: string
          tone?: string
          updated_at?: string
        }
        Relationships: []
      }
      proposals: {
        Row: {
          bottlenecks: string | null
          client_name: string
          company: string | null
          created_at: string
          discount_percent: number
          id: string
          items: Json
          niche_id: string | null
          notes: string | null
          number: number
          solution: string | null
          total: number
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          bottlenecks?: string | null
          client_name: string
          company?: string | null
          created_at?: string
          discount_percent?: number
          id?: string
          items?: Json
          niche_id?: string | null
          notes?: string | null
          number?: number
          solution?: string | null
          total?: number
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          bottlenecks?: string | null
          client_name?: string
          company?: string | null
          created_at?: string
          discount_percent?: number
          id?: string
          items?: Json
          niche_id?: string | null
          notes?: string | null
          number?: number
          solution?: string | null
          total?: number
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proposals_niche_id_fkey"
            columns: ["niche_id"]
            isOneToOne: false
            referencedRelation: "niches"
            referencedColumns: ["id"]
          },
        ]
      }
      receipts: {
        Row: {
          amount: number
          client_document: string | null
          client_name: string
          created_at: string
          description: string | null
          id: string
          number: number
          paid_at: string
          payment_method: string
          updated_at: string
        }
        Insert: {
          amount?: number
          client_document?: string | null
          client_name: string
          created_at?: string
          description?: string | null
          id?: string
          number?: number
          paid_at?: string
          payment_method?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          client_document?: string | null
          client_name?: string
          created_at?: string
          description?: string | null
          id?: string
          number?: number
          paid_at?: string
          payment_method?: string
          updated_at?: string
        }
        Relationships: []
      }
      service_package_items: {
        Row: {
          created_at: string
          id: string
          package_id: string
          quantity: number
          service_id: string | null
          service_name: string
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          package_id: string
          quantity?: number
          service_id?: string | null
          service_name: string
          unit_price?: number
        }
        Update: {
          created_at?: string
          id?: string
          package_id?: string
          quantity?: number
          service_id?: string | null
          service_name?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "service_package_items_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "service_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_package_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_packages: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          discount_percent: number
          final_value: number
          id: string
          installments: number
          is_demo: boolean
          name: string
          payment_type: string
          savings: number
          subtotal: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          discount_percent?: number
          final_value?: number
          id?: string
          installments?: number
          is_demo?: boolean
          name: string
          payment_type?: string
          savings?: number
          subtotal?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          discount_percent?: number
          final_value?: number
          id?: string
          installments?: number
          is_demo?: boolean
          name?: string
          payment_type?: string
          savings?: number
          subtotal?: number
          updated_at?: string
        }
        Relationships: []
      }
      service_prices: {
        Row: {
          cost: number | null
          created_at: string
          id: string
          min_price: number | null
          price: number
          promo_price: number | null
          service_id: string
          valid_from: string
        }
        Insert: {
          cost?: number | null
          created_at?: string
          id?: string
          min_price?: number | null
          price: number
          promo_price?: number | null
          service_id: string
          valid_from?: string
        }
        Update: {
          cost?: number | null
          created_at?: string
          id?: string
          min_price?: number | null
          price?: number
          promo_price?: number | null
          service_id?: string
          valid_from?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_prices_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          active: boolean
          category: string
          cost: number
          created_at: string
          description: string | null
          id: string
          is_demo: boolean
          margin: number | null
          min_price: number | null
          name: string
          periodicity: string
          price: number
          promo_price: number | null
          setup_fee: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          category?: string
          cost?: number
          created_at?: string
          description?: string | null
          id?: string
          is_demo?: boolean
          margin?: number | null
          min_price?: number | null
          name: string
          periodicity?: string
          price?: number
          promo_price?: number | null
          setup_fee?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          category?: string
          cost?: number
          created_at?: string
          description?: string | null
          id?: string
          is_demo?: boolean
          margin?: number | null
          min_price?: number | null
          name?: string
          periodicity?: string
          price?: number
          promo_price?: number | null
          setup_fee?: number
          updated_at?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          address: string | null
          bank_details: string | null
          cnpj: string | null
          company_name: string
          created_at: string
          document_footer: string | null
          email: string | null
          id: string
          instagram: string | null
          logo_url: string | null
          phone: string | null
          pix_key: string | null
          updated_at: string
          website: string | null
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          bank_details?: string | null
          cnpj?: string | null
          company_name?: string
          created_at?: string
          document_footer?: string | null
          email?: string | null
          id?: string
          instagram?: string | null
          logo_url?: string | null
          phone?: string | null
          pix_key?: string | null
          updated_at?: string
          website?: string | null
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          bank_details?: string | null
          cnpj?: string | null
          company_name?: string
          created_at?: string
          document_footer?: string | null
          email?: string | null
          id?: string
          instagram?: string | null
          logo_url?: string | null
          phone?: string | null
          pix_key?: string | null
          updated_at?: string
          website?: string | null
          whatsapp?: string | null
        }
        Relationships: []
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "administrador" | "comercial" | "financeiro" | "usuario"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["administrador", "comercial", "financeiro", "usuario"],
    },
  },
} as const
