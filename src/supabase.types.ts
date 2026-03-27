export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      materials: {
        Row: {
          id: string;
          title: string;
          description: string;
          type: 'swap' | 'sell' | 'donate' | 'resource';
          subject: string;
          author_id: string;
          author_name: string;
          author_avatar: string | null;
          file_url: string | null;
          file_name: string | null;
          file_type: string | null;
          file_size: number | null;
          student_name: string | null;
          student_year: string | null;
          student_department: string | null;
          contact_phone: string | null;
          contact_whatsapp: string | null;
          contact_instagram: string | null;
          contact_telegram: string | null;
          rating: number | null;
          downloads: number | null;
          price: number | null;
          is_verified: boolean | null;
          is_community_choice: boolean | null;
          icon: string | null;
          status: 'available' | 'completed' | null;
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          type: 'swap' | 'sell' | 'donate' | 'resource';
          subject: string;
          author_id: string;
          author_name: string;
          author_avatar?: string | null;
          file_url?: string | null;
          file_name?: string | null;
          file_type?: string | null;
          file_size?: number | null;
          student_name?: string | null;
          student_year?: string | null;
          student_department?: string | null;
          contact_phone?: string | null;
          contact_whatsapp?: string | null;
          contact_instagram?: string | null;
          contact_telegram?: string | null;
          rating?: number | null;
          downloads?: number | null;
          price?: number | null;
          is_verified?: boolean | null;
          is_community_choice?: boolean | null;
          icon?: string | null;
          status?: 'available' | 'completed' | null;
          completed_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['materials']['Insert']>;
        Relationships: [];
      };
      downloads: {
        Row: {
          id: string;
          user_id: string;
          material_id: string;
          material_title: string;
          material_author: string;
          downloaded_at: string;
          file_url: string;
          file_name: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          material_id: string;
          material_title: string;
          material_author: string;
          downloaded_at?: string;
          file_url: string;
          file_name: string;
        };
        Update: Partial<Database['public']['Tables']['downloads']['Insert']>;
        Relationships: [];
      };
      swap_requests: {
        Row: {
          id: string;
          user_id: string;
          user_name: string;
          user_avatar: string | null;
          title: string;
          description: string;
          looking_for: string;
          status: 'open' | 'closed';
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          user_name: string;
          user_avatar?: string | null;
          title: string;
          description: string;
          looking_for: string;
          status?: 'open' | 'closed';
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['swap_requests']['Insert']>;
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          sender_id: string;
          receiver_id: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          sender_id: string;
          receiver_id: string;
          content: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['messages']['Insert']>;
        Relationships: [];
      };
      purchases: {
        Row: {
          id: string;
          material_id: string;
          material_title: string;
          seller_id: string;
          buyer_id: string;
          amount: number;
          purchased_at: string;
        };
        Insert: {
          id?: string;
          material_id: string;
          material_title: string;
          seller_id: string;
          buyer_id: string;
          amount: number;
          purchased_at?: string;
        };
        Update: Partial<Database['public']['Tables']['purchases']['Insert']>;
        Relationships: [];
      };
      contact_messages: {
        Row: {
          id: string;
          name: string;
          email: string;
          message: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          message: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['contact_messages']['Insert']>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
