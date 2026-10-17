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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_announcements: {
        Row: {
          content: string
          created_at: string
          id: string
          image_url: string | null
          title: string | null
          updated_at: string
          user_id: string
          village: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
          village: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
          village?: string
        }
        Relationships: []
      }
      announcement_replies: {
        Row: {
          announcement_id: string
          content: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          announcement_id: string
          content: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          announcement_id?: string
          content?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcement_replies_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "admin_announcements"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          category: string | null
          content: string
          created_at: string
          id: string
          image_url: string | null
          is_urgent: boolean | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_urgent?: boolean | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_urgent?: boolean | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      business_items: {
        Row: {
          business_id: string
          category: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_available: boolean | null
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          business_id: string
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          name: string
          price: number
          updated_at?: string
        }
        Update: {
          business_id?: string
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_items_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_order_items: {
        Row: {
          created_at: string
          id: string
          item_id: string
          item_name: string
          order_id: string
          quantity: number
          subtotal: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          item_name: string
          order_id: string
          quantity: number
          subtotal: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          item_name?: string
          order_id?: string
          quantity?: number
          subtotal?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "business_order_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "business_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "business_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      business_orders: {
        Row: {
          amount_paid: number | null
          business_id: string
          created_at: string
          guest_contact: string | null
          guest_name: string | null
          id: string
          status: string
          total_amount: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount_paid?: number | null
          business_id: string
          created_at?: string
          guest_contact?: string | null
          guest_name?: string | null
          id?: string
          status?: string
          total_amount: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount_paid?: number | null
          business_id?: string
          created_at?: string
          guest_contact?: string | null
          guest_name?: string | null
          id?: string
          status?: string
          total_amount?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_orders_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          updated_at: string
          user_id: string
          village: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          updated_at?: string
          user_id: string
          village: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          updated_at?: string
          user_id?: string
          village?: string
        }
        Relationships: []
      }
      facilities: {
        Row: {
          created_at: string
          description: string | null
          facility_type: Database["public"]["Enums"]["facility_type"]
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
          village: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          facility_type: Database["public"]["Enums"]["facility_type"]
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
          village: string
        }
        Update: {
          created_at?: string
          description?: string | null
          facility_type?: Database["public"]["Enums"]["facility_type"]
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
          village?: string
        }
        Relationships: []
      }
      facility_bookings: {
        Row: {
          booking_date: string
          booking_status: Database["public"]["Enums"]["booking_status"]
          catering: boolean | null
          created_at: string
          end_time: string
          event_type: string | null
          facility_id: string
          id: string
          num_people: number | null
          pa_system: boolean | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          purpose: string
          resource_id: string
          start_time: string
          updated_at: string
          user_id: string
          village: string
        }
        Insert: {
          booking_date: string
          booking_status?: Database["public"]["Enums"]["booking_status"]
          catering?: boolean | null
          created_at?: string
          end_time: string
          event_type?: string | null
          facility_id: string
          id?: string
          num_people?: number | null
          pa_system?: boolean | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          purpose: string
          resource_id: string
          start_time: string
          updated_at?: string
          user_id: string
          village: string
        }
        Update: {
          booking_date?: string
          booking_status?: Database["public"]["Enums"]["booking_status"]
          catering?: boolean | null
          created_at?: string
          end_time?: string
          event_type?: string | null
          facility_id?: string
          id?: string
          num_people?: number | null
          pa_system?: boolean | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          purpose?: string
          resource_id?: string
          start_time?: string
          updated_at?: string
          user_id?: string
          village?: string
        }
        Relationships: [
          {
            foreignKeyName: "facility_bookings_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facility_bookings_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "facility_resources"
            referencedColumns: ["id"]
          },
        ]
      }
      facility_resources: {
        Row: {
          capacity: number | null
          created_at: string
          facility_id: string
          id: string
          is_active: boolean | null
          name: string
          resource_type: string
          updated_at: string
        }
        Insert: {
          capacity?: number | null
          created_at?: string
          facility_id: string
          id?: string
          is_active?: boolean | null
          name: string
          resource_type: string
          updated_at?: string
        }
        Update: {
          capacity?: number | null
          created_at?: string
          facility_id?: string
          id?: string
          is_active?: boolean | null
          name?: string
          resource_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "facility_resources_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
        ]
      }
      families: {
        Row: {
          approval_status: string | null
          approved_by: string | null
          created_at: string
          head_user_id: string
          id: string
          name: string
          qr_code: string
          updated_at: string
          village: string | null
        }
        Insert: {
          approval_status?: string | null
          approved_by?: string | null
          created_at?: string
          head_user_id: string
          id?: string
          name: string
          qr_code?: string
          updated_at?: string
          village?: string | null
        }
        Update: {
          approval_status?: string | null
          approved_by?: string | null
          created_at?: string
          head_user_id?: string
          id?: string
          name?: string
          qr_code?: string
          updated_at?: string
          village?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "families_head_user_id_fkey"
            columns: ["head_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      family_members: {
        Row: {
          created_at: string
          family_id: string
          ic_number: string | null
          id: string
          invitation_status: Database["public"]["Enums"]["invitation_status"]
          invited_by: string | null
          name: string
          role: Database["public"]["Enums"]["family_role"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          family_id: string
          ic_number?: string | null
          id?: string
          invitation_status?: Database["public"]["Enums"]["invitation_status"]
          invited_by?: string | null
          name: string
          role?: Database["public"]["Enums"]["family_role"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          family_id?: string
          ic_number?: string | null
          id?: string
          invitation_status?: Database["public"]["Enums"]["invitation_status"]
          invited_by?: string | null
          name?: string
          role?: Database["public"]["Enums"]["family_role"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "family_members_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_members_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "family_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      fund_donations: {
        Row: {
          amount: number
          created_at: string
          fund_request_id: string
          guest_email: string | null
          guest_name: string | null
          id: string
          message: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          fund_request_id: string
          guest_email?: string | null
          guest_name?: string | null
          id?: string
          message?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          fund_request_id?: string
          guest_email?: string | null
          guest_name?: string | null
          id?: string
          message?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fund_donations_fund_request_id_fkey"
            columns: ["fund_request_id"]
            isOneToOne: false
            referencedRelation: "fund_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      fund_requests: {
        Row: {
          created_at: string
          current_amount: number | null
          description: string
          id: string
          photo_url: string | null
          status: Database["public"]["Enums"]["fund_status"]
          target_amount: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_amount?: number | null
          description: string
          id?: string
          photo_url?: string | null
          status?: Database["public"]["Enums"]["fund_status"]
          target_amount: number
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_amount?: number | null
          description?: string
          id?: string
          photo_url?: string | null
          status?: Database["public"]["Enums"]["fund_status"]
          target_amount?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      guest_inquiries: {
        Row: {
          created_at: string
          guest_contact: string
          guest_name: string
          id: string
          is_read: boolean | null
          item_id: string
          message: string
          seller_id: string
        }
        Insert: {
          created_at?: string
          guest_contact: string
          guest_name: string
          id?: string
          is_read?: boolean | null
          item_id: string
          message: string
          seller_id: string
        }
        Update: {
          created_at?: string
          guest_contact?: string
          guest_name?: string
          id?: string
          is_read?: boolean | null
          item_id?: string
          message?: string
          seller_id?: string
        }
        Relationships: []
      }
      lost_found: {
        Row: {
          contact: string | null
          created_at: string
          description: string
          found_at: string | null
          id: string
          is_resolved: boolean | null
          location: string | null
          photo_url: string | null
          title: string
          type: Database["public"]["Enums"]["lost_found_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          contact?: string | null
          created_at?: string
          description: string
          found_at?: string | null
          id?: string
          is_resolved?: boolean | null
          location?: string | null
          photo_url?: string | null
          title: string
          type: Database["public"]["Enums"]["lost_found_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          contact?: string | null
          created_at?: string
          description?: string
          found_at?: string | null
          id?: string
          is_resolved?: boolean | null
          location?: string | null
          photo_url?: string | null
          title?: string
          type?: Database["public"]["Enums"]["lost_found_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      marketplace_items: {
        Row: {
          contact: string | null
          created_at: string
          description: string
          id: string
          is_sold: boolean | null
          photo_url: string | null
          price: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          contact?: string | null
          created_at?: string
          description: string
          id?: string
          is_sold?: boolean | null
          photo_url?: string | null
          price: number
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          contact?: string | null
          created_at?: string
          description?: string
          id?: string
          is_sold?: boolean | null
          photo_url?: string | null
          price?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          image_url: string | null
          is_pinned: boolean | null
          reply_to: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_pinned?: boolean | null
          reply_to?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_pinned?: boolean | null
          reply_to?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_reply_to_fkey"
            columns: ["reply_to"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          approval_status: Database["public"]["Enums"]["approval_status"] | null
          approved_by: string | null
          avatar_url: string | null
          created_at: string
          date_of_birth: string | null
          education_level: string | null
          email: string
          gender: string | null
          id: string
          name: string
          occupation: string | null
          phone: string | null
          updated_at: string
          user_id: string
          village: string | null
        }
        Insert: {
          address?: string | null
          approval_status?:
            | Database["public"]["Enums"]["approval_status"]
            | null
          approved_by?: string | null
          avatar_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          education_level?: string | null
          email: string
          gender?: string | null
          id?: string
          name: string
          occupation?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
          village?: string | null
        }
        Update: {
          address?: string | null
          approval_status?:
            | Database["public"]["Enums"]["approval_status"]
            | null
          approved_by?: string | null
          avatar_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          education_level?: string | null
          email?: string
          gender?: string | null
          id?: string
          name?: string
          occupation?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
          village?: string | null
        }
        Relationships: []
      }
      reports: {
        Row: {
          admin_response: string | null
          created_at: string
          description: string
          id: string
          location: string | null
          photo_url: string | null
          status: Database["public"]["Enums"]["report_status"]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_response?: string | null
          created_at?: string
          description: string
          id?: string
          location?: string | null
          photo_url?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_response?: string | null
          created_at?: string
          description?: string
          id?: string
          location?: string | null
          photo_url?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      archive_fund_request: {
        Args: { _fund_request_id: string }
        Returns: boolean
      }
      auto_delete_found_items: { Args: never; Returns: undefined }
      check_booking_availability: {
        Args: {
          _booking_date: string
          _end_time: string
          _exclude_booking_id?: string
          _resource_id: string
          _start_time: string
        }
        Returns: boolean
      }
      create_business_order: {
        Args: {
          _amount_paid: number
          _business_id: string
          _guest_contact: string
          _guest_name: string
          _items: Json
          _total_amount: number
        }
        Returns: string
      }
      create_guest_donation: {
        Args: {
          _amount: number
          _fund_request_id: string
          _guest_email?: string
          _guest_name?: string
          _message?: string
        }
        Returns: string
      }
      create_guest_inquiry: {
        Args: {
          _guest_contact: string
          _guest_name: string
          _item_id: string
          _message: string
          _seller_id: string
        }
        Returns: string
      }
      create_user_donation: {
        Args: { _amount: number; _fund_request_id: string; _user_id: string }
        Returns: string
      }
      get_all_announcements_with_villages: {
        Args: never
        Returns: {
          author_name: string
          category: string
          content: string
          created_at: string
          id: string
          image_url: string
          is_urgent: boolean
          title: string
          user_id: string
          village_name: string
        }[]
      }
      get_all_villages: {
        Args: never
        Returns: {
          village_name: string
        }[]
      }
      get_booked_slots: {
        Args: { _booking_date: string; _resource_id: string }
        Returns: {
          end_time: string
          start_time: string
        }[]
      }
      get_business_items: {
        Args: { _business_id: string }
        Returns: {
          category: string
          description: string
          id: string
          image_url: string
          name: string
          price: number
        }[]
      }
      get_public_announcements: {
        Args: { _village: string }
        Returns: {
          category: string
          content: string
          created_at: string
          id: string
          image_url: string
          is_urgent: boolean
          title: string
        }[]
      }
      get_public_businesses: {
        Args: { _village: string }
        Returns: {
          created_at: string
          description: string
          id: string
          image_url: string
          name: string
          user_id: string
        }[]
      }
      get_public_fund_requests: {
        Args: { _village: string }
        Returns: {
          created_at: string
          current_amount: number
          description: string
          id: string
          photo_url: string
          status: string
          target_amount: number
          title: string
        }[]
      }
      get_public_marketplace: {
        Args: { _village: string }
        Returns: {
          created_at: string
          description: string
          id: string
          is_sold: boolean
          photo_url: string
          price: number
          seller_id: string
          title: string
        }[]
      }
      get_public_villages: {
        Args: never
        Returns: {
          village_name: string
        }[]
      }
      get_user_family_ids: { Args: { _user_id: string }; Returns: string[] }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_user_village: { Args: { _user_id: string }; Returns: string }
      get_village_announcements: {
        Args: { _village: string }
        Returns: {
          author_name: string
          category: string
          content: string
          created_at: string
          id: string
          image_url: string
          is_urgent: boolean
          title: string
          user_id: string
        }[]
      }
      get_village_ketua: {
        Args: { _village: string }
        Returns: {
          ketua_id: string
          ketua_name: string
        }[]
      }
      has_admin_access: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      initialize_village_facilities: {
        Args: { _village: string }
        Returns: undefined
      }
      is_family_member: {
        Args: { _family_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "resident" | "jkkk"
      approval_status: "pending" | "approved" | "rejected"
      booking_status: "booked" | "cancelled"
      facility_type: "library" | "pusat_it" | "hall"
      family_role: "father" | "mother" | "son" | "daughter" | "other"
      fund_status: "active" | "completed" | "cancelled"
      invitation_status: "pending" | "accepted" | "rejected"
      lost_found_type: "lost" | "found"
      payment_status: "paid" | "unpaid"
      report_status: "pending" | "in_progress" | "resolved"
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
      app_role: ["admin", "resident", "jkkk"],
      approval_status: ["pending", "approved", "rejected"],
      booking_status: ["booked", "cancelled"],
      facility_type: ["library", "pusat_it", "hall"],
      family_role: ["father", "mother", "son", "daughter", "other"],
      fund_status: ["active", "completed", "cancelled"],
      invitation_status: ["pending", "accepted", "rejected"],
      lost_found_type: ["lost", "found"],
      payment_status: ["paid", "unpaid"],
      report_status: ["pending", "in_progress", "resolved"],
    },
  },
} as const
