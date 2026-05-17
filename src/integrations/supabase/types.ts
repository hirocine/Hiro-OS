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
      _internal_config: {
        Row: {
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      audiovisual_projects: {
        Row: {
          actual_end_date: string | null
          company: string | null
          created_at: string
          created_by: string | null
          created_by_name: string | null
          deadline: string | null
          description: string | null
          id: string
          logo_url: string | null
          name: string
          responsible_user_id: string | null
          responsible_user_name: string | null
          status: string
          updated_at: string
        }
        Insert: {
          actual_end_date?: string | null
          company?: string | null
          created_at?: string
          created_by?: string | null
          created_by_name?: string | null
          deadline?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          name: string
          responsible_user_id?: string | null
          responsible_user_name?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          actual_end_date?: string | null
          company?: string | null
          created_at?: string
          created_by?: string | null
          created_by_name?: string | null
          deadline?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          responsible_user_id?: string | null
          responsible_user_name?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
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
      av_project_sections: {
        Row: {
          created_at: string
          display_order: number
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          display_order?: number
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      av_project_steps: {
        Row: {
          created_at: string
          deadline: string | null
          display_order: number
          id: string
          notes: string | null
          project_id: string
          responsible_user_id: string | null
          responsible_user_name: string | null
          section_id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deadline?: string | null
          display_order?: number
          id?: string
          notes?: string | null
          project_id: string
          responsible_user_id?: string | null
          responsible_user_name?: string | null
          section_id: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deadline?: string | null
          display_order?: number
          id?: string
          notes?: string | null
          project_id?: string
          responsible_user_id?: string | null
          responsible_user_name?: string | null
          section_id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "av_project_steps_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "audiovisual_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "av_project_steps_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "av_project_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      av_project_substeps: {
        Row: {
          created_at: string
          deadline: string | null
          display_order: number
          id: string
          is_completed: boolean
          responsible_user_id: string | null
          responsible_user_name: string | null
          step_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deadline?: string | null
          display_order?: number
          id?: string
          is_completed?: boolean
          responsible_user_id?: string | null
          responsible_user_name?: string | null
          step_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deadline?: string | null
          display_order?: number
          id?: string
          is_completed?: boolean
          responsible_user_id?: string | null
          responsible_user_name?: string | null
          step_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "av_project_substeps_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "av_project_steps"
            referencedColumns: ["id"]
          },
        ]
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
      cash_flow_projections: {
        Row: {
          created_at: string | null
          current_balance: number | null
          expenses: number | null
          id: number
          income: number | null
          net_cash_flow: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_balance?: number | null
          expenses?: number | null
          id: number
          income?: number | null
          net_cash_flow?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_balance?: number | null
          expenses?: number | null
          id?: number
          income?: number | null
          net_cash_flow?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      chat_conversations: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          last_message_at: string | null
          name: string | null
          slug: string | null
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          last_message_at?: string | null
          name?: string | null
          slug?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          last_message_at?: string | null
          name?: string | null
          slug?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      chat_members: {
        Row: {
          conversation_id: string
          joined_at: string
          last_read_at: string | null
          last_read_message_id: string | null
          muted: boolean
          role: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          joined_at?: string
          last_read_at?: string | null
          last_read_message_id?: string | null
          muted?: boolean
          role?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          joined_at?: string
          last_read_at?: string | null
          last_read_message_id?: string | null
          muted?: boolean
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_members_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          body: string
          conversation_id: string
          created_at: string
          deleted_at: string | null
          edited_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          body: string
          conversation_id: string
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
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
      contracts: {
        Row: {
          completed_at: string | null
          contract_class: string
          expires_at: string | null
          id: string
          imported_at: string
          linked_at: string | null
          linked_by: string | null
          linked_client_id: string | null
          linked_client_name: string | null
          linked_project_id: string | null
          linked_project_name: string | null
          linked_supplier_id: string | null
          linked_supplier_name: string | null
          notes: string | null
          party_type: string
          recurrence: Json | null
          sent_at: string | null
          signed_pdf_url: string | null
          signers: Json
          status: string
          title: string
          updated_at: string
          updated_by: string | null
          value_brl: number | null
          zapsign_created_at: string
          zapsign_description: string | null
          zapsign_doc_token: string
          zapsign_doc_url: string
        }
        Insert: {
          completed_at?: string | null
          contract_class?: string
          expires_at?: string | null
          id?: string
          imported_at?: string
          linked_at?: string | null
          linked_by?: string | null
          linked_client_id?: string | null
          linked_client_name?: string | null
          linked_project_id?: string | null
          linked_project_name?: string | null
          linked_supplier_id?: string | null
          linked_supplier_name?: string | null
          notes?: string | null
          party_type?: string
          recurrence?: Json | null
          sent_at?: string | null
          signed_pdf_url?: string | null
          signers?: Json
          status: string
          title: string
          updated_at?: string
          updated_by?: string | null
          value_brl?: number | null
          zapsign_created_at: string
          zapsign_description?: string | null
          zapsign_doc_token: string
          zapsign_doc_url: string
        }
        Update: {
          completed_at?: string | null
          contract_class?: string
          expires_at?: string | null
          id?: string
          imported_at?: string
          linked_at?: string | null
          linked_by?: string | null
          linked_client_id?: string | null
          linked_client_name?: string | null
          linked_project_id?: string | null
          linked_project_name?: string | null
          linked_supplier_id?: string | null
          linked_supplier_name?: string | null
          notes?: string | null
          party_type?: string
          recurrence?: Json | null
          sent_at?: string | null
          signed_pdf_url?: string | null
          signers?: Json
          status?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
          value_brl?: number | null
          zapsign_created_at?: string
          zapsign_description?: string | null
          zapsign_doc_token?: string
          zapsign_doc_url?: string
        }
        Relationships: []
      }
      crm_activities: {
        Row: {
          activity_type: string
          completed_at: string | null
          contact_id: string | null
          created_at: string | null
          created_by: string | null
          deal_id: string | null
          description: string | null
          id: string
          is_completed: boolean | null
          scheduled_at: string | null
          title: string
        }
        Insert: {
          activity_type: string
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          deal_id?: string | null
          description?: string | null
          id?: string
          is_completed?: boolean | null
          scheduled_at?: string | null
          title: string
        }
        Update: {
          activity_type?: string
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          deal_id?: string | null
          description?: string | null
          id?: string
          is_completed?: boolean | null
          scheduled_at?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_activities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_activities_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "crm_deals"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_contacts: {
        Row: {
          assigned_to: string | null
          avatar_url: string | null
          company_name: string | null
          company_segment: string | null
          company_website: string | null
          contact_type: string
          created_at: string | null
          created_by: string | null
          email: string | null
          id: string
          instagram: string | null
          lead_source: string | null
          lead_source_detail: string | null
          name: string
          notes: string | null
          phone: string | null
          position: string | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          avatar_url?: string | null
          company_name?: string | null
          company_segment?: string | null
          company_website?: string | null
          contact_type?: string
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          id?: string
          instagram?: string | null
          lead_source?: string | null
          lead_source_detail?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          position?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          avatar_url?: string | null
          company_name?: string | null
          company_segment?: string | null
          company_website?: string | null
          contact_type?: string
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          id?: string
          instagram?: string | null
          lead_source?: string | null
          lead_source_detail?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          position?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      crm_deals: {
        Row: {
          assigned_to: string | null
          closed_at: string | null
          contact_id: string
          created_at: string | null
          created_by: string | null
          description: string | null
          estimated_value: number | null
          expected_close_date: string | null
          id: string
          lost_reason: string | null
          project_id: string | null
          proposal_id: string | null
          service_type: string | null
          stage_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          closed_at?: string | null
          contact_id: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          estimated_value?: number | null
          expected_close_date?: string | null
          id?: string
          lost_reason?: string | null
          project_id?: string | null
          proposal_id?: string | null
          service_type?: string | null
          stage_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          closed_at?: string | null
          contact_id?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          estimated_value?: number | null
          expected_close_date?: string | null
          id?: string
          lost_reason?: string | null
          project_id?: string | null
          proposal_id?: string | null
          service_type?: string | null
          stage_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_deals_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_deals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_deals_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "orcamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_deals_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "crm_pipeline_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_pipeline_stages: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          is_lost: boolean | null
          is_won: boolean | null
          name: string
          position: number
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          is_lost?: boolean | null
          is_won?: boolean | null
          name: string
          position: number
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          is_lost?: boolean | null
          is_won?: boolean | null
          name?: string
          position?: number
        }
        Relationships: []
      }
      departments: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          name?: string
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
          ssd_number: string | null
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
          ssd_number?: string | null
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
          ssd_number?: string | null
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
      financial_computed: {
        Row: {
          contribution_margin_pct: number | null
          contribution_margin_value: number | null
          created_at: string | null
          cumulative_cash_flow: number | null
          id: string
          month: number
          net_cash_flow: number | null
          net_profit_pct: number | null
          net_profit_value: number | null
          revenue_goal_monthly: number | null
          snapshot_id: string
          updated_at: string | null
          year: number
        }
        Insert: {
          contribution_margin_pct?: number | null
          contribution_margin_value?: number | null
          created_at?: string | null
          cumulative_cash_flow?: number | null
          id?: string
          month: number
          net_cash_flow?: number | null
          net_profit_pct?: number | null
          net_profit_value?: number | null
          revenue_goal_monthly?: number | null
          snapshot_id: string
          updated_at?: string | null
          year: number
        }
        Update: {
          contribution_margin_pct?: number | null
          contribution_margin_value?: number | null
          created_at?: string | null
          cumulative_cash_flow?: number | null
          id?: string
          month?: number
          net_cash_flow?: number | null
          net_profit_pct?: number | null
          net_profit_value?: number | null
          revenue_goal_monthly?: number | null
          snapshot_id?: string
          updated_at?: string | null
          year?: number
        }
        Relationships: []
      }
      financial_goals: {
        Row: {
          cac_goal: number | null
          created_at: string | null
          id: string
          margin_goal_pct: number | null
          profit_goal_pct: number | null
          revenue_goal: number | null
          updated_at: string | null
          year: number
        }
        Insert: {
          cac_goal?: number | null
          created_at?: string | null
          id?: string
          margin_goal_pct?: number | null
          profit_goal_pct?: number | null
          revenue_goal?: number | null
          updated_at?: string | null
          year: number
        }
        Update: {
          cac_goal?: number | null
          created_at?: string | null
          id?: string
          margin_goal_pct?: number | null
          profit_goal_pct?: number | null
          revenue_goal?: number | null
          updated_at?: string | null
          year?: number
        }
        Relationships: []
      }
      financial_snapshots: {
        Row: {
          avg_ticket: number | null
          burn_rate: number | null
          cac: number | null
          cash_balance: number | null
          churn_rate: number | null
          costs: number | null
          costs_projects: number | null
          created_at: string | null
          id: string
          ltv: number | null
          month: number
          nps: number | null
          realized_expenses: number | null
          realized_income: number | null
          refund: number | null
          refund_projects: number | null
          revenue: number | null
          updated_at: string | null
          year: number
        }
        Insert: {
          avg_ticket?: number | null
          burn_rate?: number | null
          cac?: number | null
          cash_balance?: number | null
          churn_rate?: number | null
          costs?: number | null
          costs_projects?: number | null
          created_at?: string | null
          id: string
          ltv?: number | null
          month: number
          nps?: number | null
          realized_expenses?: number | null
          realized_income?: number | null
          refund?: number | null
          refund_projects?: number | null
          revenue?: number | null
          updated_at?: string | null
          year: number
        }
        Update: {
          avg_ticket?: number | null
          burn_rate?: number | null
          cac?: number | null
          cash_balance?: number | null
          churn_rate?: number | null
          costs?: number | null
          costs_projects?: number | null
          created_at?: string | null
          id?: string
          ltv?: number | null
          month?: number
          nps?: number | null
          realized_expenses?: number | null
          realized_income?: number | null
          refund?: number | null
          refund_projects?: number | null
          revenue?: number | null
          updated_at?: string | null
          year?: number
        }
        Relationships: []
      }
      important_dates: {
        Row: {
          created_at: string
          created_by: string | null
          date: string
          id: string
          notes: string | null
          recurring: boolean
          title: string
          type: Database["public"]["Enums"]["important_date_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          date: string
          id?: string
          notes?: string | null
          recurring?: boolean
          title: string
          type?: Database["public"]["Enums"]["important_date_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          date?: string
          id?: string
          notes?: string | null
          recurring?: boolean
          title?: string
          type?: Database["public"]["Enums"]["important_date_type"]
          updated_at?: string
        }
        Relationships: []
      }
      inbox_items: {
        Row: {
          actor_avatar_url: string | null
          actor_id: string | null
          actor_name: string | null
          created_at: string
          deep_link: string
          done_at: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          metadata: Json | null
          preview: string | null
          read_at: string | null
          reason: string
          snooze_until: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          actor_avatar_url?: string | null
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string
          deep_link: string
          done_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          preview?: string | null
          read_at?: string | null
          reason: string
          snooze_until?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          actor_avatar_url?: string | null
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string
          deep_link?: string
          done_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          preview?: string | null
          read_at?: string | null
          reason?: string
          snooze_until?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
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
      marketing_account_audience: {
        Row: {
          account_id: string
          captured_at: string
          cities: Json | null
          countries: Json | null
          created_at: string
          gender_age: Json | null
          id: string
          locales: Json | null
          platform: string
          raw_response: Json | null
        }
        Insert: {
          account_id: string
          captured_at?: string
          cities?: Json | null
          countries?: Json | null
          created_at?: string
          gender_age?: Json | null
          id?: string
          locales?: Json | null
          platform?: string
          raw_response?: Json | null
        }
        Update: {
          account_id?: string
          captured_at?: string
          cities?: Json | null
          countries?: Json | null
          created_at?: string
          gender_age?: Json | null
          id?: string
          locales?: Json | null
          platform?: string
          raw_response?: Json | null
        }
        Relationships: []
      }
      marketing_account_snapshots: {
        Row: {
          account_id: string
          captured_at: string
          captured_date: string | null
          created_at: string
          followers_count: number | null
          followers_delta: number | null
          follows_count: number | null
          id: string
          media_count: number | null
          platform: string
          profile_views_day: number
          raw_response: Json | null
          reach_day: number
          views_day: number
        }
        Insert: {
          account_id: string
          captured_at?: string
          captured_date?: string | null
          created_at?: string
          followers_count?: number | null
          followers_delta?: number | null
          follows_count?: number | null
          id?: string
          media_count?: number | null
          platform?: string
          profile_views_day?: number
          raw_response?: Json | null
          reach_day?: number
          views_day?: number
        }
        Update: {
          account_id?: string
          captured_at?: string
          captured_date?: string | null
          created_at?: string
          followers_count?: number | null
          followers_delta?: number | null
          follows_count?: number | null
          id?: string
          media_count?: number | null
          platform?: string
          profile_views_day?: number
          raw_response?: Json | null
          reach_day?: number
          views_day?: number
        }
        Relationships: []
      }
      marketing_ga4_dimensions: {
        Row: {
          captured_at: string
          captured_date: string
          conversion_events: Json | null
          countries_breakdown: Json | null
          devices_breakdown: Json | null
          exit_pages: Json | null
          id: string
          mediums_breakdown: Json | null
          property_id: string
          sources_breakdown: Json | null
          top_pages: Json | null
        }
        Insert: {
          captured_at?: string
          captured_date: string
          conversion_events?: Json | null
          countries_breakdown?: Json | null
          devices_breakdown?: Json | null
          exit_pages?: Json | null
          id?: string
          mediums_breakdown?: Json | null
          property_id: string
          sources_breakdown?: Json | null
          top_pages?: Json | null
        }
        Update: {
          captured_at?: string
          captured_date?: string
          conversion_events?: Json | null
          countries_breakdown?: Json | null
          devices_breakdown?: Json | null
          exit_pages?: Json | null
          id?: string
          mediums_breakdown?: Json | null
          property_id?: string
          sources_breakdown?: Json | null
          top_pages?: Json | null
        }
        Relationships: []
      }
      marketing_ga4_metrics_monthly: {
        Row: {
          aggregated_at: string
          avg_session_duration: number | null
          bounce_rate: number | null
          conversions: number
          engagement_rate: number | null
          id: string
          month_start: string
          new_users: number
          page_views: number
          property_id: string
          sessions: number
          total_users: number
        }
        Insert: {
          aggregated_at?: string
          avg_session_duration?: number | null
          bounce_rate?: number | null
          conversions?: number
          engagement_rate?: number | null
          id?: string
          month_start: string
          new_users?: number
          page_views?: number
          property_id: string
          sessions?: number
          total_users?: number
        }
        Update: {
          aggregated_at?: string
          avg_session_duration?: number | null
          bounce_rate?: number | null
          conversions?: number
          engagement_rate?: number | null
          id?: string
          month_start?: string
          new_users?: number
          page_views?: number
          property_id?: string
          sessions?: number
          total_users?: number
        }
        Relationships: []
      }
      marketing_ga4_snapshots: {
        Row: {
          avg_session_duration: number | null
          bounce_rate: number | null
          captured_at: string
          captured_date: string
          conversions: number | null
          engagement_rate: number | null
          id: string
          new_users: number | null
          page_views: number | null
          property_id: string
          raw_response: Json | null
          sessions: number | null
          top_source: string | null
          total_users: number | null
        }
        Insert: {
          avg_session_duration?: number | null
          bounce_rate?: number | null
          captured_at?: string
          captured_date: string
          conversions?: number | null
          engagement_rate?: number | null
          id?: string
          new_users?: number | null
          page_views?: number | null
          property_id: string
          raw_response?: Json | null
          sessions?: number | null
          top_source?: string | null
          total_users?: number | null
        }
        Update: {
          avg_session_duration?: number | null
          bounce_rate?: number | null
          captured_at?: string
          captured_date?: string
          conversions?: number | null
          engagement_rate?: number | null
          id?: string
          new_users?: number | null
          page_views?: number | null
          property_id?: string
          raw_response?: Json | null
          sessions?: number | null
          top_source?: string | null
          total_users?: number | null
        }
        Relationships: []
      }
      marketing_ideas: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          format: string | null
          id: string
          persona_id: string | null
          pillar_id: string | null
          reference_ids: string[]
          source: string | null
          status: string
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          format?: string | null
          id?: string
          persona_id?: string | null
          pillar_id?: string | null
          reference_ids?: string[]
          source?: string | null
          status?: string
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          format?: string | null
          id?: string
          persona_id?: string | null
          pillar_id?: string | null
          reference_ids?: string[]
          source?: string | null
          status?: string
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketing_ideas_persona_id_fkey"
            columns: ["persona_id"]
            isOneToOne: false
            referencedRelation: "marketing_personas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_ideas_pillar_id_fkey"
            columns: ["pillar_id"]
            isOneToOne: false
            referencedRelation: "marketing_pillars"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_integrations: {
        Row: {
          access_token: string | null
          account_id: string | null
          account_name: string | null
          connected_at: string | null
          connected_by: string | null
          created_at: string
          id: string
          last_sync_at: string | null
          platform: string
          profile_picture_url: string | null
          refresh_token: string | null
          status: string
          status_message: string | null
          token_expires_at: string | null
          updated_at: string
        }
        Insert: {
          access_token?: string | null
          account_id?: string | null
          account_name?: string | null
          connected_at?: string | null
          connected_by?: string | null
          created_at?: string
          id?: string
          last_sync_at?: string | null
          platform: string
          profile_picture_url?: string | null
          refresh_token?: string | null
          status?: string
          status_message?: string | null
          token_expires_at?: string | null
          updated_at?: string
        }
        Update: {
          access_token?: string | null
          account_id?: string | null
          account_name?: string | null
          connected_at?: string | null
          connected_by?: string | null
          created_at?: string
          id?: string
          last_sync_at?: string | null
          platform?: string
          profile_picture_url?: string | null
          refresh_token?: string | null
          status?: string
          status_message?: string | null
          token_expires_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      marketing_personas: {
        Row: {
          avatar_url: string | null
          buying_triggers: string[]
          channels_consumed: string[]
          common_objections: string[]
          company_size: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          id: string
          main_pains: string[]
          name: string
          segment: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          buying_triggers?: string[]
          channels_consumed?: string[]
          common_objections?: string[]
          company_size?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          main_pains?: string[]
          name: string
          segment?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          buying_triggers?: string[]
          channels_consumed?: string[]
          common_objections?: string[]
          company_size?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          main_pains?: string[]
          name?: string
          segment?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      marketing_pillars: {
        Row: {
          color: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          id: string
          name: string
          target_percentage: number | null
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          name: string
          target_percentage?: number | null
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          name?: string
          target_percentage?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      marketing_post_metrics_monthly: {
        Row: {
          aggregated_at: string
          comments: number
          id: string
          likes: number
          likes_delta: number
          month_start: string
          post_id: string
          reach: number
          reach_delta: number
          saves: number
          shares: number
          source: string | null
          views: number
          views_delta: number
        }
        Insert: {
          aggregated_at?: string
          comments?: number
          id?: string
          likes?: number
          likes_delta?: number
          month_start: string
          post_id: string
          reach?: number
          reach_delta?: number
          saves?: number
          shares?: number
          source?: string | null
          views?: number
          views_delta?: number
        }
        Update: {
          aggregated_at?: string
          comments?: number
          id?: string
          likes?: number
          likes_delta?: number
          month_start?: string
          post_id?: string
          reach?: number
          reach_delta?: number
          saves?: number
          shares?: number
          source?: string | null
          views?: number
          views_delta?: number
        }
        Relationships: [
          {
            foreignKeyName: "marketing_post_metrics_monthly_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "marketing_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_post_metrics_weekly: {
        Row: {
          aggregated_at: string
          comments: number
          id: string
          likes: number
          likes_delta: number
          post_id: string
          reach: number
          reach_delta: number
          saves: number
          shares: number
          source: string | null
          views: number
          views_delta: number
          week_start: string
        }
        Insert: {
          aggregated_at?: string
          comments?: number
          id?: string
          likes?: number
          likes_delta?: number
          post_id: string
          reach?: number
          reach_delta?: number
          saves?: number
          shares?: number
          source?: string | null
          views?: number
          views_delta?: number
          week_start: string
        }
        Update: {
          aggregated_at?: string
          comments?: number
          id?: string
          likes?: number
          likes_delta?: number
          post_id?: string
          reach?: number
          reach_delta?: number
          saves?: number
          shares?: number
          source?: string | null
          views?: number
          views_delta?: number
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketing_post_metrics_weekly_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "marketing_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_post_snapshots: {
        Row: {
          captured_at: string
          comments: number
          id: string
          likes: number
          new_followers: number
          post_id: string
          profile_clicks: number
          reach: number
          saves: number
          shares: number
          source: string
          views: number
        }
        Insert: {
          captured_at?: string
          comments?: number
          id?: string
          likes?: number
          new_followers?: number
          post_id: string
          profile_clicks?: number
          reach?: number
          saves?: number
          shares?: number
          source: string
          views?: number
        }
        Update: {
          captured_at?: string
          comments?: number
          id?: string
          likes?: number
          new_followers?: number
          post_id?: string
          profile_clicks?: number
          reach?: number
          saves?: number
          shares?: number
          source?: string
          views?: number
        }
        Relationships: [
          {
            foreignKeyName: "marketing_post_snapshots_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "marketing_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_posts: {
        Row: {
          auto_discovered_at: string | null
          caption: string | null
          carousel_media_urls: Json | null
          comments: number
          cover_url: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          engagement_rate: number | null
          external_id: string | null
          file_url: string | null
          format: string | null
          hashtags: string[]
          id: string
          idea_id: string | null
          likes: number
          media_type: string | null
          metrics_source: string | null
          metrics_updated_at: string | null
          new_followers: number
          persona_id: string | null
          pillar_id: string | null
          platform: string | null
          profile_clicks: number
          published_at: string | null
          published_url: string | null
          reach: number
          saves: number
          scheduled_at: string | null
          shares: number
          source: string
          status: string
          thumbnail_url: string | null
          title: string
          updated_at: string
          views: number
        }
        Insert: {
          auto_discovered_at?: string | null
          caption?: string | null
          carousel_media_urls?: Json | null
          comments?: number
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          engagement_rate?: number | null
          external_id?: string | null
          file_url?: string | null
          format?: string | null
          hashtags?: string[]
          id?: string
          idea_id?: string | null
          likes?: number
          media_type?: string | null
          metrics_source?: string | null
          metrics_updated_at?: string | null
          new_followers?: number
          persona_id?: string | null
          pillar_id?: string | null
          platform?: string | null
          profile_clicks?: number
          published_at?: string | null
          published_url?: string | null
          reach?: number
          saves?: number
          scheduled_at?: string | null
          shares?: number
          source?: string
          status?: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          views?: number
        }
        Update: {
          auto_discovered_at?: string | null
          caption?: string | null
          carousel_media_urls?: Json | null
          comments?: number
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          engagement_rate?: number | null
          external_id?: string | null
          file_url?: string | null
          format?: string | null
          hashtags?: string[]
          id?: string
          idea_id?: string | null
          likes?: number
          media_type?: string | null
          metrics_source?: string | null
          metrics_updated_at?: string | null
          new_followers?: number
          persona_id?: string | null
          pillar_id?: string | null
          platform?: string | null
          profile_clicks?: number
          published_at?: string | null
          published_url?: string | null
          reach?: number
          saves?: number
          scheduled_at?: string | null
          shares?: number
          source?: string
          status?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          views?: number
        }
        Relationships: [
          {
            foreignKeyName: "marketing_posts_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "marketing_ideas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_posts_persona_id_fkey"
            columns: ["persona_id"]
            isOneToOne: false
            referencedRelation: "marketing_personas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_posts_pillar_id_fkey"
            columns: ["pillar_id"]
            isOneToOne: false
            referencedRelation: "marketing_pillars"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_references: {
        Row: {
          category: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          image_url: string | null
          notes: string | null
          platform: string | null
          source_url: string | null
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          notes?: string | null
          platform?: string | null
          source_url?: string | null
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          notes?: string | null
          platform?: string | null
          source_url?: string | null
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      marketing_report_subscribers: {
        Row: {
          added_by: string | null
          created_at: string
          email: string
          enabled: boolean
          id: string
          name: string | null
          updated_at: string
        }
        Insert: {
          added_by?: string | null
          created_at?: string
          email: string
          enabled?: boolean
          id?: string
          name?: string | null
          updated_at?: string
        }
        Update: {
          added_by?: string | null
          created_at?: string
          email?: string
          enabled?: boolean
          id?: string
          name?: string | null
          updated_at?: string
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
      orcamentos: {
        Row: {
          base_value: number | null
          briefing: string | null
          cases: Json | null
          client_logo: string | null
          client_name: string | null
          client_responsible: string | null
          company_description: string | null
          created_at: string
          created_by: string | null
          diagnostico_dores: Json | null
          discount_pct: number | null
          entregaveis: Json | null
          final_value: number | null
          id: string
          is_latest_version: boolean | null
          list_price: number | null
          moodboard_images: Json | null
          objetivo: string | null
          parent_id: string | null
          payment_options: Json | null
          payment_terms: string | null
          project_name: string | null
          project_number: string | null
          scope_post_production: Json | null
          scope_pre_production: Json | null
          scope_production: Json | null
          sent_date: string | null
          services: Json | null
          slug: string
          status: string
          testimonial_image: string | null
          testimonial_name: string | null
          testimonial_role: string | null
          testimonial_text: string | null
          timeline: Json | null
          updated_at: string
          validity_date: string | null
          version: number | null
          video_url: string | null
          views_count: number | null
          whatsapp_number: string | null
        }
        Insert: {
          base_value?: number | null
          briefing?: string | null
          cases?: Json | null
          client_logo?: string | null
          client_name?: string | null
          client_responsible?: string | null
          company_description?: string | null
          created_at?: string
          created_by?: string | null
          diagnostico_dores?: Json | null
          discount_pct?: number | null
          entregaveis?: Json | null
          final_value?: number | null
          id?: string
          is_latest_version?: boolean | null
          list_price?: number | null
          moodboard_images?: Json | null
          objetivo?: string | null
          parent_id?: string | null
          payment_options?: Json | null
          payment_terms?: string | null
          project_name?: string | null
          project_number?: string | null
          scope_post_production?: Json | null
          scope_pre_production?: Json | null
          scope_production?: Json | null
          sent_date?: string | null
          services?: Json | null
          slug: string
          status?: string
          testimonial_image?: string | null
          testimonial_name?: string | null
          testimonial_role?: string | null
          testimonial_text?: string | null
          timeline?: Json | null
          updated_at?: string
          validity_date?: string | null
          version?: number | null
          video_url?: string | null
          views_count?: number | null
          whatsapp_number?: string | null
        }
        Update: {
          base_value?: number | null
          briefing?: string | null
          cases?: Json | null
          client_logo?: string | null
          client_name?: string | null
          client_responsible?: string | null
          company_description?: string | null
          created_at?: string
          created_by?: string | null
          diagnostico_dores?: Json | null
          discount_pct?: number | null
          entregaveis?: Json | null
          final_value?: number | null
          id?: string
          is_latest_version?: boolean | null
          list_price?: number | null
          moodboard_images?: Json | null
          objetivo?: string | null
          parent_id?: string | null
          payment_options?: Json | null
          payment_terms?: string | null
          project_name?: string | null
          project_number?: string | null
          scope_post_production?: Json | null
          scope_pre_production?: Json | null
          scope_production?: Json | null
          sent_date?: string | null
          services?: Json | null
          slug?: string
          status?: string
          testimonial_image?: string | null
          testimonial_name?: string | null
          testimonial_role?: string | null
          testimonial_text?: string | null
          timeline?: Json | null
          updated_at?: string
          validity_date?: string | null
          version?: number | null
          video_url?: string | null
          views_count?: number | null
          whatsapp_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orcamentos_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "orcamentos"
            referencedColumns: ["id"]
          },
        ]
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
      post_production_queue: {
        Row: {
          client_name: string | null
          created_at: string
          created_by: string
          delivered_date: string | null
          due_date: string | null
          editor_id: string | null
          editor_name: string | null
          id: string
          notes: string | null
          priority: string
          project_id: string | null
          project_name: string | null
          start_date: string | null
          status: string
          sub_status: string | null
          sub_status_index: number | null
          title: string
          updated_at: string
        }
        Insert: {
          client_name?: string | null
          created_at?: string
          created_by: string
          delivered_date?: string | null
          due_date?: string | null
          editor_id?: string | null
          editor_name?: string | null
          id?: string
          notes?: string | null
          priority?: string
          project_id?: string | null
          project_name?: string | null
          start_date?: string | null
          status?: string
          sub_status?: string | null
          sub_status_index?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          client_name?: string | null
          created_at?: string
          created_by?: string
          delivered_date?: string | null
          due_date?: string | null
          editor_id?: string | null
          editor_name?: string | null
          id?: string
          notes?: string | null
          priority?: string
          project_id?: string | null
          project_name?: string | null
          start_date?: string | null
          status?: string
          sub_status?: string | null
          sub_status_index?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_production_queue_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "audiovisual_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      pp_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          item_id: string
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          item_id: string
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          item_id?: string
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pp_comments_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "post_production_queue"
            referencedColumns: ["id"]
          },
        ]
      }
      pp_versions: {
        Row: {
          created_at: string | null
          created_by: string | null
          frame_io_url: string
          id: string
          item_id: string
          notes: string | null
          status: string
          version_number: number
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          frame_io_url: string
          id?: string
          item_id: string
          notes?: string | null
          status?: string
          version_number: number
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          frame_io_url?: string
          id?: string
          item_id?: string
          notes?: string | null
          status?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "pp_versions_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "post_production_queue"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          birth_date: string | null
          created_at: string
          department: string | null
          display_name: string | null
          hired_at: string | null
          id: string
          is_approved: boolean
          last_seen_at: string | null
          position: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string
          department?: string | null
          display_name?: string | null
          hired_at?: string | null
          id?: string
          is_approved?: boolean
          last_seen_at?: string | null
          position?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string
          department?: string | null
          display_name?: string | null
          hired_at?: string | null
          id?: string
          is_approved?: boolean
          last_seen_at?: string | null
          position?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      project_registry: {
        Row: {
          client_name: string | null
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          project_date: string | null
          project_name: string | null
          project_number: string | null
          updated_at: string
          value_brl: number | null
        }
        Insert: {
          client_name?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          project_date?: string | null
          project_name?: string | null
          project_number?: string | null
          updated_at?: string
          value_brl?: number | null
        }
        Update: {
          client_name?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          project_date?: string | null
          project_name?: string | null
          project_number?: string | null
          updated_at?: string
          value_brl?: number | null
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
      proposal_cases: {
        Row: {
          campaign_name: string
          client_name: string
          created_at: string
          created_by: string | null
          destaque: boolean
          id: string
          tags: string[] | null
          tipo: string
          vimeo_hash: string | null
          vimeo_id: string
        }
        Insert: {
          campaign_name?: string
          client_name?: string
          created_at?: string
          created_by?: string | null
          destaque?: boolean
          id?: string
          tags?: string[] | null
          tipo?: string
          vimeo_hash?: string | null
          vimeo_id?: string
        }
        Update: {
          campaign_name?: string
          client_name?: string
          created_at?: string
          created_by?: string | null
          destaque?: boolean
          id?: string
          tags?: string[] | null
          tipo?: string
          vimeo_hash?: string | null
          vimeo_id?: string
        }
        Relationships: []
      }
      proposal_pain_points: {
        Row: {
          category: string | null
          created_at: string
          created_by: string | null
          description: string
          id: string
          label: string
          title: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          label?: string
          title?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          label?: string
          title?: string
        }
        Relationships: []
      }
      proposal_testimonials: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          image: string | null
          name: string
          role: string
          text: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          image?: string | null
          name: string
          role?: string
          text?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          image?: string | null
          name?: string
          role?: string
          text?: string
        }
        Relationships: []
      }
      proposal_views: {
        Row: {
          device_type: string | null
          id: string
          ip_address: string | null
          proposal_id: string
          referrer: string | null
          time_on_page_seconds: number | null
          user_agent: string | null
          viewed_at: string
        }
        Insert: {
          device_type?: string | null
          id?: string
          ip_address?: string | null
          proposal_id: string
          referrer?: string | null
          time_on_page_seconds?: number | null
          user_agent?: string | null
          viewed_at?: string
        }
        Update: {
          device_type?: string | null
          id?: string
          ip_address?: string | null
          proposal_id?: string
          referrer?: string | null
          time_on_page_seconds?: number | null
          user_agent?: string | null
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposal_views_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "orcamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          created_at: string
          granted: boolean
          id: string
          permission_key: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          granted?: boolean
          id?: string
          permission_key: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          granted?: boolean
          id?: string
          permission_key?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          updated_by?: string | null
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
      site_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value: Json | null
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value?: Json | null
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: Json | null
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
      subtitle_jobs: {
        Row: {
          aspect_ratio: string
          corrected_srt: string | null
          created_at: string
          cue_count: number
          file_name: string
          file_size_bytes: number
          glossary: string[]
          id: string
          original_srt: string
          preset_id: string | null
          preset_name: string | null
          source_language: string
          status: string
          target_language: string
          updated_at: string
          user_id: string
        }
        Insert: {
          aspect_ratio?: string
          corrected_srt?: string | null
          created_at?: string
          cue_count?: number
          file_name: string
          file_size_bytes?: number
          glossary?: string[]
          id?: string
          original_srt: string
          preset_id?: string | null
          preset_name?: string | null
          source_language?: string
          status?: string
          target_language?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          aspect_ratio?: string
          corrected_srt?: string | null
          created_at?: string
          cue_count?: number
          file_name?: string
          file_size_bytes?: number
          glossary?: string[]
          id?: string
          original_srt?: string
          preset_id?: string | null
          preset_name?: string | null
          source_language?: string
          status?: string
          target_language?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subtitle_jobs_preset_id_fkey"
            columns: ["preset_id"]
            isOneToOne: false
            referencedRelation: "subtitle_presets"
            referencedColumns: ["id"]
          },
        ]
      }
      subtitle_presets: {
        Row: {
          aspect_ratio: string
          background_color: string | null
          background_opacity: number | null
          bg_type: string
          casing: string
          chars_per_line: number
          cps_max: number
          created_at: string
          font_family: string
          font_size: number
          font_weight: string
          id: string
          is_global: boolean
          margin_v: number
          max_lines: number
          max_width: number
          name: string
          outline_color: string | null
          outline_width: number | null
          padding_h: number
          padding_v: number
          position: string
          shadow_blur: number
          shadow_color: string
          shadow_enabled: boolean
          shadow_x: number
          shadow_y: number
          text_color: string
          tone: string
          tracking: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          aspect_ratio: string
          background_color?: string | null
          background_opacity?: number | null
          bg_type?: string
          casing?: string
          chars_per_line?: number
          cps_max?: number
          created_at?: string
          font_family?: string
          font_size?: number
          font_weight?: string
          id?: string
          is_global?: boolean
          margin_v?: number
          max_lines?: number
          max_width?: number
          name: string
          outline_color?: string | null
          outline_width?: number | null
          padding_h?: number
          padding_v?: number
          position?: string
          shadow_blur?: number
          shadow_color?: string
          shadow_enabled?: boolean
          shadow_x?: number
          shadow_y?: number
          text_color?: string
          tone?: string
          tracking?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          aspect_ratio?: string
          background_color?: string | null
          background_opacity?: number | null
          bg_type?: string
          casing?: string
          chars_per_line?: number
          cps_max?: number
          created_at?: string
          font_family?: string
          font_size?: number
          font_weight?: string
          id?: string
          is_global?: boolean
          margin_v?: number
          max_lines?: number
          max_width?: number
          name?: string
          outline_color?: string | null
          outline_width?: number | null
          padding_h?: number
          padding_v?: number
          position?: string
          shadow_blur?: number
          shadow_color?: string
          shadow_enabled?: boolean
          shadow_x?: number
          shadow_y?: number
          text_color?: string
          tone?: string
          tracking?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      supplier_companies: {
        Row: {
          area: string
          company_name: string
          created_at: string | null
          created_by: string | null
          id: string
          instagram: string | null
          is_active: boolean | null
          portfolio_url: string | null
          rating: number | null
          updated_at: string | null
          whatsapp: string | null
        }
        Insert: {
          area: string
          company_name: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          instagram?: string | null
          is_active?: boolean | null
          portfolio_url?: string | null
          rating?: number | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Update: {
          area?: string
          company_name?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          instagram?: string | null
          is_active?: boolean | null
          portfolio_url?: string | null
          rating?: number | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      supplier_company_notes: {
        Row: {
          company_id: string
          content: string
          created_at: string | null
          created_by: string | null
          created_by_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          company_id: string
          content: string
          created_at?: string | null
          created_by?: string | null
          created_by_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          content?: string
          created_at?: string | null
          created_by?: string | null
          created_by_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_company_notes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "supplier_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_notes: {
        Row: {
          content: string
          created_at: string | null
          created_by: string | null
          created_by_name: string | null
          id: string
          supplier_id: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          created_by?: string | null
          created_by_name?: string | null
          id?: string
          supplier_id: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by?: string | null
          created_by_name?: string | null
          id?: string
          supplier_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_notes_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_roles: {
        Row: {
          created_at: string | null
          created_by: string | null
          display_order: number | null
          id: string
          is_custom: boolean | null
          name: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          display_order?: number | null
          id?: string
          is_custom?: boolean | null
          name: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          display_order?: number | null
          id?: string
          is_custom?: boolean | null
          name?: string
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          created_at: string | null
          created_by: string | null
          daily_rate: number | null
          expertise: string
          full_name: string
          id: string
          instagram: string | null
          is_active: boolean | null
          portfolio_url: string | null
          primary_role: string
          rating: number | null
          secondary_role: string | null
          updated_at: string | null
          whatsapp: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          daily_rate?: number | null
          expertise?: string
          full_name: string
          id?: string
          instagram?: string | null
          is_active?: boolean | null
          portfolio_url?: string | null
          primary_role: string
          rating?: number | null
          secondary_role?: string | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          daily_rate?: number | null
          expertise?: string
          full_name?: string
          id?: string
          instagram?: string | null
          is_active?: boolean | null
          portfolio_url?: string | null
          primary_role?: string
          rating?: number | null
          secondary_role?: string | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      task_assignees: {
        Row: {
          created_at: string | null
          id: string
          task_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          task_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_assignees_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_attachments: {
        Row: {
          created_at: string
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          task_id: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          task_id: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          task_id?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_attachments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          parent_id: string | null
          task_id: string
          updated_at: string
          user_id: string
          user_name: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          parent_id?: string | null
          task_id: string
          updated_at?: string
          user_id: string
          user_name?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          parent_id?: string | null
          task_id?: string
          updated_at?: string
          user_id?: string
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "task_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_history: {
        Row: {
          action: string
          created_at: string
          field_changed: string | null
          id: string
          new_value: string | null
          old_value: string | null
          task_id: string
          user_id: string
          user_name: string
        }
        Insert: {
          action: string
          created_at?: string
          field_changed?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          task_id: string
          user_id: string
          user_name: string
        }
        Update: {
          action?: string
          created_at?: string
          field_changed?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          task_id?: string
          user_id?: string
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_history_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_links: {
        Row: {
          created_at: string
          created_by: string
          id: string
          link_type: string
          task_id: string
          title: string
          url: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          link_type?: string
          task_id: string
          title: string
          url: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          link_type?: string
          task_id?: string
          title?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_links_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_subtasks: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_completed: boolean
          task_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          is_completed?: boolean
          task_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_completed?: boolean
          task_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_subtasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string | null
          created_at: string
          created_by: string
          department: string | null
          description: string | null
          due_date: string | null
          id: string
          is_private: boolean
          priority: string
          project_id: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          created_by: string
          department?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_private?: boolean
          priority?: string
          project_id?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string
          department?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_private?: boolean
          priority?: string
          project_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "audiovisual_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          created_at: string | null
          created_by: string | null
          crop_settings: Json | null
          display_order: number | null
          id: string
          is_visible: boolean | null
          name: string
          original_photo_url: string | null
          photo_url: string | null
          position: string | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          crop_settings?: Json | null
          display_order?: number | null
          id?: string
          is_visible?: boolean | null
          name: string
          original_photo_url?: string | null
          photo_url?: string | null
          position?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          crop_settings?: Json | null
          display_order?: number | null
          id?: string
          is_visible?: boolean | null
          name?: string
          original_photo_url?: string | null
          photo_url?: string | null
          position?: string | null
          tags?: string[] | null
          updated_at?: string | null
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
      wiki_articles: {
        Row: {
          author_id: string | null
          body: string
          category: Database["public"]["Enums"]["wiki_category"]
          created_at: string
          excerpt: string | null
          id: string
          last_edited_by: string | null
          published: boolean
          published_at: string | null
          slug: string
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          body?: string
          category?: Database["public"]["Enums"]["wiki_category"]
          created_at?: string
          excerpt?: string | null
          id?: string
          last_edited_by?: string | null
          published?: boolean
          published_at?: string | null
          slug: string
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          body?: string
          category?: Database["public"]["Enums"]["wiki_category"]
          created_at?: string
          excerpt?: string | null
          id?: string
          last_edited_by?: string | null
          published?: boolean
          published_at?: string | null
          slug?: string
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      withdrawal_drafts: {
        Row: {
          created_at: string
          current_step: number
          data: Json
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_step?: number
          data?: Json
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_step?: number
          data?: Json
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      marketing_ga4_history: {
        Row: {
          avg_session_duration: number | null
          bounce_rate: number | null
          conversions: number | null
          engagement_rate: number | null
          granularity: string | null
          new_users: number | null
          page_views: number | null
          period_start: string | null
          property_id: string | null
          sessions: number | null
          total_users: number | null
        }
        Relationships: []
      }
      marketing_post_metrics_history: {
        Row: {
          comments: number | null
          granularity: string | null
          likes: number | null
          period_start: string | null
          post_id: string | null
          reach: number | null
          saves: number | null
          shares: number | null
          source: string | null
          views: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      aggregate_ga4_snapshots_to_monthly: { Args: never; Returns: undefined }
      aggregate_post_snapshots_to_weekly: { Args: never; Returns: undefined }
      aggregate_post_weekly_to_monthly: { Args: never; Returns: undefined }
      audit_data_access: {
        Args: never
        Returns: {
          policy_name: string
          potential_exposure: string
          severity: string
          table_name: string
        }[]
      }
      can_access_task: { Args: { _task_id: string }; Returns: boolean }
      can_see_task: {
        Args: { _task_id: string; _user_id: string }
        Returns: boolean
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
      cleanup_old_post_snapshots: { Args: never; Returns: undefined }
      cleanup_soft_deleted_marketing: { Args: never; Returns: undefined }
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
      create_notification_for_user: {
        Args: {
          _description?: string
          _entity_id?: string
          _related_entity?: string
          _required_permission?: string
          _responsible_user_id?: string
          _target_user_id: string
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
      fire_birthday_inbox_items: { Args: never; Returns: undefined }
      fire_loan_overdue_inbox_items: { Args: never; Returns: undefined }
      get_current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_equipment_project_count: {
        Args: { equipment_id: string }
        Returns: number
      }
      get_internal_config: { Args: { _key: string }; Returns: string }
      get_latest_proposal_slug: {
        Args: { p_parent_id: string }
        Returns: string
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
      get_proposal_by_slug: {
        Args: { p_slug: string }
        Returns: {
          base_value: number | null
          briefing: string | null
          cases: Json | null
          client_logo: string | null
          client_name: string | null
          client_responsible: string | null
          company_description: string | null
          created_at: string
          created_by: string | null
          diagnostico_dores: Json | null
          discount_pct: number | null
          entregaveis: Json | null
          final_value: number | null
          id: string
          is_latest_version: boolean | null
          list_price: number | null
          moodboard_images: Json | null
          objetivo: string | null
          parent_id: string | null
          payment_options: Json | null
          payment_terms: string | null
          project_name: string | null
          project_number: string | null
          scope_post_production: Json | null
          scope_pre_production: Json | null
          scope_production: Json | null
          sent_date: string | null
          services: Json | null
          slug: string
          status: string
          testimonial_image: string | null
          testimonial_name: string | null
          testimonial_role: string | null
          testimonial_text: string | null
          timeline: Json | null
          updated_at: string
          validity_date: string | null
          version: number | null
          video_url: string | null
          views_count: number | null
          whatsapp_number: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "orcamentos"
          isOneToOne: false
          isSetofReturn: true
        }
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
      has_marketing_access: { Args: { _user_id: string }; Returns: boolean }
      has_permission: {
        Args: { _permission: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_proposal_views: {
        Args: { proposal_id: string }
        Returns: undefined
      }
      is_chat_member: {
        Args: { _conversation_id: string; _user_id: string }
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
      update_last_seen: { Args: never; Returns: undefined }
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
      app_role:
        | "admin"
        | "user"
        | "producao"
        | "marketing"
        | "comercial"
        | "edicao"
        | "financeiro"
        | "convidado"
      important_date_type:
        | "company_milestone"
        | "commemorative"
        | "client_anniversary"
        | "custom"
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
      wiki_category:
        | "faq"
        | "onboarding"
        | "processos"
        | "ferramentas"
        | "beneficios"
        | "cultura"
        | "outros"
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
      app_role: [
        "admin",
        "user",
        "producao",
        "marketing",
        "comercial",
        "edicao",
        "financeiro",
        "convidado",
      ],
      important_date_type: [
        "company_milestone",
        "commemorative",
        "client_anniversary",
        "custom",
      ],
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
      wiki_category: [
        "faq",
        "onboarding",
        "processos",
        "ferramentas",
        "beneficios",
        "cultura",
        "outros",
      ],
    },
  },
} as const
