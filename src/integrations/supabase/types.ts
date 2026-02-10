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
      channel_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          position: number
          server_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          position?: number
          server_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          position?: number
          server_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "channel_categories_server_id_fkey"
            columns: ["server_id"]
            isOneToOne: false
            referencedRelation: "servers"
            referencedColumns: ["id"]
          },
        ]
      }
      channels: {
        Row: {
          category_id: string | null
          created_at: string
          id: string
          name: string
          position: number
          server_id: string
          type: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          id?: string
          name: string
          position?: number
          server_id: string
          type?: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          id?: string
          name?: string
          position?: number
          server_id?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "channels_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "channel_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channels_server_id_fkey"
            columns: ["server_id"]
            isOneToOne: false
            referencedRelation: "servers"
            referencedColumns: ["id"]
          },
        ]
      }
      direct_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          media_url: string | null
          read: boolean
          receiver_id: string
          sender_id: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          media_url?: string | null
          read?: boolean
          receiver_id: string
          sender_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          media_url?: string | null
          read?: boolean
          receiver_id?: string
          sender_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "direct_messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "direct_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      friendships: {
        Row: {
          created_at: string
          friend_id: string
          id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          friend_id: string
          id?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          friend_id?: string
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "friendships_friend_id_fkey"
            columns: ["friend_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friendships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      message_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          message_id: string
          table_name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          message_id: string
          table_name?: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          message_id?: string
          table_name?: string
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          channel_id: string
          content: string
          created_at: string
          id: string
          media_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          channel_id: string
          content: string
          created_at?: string
          id?: string
          media_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          channel_id?: string
          content?: string
          created_at?: string
          id?: string
          media_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pinned_messages: {
        Row: {
          channel_id: string
          id: string
          message_id: string
          pinned_at: string
          pinned_by: string
        }
        Insert: {
          channel_id: string
          id?: string
          message_id: string
          pinned_at?: string
          pinned_by: string
        }
        Update: {
          channel_id?: string
          id?: string
          message_id?: string
          pinned_at?: string
          pinned_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "pinned_messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pinned_messages_pinned_by_fkey"
            columns: ["pinned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          id: string
          last_seen: string | null
          status: string | null
          updated_at: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          id: string
          last_seen?: string | null
          status?: string | null
          updated_at?: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          last_seen?: string | null
          status?: string | null
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      server_bans: {
        Row: {
          banned_by: string
          created_at: string
          id: string
          reason: string | null
          server_id: string
          user_id: string
        }
        Insert: {
          banned_by: string
          created_at?: string
          id?: string
          reason?: string | null
          server_id: string
          user_id: string
        }
        Update: {
          banned_by?: string
          created_at?: string
          id?: string
          reason?: string | null
          server_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "server_bans_banned_by_fkey"
            columns: ["banned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "server_bans_server_id_fkey"
            columns: ["server_id"]
            isOneToOne: false
            referencedRelation: "servers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "server_bans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      server_member_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["server_role"]
          server_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["server_role"]
          server_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["server_role"]
          server_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "server_member_roles_server_id_fkey"
            columns: ["server_id"]
            isOneToOne: false
            referencedRelation: "servers"
            referencedColumns: ["id"]
          },
        ]
      }
      server_members: {
        Row: {
          id: string
          joined_at: string
          server_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          server_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          server_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "server_members_server_id_fkey"
            columns: ["server_id"]
            isOneToOne: false
            referencedRelation: "servers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "server_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      server_mutes: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          muted_by: string
          reason: string | null
          server_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          muted_by: string
          reason?: string | null
          server_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          muted_by?: string
          reason?: string | null
          server_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "server_mutes_server_id_fkey"
            columns: ["server_id"]
            isOneToOne: false
            referencedRelation: "servers"
            referencedColumns: ["id"]
          },
        ]
      }
      servers: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_private: boolean | null
          name: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_private?: boolean | null
          name: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_private?: boolean | null
          name?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_server_role: {
        Args: { p_server_id: string; p_user_id: string }
        Returns: Database["public"]["Enums"]["server_role"]
      }
    }
    Enums: {
      server_role: "owner" | "admin" | "moderator" | "member"
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
      server_role: ["owner", "admin", "moderator", "member"],
    },
  },
} as const
