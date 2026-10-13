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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      abandoned_carts: {
        Row: {
          cart_items: Json
          created_at: string
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          id: string
          recovered_at: string | null
          recovery_status: string | null
          reminder_sent_at: string | null
          session_id: string | null
          total_amount: number | null
          updated_at: string
        }
        Insert: {
          cart_items: Json
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          recovered_at?: string | null
          recovery_status?: string | null
          reminder_sent_at?: string | null
          session_id?: string | null
          total_amount?: number | null
          updated_at?: string
        }
        Update: {
          cart_items?: Json
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          recovered_at?: string | null
          recovery_status?: string | null
          reminder_sent_at?: string | null
          session_id?: string | null
          total_amount?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      auth_rate_limits: {
        Row: {
          blocked_until: string | null
          count: number | null
          last_attempt_at: string | null
          phone: string
        }
        Insert: {
          blocked_until?: string | null
          count?: number | null
          last_attempt_at?: string | null
          phone: string
        }
        Update: {
          blocked_until?: string | null
          count?: number | null
          last_attempt_at?: string | null
          phone?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author: string | null
          content: string | null
          created_at: string
          id: string
          image_key: string | null
          image_url: string | null
          published_at: string | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          author?: string | null
          content?: string | null
          created_at?: string
          id?: string
          image_key?: string | null
          image_url?: string | null
          published_at?: string | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          author?: string | null
          content?: string | null
          created_at?: string
          id?: string
          image_key?: string | null
          image_url?: string | null
          published_at?: string | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_hint: string | null
          image_url: string | null
          is_trending: boolean | null
          link_url: string | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id: string
          image_hint?: string | null
          image_url?: string | null
          is_trending?: boolean | null
          link_url?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_hint?: string | null
          image_url?: string | null
          is_trending?: boolean | null
          link_url?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      coupon_redemptions: {
        Row: {
          coupon_code: string
          created_at: string
          discount_amount: number
          id: string
          order_id: string
        }
        Insert: {
          coupon_code: string
          created_at?: string
          discount_amount: number
          id?: string
          order_id: string
        }
        Update: {
          coupon_code?: string
          created_at?: string
          discount_amount?: number
          id?: string
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_redemptions_coupon_code_fkey"
            columns: ["coupon_code"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "coupon_redemptions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          active: boolean
          code: string
          created_at: string
          type: Database["public"]["Enums"]["coupon_type"]
          updated_at: string
          value: number
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          type: Database["public"]["Enums"]["coupon_type"]
          updated_at?: string
          value: number
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          type?: Database["public"]["Enums"]["coupon_type"]
          updated_at?: string
          value?: number
        }
        Relationships: []
      }
      customer_addresses: {
        Row: {
          address_line: string
          area: string | null
          city: string
          created_at: string
          customer_id: string
          full_name: string
          id: string
          is_default: boolean | null
          phone: string | null
          pincode: string
          state: string
          updated_at: string
        }
        Insert: {
          address_line: string
          area?: string | null
          city: string
          created_at?: string
          customer_id: string
          full_name: string
          id?: string
          is_default?: boolean | null
          phone?: string | null
          pincode: string
          state: string
          updated_at?: string
        }
        Update: {
          address_line?: string
          area?: string | null
          city?: string
          created_at?: string
          customer_id?: string
          full_name?: string
          id?: string
          is_default?: boolean | null
          phone?: string | null
          pincode?: string
          state?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_addresses_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_uploads: {
        Row: {
          created_at: string
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          mime_type: string | null
          order_item_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          mime_type?: string | null
          order_item_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          mime_type?: string | null
          order_item_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_uploads_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string
          updated_at?: string
        }
        Relationships: []
      }
      lead_analytics: {
        Row: {
          city: string | null
          country: string | null
          created_at: string
          element_selector: string | null
          event_type: string
          id: string
          ip_address: unknown
          page_url: string | null
          referrer: string | null
          session_id: string | null
          timestamp: string
          user_agent: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string
          element_selector?: string | null
          event_type: string
          id?: string
          ip_address?: unknown
          page_url?: string | null
          referrer?: string | null
          session_id?: string | null
          timestamp?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string
          element_selector?: string | null
          event_type?: string
          id?: string
          ip_address?: unknown
          page_url?: string | null
          referrer?: string | null
          session_id?: string | null
          timestamp?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      marketing_campaigns: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          name: string
          recipients: string[] | null
          status: string | null
          template_name: string | null
          variable_names: string[] | null
          variables: Json | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          recipients?: string[] | null
          status?: string | null
          template_name?: string | null
          variable_names?: string[] | null
          variables?: Json | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          recipients?: string[] | null
          status?: string | null
          template_name?: string | null
          variable_names?: string[] | null
          variables?: Json | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          image_hint: string | null
          image_url: string | null
          order_id: string
          product_id: string | null
          product_name: string
          quantity: number
          sku: string | null
          total_price: number
          unit_price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_hint?: string | null
          image_url?: string | null
          order_id: string
          product_id?: string | null
          product_name: string
          quantity: number
          sku?: string | null
          total_price: number
          unit_price: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          image_hint?: string | null
          image_url?: string | null
          order_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          sku?: string | null
          total_price?: number
          unit_price?: number
          updated_at?: string
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
      order_status_history: {
        Row: {
          admin_note: string | null
          created_at: string
          created_by: string | null
          id: string
          new_status: string
          old_status: string | null
          order_id: string
          reason: string | null
        }
        Insert: {
          admin_note?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          new_status: string
          old_status?: string | null
          order_id: string
          reason?: string | null
        }
        Update: {
          admin_note?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          new_status?: string
          old_status?: string | null
          order_id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          admin_notes: string | null
          advance_amount: number | null
          created_at: string
          customer_address: string | null
          customer_id: string | null
          customer_name: string | null
          customer_phone: string | null
          external_order_id: string | null
          extra_note: string | null
          id: string
          payment_status: string | null
          refund_amount: number | null
          refund_reason: string | null
          return_reason: string | null
          shipping_cost: number | null
          status: string | null
          subtotal_amount: number | null
          total_amount: number | null
          transaction_id: string | null
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          advance_amount?: number | null
          created_at?: string
          customer_address?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          external_order_id?: string | null
          extra_note?: string | null
          id?: string
          payment_status?: string | null
          refund_amount?: number | null
          refund_reason?: string | null
          return_reason?: string | null
          shipping_cost?: number | null
          status?: string | null
          subtotal_amount?: number | null
          total_amount?: number | null
          transaction_id?: string | null
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          advance_amount?: number | null
          created_at?: string
          customer_address?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          external_order_id?: string | null
          extra_note?: string | null
          id?: string
          payment_status?: string | null
          refund_amount?: number | null
          refund_reason?: string | null
          return_reason?: string | null
          shipping_cost?: number | null
          status?: string | null
          subtotal_amount?: number | null
          total_amount?: number | null
          transaction_id?: string | null
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
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          order_id: string
          provider: string
          provider_order_id: string | null
          raw_response: Json | null
          session_id: string | null
          status: string
          transaction_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          order_id: string
          provider: string
          provider_order_id?: string | null
          raw_response?: Json | null
          session_id?: string | null
          status: string
          transaction_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          order_id?: string
          provider?: string
          provider_order_id?: string | null
          raw_response?: Json | null
          session_id?: string | null
          status?: string
          transaction_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          allow_image_upload: boolean | null
          badge: string | null
          category_id: string
          color: string | null
          color_options: Json | null
          created_at: string
          description: string | null
          dimensions_height: number | null
          dimensions_length: number | null
          dimensions_width: number | null
          features: string[] | null
          gallery_images: string[] | null
          id: string
          image_alt: string | null
          image_attribution: string | null
          image_hint: string | null
          image_url: string | null
          inventory: number | null
          license: string | null
          material: string | null
          media_url_1: string | null
          media_url_2: string | null
          media_url_3: string | null
          name: string
          price: number
          rating: number | null
          regular_price: number | null
          review_count: number | null
          sale_price: number | null
          short_description: string | null
          specific_description: string | null
          sub_category: string | null
          tags: string[] | null
          updated_at: string
          video_url: string | null
          weight_grams: number | null
        }
        Insert: {
          allow_image_upload?: boolean | null
          badge?: string | null
          category_id: string
          color?: string | null
          color_options?: Json | null
          created_at?: string
          description?: string | null
          dimensions_height?: number | null
          dimensions_length?: number | null
          dimensions_width?: number | null
          features?: string[] | null
          gallery_images?: string[] | null
          id: string
          image_alt?: string | null
          image_attribution?: string | null
          image_hint?: string | null
          image_url?: string | null
          inventory?: number | null
          license?: string | null
          material?: string | null
          media_url_1?: string | null
          media_url_2?: string | null
          media_url_3?: string | null
          name: string
          price: number
          rating?: number | null
          regular_price?: number | null
          review_count?: number | null
          sale_price?: number | null
          short_description?: string | null
          specific_description?: string | null
          sub_category?: string | null
          tags?: string[] | null
          updated_at?: string
          video_url?: string | null
          weight_grams?: number | null
        }
        Update: {
          allow_image_upload?: boolean | null
          badge?: string | null
          category_id?: string
          color?: string | null
          color_options?: Json | null
          created_at?: string
          description?: string | null
          dimensions_height?: number | null
          dimensions_length?: number | null
          dimensions_width?: number | null
          features?: string[] | null
          gallery_images?: string[] | null
          id?: string
          image_alt?: string | null
          image_attribution?: string | null
          image_hint?: string | null
          image_url?: string | null
          inventory?: number | null
          license?: string | null
          material?: string | null
          media_url_1?: string | null
          media_url_2?: string | null
          media_url_3?: string | null
          name?: string
          price?: number
          rating?: number | null
          regular_price?: number | null
          review_count?: number | null
          sale_price?: number | null
          short_description?: string | null
          specific_description?: string | null
          sub_category?: string | null
          tags?: string[] | null
          updated_at?: string
          video_url?: string | null
          weight_grams?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_products_sub_category"
            columns: ["sub_category"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          customer_id: string | null
          customer_name: string | null
          id: string
          is_approved: boolean | null
          product_id: string | null
          rating: number | null
          updated_at: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          customer_id?: string | null
          customer_name?: string | null
          id?: string
          is_approved?: boolean | null
          product_id?: string | null
          rating?: number | null
          updated_at?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          customer_id?: string | null
          customer_name?: string | null
          id?: string
          is_approved?: boolean | null
          product_id?: string | null
          rating?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      site_images: {
        Row: {
          button_text: string | null
          created_at: string
          description: string | null
          id: string
          image_hint: string | null
          image_url: string
          is_visible: boolean | null
          link_url: string | null
          name: string | null
          updated_at: string
        }
        Insert: {
          button_text?: string | null
          created_at?: string
          description?: string | null
          id: string
          image_hint?: string | null
          image_url: string
          is_visible?: boolean | null
          link_url?: string | null
          name?: string | null
          updated_at?: string
        }
        Update: {
          button_text?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_hint?: string | null
          image_url?: string
          is_visible?: boolean | null
          link_url?: string | null
          name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          banner_effect: string | null
          cart_abandonment_delay_hours: number | null
          cart_abandonment_enabled: boolean | null
          cart_abandonment_whatsapp_template: string | null
          contact_address: string | null
          contact_email: string | null
          contact_hours: string | null
          contact_phone: string | null
          created_at: string
          customer_login_enabled: boolean | null
          expected_delivery_max_days: number | null
          expected_delivery_min_days: number | null
          free_shipping_threshold: number | null
          google_tag_manager_id: string | null
          google_verification_code: string | null
          hero_button_link: string | null
          hero_button_text: string | null
          hero_mobile_image_id: string | null
          hero_subtitle: string | null
          hero_title: string | null
          home_meta_description: string | null
          home_meta_title: string | null
          id: boolean
          invoice_business_address: string | null
          invoice_business_name: string | null
          invoice_currency_symbol: string | null
          invoice_email: string | null
          invoice_gst_number: string | null
          invoice_logo_url: string | null
          invoice_phone: string | null
          invoice_tax_percent: number | null
          invoice_terms: string | null
          logo_url: string | null
          maintenance_mode_enabled: boolean | null
          maintenance_mode_message: string | null
          owner_first_name: string | null
          owner_last_name: string | null
          payment_gateway: string
          product_id_prefix: string | null
          promo_banner_enabled: boolean | null
          promo_banner_subtitle: string | null
          promo_banner_title: string | null
          redirects: string | null
          social_facebook: string | null
          social_instagram: string | null
          social_linkedin: string | null
          social_twitter: string | null
          social_youtube: string | null
          theme_background: string | null
          theme_gradient: string | null
          theme_muted: string | null
          timer_banner_enabled: boolean | null
          timer_banner_end_date: string | null
          timer_banner_image_url: string | null
          timer_banner_title: string | null
          updated_at: string
          upload_provider: string | null
          whatsapp_only_checkout_enabled: boolean | null
          whatsapp_otp_template: string | null
        }
        Insert: {
          banner_effect?: string | null
          cart_abandonment_delay_hours?: number | null
          cart_abandonment_enabled?: boolean | null
          cart_abandonment_whatsapp_template?: string | null
          contact_address?: string | null
          contact_email?: string | null
          contact_hours?: string | null
          contact_phone?: string | null
          created_at?: string
          customer_login_enabled?: boolean | null
          expected_delivery_max_days?: number | null
          expected_delivery_min_days?: number | null
          free_shipping_threshold?: number | null
          google_tag_manager_id?: string | null
          google_verification_code?: string | null
          hero_button_link?: string | null
          hero_button_text?: string | null
          hero_mobile_image_id?: string | null
          hero_subtitle?: string | null
          hero_title?: string | null
          home_meta_description?: string | null
          home_meta_title?: string | null
          id?: boolean
          invoice_business_address?: string | null
          invoice_business_name?: string | null
          invoice_currency_symbol?: string | null
          invoice_email?: string | null
          invoice_gst_number?: string | null
          invoice_logo_url?: string | null
          invoice_phone?: string | null
          invoice_tax_percent?: number | null
          invoice_terms?: string | null
          logo_url?: string | null
          maintenance_mode_enabled?: boolean | null
          maintenance_mode_message?: string | null
          owner_first_name?: string | null
          owner_last_name?: string | null
          payment_gateway?: string
          product_id_prefix?: string | null
          promo_banner_enabled?: boolean | null
          promo_banner_subtitle?: string | null
          promo_banner_title?: string | null
          redirects?: string | null
          social_facebook?: string | null
          social_instagram?: string | null
          social_linkedin?: string | null
          social_twitter?: string | null
          social_youtube?: string | null
          theme_background?: string | null
          theme_gradient?: string | null
          theme_muted?: string | null
          timer_banner_enabled?: boolean | null
          timer_banner_end_date?: string | null
          timer_banner_image_url?: string | null
          timer_banner_title?: string | null
          updated_at?: string
          upload_provider?: string | null
          whatsapp_only_checkout_enabled?: boolean | null
          whatsapp_otp_template?: string | null
        }
        Update: {
          banner_effect?: string | null
          cart_abandonment_delay_hours?: number | null
          cart_abandonment_enabled?: boolean | null
          cart_abandonment_whatsapp_template?: string | null
          contact_address?: string | null
          contact_email?: string | null
          contact_hours?: string | null
          contact_phone?: string | null
          created_at?: string
          customer_login_enabled?: boolean | null
          expected_delivery_max_days?: number | null
          expected_delivery_min_days?: number | null
          free_shipping_threshold?: number | null
          google_tag_manager_id?: string | null
          google_verification_code?: string | null
          hero_button_link?: string | null
          hero_button_text?: string | null
          hero_mobile_image_id?: string | null
          hero_subtitle?: string | null
          hero_title?: string | null
          home_meta_description?: string | null
          home_meta_title?: string | null
          id?: boolean
          invoice_business_address?: string | null
          invoice_business_name?: string | null
          invoice_currency_symbol?: string | null
          invoice_email?: string | null
          invoice_gst_number?: string | null
          invoice_logo_url?: string | null
          invoice_phone?: string | null
          invoice_tax_percent?: number | null
          invoice_terms?: string | null
          logo_url?: string | null
          maintenance_mode_enabled?: boolean | null
          maintenance_mode_message?: string | null
          owner_first_name?: string | null
          owner_last_name?: string | null
          payment_gateway?: string
          product_id_prefix?: string | null
          promo_banner_enabled?: boolean | null
          promo_banner_subtitle?: string | null
          promo_banner_title?: string | null
          redirects?: string | null
          social_facebook?: string | null
          social_instagram?: string | null
          social_linkedin?: string | null
          social_twitter?: string | null
          social_youtube?: string | null
          theme_background?: string | null
          theme_gradient?: string | null
          theme_muted?: string | null
          timer_banner_enabled?: boolean | null
          timer_banner_end_date?: string | null
          timer_banner_image_url?: string | null
          timer_banner_title?: string | null
          updated_at?: string
          upload_provider?: string | null
          whatsapp_only_checkout_enabled?: boolean | null
          whatsapp_otp_template?: string | null
        }
        Relationships: []
      }
      sliding_cards: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          image_hint: string | null
          image_url: string
          link_url: string | null
          order_num: number
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          image_hint?: string | null
          image_url: string
          link_url?: string | null
          order_num?: number
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          image_hint?: string | null
          image_url?: string
          link_url?: string | null
          order_num?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          id: string
          name: string
          phone: string
          source: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          phone: string
          source?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          phone?: string
          source?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      videos: {
        Row: {
          created_at: string
          id: string
          thumbnail_url: string
          type: string
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          id: string
          thumbnail_url: string
          type: string
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          thumbnail_url?: string
          type?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      whatsapp_messages: {
        Row: {
          body_parameters: Json | null
          created_at: string
          error: string | null
          header_parameters: Json | null
          id: string
          language_code: string | null
          raw_response: Json | null
          status: string | null
          template_name: string | null
          to_number: string
        }
        Insert: {
          body_parameters?: Json | null
          created_at?: string
          error?: string | null
          header_parameters?: Json | null
          id?: string
          language_code?: string | null
          raw_response?: Json | null
          status?: string | null
          template_name?: string | null
          to_number: string
        }
        Update: {
          body_parameters?: Json | null
          created_at?: string
          error?: string | null
          header_parameters?: Json | null
          id?: string
          language_code?: string | null
          raw_response?: Json | null
          status?: string | null
          template_name?: string | null
          to_number?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_old_abandoned_carts: { Args: never; Returns: undefined }
      get_unique_tags: {
        Args: never
        Returns: {
          tag: string
        }[]
      }
      update_order_status: {
        Args: {
          admin_note?: string
          new_status: string
          order_uuid: string
          reason?: string
        }
        Returns: boolean
      }
      validate_coupon: {
        Args: { coupon_code: string; subtotal?: number }
        Returns: Json
      }
    }
    Enums: {
      coupon_type: "percent" | "flat"
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
      coupon_type: ["percent", "flat"],
    },
  },
} as const
