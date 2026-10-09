export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type DeliveryMethod = "delivery" | "pickup";
export type OrderStatus =
  | "pending"
  | "preparing"
  | "ready"
  | "completed"
  | "cancelled";
export type ProfileRole =
  | "admin"
  | "owner"
  | "manager"
  | "operator"
  | "viewer"
  | "super_admin";

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "12";
  };
  public: {
    Tables: {
      business_settings: {
        Row: {
          business_id: string;
          created_at: string;
          delivery_mode_active: boolean;
          inactive_working_days: number[];
          kitchen_mode_active: boolean;
          on_demand_mode_active: boolean;
          order_assignment_enabled: boolean;
          product_customization_enabled: boolean;
          scheduled_cutoff_time: string;
          scheduled_max_days_in_advance: number;
          scheduled_min_lead_time_hours: number;
          scheduled_mode_active: boolean;
          updated_at: string;
        };
        Insert: {
          business_id: string;
          created_at?: string;
          delivery_mode_active?: boolean;
          inactive_working_days?: number[];
          kitchen_mode_active?: boolean;
          on_demand_mode_active?: boolean;
          order_assignment_enabled?: boolean;
          product_customization_enabled?: boolean;
          scheduled_cutoff_time?: string;
          scheduled_max_days_in_advance?: number;
          scheduled_min_lead_time_hours?: number;
          scheduled_mode_active?: boolean;
          updated_at?: string;
        };
        Update: {
          business_id?: string;
          created_at?: string;
          delivery_mode_active?: boolean;
          inactive_working_days?: number[];
          kitchen_mode_active?: boolean;
          on_demand_mode_active?: boolean;
          order_assignment_enabled?: boolean;
          product_customization_enabled?: boolean;
          scheduled_cutoff_time?: string;
          scheduled_max_days_in_advance?: number;
          scheduled_min_lead_time_hours?: number;
          scheduled_mode_active?: boolean;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "business_settings_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: true;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
      businesses: {
        Row: {
          catalog_hero_badge: string | null;
          catalog_hero_headline: string | null;
          catalog_hero_microcopy: string | null;
          cover_image_url: string | null;
          created_at: string;
          description: string | null;
          id: string;
          instagram_url: string | null;
          is_active: boolean;
          logo_url: string | null;
          name: string;
          primary_color: string | null;
          slug: string;
          whatsapp_number: string;
        };
        Insert: {
          catalog_hero_badge?: string | null;
          catalog_hero_headline?: string | null;
          catalog_hero_microcopy?: string | null;
          cover_image_url?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          instagram_url?: string | null;
          is_active?: boolean;
          logo_url?: string | null;
          name: string;
          primary_color?: string | null;
          slug: string;
          whatsapp_number: string;
        };
        Update: {
          catalog_hero_badge?: string | null;
          catalog_hero_headline?: string | null;
          catalog_hero_microcopy?: string | null;
          cover_image_url?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          instagram_url?: string | null;
          is_active?: boolean;
          logo_url?: string | null;
          name?: string;
          primary_color?: string | null;
          slug?: string;
          whatsapp_number?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          business_id: string;
          created_at: string;
          id: string;
          name: string;
          position: number | null;
        };
        Insert: {
          business_id: string;
          created_at?: string;
          id?: string;
          name: string;
          position?: number | null;
        };
        Update: {
          business_id?: string;
          created_at?: string;
          id?: string;
          name?: string;
          position?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "categories_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          }
        ];
      };
      customization_group_assignments: {
        Row: {
          business_id: string;
          created_at: string;
          group_id: string;
          id: string;
          is_enabled: boolean;
          sort_order: number;
          target_id: string;
          target_type: "category" | "product";
          updated_at: string;
        };
        Insert: {
          business_id: string;
          created_at?: string;
          group_id: string;
          id?: string;
          is_enabled?: boolean;
          sort_order?: number;
          target_id: string;
          target_type: "category" | "product";
          updated_at?: string;
        };
        Update: {
          business_id?: string;
          created_at?: string;
          group_id?: string;
          id?: string;
          is_enabled?: boolean;
          sort_order?: number;
          target_id?: string;
          target_type?: "category" | "product";
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "customization_group_assignments_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "customization_group_assignments_group_same_business_fk";
            columns: ["group_id", "business_id"];
            isOneToOne: false;
            referencedRelation: "customization_groups";
            referencedColumns: ["id", "business_id"];
          }
        ];
      };
      customization_groups: {
        Row: {
          allows_option_quantity: boolean;
          business_id: string;
          created_at: string;
          description: string | null;
          id: string;
          is_available: boolean;
          is_required: boolean;
          max_selections: number | null;
          max_total_quantity: number | null;
          min_selections: number;
          name: string;
          selection_type: "single" | "multiple";
          sort_order: number;
          updated_at: string;
        };
        Insert: {
          allows_option_quantity?: boolean;
          business_id: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_available?: boolean;
          is_required?: boolean;
          max_selections?: number | null;
          max_total_quantity?: number | null;
          min_selections?: number;
          name: string;
          selection_type: "single" | "multiple";
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          allows_option_quantity?: boolean;
          business_id?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_available?: boolean;
          is_required?: boolean;
          max_selections?: number | null;
          max_total_quantity?: number | null;
          min_selections?: number;
          name?: string;
          selection_type?: "single" | "multiple";
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "customization_groups_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          }
        ];
      };
      customization_options: {
        Row: {
          business_id: string;
          created_at: string;
          description: string | null;
          group_id: string;
          id: string;
          is_available: boolean;
          max_quantity: number;
          name: string;
          price_delta: number;
          sort_order: number;
          updated_at: string;
        };
        Insert: {
          business_id: string;
          created_at?: string;
          description?: string | null;
          group_id: string;
          id?: string;
          is_available?: boolean;
          max_quantity?: number;
          name: string;
          price_delta?: number;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          business_id?: string;
          created_at?: string;
          description?: string | null;
          group_id?: string;
          id?: string;
          is_available?: boolean;
          max_quantity?: number;
          name?: string;
          price_delta?: number;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "customization_options_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "customization_options_group_same_business_fk";
            columns: ["group_id", "business_id"];
            isOneToOne: false;
            referencedRelation: "customization_groups";
            referencedColumns: ["id", "business_id"];
          }
        ];
      };
      order_items: {
        Row: {
          customization_snapshot: Json | null;
          id: string;
          item_kind: "product" | "upsell";
          order_id: string;
          parent_order_item_id: string | null;
          product_id: string | null;
          product_name: string;
          quantity: number;
          unit_price: number;
        };
        Insert: {
          customization_snapshot?: Json | null;
          id?: string;
          item_kind?: "product" | "upsell";
          order_id: string;
          parent_order_item_id?: string | null;
          product_id?: string | null;
          product_name: string;
          quantity: number;
          unit_price: number;
        };
        Update: {
          customization_snapshot?: Json | null;
          id?: string;
          item_kind?: "product" | "upsell";
          order_id?: string;
          parent_order_item_id?: string | null;
          product_id?: string | null;
          product_name?: string;
          quantity?: number;
          unit_price?: number;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_parent_order_item_id_fkey";
            columns: ["parent_order_item_id"];
            isOneToOne: false;
            referencedRelation: "order_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          }
        ];
      };
      order_events: {
        Row: {
          actor_profile_id: string | null;
          business_id: string;
          created_at: string;
          event_type: string;
          id: string;
          order_id: string;
          payload: Json;
        };
        Insert: {
          actor_profile_id?: string | null;
          business_id: string;
          created_at?: string;
          event_type: string;
          id?: string;
          order_id: string;
          payload?: Json;
        };
        Update: {
          actor_profile_id?: string | null;
          business_id?: string;
          created_at?: string;
          event_type?: string;
          id?: string;
          order_id?: string;
          payload?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "order_events_actor_profile_id_fkey";
            columns: ["actor_profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_events_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_events_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          }
        ];
      };
      orders: {
        Row: {
          address: string | null;
          assigned_at: string | null;
          assigned_to: string | null;
          business_id: string;
          created_at: string;
          customer_name: string;
          delivery_date: string;
          delivery_method: DeliveryMethod;
          delivery_time: string | null;
          id: string;
          notes: string | null;
          order_code: string;
          phone: string;
          status: OrderStatus;
          total_price: number;
        };
        Insert: {
          address?: string | null;
          assigned_at?: string | null;
          assigned_to?: string | null;
          business_id: string;
          created_at?: string;
          customer_name: string;
          delivery_date: string;
          delivery_method: DeliveryMethod;
          delivery_time?: string | null;
          id?: string;
          notes?: string | null;
          order_code?: string;
          phone: string;
          status?: OrderStatus;
          total_price: number;
        };
        Update: {
          address?: string | null;
          assigned_at?: string | null;
          assigned_to?: string | null;
          business_id?: string;
          created_at?: string;
          customer_name?: string;
          delivery_date?: string;
          delivery_method?: DeliveryMethod;
          delivery_time?: string | null;
          id?: string;
          notes?: string | null;
          order_code?: string;
          phone?: string;
          status?: OrderStatus;
          total_price?: number;
        };
        Relationships: [
          {
            foreignKeyName: "orders_assigned_to_fkey";
            columns: ["assigned_to"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "orders_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          }
        ];
      };
      stock_movements: {
        Row: {
          id: string;
          business_id: string;
          product_id: string;
          order_id: string | null;
          order_item_id: string | null;
          movement_type: "order_decrement" | "order_restock" | "manual_adjustment";
          quantity_delta: number;
          stock_before: number;
          stock_after: number;
          reason: string | null;
          metadata: Json;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          product_id: string;
          order_id?: string | null;
          order_item_id?: string | null;
          movement_type: "order_decrement" | "order_restock" | "manual_adjustment";
          quantity_delta: number;
          stock_before: number;
          stock_after: number;
          reason?: string | null;
          metadata?: Json;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          product_id?: string;
          order_id?: string | null;
          order_item_id?: string | null;
          movement_type?: "order_decrement" | "order_restock" | "manual_adjustment";
          quantity_delta?: number;
          stock_before?: number;
          stock_after?: number;
          reason?: string | null;
          metadata?: Json;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "stock_movements_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "stock_movements_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "stock_movements_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "stock_movements_order_item_id_fkey";
            columns: ["order_item_id"];
            isOneToOne: false;
            referencedRelation: "order_items";
            referencedColumns: ["id"];
          }
        ];
      };
      products: {
        Row: {
          business_id: string;
          category_id: string;
          created_at: string;
          description: string | null;
          id: string;
          image_url: string | null;
          is_available: boolean;
          name: string;
          price: number;
          sku: string | null;
          stock: number;
          track_stock: boolean;
        };
        Insert: {
          business_id: string;
          category_id: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          is_available?: boolean;
          name: string;
          price: number;
          sku?: string | null;
          stock?: number;
          track_stock?: boolean;
        };
        Update: {
          business_id?: string;
          category_id?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          is_available?: boolean;
          name?: string;
          price?: number;
          sku?: string | null;
          stock?: number;
          track_stock?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "products_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "products_category_id_business_id_fkey";
            columns: ["category_id", "business_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id", "business_id"];
          }
        ];
      };
      product_customization_overrides: {
        Row: {
          business_id: string;
          created_at: string;
          group_id: string | null;
          id: string;
          is_enabled: boolean;
          option_id: string | null;
          override_type: "group" | "option";
          product_id: string;
          updated_at: string;
        };
        Insert: {
          business_id: string;
          created_at?: string;
          group_id?: string | null;
          id?: string;
          is_enabled?: boolean;
          option_id?: string | null;
          override_type: "group" | "option";
          product_id: string;
          updated_at?: string;
        };
        Update: {
          business_id?: string;
          created_at?: string;
          group_id?: string | null;
          id?: string;
          is_enabled?: boolean;
          option_id?: string | null;
          override_type?: "group" | "option";
          product_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_customization_overrides_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_customization_overrides_group_same_business_fk";
            columns: ["group_id", "business_id"];
            isOneToOne: false;
            referencedRelation: "customization_groups";
            referencedColumns: ["id", "business_id"];
          },
          {
            foreignKeyName: "product_customization_overrides_option_same_business_fk";
            columns: ["option_id", "business_id"];
            isOneToOne: false;
            referencedRelation: "customization_options";
            referencedColumns: ["id", "business_id"];
          },
          {
            foreignKeyName: "product_customization_overrides_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          }
        ];
      };
      profiles: {
        Row: {
          business_id: string | null;
          created_at: string;
          id: string;
          notification_preferences: Json;
          role: ProfileRole;
        };
        Insert: {
          business_id?: string | null;
          created_at?: string;
          id: string;
          notification_preferences?: Json;
          role?: ProfileRole;
        };
        Update: {
          business_id?: string | null;
          created_at?: string;
          id?: string;
          notification_preferences?: Json;
          role?: ProfileRole;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      store_sessions: {
        Row: {
          business_id: string;
          closed_at: string | null;
          closed_by: string | null;
          created_at: string;
          id: string;
          opened_at: string;
          opened_by: string | null;
          status: "open" | "closed";
          updated_at: string;
        };
        Insert: {
          business_id: string;
          closed_at?: string | null;
          closed_by?: string | null;
          created_at?: string;
          id?: string;
          opened_at?: string;
          opened_by?: string | null;
          status?: "open" | "closed";
          updated_at?: string;
        };
        Update: {
          business_id?: string;
          closed_at?: string | null;
          closed_by?: string | null;
          created_at?: string;
          id?: string;
          opened_at?: string;
          opened_by?: string | null;
          status?: "open" | "closed";
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "store_sessions_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "store_sessions_closed_by_fkey";
            columns: ["closed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "store_sessions_opened_by_fkey";
            columns: ["opened_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      upsell_group_items: {
        Row: {
          business_id: string;
          created_at: string;
          id: string;
          is_available: boolean;
          product_id: string;
          sort_order: number;
          updated_at: string;
          upsell_group_id: string;
        };
        Insert: {
          business_id: string;
          created_at?: string;
          id?: string;
          is_available?: boolean;
          product_id: string;
          sort_order?: number;
          updated_at?: string;
          upsell_group_id: string;
        };
        Update: {
          business_id?: string;
          created_at?: string;
          id?: string;
          is_available?: boolean;
          product_id?: string;
          sort_order?: number;
          updated_at?: string;
          upsell_group_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "upsell_group_items_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "upsell_group_items_group_same_business_fk";
            columns: ["upsell_group_id", "business_id"];
            isOneToOne: false;
            referencedRelation: "upsell_groups";
            referencedColumns: ["id", "business_id"];
          },
          {
            foreignKeyName: "upsell_group_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          }
        ];
      };
      upsell_groups: {
        Row: {
          business_id: string;
          created_at: string;
          description: string | null;
          id: string;
          is_available: boolean;
          name: string;
          sort_order: number;
          target_id: string;
          target_type: "category" | "product";
          updated_at: string;
        };
        Insert: {
          business_id: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_available?: boolean;
          name: string;
          sort_order?: number;
          target_id: string;
          target_type: "category" | "product";
          updated_at?: string;
        };
        Update: {
          business_id?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_available?: boolean;
          name?: string;
          sort_order?: number;
          target_id?: string;
          target_type?: "category" | "product";
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "upsell_groups_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          }
        ];
      };
      push_subscriptions: {
        Row: {
          auth: string;
          business_id: string;
          created_at: string;
          endpoint: string;
          id: string;
          last_seen_at: string;
          p256dh: string;
          profile_id: string;
          revoked_at: string | null;
          user_agent: string | null;
        };
        Insert: {
          auth: string;
          business_id: string;
          created_at?: string;
          endpoint: string;
          id?: string;
          last_seen_at?: string;
          p256dh: string;
          profile_id: string;
          revoked_at?: string | null;
          user_agent?: string | null;
        };
        Update: {
          auth?: string;
          business_id?: string;
          created_at?: string;
          endpoint?: string;
          id?: string;
          last_seen_at?: string;
          p256dh?: string;
          profile_id?: string;
          revoked_at?: string | null;
          user_agent?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "push_subscriptions_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      commercial_session: { Args: Record<string, never>; Returns: Json };
      create_claim: {
        Args: { p_commercial_business_id: string; p_opportunity_id: string | null };
        Returns: Json;
      };

      register_promoter: {
        Args: { p_cuit: string | null; p_email: string; p_legal_name: string };
        Returns: Json;
      };
      transition_promoter_status: {
        Args: { p_promoter_id: string; p_to_status: string };
        Returns: Json;
      };
      submit_promoter_evidence: {
        Args: { p_evidence_path: string; p_kind: string; p_promoter_id: string };
        Returns: Json;
      };
      review_verification: {
        Args: { p_notes: string | null; p_status: string; p_verification_id: string };
        Returns: Json;
      };
      activate_promoter: { Args: { p_promoter_id: string }; Returns: Json };
      replace_bank_account: {
        Args: {
          p_cbu_or_cvu: string;
          p_holder_name: string;
          p_note: string | null;
          p_promoter_id: string;
        };
        Returns: Json;
      };
      extend_claim: {
        Args: { p_claim_id: string; p_interaction_id: string; p_reason: string };
        Returns: Json;
      };
      expire_due_claims: { Args: Record<string, never>; Returns: Json };
      confirm_attribution: {
        Args: {
          p_claim_id: string;
          p_opportunity_id: string;
          p_promoter_id: string;
          p_reason: string;
        };
        Returns: Json;
      };
      open_dispute: {
        Args: { p_opportunity_id: string; p_promoter_ids: string[]; p_reason: string };
        Returns: Json;
      };
      decide_dispute: {
        Args: {
          p_decision: string;
          p_dispute_id: string;
          p_economic_effect: string;
          p_reason: string;
          p_void_attribution: boolean;
        };
        Returns: Json;
      };
      read_dispute: { Args: { p_dispute_id: string }; Returns: Json };
      separate_promoter: {
        Args: {
          p_exception_opportunity_id: string | null;
          p_owner_account_id: string;
          p_promoter_id: string;
          p_reason: string;
        };
        Returns: Json;
      };
      promoter_add_note: { Args: { p_body: string; p_opportunity_id: string }; Returns: Json };
      promoter_overview: { Args: Record<string, never>; Returns: Json };
      promoter_session: { Args: Record<string, never>; Returns: Json };
      promoter_transition_opportunity: {
        Args: { p_opportunity_id: string; p_reason: string | null; p_to_stage: string };
        Returns: Json;
      };
      promoter_upsert_task: {
        Args: {
          p_due_at: string | null;
          p_opportunity_id: string;
          p_status: string;
          p_task_id: string | null;
          p_title: string;
        };
        Returns: Json;
      };
      read_own_bank: { Args: Record<string, never>; Returns: Json };
      register_promoter_business: {
        Args: { p_trade_category: string; p_trade_name: string; p_whatsapp: string };
        Returns: Json;
      };
      list_open_opportunities: { Args: Record<string, never>; Returns: Json };
      merge_commercial_businesses: {
        Args: { p_absorbed_id: string; p_reason: string; p_survivor_id: string };
        Returns: Json;
      };
      opportunity_detail: { Args: { p_opportunity_id: string }; Returns: Json };
      submit_demo_request: {
        Args: {
          p_campaign_ref: string | null;
          p_contact_name: string;
          p_email: string | null;
          p_idempotency_key: string;
          p_ip_hash: string | null;
          p_needs: string | null;
          p_promoter_ref: string | null;
          p_trade_category: string;
          p_trade_name: string;
          p_whatsapp: string;
        };
        Returns: Json;
      };
      create_order: {
        Args: {
          p_address?: string | null;
          p_business_id: string;
          p_customer_name: string;
          p_delivery_date: string;
          p_delivery_method: DeliveryMethod;
          p_items?: Json;
          p_notes?: string | null;
          p_phone: string;
        };
        Returns: string;
      };
      set_business_on_demand_status: {
        Args: {
          p_active: boolean;
          p_business_id: string;
        };
        Returns: undefined;
      };
      transition_opportunity: {
        Args: { p_opportunity_id: string; p_reason: string | null; p_to_stage: string };
        Returns: Json;
      };
      upsert_task: {
        Args: {
          p_cancel_reason: string | null;
          p_due_at: string | null;
          p_opportunity_id: string;
          p_priority: string | null;
          p_status: string;
          p_task_id: string | null;
          p_title: string;
        };
        Returns: Json;
      };
      transition_order_status: {
        Args: {
          p_order_id: string;
          p_target_status: string;
        };
        Returns: Json;
      };
    };
    Enums: {
      delivery_method: DeliveryMethod;
      order_status: OrderStatus;
      profile_role: ProfileRole;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  commercial: {
    Tables: {
      audit_events: {
        Row: {
          action: string;
          actor_account_id: string | null;
          actor_kind: string;
          after: Json | null;
          before: Json | null;
          correlation_id: string;
          created_at: string;
          entity_id: string;
          entity_schema: string;
          entity_table: string;
          id: string;
          reason: string | null;
        };
        Insert: {
          action: string;
          actor_account_id?: string | null;
          actor_kind: string;
          after?: Json | null;
          before?: Json | null;
          correlation_id: string;
          created_at?: string;
          entity_id: string;
          entity_schema: string;
          entity_table: string;
          id?: string;
          reason?: string | null;
        };
        Update: {
          action?: string;
          actor_account_id?: string | null;
          actor_kind?: string;
          after?: Json | null;
          before?: Json | null;
          correlation_id?: string;
          created_at?: string;
          entity_id?: string;
          entity_schema?: string;
          entity_table?: string;
          id?: string;
          reason?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "audit_events_actor_account_id_fkey";
            columns: ["actor_account_id"];
            isOneToOne: false;
            referencedRelation: "platform_accounts";
            referencedColumns: ["id"];
          },
        ];
      };
      commercial_businesses: {
        Row: {
          archived_at: string | null;
          branch_label: string | null;
          brand_name: string | null;
          created_at: string;
          display_name: string;
          email: string | null;
          fiscal_id: string | null;
          id: string;
          initial_channel: string;
          initial_promoter_id: string | null;
          linked_business_id: string | null;
          merged_into_id: string | null;
          normalized_name: string;
          normalized_phone: string | null;
          trade_category: string | null;
        };
        Insert: {
          archived_at?: string | null;
          branch_label?: string | null;
          brand_name?: string | null;
          created_at?: string;
          display_name: string;
          email?: string | null;
          fiscal_id?: string | null;
          id?: string;
          initial_channel: string;
          initial_promoter_id?: string | null;
          linked_business_id?: string | null;
          merged_into_id?: string | null;
          normalized_name: string;
          normalized_phone?: string | null;
          trade_category?: string | null;
        };
        Update: {
          archived_at?: string | null;
          branch_label?: string | null;
          brand_name?: string | null;
          created_at?: string;
          display_name?: string;
          email?: string | null;
          fiscal_id?: string | null;
          id?: string;
          initial_channel?: string;
          initial_promoter_id?: string | null;
          linked_business_id?: string | null;
          merged_into_id?: string | null;
          normalized_name?: string;
          normalized_phone?: string | null;
          trade_category?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "commercial_businesses_linked_business_id_fkey";
            columns: ["linked_business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "commercial_businesses_merged_into_id_fkey";
            columns: ["merged_into_id"];
            isOneToOne: false;
            referencedRelation: "commercial_businesses";
            referencedColumns: ["id"];
          },
        ];
      };
      commercial_contacts: {
        Row: {
          commercial_business_id: string;
          created_at: string;
          email: string | null;
          full_name: string;
          id: string;
          normalized_phone: string | null;
          role_label: string | null;
        };
        Insert: {
          commercial_business_id: string;
          created_at?: string;
          email?: string | null;
          full_name: string;
          id?: string;
          normalized_phone?: string | null;
          role_label?: string | null;
        };
        Update: {
          commercial_business_id?: string;
          created_at?: string;
          email?: string | null;
          full_name?: string;
          id?: string;
          normalized_phone?: string | null;
          role_label?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "commercial_contacts_commercial_business_id_fkey";
            columns: ["commercial_business_id"];
            isOneToOne: false;
            referencedRelation: "commercial_businesses";
            referencedColumns: ["id"];
          },
        ];
      };
      commercial_interactions: {
        Row: {
          actor_account_id: string | null;
          body: string | null;
          channel: string;
          commercial_business_id: string;
          created_at: string;
          id: string;
          kind: string;
          occurred_at: string;
          opportunity_id: string | null;
          origin: string;
        };
        Insert: {
          actor_account_id?: string | null;
          body?: string | null;
          channel: string;
          commercial_business_id: string;
          created_at?: string;
          id?: string;
          kind: string;
          occurred_at: string;
          opportunity_id?: string | null;
          origin: string;
        };
        Update: {
          actor_account_id?: string | null;
          body?: string | null;
          channel?: string;
          commercial_business_id?: string;
          created_at?: string;
          id?: string;
          kind?: string;
          occurred_at?: string;
          opportunity_id?: string | null;
          origin?: string;
        };
        Relationships: [
          {
            foreignKeyName: "commercial_interactions_actor_account_id_fkey";
            columns: ["actor_account_id"];
            isOneToOne: false;
            referencedRelation: "platform_accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "commercial_interactions_commercial_business_id_fkey";
            columns: ["commercial_business_id"];
            isOneToOne: false;
            referencedRelation: "commercial_businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "commercial_interactions_opportunity_id_fkey";
            columns: ["opportunity_id"];
            isOneToOne: false;
            referencedRelation: "commercial_opportunities";
            referencedColumns: ["id"];
          },
        ];
      };
      commercial_merges: {
        Row: {
          absorbed_id: string;
          actor_account_id: string | null;
          created_at: string;
          id: string;
          reason: string;
          survivor_id: string;
        };
        Insert: {
          absorbed_id: string;
          actor_account_id?: string | null;
          created_at?: string;
          id?: string;
          reason: string;
          survivor_id: string;
        };
        Update: {
          absorbed_id?: string;
          actor_account_id?: string | null;
          created_at?: string;
          id?: string;
          reason?: string;
          survivor_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "commercial_merges_absorbed_id_fkey";
            columns: ["absorbed_id"];
            isOneToOne: false;
            referencedRelation: "commercial_businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "commercial_merges_actor_account_id_fkey";
            columns: ["actor_account_id"];
            isOneToOne: false;
            referencedRelation: "platform_accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "commercial_merges_survivor_id_fkey";
            columns: ["survivor_id"];
            isOneToOne: false;
            referencedRelation: "commercial_businesses";
            referencedColumns: ["id"];
          },
        ];
      };
      commercial_opportunities: {
        Row: {
          archived_at: string | null;
          commercial_business_id: string;
          created_at: string;
          id: string;
          lost_at: string | null;
          lost_reason: string | null;
          owner_account_id: string | null;
          stage: string;
          won_at: string | null;
          won_business_id: string | null;
          won_by_account_id: string | null;
        };
        Insert: {
          archived_at?: string | null;
          commercial_business_id: string;
          created_at?: string;
          id?: string;
          lost_at?: string | null;
          lost_reason?: string | null;
          owner_account_id?: string | null;
          stage: string;
          won_at?: string | null;
          won_business_id?: string | null;
          won_by_account_id?: string | null;
        };
        Update: {
          archived_at?: string | null;
          commercial_business_id?: string;
          created_at?: string;
          id?: string;
          lost_at?: string | null;
          lost_reason?: string | null;
          owner_account_id?: string | null;
          stage?: string;
          won_at?: string | null;
          won_business_id?: string | null;
          won_by_account_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "commercial_opportunities_commercial_business_id_fkey";
            columns: ["commercial_business_id"];
            isOneToOne: false;
            referencedRelation: "commercial_businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "commercial_opportunities_owner_account_id_fkey";
            columns: ["owner_account_id"];
            isOneToOne: false;
            referencedRelation: "platform_accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "commercial_opportunities_won_business_id_fkey";
            columns: ["won_business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "commercial_opportunities_won_by_account_id_fkey";
            columns: ["won_by_account_id"];
            isOneToOne: false;
            referencedRelation: "platform_accounts";
            referencedColumns: ["id"];
          },
        ];
      };
      commercial_programs: {
        Row: {
          code: string;
          effective_from: string;
          id: string;
          max_recurring_slots: number;
          monthly_price_cents: number;
          recurring_bps: number;
          retired_at: string | null;
          setup_commission_cents: number;
          setup_price_cents: number;
          version: number;
        };
        Insert: {
          code: string;
          effective_from: string;
          id?: string;
          max_recurring_slots: number;
          monthly_price_cents: number;
          recurring_bps: number;
          retired_at?: string | null;
          setup_commission_cents: number;
          setup_price_cents: number;
          version: number;
        };
        Update: {
          code?: string;
          effective_from?: string;
          id?: string;
          max_recurring_slots?: number;
          monthly_price_cents?: number;
          recurring_bps?: number;
          retired_at?: string | null;
          setup_commission_cents?: number;
          setup_price_cents?: number;
          version?: number;
        };
        Relationships: [];
      };
      commercial_tasks: {
        Row: {
          assignee_account_id: string | null;
          cancel_reason: string | null;
          completed_at: string | null;
          created_at: string;
          created_by: string | null;
          description: string | null;
          due_at: string | null;
          id: string;
          kind: string | null;
          opportunity_id: string;
          priority: string | null;
          status: string;
          title: string;
        };
        Insert: {
          assignee_account_id?: string | null;
          cancel_reason?: string | null;
          completed_at?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          due_at?: string | null;
          id?: string;
          kind?: string | null;
          opportunity_id: string;
          priority?: string | null;
          status: string;
          title: string;
        };
        Update: {
          assignee_account_id?: string | null;
          cancel_reason?: string | null;
          completed_at?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          due_at?: string | null;
          id?: string;
          kind?: string | null;
          opportunity_id?: string;
          priority?: string | null;
          status?: string;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "commercial_tasks_assignee_account_id_fkey";
            columns: ["assignee_account_id"];
            isOneToOne: false;
            referencedRelation: "platform_accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "commercial_tasks_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "platform_accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "commercial_tasks_opportunity_id_fkey";
            columns: ["opportunity_id"];
            isOneToOne: false;
            referencedRelation: "commercial_opportunities";
            referencedColumns: ["id"];
          },
        ];
      };
      demo_submissions: {
        Row: {
          campaign_ref: string | null;
          contact_name: string;
          created_at: string;
          email: string | null;
          id: string;
          idempotency_key: string;
          needs: string | null;
          promoter_ref: string | null;
          resolved_business_id: string | null;
          resolved_opportunity_id: string | null;
          source_channel: string;
          trade_category: string;
          trade_name: string;
          whatsapp: string;
        };
        Insert: {
          campaign_ref?: string | null;
          contact_name: string;
          created_at?: string;
          email?: string | null;
          id?: string;
          idempotency_key: string;
          needs?: string | null;
          promoter_ref?: string | null;
          resolved_business_id?: string | null;
          resolved_opportunity_id?: string | null;
          source_channel: string;
          trade_category: string;
          trade_name: string;
          whatsapp: string;
        };
        Update: {
          campaign_ref?: string | null;
          contact_name?: string;
          created_at?: string;
          email?: string | null;
          id?: string;
          idempotency_key?: string;
          needs?: string | null;
          promoter_ref?: string | null;
          resolved_business_id?: string | null;
          resolved_opportunity_id?: string | null;
          source_channel?: string;
          trade_category?: string;
          trade_name?: string;
          whatsapp?: string;
        };
        Relationships: [
          {
            foreignKeyName: "demo_submissions_resolved_business_id_fkey";
            columns: ["resolved_business_id"];
            isOneToOne: false;
            referencedRelation: "commercial_businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "demo_submissions_resolved_opportunity_id_fkey";
            columns: ["resolved_opportunity_id"];
            isOneToOne: false;
            referencedRelation: "commercial_opportunities";
            referencedColumns: ["id"];
          },
        ];
      };
      internal_role_assignments: {
        Row: {
          account_id: string;
          created_at: string;
          granted_by: string | null;
          id: string;
          revoked_at: string | null;
          role: string;
        };
        Insert: {
          account_id: string;
          created_at?: string;
          granted_by?: string | null;
          id?: string;
          revoked_at?: string | null;
          role: string;
        };
        Update: {
          account_id?: string;
          created_at?: string;
          granted_by?: string | null;
          id?: string;
          revoked_at?: string | null;
          role?: string;
        };
        Relationships: [
          {
            foreignKeyName: "internal_role_assignments_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "platform_accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "internal_role_assignments_granted_by_fkey";
            columns: ["granted_by"];
            isOneToOne: false;
            referencedRelation: "platform_accounts";
            referencedColumns: ["id"];
          },
        ];
      };
      notification_deliveries: {
        Row: {
          attempt_count: number;
          channel: string;
          destination: string;
          id: string;
          last_error: string | null;
          outbox_event_id: string;
          status: string;
        };
        Insert: {
          attempt_count?: number;
          channel: string;
          destination: string;
          id?: string;
          last_error?: string | null;
          outbox_event_id: string;
          status: string;
        };
        Update: {
          attempt_count?: number;
          channel?: string;
          destination?: string;
          id?: string;
          last_error?: string | null;
          outbox_event_id?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notification_deliveries_outbox_event_id_fkey";
            columns: ["outbox_event_id"];
            isOneToOne: false;
            referencedRelation: "outbox_events";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          body: string;
          created_at: string;
          event_name: string;
          id: string;
          outbox_event_id: string;
          read_at: string | null;
          recipient_account_id: string;
          title: string;
        };
        Insert: {
          body: string;
          created_at?: string;
          event_name: string;
          id?: string;
          outbox_event_id: string;
          read_at?: string | null;
          recipient_account_id: string;
          title: string;
        };
        Update: {
          body?: string;
          created_at?: string;
          event_name?: string;
          id?: string;
          outbox_event_id?: string;
          read_at?: string | null;
          recipient_account_id?: string;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_outbox_event_id_fkey";
            columns: ["outbox_event_id"];
            isOneToOne: false;
            referencedRelation: "outbox_events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_recipient_account_id_fkey";
            columns: ["recipient_account_id"];
            isOneToOne: false;
            referencedRelation: "platform_accounts";
            referencedColumns: ["id"];
          },
        ];
      };
      opportunity_stage_events: {
        Row: {
          actor_account_id: string | null;
          created_at: string;
          from_stage: string | null;
          id: string;
          opportunity_id: string;
          reason: string | null;
          to_stage: string;
        };
        Insert: {
          actor_account_id?: string | null;
          created_at?: string;
          from_stage?: string | null;
          id?: string;
          opportunity_id: string;
          reason?: string | null;
          to_stage: string;
        };
        Update: {
          actor_account_id?: string | null;
          created_at?: string;
          from_stage?: string | null;
          id?: string;
          opportunity_id?: string;
          reason?: string | null;
          to_stage?: string;
        };
        Relationships: [
          {
            foreignKeyName: "opportunity_stage_events_actor_account_id_fkey";
            columns: ["actor_account_id"];
            isOneToOne: false;
            referencedRelation: "platform_accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "opportunity_stage_events_opportunity_id_fkey";
            columns: ["opportunity_id"];
            isOneToOne: false;
            referencedRelation: "commercial_opportunities";
            referencedColumns: ["id"];
          },
        ];
      };
      outbox_events: {
        Row: {
          attempts: number;
          available_at: string;
          correlation_id: string;
          event_name: string;
          id: string;
          locked_at: string | null;
          occurred_at: string;
          payload: Json;
          status: string;
        };
        Insert: {
          attempts?: number;
          available_at: string;
          correlation_id: string;
          event_name: string;
          id?: string;
          locked_at?: string | null;
          occurred_at: string;
          payload: Json;
          status: string;
        };
        Update: {
          attempts?: number;
          available_at?: string;
          correlation_id?: string;
          event_name?: string;
          id?: string;
          locked_at?: string | null;
          occurred_at?: string;
          payload?: Json;
          status?: string;
        };
        Relationships: [];
      };
      platform_accounts: {
        Row: {
          created_at: string;
          disabled_at: string | null;
          id: string;
          kind: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          disabled_at?: string | null;
          id?: string;
          kind: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          disabled_at?: string | null;
          id?: string;
          kind?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      privacy_requests: {
        Row: {
          created_at: string;
          id: string;
          opened_by: string | null;
          request_kind: string;
          resolution_notes: string | null;
          resolved_by: string | null;
          status: string;
          subject_kind: string | null;
          subject_ref: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          opened_by?: string | null;
          request_kind: string;
          resolution_notes?: string | null;
          resolved_by?: string | null;
          status: string;
          subject_kind?: string | null;
          subject_ref?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          opened_by?: string | null;
          request_kind?: string;
          resolution_notes?: string | null;
          resolved_by?: string | null;
          status?: string;
          subject_kind?: string | null;
          subject_ref?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "privacy_requests_opened_by_fkey";
            columns: ["opened_by"];
            isOneToOne: false;
            referencedRelation: "platform_accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "privacy_requests_resolved_by_fkey";
            columns: ["resolved_by"];
            isOneToOne: false;
            referencedRelation: "platform_accounts";
            referencedColumns: ["id"];
          },
        ];
      };
      attribution_claims: {
        Row: {
          commercial_business_id: string;
          created_at: string;
          id: string;
          opportunity_id: string | null;
          promoter_id: string;
          provisional_until: string;
          status: string;
        };
        Insert: {
          commercial_business_id: string;
          created_at?: string;
          id?: string;
          opportunity_id?: string | null;
          promoter_id: string;
          provisional_until: string;
          status: string;
        };
        Update: {
          commercial_business_id?: string;
          created_at?: string;
          id?: string;
          opportunity_id?: string | null;
          promoter_id?: string;
          provisional_until?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "attribution_claims_commercial_business_id_fkey";
            columns: ["commercial_business_id"];
            isOneToOne: false;
            referencedRelation: "commercial_businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attribution_claims_opportunity_id_fkey";
            columns: ["opportunity_id"];
            isOneToOne: false;
            referencedRelation: "commercial_opportunities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attribution_claims_promoter_id_fkey";
            columns: ["promoter_id"];
            isOneToOne: false;
            referencedRelation: "promoters";
            referencedColumns: ["id"];
          },
        ];
      };
      attribution_disputes: {
        Row: {
          assigned_to: string | null;
          created_at: string;
          decided_at: string | null;
          decision: string | null;
          decision_reason: string | null;
          economic_effect: string | null;
          id: string;
          opened_by: string;
          opportunity_id: string;
          status: string;
        };
        Insert: {
          assigned_to?: string | null;
          created_at?: string;
          decided_at?: string | null;
          decision?: string | null;
          decision_reason?: string | null;
          economic_effect?: string | null;
          id?: string;
          opened_by: string;
          opportunity_id: string;
          status: string;
        };
        Update: {
          assigned_to?: string | null;
          created_at?: string;
          decided_at?: string | null;
          decision?: string | null;
          decision_reason?: string | null;
          economic_effect?: string | null;
          id?: string;
          opened_by?: string;
          opportunity_id?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "attribution_disputes_assigned_to_fkey";
            columns: ["assigned_to"];
            isOneToOne: false;
            referencedRelation: "platform_accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attribution_disputes_opened_by_fkey";
            columns: ["opened_by"];
            isOneToOne: false;
            referencedRelation: "platform_accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attribution_disputes_opportunity_id_fkey";
            columns: ["opportunity_id"];
            isOneToOne: false;
            referencedRelation: "commercial_opportunities";
            referencedColumns: ["id"];
          },
        ];
      };
      claim_extensions: {
        Row: {
          actor_account_id: string;
          claim_id: string;
          created_at: string;
          extended_until: string;
          id: string;
          interaction_id: string;
          reason: string;
        };
        Insert: {
          actor_account_id: string;
          claim_id: string;
          created_at?: string;
          extended_until: string;
          id?: string;
          interaction_id: string;
          reason: string;
        };
        Update: {
          actor_account_id?: string;
          claim_id?: string;
          created_at?: string;
          extended_until?: string;
          id?: string;
          interaction_id?: string;
          reason?: string;
        };
        Relationships: [
          {
            foreignKeyName: "claim_extensions_actor_account_id_fkey";
            columns: ["actor_account_id"];
            isOneToOne: false;
            referencedRelation: "platform_accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "claim_extensions_claim_id_fkey";
            columns: ["claim_id"];
            isOneToOne: false;
            referencedRelation: "attribution_claims";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "claim_extensions_interaction_id_fkey";
            columns: ["interaction_id"];
            isOneToOne: false;
            referencedRelation: "commercial_interactions";
            referencedColumns: ["id"];
          },
        ];
      };
      dispute_events: {
        Row: {
          actor_account_id: string | null;
          body: string | null;
          created_at: string;
          dispute_id: string;
          evidence_path: string | null;
          id: string;
          kind: string;
        };
        Insert: {
          actor_account_id?: string | null;
          body?: string | null;
          created_at?: string;
          dispute_id: string;
          evidence_path?: string | null;
          id?: string;
          kind: string;
        };
        Update: {
          actor_account_id?: string | null;
          body?: string | null;
          created_at?: string;
          dispute_id?: string;
          evidence_path?: string | null;
          id?: string;
          kind?: string;
        };
        Relationships: [
          {
            foreignKeyName: "dispute_events_actor_account_id_fkey";
            columns: ["actor_account_id"];
            isOneToOne: false;
            referencedRelation: "platform_accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "dispute_events_dispute_id_fkey";
            columns: ["dispute_id"];
            isOneToOne: false;
            referencedRelation: "attribution_disputes";
            referencedColumns: ["id"];
          },
        ];
      };
      dispute_parties: {
        Row: {
          dispute_id: string;
          promoter_id: string;
          role: string;
        };
        Insert: {
          dispute_id: string;
          promoter_id: string;
          role: string;
        };
        Update: {
          dispute_id?: string;
          promoter_id?: string;
          role?: string;
        };
        Relationships: [
          {
            foreignKeyName: "dispute_parties_dispute_id_fkey";
            columns: ["dispute_id"];
            isOneToOne: false;
            referencedRelation: "attribution_disputes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "dispute_parties_promoter_id_fkey";
            columns: ["promoter_id"];
            isOneToOne: false;
            referencedRelation: "promoters";
            referencedColumns: ["id"];
          },
        ];
      };
      opportunity_attributions: {
        Row: {
          claim_id: string | null;
          confirmed_at: string;
          confirmed_by: string | null;
          id: string;
          method: string;
          opportunity_id: string;
          promoter_id: string;
          reason: string;
          status: string;
          voided_at: string | null;
        };
        Insert: {
          claim_id?: string | null;
          confirmed_at?: string;
          confirmed_by?: string | null;
          id?: string;
          method: string;
          opportunity_id: string;
          promoter_id: string;
          reason: string;
          status: string;
          voided_at?: string | null;
        };
        Update: {
          claim_id?: string | null;
          confirmed_at?: string;
          confirmed_by?: string | null;
          id?: string;
          method?: string;
          opportunity_id?: string;
          promoter_id?: string;
          reason?: string;
          status?: string;
          voided_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "opportunity_attributions_claim_id_fkey";
            columns: ["claim_id"];
            isOneToOne: false;
            referencedRelation: "attribution_claims";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "opportunity_attributions_confirmed_by_fkey";
            columns: ["confirmed_by"];
            isOneToOne: false;
            referencedRelation: "platform_accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "opportunity_attributions_opportunity_id_fkey";
            columns: ["opportunity_id"];
            isOneToOne: false;
            referencedRelation: "commercial_opportunities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "opportunity_attributions_promoter_id_fkey";
            columns: ["promoter_id"];
            isOneToOne: false;
            referencedRelation: "promoters";
            referencedColumns: ["id"];
          },
        ];
      };
      opportunity_protections: {
        Row: {
          basis: string;
          created_at: string;
          ends_at: string;
          id: string;
          opportunity_id: string;
          promoter_id: string;
          separation_id: string;
          starts_at: string;
        };
        Insert: {
          basis: string;
          created_at?: string;
          ends_at: string;
          id?: string;
          opportunity_id: string;
          promoter_id: string;
          separation_id: string;
          starts_at: string;
        };
        Update: {
          basis?: string;
          created_at?: string;
          ends_at?: string;
          id?: string;
          opportunity_id?: string;
          promoter_id?: string;
          separation_id?: string;
          starts_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "opportunity_protections_opportunity_id_fkey";
            columns: ["opportunity_id"];
            isOneToOne: false;
            referencedRelation: "commercial_opportunities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "opportunity_protections_promoter_id_fkey";
            columns: ["promoter_id"];
            isOneToOne: false;
            referencedRelation: "promoters";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "opportunity_protections_separation_id_fkey";
            columns: ["separation_id"];
            isOneToOne: false;
            referencedRelation: "promoter_separations";
            referencedColumns: ["id"];
          },
        ];
      };
      promoter_bank_accounts: {
        Row: {
          cbu_or_cvu: string;
          created_at: string;
          created_by: string | null;
          disabled_at: string | null;
          holder_name: string;
          id: string;
          is_current: boolean;
          promoter_id: string;
          verification_note: string | null;
        };
        Insert: {
          cbu_or_cvu: string;
          created_at?: string;
          created_by?: string | null;
          disabled_at?: string | null;
          holder_name: string;
          id?: string;
          is_current?: boolean;
          promoter_id: string;
          verification_note?: string | null;
        };
        Update: {
          cbu_or_cvu?: string;
          created_at?: string;
          created_by?: string | null;
          disabled_at?: string | null;
          holder_name?: string;
          id?: string;
          is_current?: boolean;
          promoter_id?: string;
          verification_note?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "promoter_bank_accounts_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "platform_accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "promoter_bank_accounts_promoter_id_fkey";
            columns: ["promoter_id"];
            isOneToOne: false;
            referencedRelation: "promoters";
            referencedColumns: ["id"];
          },
        ];
      };
      promoter_contracts: {
        Row: {
          accepted_at: string | null;
          created_at: string;
          document_path: string | null;
          id: string;
          promoter_id: string;
          version_label: string;
        };
        Insert: {
          accepted_at?: string | null;
          created_at?: string;
          document_path?: string | null;
          id?: string;
          promoter_id: string;
          version_label: string;
        };
        Update: {
          accepted_at?: string | null;
          created_at?: string;
          document_path?: string | null;
          id?: string;
          promoter_id?: string;
          version_label?: string;
        };
        Relationships: [
          {
            foreignKeyName: "promoter_contracts_promoter_id_fkey";
            columns: ["promoter_id"];
            isOneToOne: false;
            referencedRelation: "promoters";
            referencedColumns: ["id"];
          },
        ];
      };
      promoter_separations: {
        Row: {
          actor_account_id: string;
          created_at: string;
          effective_at: string;
          id: string;
          promoter_id: string;
          reason: string;
        };
        Insert: {
          actor_account_id: string;
          created_at?: string;
          effective_at: string;
          id?: string;
          promoter_id: string;
          reason: string;
        };
        Update: {
          actor_account_id?: string;
          created_at?: string;
          effective_at?: string;
          id?: string;
          promoter_id?: string;
          reason?: string;
        };
        Relationships: [
          {
            foreignKeyName: "promoter_separations_actor_account_id_fkey";
            columns: ["actor_account_id"];
            isOneToOne: false;
            referencedRelation: "platform_accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "promoter_separations_promoter_id_fkey";
            columns: ["promoter_id"];
            isOneToOne: true;
            referencedRelation: "promoters";
            referencedColumns: ["id"];
          },
        ];
      };
      promoter_verifications: {
        Row: {
          created_at: string;
          evidence_path: string | null;
          id: string;
          kind: string;
          notes: string | null;
          promoter_id: string;
          reviewed_at: string | null;
          reviewed_by: string | null;
          status: string;
        };
        Insert: {
          created_at?: string;
          evidence_path?: string | null;
          id?: string;
          kind: string;
          notes?: string | null;
          promoter_id: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status: string;
        };
        Update: {
          created_at?: string;
          evidence_path?: string | null;
          id?: string;
          kind?: string;
          notes?: string | null;
          promoter_id?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "promoter_verifications_promoter_id_fkey";
            columns: ["promoter_id"];
            isOneToOne: false;
            referencedRelation: "promoters";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "promoter_verifications_reviewed_by_fkey";
            columns: ["reviewed_by"];
            isOneToOne: false;
            referencedRelation: "platform_accounts";
            referencedColumns: ["id"];
          },
        ];
      };
      promoters: {
        Row: {
          account_id: string;
          activated_at: string | null;
          created_at: string;
          cuit: string | null;
          id: string;
          legal_name: string;
          public_code: string;
          separated_at: string | null;
          status: string;
        };
        Insert: {
          account_id: string;
          activated_at?: string | null;
          created_at?: string;
          cuit?: string | null;
          id?: string;
          legal_name: string;
          public_code: string;
          separated_at?: string | null;
          status: string;
        };
        Update: {
          account_id?: string;
          activated_at?: string | null;
          created_at?: string;
          cuit?: string | null;
          id?: string;
          legal_name?: string;
          public_code?: string;
          separated_at?: string | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "promoters_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: true;
            referencedRelation: "platform_accounts";
            referencedColumns: ["id"];
          },
        ];
      };

    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      current_account_id: { Args: never; Returns: string };
      activate_promoter: { Args: { p_promoter_id: string }; Returns: Json };
      confirm_attribution: {
        Args: {
          p_claim_id: string;
          p_opportunity_id: string;
          p_promoter_id: string;
          p_reason: string;
        };
        Returns: Json;
      };
      create_claim: {
        Args: { p_commercial_business_id: string; p_opportunity_id: string };
        Returns: Json;
      };
      current_promoter_id: { Args: never; Returns: string };
      decide_dispute: {
        Args: {
          p_decision: string;
          p_dispute_id: string;
          p_economic_effect: string;
          p_reason: string;
          p_void_attribution: boolean;
        };
        Returns: Json;
      };
      expire_due_claims: { Args: never; Returns: Json };
      extend_claim: {
        Args: { p_claim_id: string; p_interaction_id: string; p_reason: string };
        Returns: Json;
      };
      open_dispute: {
        Args: { p_opportunity_id: string; p_promoter_ids: string[]; p_reason: string };
        Returns: Json;
      };
      promoter_add_note: { Args: { p_body: string; p_opportunity_id: string }; Returns: Json };
      promoter_can_operate: { Args: { p_status: string }; Returns: boolean };
      promoter_has_substantive_activity: {
        Args: { p_opportunity_id: string; p_promoter_id: string };
        Returns: boolean;
      };
      promoter_overview: { Args: never; Returns: Json };
      promoter_session: { Args: never; Returns: Json };
      promoter_transition_opportunity: {
        Args: { p_opportunity_id: string; p_reason: string; p_to_stage: string };
        Returns: Json;
      };
      promoter_upsert_task: {
        Args: {
          p_due_at: string;
          p_opportunity_id: string;
          p_status: string;
          p_task_id: string;
          p_title: string;
        };
        Returns: Json;
      };
      read_dispute: { Args: { p_dispute_id: string }; Returns: Json };
      read_own_bank: { Args: never; Returns: Json };
      register_promoter: {
        Args: { p_cuit: string; p_email: string; p_legal_name: string };
        Returns: Json;
      };
      register_promoter_business: {
        Args: { p_trade_category: string; p_trade_name: string; p_whatsapp: string };
        Returns: Json;
      };
      replace_bank_account: {
        Args: {
          p_cbu_or_cvu: string;
          p_holder_name: string;
          p_note: string;
          p_promoter_id: string;
        };
        Returns: Json;
      };
      review_verification: {
        Args: { p_notes: string; p_status: string; p_verification_id: string };
        Returns: Json;
      };
      separate_promoter: {
        Args: {
          p_exception_opportunity_id: string;
          p_owner_account_id: string;
          p_promoter_id: string;
          p_reason: string;
        };
        Returns: Json;
      };
      submit_promoter_evidence: {
        Args: { p_evidence_path: string; p_kind: string; p_promoter_id: string };
        Returns: Json;
      };
      transition_promoter_status: {
        Args: { p_promoter_id: string; p_to_status: string };
        Returns: Json;
      };
      try_automatic_referral: {
        Args: { p_business_id: string; p_opportunity_id: string; p_origin: string };
        Returns: undefined;
      };
      enqueue: {
        Args: { p_correlation_id: string; p_event_name: string; p_payload: Json };
        Returns: string;
      };
      find_or_prepare_business: {
        Args: { p_channel: string; p_display_name: string; p_fiscal_id: string; p_phone: string };
        Returns: Json;
      };
      grant_internal_role: {
        Args: { p_account_id: string; p_role: string };
        Returns: Json;
      };
      has_internal_role: { Args: { p_role: string }; Returns: boolean };
      has_permission: { Args: { p_code: string }; Returns: boolean };
      transition_opportunity: {
        Args: { p_opportunity_id: string; p_reason: string; p_to_stage: string };
        Returns: Json;
      };
      upsert_task: {
        Args: {
          p_cancel_reason: string;
          p_due_at: string;
          p_opportunity_id: string;
          p_priority: string;
          p_status: string;
          p_task_id: string;
          p_title: string;
        };
        Returns: Json;
      };
      revoke_internal_role: {
        Args: { p_account_id: string; p_role: string };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type PublicSchema = Database["public"];

export type Tables<TableName extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][TableName]["Row"];

export type TablesInsert<TableName extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][TableName]["Insert"];

export type TablesUpdate<TableName extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][TableName]["Update"];

export type Enums<EnumName extends keyof PublicSchema["Enums"]> =
  PublicSchema["Enums"][EnumName];
