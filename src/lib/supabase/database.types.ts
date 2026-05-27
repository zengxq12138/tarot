export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      readings: {
        Row: {
          id: string;
          user_id: string;
          question: string;
          locale: string;
          cards: Json;
          interpretation: string;
          is_favorited: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          question: string;
          locale?: string;
          cards: Json;
          interpretation?: string;
          is_favorited?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          question?: string;
          locale?: string;
          cards?: Json;
          interpretation?: string;
          is_favorited?: boolean;
          created_at?: string;
        };
      };
      user_points: {
        Row: {
          user_id: string;
          balance: number;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          balance?: number;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          balance?: number;
          updated_at?: string;
        };
      };
      points_transactions: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          type: string;
          balance_after: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount: number;
          type: string;
          balance_after: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          amount?: number;
          type?: string;
          balance_after?: number;
          created_at?: string;
        };
      };
    };
    Views: {};
    Functions: {
      deduct_points: {
        Args: {
          p_user_id: string;
          p_amount: number;
          p_type: string;
        };
        Returns: Json;
      };
      recharge_points: {
        Args: {
          p_admin_id: string;
          p_user_id: string;
          p_amount: number;
        };
        Returns: Json;
      };
    };
    Enums: {};
  };
}
