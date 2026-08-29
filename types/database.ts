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
