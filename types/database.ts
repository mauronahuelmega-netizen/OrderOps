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
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string | null;
          product_name: string;
          quantity: number;
          unit_price: number;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id?: string | null;
          product_name: string;
          quantity: number;
          unit_price: number;
        };
        Update: {
          id?: string;
          order_id?: string;
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
