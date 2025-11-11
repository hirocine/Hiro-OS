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
          ip_address: unknown
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
          ip_address?: unknown
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
          ip_address?: unknown
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
      borrower_contacts: {
        Row: {
          borrower_email: string | null
          borrower_phone: string | null
          created_at: string | null
          created_by: string | null
          department: string | null
          id: string
          loan_id: string
          updated_at: string | null
        }
        Insert: {
          borrower_email?: string | null
          borrower_phone?: string | null
          created_at?: string | null
          created_by?: string | null
          department?: string | null
          id?: string
          loan_id: string
          updated_at?: string | null
        }
        Update: {
          borrower_email?: string | null
          borrower_phone?: string | null
          created_at?: string | null
          created_by?: string | null
          department?: string | null
          id?: string
          loan_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "borrower_contacts_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_borrower_contacts_loan"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
        ]
      }
      company_policies: {
        Row: {
          category: string | null
          content: string
          created_at: string | null
          created_by: string | null
          display_order: number | null
          icon_url: string | null
          id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string | null
          created_by?: string | null
          display_order?: number | null
          icon_url?: string | null
          id?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string | null
          created_by?: string | null
          display_order?: number | null
          icon_url?: string | null
          id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      equipment_categories: {
        Row: {
          category: string
          category_order: number | null
          created_at: string | null
          created_by: string | null
          icon: string | null
          id: string
          is_custom: boolean | null
          subcategory: string | null
          subcategory_order: number | null
        }
        Insert: {
          category: string
          category_order?: number | null
          created_at?: string | null
          created_by?: string | null
          icon?: string | null
          id?: string
          is_custom?: boolean | null
          subcategory?: string | null
          subcategory_order?: number | null
        }
        Update: {
          category?: string
          category_order?: number | null
          created_at?: string | null
          created_by?: string | null
          icon?: string | null
          id?: string
          is_custom?: boolean | null
          subcategory?: string | null
          subcategory_order?: number | null
        }
        Relationships: []
      }
      equipments: {
        Row: {
          brand: string
          capacity: number | null
          category: string | null
          created_at: string
          current_borrower: string | null
          current_loan_id: string | null
          custom_category: string | null
          depreciated_value: number | null
          description: string | null
          display_order: number | null
          expected_return_date: string | null
          id: string
          image: string | null
          internal_user_id: string | null
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
          simplified_status: string | null
          status: string
          store: string | null
          subcategory: string | null
          updated_at: string
          value: number | null
        }
        Insert: {
          brand: string
          capacity?: number | null
          category?: string | null
          created_at?: string
          current_borrower?: string | null
          current_loan_id?: string | null
          custom_category?: string | null
          depreciated_value?: number | null
          description?: string | null
          display_order?: number | null
          expected_return_date?: string | null
          id?: string
          image?: string | null
          internal_user_id?: string | null
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
          simplified_status?: string | null
          status?: string
          store?: string | null
          subcategory?: string | null
          updated_at?: string
          value?: number | null
        }
        Update: {
          brand?: string
          capacity?: number | null
          category?: string | null
          created_at?: string
          current_borrower?: string | null
          current_loan_id?: string | null
          custom_category?: string | null
          depreciated_value?: number | null
          description?: string | null
          display_order?: number | null
          expected_return_date?: string | null
          id?: string
          image?: string | null
          internal_user_id?: string | null
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
          simplified_status?: string | null
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
          {
            foreignKeyName: "fk_equipments_parent"
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
          borrower_name: string
          created_at: string
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
          borrower_name: string
          created_at?: string
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
          borrower_name?: string
          created_at?: string
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
            foreignKeyName: "fk_loans_equipment"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipments"
            referencedColumns: ["id"]
          },
        ]
      }
      login_attempts: {
        Row: {
          attempt_time: string | null
          failure_reason: string | null
          id: string
          ip_address: unknown
          success: boolean | null
          user_agent: string | null
          user_email: string | null
        }
        Insert: {
          attempt_time?: string | null
          failure_reason?: string | null
          id?: string
          ip_address: unknown
          success?: boolean | null
          user_agent?: string | null
          user_email?: string | null
        }
        Update: {
          attempt_time?: string | null
          failure_reason?: string | null
          id?: string
          ip_address?: unknown
          success?: boolean | null
          user_agent?: string | null
          user_email?: string | null
        }
        Relationships: []
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
      platform_accesses: {
        Row: {
          category: Database["public"]["Enums"]["platform_category"] | null
          created_at: string | null
          encrypted_password: string
          id: string
          is_active: boolean
          is_favorite: boolean | null
          notes: string | null
          platform_icon_url: string | null
          platform_name: string
          platform_url: string | null
          updated_at: string | null
          user_id: string
          username: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["platform_category"] | null
          created_at?: string | null
          encrypted_password: string
          id?: string
          is_active?: boolean
          is_favorite?: boolean | null
          notes?: string | null
          platform_icon_url?: string | null
          platform_name: string
          platform_url?: string | null
          updated_at?: string | null
          user_id: string
          username: string
        }
        Update: {
          category?: Database["public"]["Enums"]["platform_category"] | null
          created_at?: string | null
          encrypted_password?: string
          id?: string
          is_active?: boolean
          is_favorite?: boolean | null
          notes?: string | null
          platform_icon_url?: string | null
          platform_name?: string
          platform_url?: string | null
          updated_at?: string | null
          user_id?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_accesses_profile_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
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
          completed_by_user_id: string | null
          completed_by_user_name: string | null
          completed_time: string | null
          created_at: string
          created_by_user_id: string | null
          created_by_user_name: string | null
          department: string | null
          description: string | null
          equipment_count: number | null
          expected_end_date: string
          id: string
          loan_ids: string[] | null
          name: string
          notes: string | null
          office_receipt_time: string | null
          office_receipt_user_id: string | null
          office_receipt_user_name: string | null
          project_name: string | null
          project_number: string | null
          recording_type: string | null
          responsible_email: string | null
          responsible_name: string
          responsible_user_id: string | null
          return_condition: string | null
          return_notes: string | null
          separation_date: string | null
          separation_time: string | null
          separation_user_id: string | null
          separation_user_name: string | null
          start_date: string
          status: string
          step: string
          step_history: Json | null
          updated_at: string
          verification_time: string | null
          verification_user_id: string | null
          verification_user_name: string | null
          withdrawal_date: string | null
          withdrawal_notes: string | null
          withdrawal_time: string | null
          withdrawal_user_id: string | null
          withdrawal_user_name: string | null
        }
        Insert: {
          actual_end_date?: string | null
          company?: string | null
          completed_by_user_id?: string | null
          completed_by_user_name?: string | null
          completed_time?: string | null
          created_at?: string
          created_by_user_id?: string | null
          created_by_user_name?: string | null
          department?: string | null
          description?: string | null
          equipment_count?: number | null
          expected_end_date: string
          id?: string
          loan_ids?: string[] | null
          name: string
          notes?: string | null
          office_receipt_time?: string | null
          office_receipt_user_id?: string | null
          office_receipt_user_name?: string | null
          project_name?: string | null
          project_number?: string | null
          recording_type?: string | null
          responsible_email?: string | null
          responsible_name: string
          responsible_user_id?: string | null
          return_condition?: string | null
          return_notes?: string | null
          separation_date?: string | null
          separation_time?: string | null
          separation_user_id?: string | null
          separation_user_name?: string | null
          start_date: string
          status?: string
          step?: string
          step_history?: Json | null
          updated_at?: string
          verification_time?: string | null
          verification_user_id?: string | null
          verification_user_name?: string | null
          withdrawal_date?: string | null
          withdrawal_notes?: string | null
          withdrawal_time?: string | null
          withdrawal_user_id?: string | null
          withdrawal_user_name?: string | null
        }
        Update: {
          actual_end_date?: string | null
          company?: string | null
          completed_by_user_id?: string | null
          completed_by_user_name?: string | null
          completed_time?: string | null
          created_at?: string
          created_by_user_id?: string | null
          created_by_user_name?: string | null
          department?: string | null
          description?: string | null
          equipment_count?: number | null
          expected_end_date?: string
          id?: string
          loan_ids?: string[] | null
          name?: string
          notes?: string | null
          office_receipt_time?: string | null
          office_receipt_user_id?: string | null
          office_receipt_user_name?: string | null
          project_name?: string | null
          project_number?: string | null
          recording_type?: string | null
          responsible_email?: string | null
          responsible_name?: string
          responsible_user_id?: string | null
          return_condition?: string | null
          return_notes?: string | null
          separation_date?: string | null
          separation_time?: string | null
          separation_user_id?: string | null
          separation_user_name?: string | null
          start_date?: string
          status?: string
          step?: string
          step_history?: Json | null
          updated_at?: string
          verification_time?: string | null
          verification_user_id?: string | null
          verification_user_name?: string | null
          withdrawal_date?: string | null
          withdrawal_notes?: string | null
          withdrawal_time?: string | null
          withdrawal_user_id?: string | null
          withdrawal_user_name?: string | null
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
      security_alerts: {
        Row: {
          alert_type: string
          created_at: string | null
          description: string | null
          id: string
          metadata: Json | null
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          title: string
        }
        Insert: {
          alert_type: string
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity: string
          title: string
        }
        Update: {
          alert_type?: string
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          title?: string
        }
        Relationships: []
      }
      ssd_allocations: {
        Row: {
          allocated_gb: number
          created_at: string
          id: string
          project_name: string
          ssd_id: string
          updated_at: string
        }
        Insert: {
          allocated_gb: number
          created_at?: string
          id?: string
          project_name: string
          ssd_id: string
          updated_at?: string
        }
        Update: {
          allocated_gb?: number
          created_at?: string
          id?: string
          project_name?: string
          ssd_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_ssd_allocations_ssd"
            columns: ["ssd_id"]
            isOneToOne: false
            referencedRelation: "equipments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ssd_allocations_ssd_id_fkey"
            columns: ["ssd_id"]
            isOneToOne: false
            referencedRelation: "equipments"
            referencedColumns: ["id"]
          },
        ]
      }
      ssd_external_loans: {
        Row: {
          actual_return_date: string | null
          borrower_name: string
          created_at: string
          expected_return_date: string
          id: string
          loan_date: string
          ssd_id: string
          updated_at: string
        }
        Insert: {
          actual_return_date?: string | null
          borrower_name: string
          created_at?: string
          expected_return_date: string
          id?: string
          loan_date: string
          ssd_id: string
          updated_at?: string
        }
        Update: {
          actual_return_date?: string | null
          borrower_name?: string
          created_at?: string
          expected_return_date?: string
          id?: string
          loan_date?: string
          ssd_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_ssd_external_loans_ssd"
            columns: ["ssd_id"]
            isOneToOne: false
            referencedRelation: "equipments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ssd_external_loans_ssd_id_fkey"
            columns: ["ssd_id"]
            isOneToOne: false
            referencedRelation: "equipments"
            referencedColumns: ["id"]
          },
        ]
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
      audit_data_access: {
        Args: never
        Returns: {
          policy_name: string
          potential_exposure: string
          severity: string
          table_name: string
        }[]
      }
      check_login_rate_limit: {
        Args: { _ip_address: unknown; _user_email?: string }
        Returns: Json
      }
      check_password_security: {
        Args: never
        Returns: {
          priority: string
          recommendation: string
          setting_name: string
          status: string
        }[]
      }
      check_password_security_settings: {
        Args: never
        Returns: {
          current_status: string
          priority: string
          recommendation: string
          setting_name: string
        }[]
      }
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
      create_security_alert: {
        Args: {
          _alert_type: string
          _description?: string
          _metadata?: Json
          _severity: string
          _title: string
        }
        Returns: string
      }
      deactivate_user: { Args: { _user_id: string }; Returns: boolean }
      detect_suspicious_activity: { Args: never; Returns: undefined }
      finalize_security_improvements: { Args: never; Returns: Json }
      get_current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_equipment_project_count: {
        Args: { equipment_id: string }
        Returns: number
      }
      get_loan_contact_info: {
        Args: { loan_id: string }
        Returns: {
          borrower_email: string
          borrower_phone: string
          department: string
        }[]
      }
      get_project_equipment: {
        Args: { _project_id: string }
        Returns: {
          equipment_brand: string
          equipment_category: string
          equipment_current_borrower: string
          equipment_current_loan_id: string
          equipment_custom_category: string
          equipment_depreciated_value: number
          equipment_description: string
          equipment_id: string
          equipment_image: string
          equipment_invoice: string
          equipment_item_type: string
          equipment_last_loan_date: string
          equipment_last_maintenance: string
          equipment_name: string
          equipment_parent_id: string
          equipment_patrimony_number: string
          equipment_purchase_date: string
          equipment_receive_date: string
          equipment_serial_number: string
          equipment_status: string
          equipment_store: string
          equipment_subcategory: string
          equipment_value: number
          loan_borrower_name: string
          loan_date: string
          loan_expected_return_date: string
          loan_id: string
          loan_status: string
        }[]
      }
      get_project_loans_with_fallback: {
        Args: { _project_id: string }
        Returns: {
          borrower_name: string
          equipment_id: string
          equipment_name: string
          expected_return_date: string
          loan_date: string
          loan_id: string
          status: string
        }[]
      }
      get_safe_equipment_list: {
        Args: never
        Returns: {
          brand: string
          category: string
          created_at: string
          current_borrower: string
          current_loan_id: string
          custom_category: string
          depreciated_value: number
          description: string
          id: string
          image: string
          invoice: string
          item_type: string
          last_loan_date: string
          last_maintenance: string
          name: string
          parent_id: string
          patrimony_number: string
          purchase_date: string
          receive_date: string
          serial_number: string
          simplified_status: string
          status: string
          store: string
          subcategory: string
          updated_at: string
          value: number
        }[]
      }
      get_security_dashboard: { Args: never; Returns: Json }
      get_users_for_admin: {
        Args: never
        Returns: {
          avatar_url: string
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
          user_metadata: Json
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_storage_device: { Args: { _equipment_id: string }; Returns: boolean }
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
      log_login_attempt: {
        Args: {
          _failure_reason?: string
          _ip_address: unknown
          _success: boolean
          _user_agent?: string
          _user_email: string
        }
        Returns: undefined
      }
      log_unauthorized_access_attempt: {
        Args: {
          _attempted_action: string
          _record_id: string
          _table_name: string
        }
        Returns: undefined
      }
      manual_sync_equipment_status: { Args: never; Returns: undefined }
      mark_all_notifications_as_read: { Args: never; Returns: number }
      mark_notification_as_read: {
        Args: { _notification_id: string }
        Returns: undefined
      }
      monitor_contact_access: { Args: never; Returns: undefined }
      run_complete_security_scan: {
        Args: never
        Returns: {
          critical_issues: number
          high_issues: number
          low_issues: number
          medium_issues: number
          scan_id: string
          scan_summary: Json
          scan_timestamp: string
          vulnerabilities_found: number
        }[]
      }
      run_security_maintenance: { Args: never; Returns: undefined }
      sanitize_audit_logs: { Args: never; Returns: undefined }
      user_can_access_equipment: {
        Args: { equipment_id: string }
        Returns: boolean
      }
      user_can_access_equipment_details: {
        Args: { equipment_id: string }
        Returns: {
          access_reason: string
          can_edit: boolean
          can_view_commercial: boolean
          can_view_financial: boolean
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "user"
      platform_category:
        | "cloud"
        | "ai"
        | "references"
        | "social_media"
        | "site"
        | "software"
        | "music"
        | "stock"
        | "other"
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
      platform_category: [
        "cloud",
        "ai",
        "references",
        "social_media",
        "site",
        "software",
        "music",
        "stock",
        "other",
      ],
    },
  },
} as const
