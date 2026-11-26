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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          actor_user_id: string | null
          created_at: string
          id: number
          metadata: Json
          resource_id: string | null
          resource_type: string
          store_id: string | null
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          created_at?: string
          id?: never
          metadata?: Json
          resource_id?: string | null
          resource_type: string
          store_id?: string | null
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          created_at?: string
          id?: never
          metadata?: Json
          resource_id?: string | null
          resource_type?: string
          store_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_products: {
        Row: {
          collection_id: string
          position: number
          product_id: string
        }
        Insert: {
          collection_id: string
          position?: number
          product_id: string
        }
        Update: {
          collection_id?: string
          position?: number
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_products_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_published: boolean
          name: string
          position: number
          slug: string
          store_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          name: string
          position?: number
          slug: string
          store_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          name?: string
          position?: number
          slug?: string
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "collections_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          auth_user_id: string | null
          created_at: string
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          marketing_consent: boolean
          marketing_consent_at: string | null
          phone: string | null
          store_id: string
          updated_at: string
        }
        Insert: {
          auth_user_id?: string | null
          created_at?: string
          email: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          marketing_consent?: boolean
          marketing_consent_at?: string | null
          phone?: string | null
          store_id: string
          updated_at?: string
        }
        Update: {
          auth_user_id?: string | null
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          marketing_consent?: boolean
          marketing_consent_at?: string | null
          phone?: string | null
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_queue: {
        Row: {
          attempts: number
          channel: string
          created_at: string
          id: string
          last_error: string | null
          payload: Json
          recipient: string
          scheduled_for: string
          sent_at: string | null
          status: string
          store_id: string
          template_key: string
        }
        Insert: {
          attempts?: number
          channel: string
          created_at?: string
          id?: string
          last_error?: string | null
          payload?: Json
          recipient: string
          scheduled_for?: string
          sent_at?: string | null
          status?: string
          store_id: string
          template_key: string
        }
        Update: {
          attempts?: number
          channel?: string
          created_at?: string
          id?: string
          last_error?: string | null
          payload?: Json
          recipient?: string
          scheduled_for?: string
          sent_at?: string | null
          status?: string
          store_id?: string
          template_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_queue_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          id: string
          line_total: number
          order_id: string
          product_id: string | null
          product_name: string
          product_snapshot: Json
          quantity: number
          sku: string | null
          unit_price: number
        }
        Insert: {
          id?: string
          line_total: number
          order_id: string
          product_id?: string | null
          product_name: string
          product_snapshot?: Json
          quantity: number
          sku?: string | null
          unit_price: number
        }
        Update: {
          id?: string
          line_total?: number
          order_id?: string
          product_id?: string | null
          product_name?: string
          product_snapshot?: Json
          quantity?: number
          sku?: string | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          billing_address: Json | null
          created_at: string
          currency: string
          customer_email: string
          customer_id: string | null
          customer_note: string | null
          discount_total: number
          grand_total: number
          id: string
          order_number: number
          payment_status: string
          placed_at: string
          shipping_address: Json | null
          shipping_total: number
          status: string
          store_id: string
          subtotal: number
          tax_total: number
          updated_at: string
        }
        Insert: {
          billing_address?: Json | null
          created_at?: string
          currency?: string
          customer_email: string
          customer_id?: string | null
          customer_note?: string | null
          discount_total?: number
          grand_total?: number
          id?: string
          order_number?: never
          payment_status?: string
          placed_at?: string
          shipping_address?: Json | null
          shipping_total?: number
          status?: string
          store_id: string
          subtotal?: number
          tax_total?: number
          updated_at?: string
        }
        Update: {
          billing_address?: Json | null
          created_at?: string
          currency?: string
          customer_email?: string
          customer_id?: string | null
          customer_note?: string | null
          discount_total?: number
          grand_total?: number
          id?: string
          order_number?: never
          payment_status?: string
          placed_at?: string
          shipping_address?: Json | null
          shipping_total?: number
          status?: string
          store_id?: string
          subtotal?: number
          tax_total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_provider_connections: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          last_verified_at: string | null
          merchant_reference: string | null
          provider: string
          public_config: Json
          secret_vault_id: string | null
          status: string
          store_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id?: string
          last_verified_at?: string | null
          merchant_reference?: string | null
          provider: string
          public_config?: Json
          secret_vault_id?: string | null
          status?: string
          store_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          last_verified_at?: string | null
          merchant_reference?: string | null
          provider?: string
          public_config?: Json
          secret_vault_id?: string | null
          status?: string
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_provider_connections_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_transactions: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          order_id: string | null
          provider: string
          provider_payload: Json
          provider_transaction_id: string | null
          status: string
          store_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          order_id?: string | null
          provider: string
          provider_payload?: Json
          provider_transaction_id?: string | null
          status?: string
          store_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          order_id?: string | null
          provider?: string
          provider_payload?: Json
          provider_transaction_id?: string | null
          status?: string
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          advanced_analytics: boolean
          advanced_marketing: boolean
          advanced_theme_customization: boolean
          theme_access: string[]
          code: string
          created_at: string
          custom_domain: boolean
          customer_accounts: boolean
          is_active: boolean
          max_bookings: number
          max_digital_products: number
          max_product_images: number
          max_products: number
          max_stores: number
          max_team_members: number
          monthly_price_zar: number
          name: string
          notifications: Json
          professional_email: boolean
          updated_at: string
        }
        Insert: {
          advanced_analytics?: boolean
          advanced_marketing?: boolean
          advanced_theme_customization?: boolean
          theme_access?: string[]
          code: string
          created_at?: string
          custom_domain?: boolean
          customer_accounts?: boolean
          is_active?: boolean
          max_bookings: number
          max_digital_products: number
          max_product_images: number
          max_products: number
          max_stores: number
          max_team_members: number
          monthly_price_zar: number
          name: string
          notifications?: Json
          professional_email?: boolean
          updated_at?: string
        }
        Update: {
          advanced_analytics?: boolean
          advanced_marketing?: boolean
          advanced_theme_customization?: boolean
          theme_access?: string[]
          code?: string
          created_at?: string
          custom_domain?: boolean
          customer_accounts?: boolean
          is_active?: boolean
          max_bookings?: number
          max_digital_products?: number
          max_product_images?: number
          max_products?: number
          max_stores?: number
          max_team_members?: number
          monthly_price_zar?: number
          name?: string
          notifications?: Json
          professional_email?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      product_images: {
        Row: {
          alt_text: string | null
          created_at: string
          id: string
          position: number
          product_id: string
          storage_path: string
          store_id: string
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          id?: string
          position?: number
          product_id: string
          storage_path: string
          store_id: string
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          id?: string
          position?: number
          product_id?: string
          storage_path?: string
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_store_fk"
            columns: ["product_id", "store_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id", "store_id"]
          },
          {
            foreignKeyName: "product_images_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          allow_backorder: boolean
          barcode: string | null
          category: string | null
          compare_at_price: number | null
          cost_price: number | null
          created_at: string
          description: string | null
          digital_asset_path: string | null
          id: string
          inventory_quantity: number
          is_taxable: boolean
          metadata: Json
          name: string
          price: number
          product_type: string
          sku: string | null
          slug: string
          status: string
          store_id: string
          track_inventory: boolean
          updated_at: string
          weight_grams: number | null
        }
        Insert: {
          allow_backorder?: boolean
          barcode?: string | null
          category?: string | null
          compare_at_price?: number | null
          cost_price?: number | null
          created_at?: string
          description?: string | null
          digital_asset_path?: string | null
          id?: string
          inventory_quantity?: number
          is_taxable?: boolean
          metadata?: Json
          name: string
          price?: number
          product_type?: string
          sku?: string | null
          slug: string
          status?: string
          store_id: string
          track_inventory?: boolean
          updated_at?: string
          weight_grams?: number | null
        }
        Update: {
          allow_backorder?: boolean
          barcode?: string | null
          category?: string | null
          compare_at_price?: number | null
          cost_price?: number | null
          created_at?: string
          description?: string | null
          digital_asset_path?: string | null
          id?: string
          inventory_quantity?: number
          is_taxable?: boolean
          metadata?: Json
          name?: string
          price?: number
          product_type?: string
          sku?: string | null
          slug?: string
          status?: string
          store_id?: string
          track_inventory?: boolean
          updated_at?: string
          weight_grams?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          platform_role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          platform_role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          platform_role?: string
          updated_at?: string
        }
        Relationships: []
      }
      store_domains: {
        Row: {
          created_at: string
          domain: string
          id: string
          is_primary: boolean
          ssl_status: string
          store_id: string
          updated_at: string
          verification_status: string
          verification_token: string
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          domain: string
          id?: string
          is_primary?: boolean
          ssl_status?: string
          store_id: string
          updated_at?: string
          verification_status?: string
          verification_token?: string
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          domain?: string
          id?: string
          is_primary?: boolean
          ssl_status?: string
          store_id?: string
          updated_at?: string
          verification_status?: string
          verification_token?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "store_domains_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_email_provisioning: {
        Row: {
          created_at: string
          id: string
          last_error: string | null
          mailbox_address: string | null
          provider: string | null
          provider_reference: string | null
          status: string
          store_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_error?: string | null
          mailbox_address?: string | null
          provider?: string | null
          provider_reference?: string | null
          status?: string
          store_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          last_error?: string | null
          mailbox_address?: string | null
          provider?: string | null
          provider_reference?: string | null
          status?: string
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_email_provisioning_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_members: {
        Row: {
          id: string
          invited_by: string | null
          joined_at: string
          role: string
          store_id: string
          user_id: string
        }
        Insert: {
          id?: string
          invited_by?: string | null
          joined_at?: string
          role?: string
          store_id: string
          user_id: string
        }
        Update: {
          id?: string
          invited_by?: string | null
          joined_at?: string
          role?: string
          store_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_members_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_subscriptions: {
        Row: {
          billing_provider: string | null
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_code: string
          provider_customer_reference: string | null
          provider_subscription_reference: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          billing_provider?: string | null
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_code: string
          provider_customer_reference?: string | null
          provider_subscription_reference?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          billing_provider?: string | null
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_code?: string
          provider_customer_reference?: string | null
          provider_subscription_reference?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_subscriptions_plan_code_fkey"
            columns: ["plan_code"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["code"]
          },
        ]
      }
      store_usage_monthly: {
        Row: {
          bookings_count: number
          digital_products_count: number
          notification_count: number
          period_start: string
          products_count: number
          storage_bytes: number
          store_id: string
          updated_at: string
        }
        Insert: {
          bookings_count?: number
          digital_products_count?: number
          notification_count?: number
          period_start: string
          products_count?: number
          storage_bytes?: number
          store_id: string
          updated_at?: string
        }
        Update: {
          bookings_count?: number
          digital_products_count?: number
          notification_count?: number
          period_start?: string
          products_count?: number
          storage_bytes?: number
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_usage_monthly_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          country_code: string
          created_at: string
          currency: string
          description: string | null
          favicon_url: string | null
          id: string
          logo_url: string | null
          name: string
          owner_user_id: string
          settings: Json
          slug: string
          status: string
          storefront_theme_id: string
          storefront_appearance: Json
          support_email: string | null
          support_phone: string | null
          timezone: string
          updated_at: string
        }
        Insert: {
          country_code?: string
          created_at?: string
          currency?: string
          description?: string | null
          favicon_url?: string | null
          id?: string
          logo_url?: string | null
          name: string
          owner_user_id: string
          settings?: Json
          slug: string
          status?: string
          support_email?: string | null
          support_phone?: string | null
          timezone?: string
          updated_at?: string
        }
        Update: {
          country_code?: string
          created_at?: string
          currency?: string
          description?: string | null
          favicon_url?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          owner_user_id?: string
          settings?: Json
          slug?: string
          status?: string
          support_email?: string | null
          support_phone?: string | null
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      storefront_stores: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          logo_url: string | null
          favicon_url: string | null
          currency: string
          country_code: string
          storefront_theme_id: string
          storefront_appearance: Json
        }
        Relationships: []
      }
      storefront_products: {
        Row: {
          id: string
          store_id: string
          name: string
          slug: string
          description: string | null
          product_type: string
          price: number
          compare_at_price: number | null
          category: string | null
          is_taxable: boolean
          weight_grams: number | null
        }
        Relationships: []
      }
      storefront_product_images: {
        Row: {
          id: string
          product_id: string
          store_id: string
          storage_path: string
          alt_text: string | null
          position: number
        }
        Relationships: []
      }
      storefront_collections: {
        Row: {
          id: string
          store_id: string
          name: string
          slug: string
          description: string | null
          position: number
        }
        Relationships: []
      }
      storefront_collection_products: {
        Row: {
          collection_id: string
          product_id: string
          position: number
        }
        Relationships: []
      }
    }
    Functions: {
      create_store_for_current_user: {
        Args: {
          store_description?: string
          store_name: string
          store_slug: string
        }
        Returns: {
          country_code: string
          created_at: string
          currency: string
          description: string | null
          favicon_url: string | null
          id: string
          logo_url: string | null
          name: string
          owner_user_id: string
          settings: Json
          slug: string
          status: string
          storefront_theme_id: string
          storefront_appearance: Json
          support_email: string | null
          support_phone: string | null
          timezone: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "stores"
          isOneToOne: true
          isSetofReturn: false
        }
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
    Enums: {},
  },
} as const
