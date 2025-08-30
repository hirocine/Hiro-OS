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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: unknown | null
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string
          user_agent: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      equipment_categories: {
        Row: {
          category: string
          created_at: string | null
          created_by: string | null
          id: string
          is_custom: boolean | null
          subcategory: string
        }
        Insert: {
          category: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_custom?: boolean | null
          subcategory: string
        }
        Update: {
          category?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_custom?: boolean | null
          subcategory?: string
        }
        Relationships: []
      }
      equipments: {
        Row: {
          brand: string
          category: string
          created_at: string
          current_borrower: string | null
          current_loan_id: string | null
          custom_category: string | null
          depreciated_value: number | null
          description: string | null
          id: string
          image: string | null
          invoice: string | null
          item_type: string
          last_loan_date: string | null
          last_maintenance: string | null
          name: string
          parent_id: string | null
          patrimony_number: string | null
          purchase_date: string | null
          receive_date: string | null
          serial_number: string | null
          status: string
          store: string | null
          subcategory: string | null
          updated_at: string
          value: number | null
        }
        Insert: {
          brand: string
          category: string
          created_at?: string
          current_borrower?: string | null
          current_loan_id?: string | null
          custom_category?: string | null
          depreciated_value?: number | null
          description?: string | null
          id?: string
          image?: string | null
          invoice?: string | null
          item_type?: string
          last_loan_date?: string | null
          last_maintenance?: string | null
          name: string
          parent_id?: string | null
          patrimony_number?: string | null
          purchase_date?: string | null
          receive_date?: string | null
          serial_number?: string | null
          status?: string
          store?: string | null
          subcategory?: string | null
          updated_at?: string
          value?: number | null
        }
        Update: {
          brand?: string
          category?: string
          created_at?: string
          current_borrower?: string | null
          current_loan_id?: string | null
          custom_category?: string | null
          depreciated_value?: number | null
          description?: string | null
          id?: string
          image?: string | null
          invoice?: string | null
          item_type?: string
          last_loan_date?: string | null
          last_maintenance?: string | null
          name?: string
          parent_id?: string | null
          patrimony_number?: string | null
          purchase_date?: string | null
          receive_date?: string | null
          serial_number?: string | null
          status?: string
          store?: string | null
          subcategory?: string | null
          updated_at?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "equipments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "equipments"
            referencedColumns: ["id"]
          },
        ]
      }
      loans: {
        Row: {
          actual_return_date: string | null
          borrower_email: string | null
          borrower_name: string
          borrower_phone: string | null
          created_at: string
          department: string | null
          equipment_id: string
          equipment_name: string
          expected_return_date: string
          id: string
          loan_date: string
          notes: string | null
          project: string | null
          return_condition: string | null
          return_notes: string | null
          status: string
          updated_at: string
        }
        Insert: {
          actual_return_date?: string | null
          borrower_email?: string | null
          borrower_name: string
          borrower_phone?: string | null
          created_at?: string
          department?: string | null
          equipment_id: string
          equipment_name: string
          expected_return_date: string
          id?: string
          loan_date: string
          notes?: string | null
          project?: string | null
          return_condition?: string | null
          return_notes?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          actual_return_date?: string | null
          borrower_email?: string | null
          borrower_name?: string
          borrower_phone?: string | null
          created_at?: string
          department?: string | null
          equipment_id?: string
          equipment_name?: string
          expected_return_date?: string
          id?: string
          loan_date?: string
          notes?: string | null
          project?: string | null
          return_condition?: string | null
          return_notes?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "loans_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipments"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          description: string | null
          entity_id: string | null
          id: string
          related_entity: string | null
          responsible_user_email: string | null
          responsible_user_id: string | null
          responsible_user_name: string | null
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          entity_id?: string | null
          id?: string
          related_entity?: string | null
          responsible_user_email?: string | null
          responsible_user_id?: string | null
          responsible_user_name?: string | null
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          entity_id?: string | null
          id?: string
          related_entity?: string | null
          responsible_user_email?: string | null
          responsible_user_id?: string | null
          responsible_user_name?: string | null
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          department: string | null
          display_name: string | null
          id: string
          position: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          display_name?: string | null
          id?: string
          position?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          display_name?: string | null
          id?: string
          position?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          actual_end_date: string | null
          company: string | null
          created_at: string
          department: string | null
          description: string | null
          equipment_count: number | null
          expected_end_date: string
          id: string
          loan_ids: string[] | null
          name: string
          notes: string | null
          project_name: string | null
          project_number: string | null
          recording_type: string | null
          responsible_email: string | null
          responsible_name: string
          responsible_user_id: string | null
          separation_date: string | null
          start_date: string
          status: string
          step: string
          step_history: Json | null
          updated_at: string
          withdrawal_date: string | null
        }
        Insert: {
          actual_end_date?: string | null
          company?: string | null
          created_at?: string
          department?: string | null
          description?: string | null
          equipment_count?: number | null
          expected_end_date: string
          id?: string
          loan_ids?: string[] | null
          name: string
          notes?: string | null
          project_name?: string | null
          project_number?: string | null
          recording_type?: string | null
          responsible_email?: string | null
          responsible_name: string
          responsible_user_id?: string | null
          separation_date?: string | null
          start_date: string
          status?: string
          step?: string
          step_history?: Json | null
          updated_at?: string
          withdrawal_date?: string | null
        }
        Update: {
          actual_end_date?: string | null
          company?: string | null
          created_at?: string
          department?: string | null
          description?: string | null
          equipment_count?: number | null
          expected_end_date?: string
          id?: string
          loan_ids?: string[] | null
          name?: string
          notes?: string | null
          project_name?: string | null
          project_number?: string | null
          recording_type?: string | null
          responsible_email?: string | null
          responsible_name?: string
          responsible_user_id?: string | null
          separation_date?: string | null
          start_date?: string
          status?: string
          step?: string
          step_history?: Json | null
          updated_at?: string
          withdrawal_date?: string | null
        }
        Relationships: []
      }
      saved_filters: {
        Row: {
          created_at: string
          filters: Json
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          filters: Json
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          filters?: Json
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_notification_status: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          notification_id: string
          read_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          notification_id: string
          read_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          notification_id?: string
          read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_notification_status_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_notification_for_all_users: {
        Args: {
          _description?: string
          _entity_id?: string
          _related_entity?: string
          _responsible_user_id?: string
          _title: string
          _type?: string
        }
        Returns: string
      }
      deactivate_user: {
        Args: { _user_id: string }
        Returns: boolean
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_users_for_admin: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string
          department: string
          display_name: string
          email: string
          email_confirmed_at: string
          id: string
          is_active: boolean
          last_sign_in_at: string
          position: string
          role: Database["public"]["Enums"]["app_role"]
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      log_audit_entry: {
        Args: {
          _action: string
          _new_values?: Json
          _old_values?: Json
          _record_id?: string
          _table_name: string
        }
        Returns: undefined
      }
      mark_all_notifications_as_read: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      mark_notification_as_read: {
        Args: { _notification_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
