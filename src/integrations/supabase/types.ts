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
      accounting_accounts: {
        Row: {
          account_type: string
          code: string
          created_at: string
          id: string
          is_active: boolean
          label: string
          parent_code: string | null
          updated_at: string
        }
        Insert: {
          account_type?: string
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          label: string
          parent_code?: string | null
          updated_at?: string
        }
        Update: {
          account_type?: string
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string
          parent_code?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      accounting_entries: {
        Row: {
          created_at: string
          created_by: string | null
          entry_date: string
          id: string
          is_posted: boolean
          journal_code: string
          label: string
          party_name: string | null
          piece_number: string | null
          pos_id: string | null
          source_id: string | null
          source_type: string | null
          total_credit: number
          total_debit: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          entry_date?: string
          id?: string
          is_posted?: boolean
          journal_code?: string
          label?: string
          party_name?: string | null
          piece_number?: string | null
          pos_id?: string | null
          source_id?: string | null
          source_type?: string | null
          total_credit?: number
          total_debit?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          entry_date?: string
          id?: string
          is_posted?: boolean
          journal_code?: string
          label?: string
          party_name?: string | null
          piece_number?: string | null
          pos_id?: string | null
          source_id?: string | null
          source_type?: string | null
          total_credit?: number
          total_debit?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounting_entries_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounting_entries_pos_id_fkey"
            columns: ["pos_id"]
            isOneToOne: false
            referencedRelation: "pos_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      accounting_entry_lines: {
        Row: {
          account_code: string
          created_at: string
          credit: number
          debit: number
          entry_id: string
          id: string
          label: string
          sort_order: number
        }
        Insert: {
          account_code: string
          created_at?: string
          credit?: number
          debit?: number
          entry_id: string
          id?: string
          label?: string
          sort_order?: number
        }
        Update: {
          account_code?: string
          created_at?: string
          credit?: number
          debit?: number
          entry_id?: string
          id?: string
          label?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "accounting_entry_lines_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "accounting_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      accounting_journals: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          journal_type: string
          label: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          journal_type?: string
          label: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          journal_type?: string
          label?: string
          updated_at?: string
        }
        Relationships: []
      }
      activity_log: {
        Row: {
          action: string
          actor_id: string | null
          actor_name: string | null
          created_at: string
          details: Json
          entity_id: string | null
          entity_type: string | null
          id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string
          details?: Json
          entity_id?: string | null
          entity_type?: string | null
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string
          details?: Json
          entity_id?: string | null
          entity_type?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_document_lines: {
        Row: {
          created_at: string
          designation: string
          document_id: string
          id: string
          quantity: number
          section: string | null
          sort_order: number
          total: number
          unit: string | null
          unit_price: number
        }
        Insert: {
          created_at?: string
          designation?: string
          document_id: string
          id?: string
          quantity?: number
          section?: string | null
          sort_order?: number
          total?: number
          unit?: string | null
          unit_price?: number
        }
        Update: {
          created_at?: string
          designation?: string
          document_id?: string
          id?: string
          quantity?: number
          section?: string | null
          sort_order?: number
          total?: number
          unit?: string | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "billing_document_lines_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "billing_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_documents: {
        Row: {
          city: string | null
          client_address: string | null
          client_email: string | null
          client_ice: string | null
          client_name: string
          client_phone: string | null
          created_at: string
          created_by: string | null
          deposit: number
          discount: number
          doc_type: string
          due_date: string | null
          id: string
          intro_text: string | null
          issue_date: string
          net_to_pay: number
          notes: string | null
          number: string
          order_ref: string | null
          pos_id: string | null
          source_document_id: string | null
          status: string
          terms: string | null
          total_ht: number
          total_ttc: number
          total_vat: number
          updated_at: string
          vat_rate: number
        }
        Insert: {
          city?: string | null
          client_address?: string | null
          client_email?: string | null
          client_ice?: string | null
          client_name: string
          client_phone?: string | null
          created_at?: string
          created_by?: string | null
          deposit?: number
          discount?: number
          doc_type?: string
          due_date?: string | null
          id?: string
          intro_text?: string | null
          issue_date?: string
          net_to_pay?: number
          notes?: string | null
          number: string
          order_ref?: string | null
          pos_id?: string | null
          source_document_id?: string | null
          status?: string
          terms?: string | null
          total_ht?: number
          total_ttc?: number
          total_vat?: number
          updated_at?: string
          vat_rate?: number
        }
        Update: {
          city?: string | null
          client_address?: string | null
          client_email?: string | null
          client_ice?: string | null
          client_name?: string
          client_phone?: string | null
          created_at?: string
          created_by?: string | null
          deposit?: number
          discount?: number
          doc_type?: string
          due_date?: string | null
          id?: string
          intro_text?: string | null
          issue_date?: string
          net_to_pay?: number
          notes?: string | null
          number?: string
          order_ref?: string | null
          pos_id?: string | null
          source_document_id?: string | null
          status?: string
          terms?: string | null
          total_ht?: number
          total_ttc?: number
          total_vat?: number
          updated_at?: string
          vat_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "billing_documents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_documents_pos_id_fkey"
            columns: ["pos_id"]
            isOneToOne: false
            referencedRelation: "pos_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_documents_source_document_id_fkey"
            columns: ["source_document_id"]
            isOneToOne: false
            referencedRelation: "billing_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_payments: {
        Row: {
          amount: number
          created_at: string
          document_id: string
          id: string
          method: string
          note: string | null
          paid_at: string
          reference: string | null
        }
        Insert: {
          amount?: number
          created_at?: string
          document_id: string
          id?: string
          method?: string
          note?: string | null
          paid_at?: string
          reference?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          document_id?: string
          id?: string
          method?: string
          note?: string | null
          paid_at?: string
          reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_payments_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "billing_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_settings: {
        Row: {
          address: string | null
          capital: string | null
          company_name: string
          created_at: string
          currency: string
          default_vat: number
          email: string | null
          ice: string | null
          id: string
          if_number: string | null
          letterhead_url: string | null
          logo_url: string | null
          patente: string | null
          phone: string | null
          rc: string | null
          rib: string | null
          stamp_url: string | null
          terms: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          capital?: string | null
          company_name?: string
          created_at?: string
          currency?: string
          default_vat?: number
          email?: string | null
          ice?: string | null
          id?: string
          if_number?: string | null
          letterhead_url?: string | null
          logo_url?: string | null
          patente?: string | null
          phone?: string | null
          rc?: string | null
          rib?: string | null
          stamp_url?: string | null
          terms?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          capital?: string | null
          company_name?: string
          created_at?: string
          currency?: string
          default_vat?: number
          email?: string | null
          ice?: string | null
          id?: string
          if_number?: string | null
          letterhead_url?: string | null
          logo_url?: string | null
          patente?: string | null
          phone?: string | null
          rc?: string | null
          rib?: string | null
          stamp_url?: string | null
          terms?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author_id: string | null
          author_name: string | null
          category: string | null
          content: string | null
          cover_image_url: string | null
          created_at: string
          excerpt: string | null
          id: string
          published_at: string | null
          read_minutes: number | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          tags: Json
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          author_name?: string | null
          category?: string | null
          content?: string | null
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          published_at?: string | null
          read_minutes?: number | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          tags?: Json
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          author_name?: string | null
          category?: string | null
          content?: string | null
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          published_at?: string | null
          read_minutes?: number | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          tags?: Json
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          company: string | null
          created_at: string
          email: string
          full_name: string
          handled_by: string | null
          id: string
          message: string
          phone: string | null
          service_interest: string | null
          status: Database["public"]["Enums"]["message_status"]
          subject: string | null
          updated_at: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          email: string
          full_name: string
          handled_by?: string | null
          id?: string
          message: string
          phone?: string | null
          service_interest?: string | null
          status?: Database["public"]["Enums"]["message_status"]
          subject?: string | null
          updated_at?: string
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string
          full_name?: string
          handled_by?: string | null
          id?: string
          message?: string
          phone?: string | null
          service_interest?: string | null
          status?: Database["public"]["Enums"]["message_status"]
          subject?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_messages_handled_by_fkey"
            columns: ["handled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      content_images: {
        Row: {
          alt_text: string | null
          created_at: string
          id: string
          image_key: string
          page_slug: string
          updated_at: string
          url: string | null
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          id?: string
          image_key: string
          page_slug: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          id?: string
          image_key?: string
          page_slug?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: []
      }
      content_texts: {
        Row: {
          created_at: string
          id: string
          page_slug: string
          style: Json
          text_key: string
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          id?: string
          page_slug: string
          style?: Json
          text_key: string
          updated_at?: string
          value?: string
        }
        Update: {
          created_at?: string
          id?: string
          page_slug?: string
          style?: Json
          text_key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      expense_categories: {
        Row: {
          accounting_account: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          accounting_account?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          accounting_account?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          account_id: string | null
          amount_ht: number
          amount_ttc: number
          category_id: string | null
          created_at: string
          created_by: string | null
          description: string
          expense_date: string
          id: string
          notes: string | null
          payment_method: string
          pos_id: string | null
          receipt_url: string | null
          supplier_id: string | null
          supplier_invoice_id: string | null
          updated_at: string
          vat_amount: number
          vat_rate: number
        }
        Insert: {
          account_id?: string | null
          amount_ht?: number
          amount_ttc?: number
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          expense_date?: string
          id?: string
          notes?: string | null
          payment_method?: string
          pos_id?: string | null
          receipt_url?: string | null
          supplier_id?: string | null
          supplier_invoice_id?: string | null
          updated_at?: string
          vat_amount?: number
          vat_rate?: number
        }
        Update: {
          account_id?: string | null
          amount_ht?: number
          amount_ttc?: number
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          expense_date?: string
          id?: string
          notes?: string | null
          payment_method?: string
          pos_id?: string | null
          receipt_url?: string | null
          supplier_id?: string | null
          supplier_invoice_id?: string | null
          updated_at?: string
          vat_amount?: number
          vat_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "expenses_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "financial_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_pos_id_fkey"
            columns: ["pos_id"]
            isOneToOne: false
            referencedRelation: "pos_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_supplier_invoice_id_fkey"
            columns: ["supplier_invoice_id"]
            isOneToOne: false
            referencedRelation: "supplier_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_settings: {
        Row: {
          account_bank: string
          account_cash: string
          account_client: string
          account_expense_default: string
          account_sales: string
          account_supplier: string
          account_vat_collected: string
          account_vat_deductible: string
          created_at: string
          currency: string
          default_vat: number
          id: string
          low_bank_threshold: number
          low_cash_threshold: number
          updated_at: string
        }
        Insert: {
          account_bank?: string
          account_cash?: string
          account_client?: string
          account_expense_default?: string
          account_sales?: string
          account_supplier?: string
          account_vat_collected?: string
          account_vat_deductible?: string
          created_at?: string
          currency?: string
          default_vat?: number
          id?: string
          low_bank_threshold?: number
          low_cash_threshold?: number
          updated_at?: string
        }
        Update: {
          account_bank?: string
          account_cash?: string
          account_client?: string
          account_expense_default?: string
          account_sales?: string
          account_supplier?: string
          account_vat_collected?: string
          account_vat_deductible?: string
          created_at?: string
          currency?: string
          default_vat?: number
          id?: string
          low_bank_threshold?: number
          low_cash_threshold?: number
          updated_at?: string
        }
        Relationships: []
      }
      financial_accounts: {
        Row: {
          account_type: string
          accounting_account: string | null
          bank_name: string | null
          created_at: string
          currency: string
          iban: string | null
          id: string
          is_active: boolean
          name: string
          notes: string | null
          opening_balance: number
          pos_id: string | null
          rib: string | null
          updated_at: string
        }
        Insert: {
          account_type?: string
          accounting_account?: string | null
          bank_name?: string | null
          created_at?: string
          currency?: string
          iban?: string | null
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          opening_balance?: number
          pos_id?: string | null
          rib?: string | null
          updated_at?: string
        }
        Update: {
          account_type?: string
          accounting_account?: string | null
          bank_name?: string | null
          created_at?: string
          currency?: string
          iban?: string | null
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          opening_balance?: number
          pos_id?: string | null
          rib?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_accounts_pos_id_fkey"
            columns: ["pos_id"]
            isOneToOne: false
            referencedRelation: "pos_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_transactions: {
        Row: {
          account_id: string | null
          amount: number
          attachment_url: string | null
          billing_document_id: string | null
          comment: string | null
          created_at: string
          created_by: string | null
          expense_id: string | null
          id: string
          is_reconciled: boolean
          label: string
          party_name: string | null
          party_type: string | null
          payment_method: string
          pos_id: string | null
          reconciled_at: string | null
          reference: string | null
          supplier_id: string | null
          supplier_invoice_id: string | null
          target_account_id: string | null
          tx_date: string
          tx_type: string
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          amount?: number
          attachment_url?: string | null
          billing_document_id?: string | null
          comment?: string | null
          created_at?: string
          created_by?: string | null
          expense_id?: string | null
          id?: string
          is_reconciled?: boolean
          label?: string
          party_name?: string | null
          party_type?: string | null
          payment_method?: string
          pos_id?: string | null
          reconciled_at?: string | null
          reference?: string | null
          supplier_id?: string | null
          supplier_invoice_id?: string | null
          target_account_id?: string | null
          tx_date?: string
          tx_type?: string
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          attachment_url?: string | null
          billing_document_id?: string | null
          comment?: string | null
          created_at?: string
          created_by?: string | null
          expense_id?: string | null
          id?: string
          is_reconciled?: boolean
          label?: string
          party_name?: string | null
          party_type?: string | null
          payment_method?: string
          pos_id?: string | null
          reconciled_at?: string | null
          reference?: string | null
          supplier_id?: string | null
          supplier_invoice_id?: string | null
          target_account_id?: string | null
          tx_date?: string
          tx_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "financial_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_billing_document_id_fkey"
            columns: ["billing_document_id"]
            isOneToOne: false
            referencedRelation: "billing_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_pos_id_fkey"
            columns: ["pos_id"]
            isOneToOne: false
            referencedRelation: "pos_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_supplier_invoice_id_fkey"
            columns: ["supplier_invoice_id"]
            isOneToOne: false
            referencedRelation: "supplier_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_target_account_id_fkey"
            columns: ["target_account_id"]
            isOneToOne: false
            referencedRelation: "financial_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      fiscal_periods: {
        Row: {
          closed_at: string | null
          created_at: string
          end_date: string
          id: string
          is_closed: boolean
          label: string
          start_date: string
          updated_at: string
        }
        Insert: {
          closed_at?: string | null
          created_at?: string
          end_date: string
          id?: string
          is_closed?: boolean
          label: string
          start_date: string
          updated_at?: string
        }
        Update: {
          closed_at?: string | null
          created_at?: string
          end_date?: string
          id?: string
          is_closed?: boolean
          label?: string
          start_date?: string
          updated_at?: string
        }
        Relationships: []
      }
      media_assets: {
        Row: {
          alt_text: string | null
          bucket: string
          created_at: string
          file_name: string | null
          folder: string | null
          height: number | null
          id: string
          mime_type: string | null
          path: string
          public_url: string | null
          size_bytes: number | null
          updated_at: string
          uploaded_by: string | null
          width: number | null
        }
        Insert: {
          alt_text?: string | null
          bucket?: string
          created_at?: string
          file_name?: string | null
          folder?: string | null
          height?: number | null
          id?: string
          mime_type?: string | null
          path: string
          public_url?: string | null
          size_bytes?: number | null
          updated_at?: string
          uploaded_by?: string | null
          width?: number | null
        }
        Update: {
          alt_text?: string | null
          bucket?: string
          created_at?: string
          file_name?: string | null
          folder?: string | null
          height?: number | null
          id?: string
          mime_type?: string | null
          path?: string
          public_url?: string | null
          size_bytes?: number | null
          updated_at?: string
          uploaded_by?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "media_assets_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      packages: {
        Row: {
          billing_period: string | null
          category_id: string | null
          created_at: string
          cta_label: string | null
          currency: string
          description: string | null
          features: Json
          id: string
          is_popular: boolean
          name: string
          price: number | null
          slug: string
          sort_order: number
          status: Database["public"]["Enums"]["content_status"]
          updated_at: string
        }
        Insert: {
          billing_period?: string | null
          category_id?: string | null
          created_at?: string
          cta_label?: string | null
          currency?: string
          description?: string | null
          features?: Json
          id?: string
          is_popular?: boolean
          name: string
          price?: number | null
          slug: string
          sort_order?: number
          status?: Database["public"]["Enums"]["content_status"]
          updated_at?: string
        }
        Update: {
          billing_period?: string | null
          category_id?: string | null
          created_at?: string
          cta_label?: string | null
          currency?: string
          description?: string | null
          features?: Json
          id?: string
          is_popular?: boolean
          name?: string
          price?: number | null
          slug?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["content_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "packages_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      page_sections: {
        Row: {
          body: string | null
          created_at: string
          cta_label: string | null
          cta_url: string | null
          data: Json
          heading: string | null
          id: string
          image_url: string | null
          page_id: string
          section_key: string
          sort_order: number
          status: Database["public"]["Enums"]["content_status"]
          subheading: string | null
          updated_at: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          cta_label?: string | null
          cta_url?: string | null
          data?: Json
          heading?: string | null
          id?: string
          image_url?: string | null
          page_id: string
          section_key: string
          sort_order?: number
          status?: Database["public"]["Enums"]["content_status"]
          subheading?: string | null
          updated_at?: string
        }
        Update: {
          body?: string | null
          created_at?: string
          cta_label?: string | null
          cta_url?: string | null
          data?: Json
          heading?: string | null
          id?: string
          image_url?: string | null
          page_id?: string
          section_key?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["content_status"]
          subheading?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "page_sections_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      pages: {
        Row: {
          created_at: string
          hero_image_url: string | null
          id: string
          seo_description: string | null
          seo_image_url: string | null
          seo_title: string | null
          slug: string
          sort_order: number
          status: Database["public"]["Enums"]["content_status"]
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          hero_image_url?: string | null
          id?: string
          seo_description?: string | null
          seo_image_url?: string | null
          seo_title?: string | null
          slug: string
          sort_order?: number
          status?: Database["public"]["Enums"]["content_status"]
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          hero_image_url?: string | null
          id?: string
          seo_description?: string | null
          seo_image_url?: string | null
          seo_title?: string | null
          slug?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["content_status"]
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      partners: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          name: string
          sort_order: number
          status: Database["public"]["Enums"]["content_status"]
          updated_at: string
          website_url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          sort_order?: number
          status?: Database["public"]["Enums"]["content_status"]
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["content_status"]
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      pos_locations: {
        Row: {
          address: string | null
          city: string | null
          code: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          phone: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          code?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          phone?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          code?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          phone?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          badge: string | null
          category_id: string | null
          created_at: string
          currency: string
          description: string | null
          gallery: Json
          id: string
          image_url: string | null
          is_featured: boolean
          name: string
          price: number | null
          slug: string
          sort_order: number
          specs: Json
          status: Database["public"]["Enums"]["content_status"]
          stock_quantity: number
          tagline: string | null
          updated_at: string
        }
        Insert: {
          badge?: string | null
          category_id?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          gallery?: Json
          id?: string
          image_url?: string | null
          is_featured?: boolean
          name: string
          price?: number | null
          slug: string
          sort_order?: number
          specs?: Json
          status?: Database["public"]["Enums"]["content_status"]
          stock_quantity?: number
          tagline?: string | null
          updated_at?: string
        }
        Update: {
          badge?: string | null
          category_id?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          gallery?: Json
          id?: string
          image_url?: string | null
          is_featured?: boolean
          name?: string
          price?: number | null
          slug?: string
          sort_order?: number
          specs?: Json
          status?: Database["public"]["Enums"]["content_status"]
          stock_quantity?: number
          tagline?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          category_id: string | null
          client: string | null
          content: string | null
          cover_image_url: string | null
          created_at: string
          gallery: Json
          id: string
          is_featured: boolean
          location: string | null
          slug: string
          sort_order: number
          status: Database["public"]["Enums"]["content_status"]
          summary: string | null
          tags: Json
          title: string
          updated_at: string
          year: number | null
        }
        Insert: {
          category_id?: string | null
          client?: string | null
          content?: string | null
          cover_image_url?: string | null
          created_at?: string
          gallery?: Json
          id?: string
          is_featured?: boolean
          location?: string | null
          slug: string
          sort_order?: number
          status?: Database["public"]["Enums"]["content_status"]
          summary?: string | null
          tags?: Json
          title: string
          updated_at?: string
          year?: number | null
        }
        Update: {
          category_id?: string | null
          client?: string | null
          content?: string | null
          cover_image_url?: string | null
          created_at?: string
          gallery?: Json
          id?: string
          is_featured?: boolean
          location?: string | null
          slug?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["content_status"]
          summary?: string | null
          tags?: Json
          title?: string
          updated_at?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      service_categories: {
        Row: {
          accent: string | null
          created_at: string
          description: string | null
          features: Json
          icon: string | null
          id: string
          image_url: string | null
          name: string
          slug: string
          sort_order: number
          status: Database["public"]["Enums"]["content_status"]
          tagline: string | null
          updated_at: string
        }
        Insert: {
          accent?: string | null
          created_at?: string
          description?: string | null
          features?: Json
          icon?: string | null
          id?: string
          image_url?: string | null
          name: string
          slug: string
          sort_order?: number
          status?: Database["public"]["Enums"]["content_status"]
          tagline?: string | null
          updated_at?: string
        }
        Update: {
          accent?: string | null
          created_at?: string
          description?: string | null
          features?: Json
          icon?: string | null
          id?: string
          image_url?: string | null
          name?: string
          slug?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["content_status"]
          tagline?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          label: string | null
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          label?: string | null
          updated_at?: string
          value?: Json
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          label?: string | null
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      supplier_invoices: {
        Row: {
          attachment_url: string | null
          created_at: string
          created_by: string | null
          description: string | null
          doc_type: string
          due_date: string | null
          id: string
          issue_date: string
          notes: string | null
          pos_id: string | null
          reference: string
          status: string
          supplier_id: string | null
          total_ht: number
          total_ttc: number
          total_vat: number
          updated_at: string
          vat_rate: number
        }
        Insert: {
          attachment_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          doc_type?: string
          due_date?: string | null
          id?: string
          issue_date?: string
          notes?: string | null
          pos_id?: string | null
          reference: string
          status?: string
          supplier_id?: string | null
          total_ht?: number
          total_ttc?: number
          total_vat?: number
          updated_at?: string
          vat_rate?: number
        }
        Update: {
          attachment_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          doc_type?: string
          due_date?: string | null
          id?: string
          issue_date?: string
          notes?: string | null
          pos_id?: string | null
          reference?: string
          status?: string
          supplier_id?: string | null
          total_ht?: number
          total_ttc?: number
          total_vat?: number
          updated_at?: string
          vat_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "supplier_invoices_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_invoices_pos_id_fkey"
            columns: ["pos_id"]
            isOneToOne: false
            referencedRelation: "pos_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_invoices_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          email: string | null
          ice: string | null
          id: string
          if_number: string | null
          is_active: boolean
          name: string
          notes: string | null
          payment_terms: string | null
          phone: string | null
          rc: string | null
          rib: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          ice?: string | null
          id?: string
          if_number?: string | null
          is_active?: boolean
          name: string
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          rc?: string | null
          rib?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          ice?: string | null
          id?: string
          if_number?: string | null
          is_active?: boolean
          name?: string
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          rc?: string | null
          rib?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      tax_rates: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          is_default: boolean
          label: string
          rate: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          label: string
          rate?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          label?: string
          rate?: number
          updated_at?: string
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          author_name: string
          author_role: string | null
          avatar_url: string | null
          company: string | null
          created_at: string
          id: string
          quote: string
          rating: number | null
          sort_order: number
          status: Database["public"]["Enums"]["content_status"]
          updated_at: string
        }
        Insert: {
          author_name: string
          author_role?: string | null
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          id?: string
          quote: string
          rating?: number | null
          sort_order?: number
          status?: Database["public"]["Enums"]["content_status"]
          updated_at?: string
        }
        Update: {
          author_name?: string
          author_role?: string | null
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          id?: string
          quote?: string
          rating?: number | null
          sort_order?: number
          status?: Database["public"]["Enums"]["content_status"]
          updated_at?: string
        }
        Relationships: []
      }
      user_permissions: {
        Row: {
          created_at: string
          maintenance_access: boolean
          modules: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          maintenance_access?: boolean
          modules?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          maintenance_access?: boolean
          modules?: Json
          updated_at?: string
          user_id?: string
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
      is_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "super_admin" | "admin" | "commercial" | "editor"
      content_status: "draft" | "published" | "archived"
      message_status: "new" | "read" | "replied" | "archived"
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
      app_role: ["super_admin", "admin", "commercial", "editor"],
      content_status: ["draft", "published", "archived"],
      message_status: ["new", "read", "replied", "archived"],
    },
  },
} as const
