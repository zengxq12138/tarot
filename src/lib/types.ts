export interface TarotCard {
  id: number;
  name_zh: string;
  name_en: string;
  arcana: "major" | "minor";
  suit: "wands" | "cups" | "swords" | "pentacles" | null;
  number?: number;
  rank?: string;
  keywords_upright_zh: string[];
  keywords_upright_en: string[];
  keywords_reversed_zh: string[];
  keywords_reversed_en: string[];
  meaning_zh: string;
  meaning_en: string;
  image: string;
}

export interface DrawnCard {
  card_id: number;
  position: "past" | "present" | "future";
  is_reversed: boolean;
}

export interface Reading {
  id: string;
  user_id: string;
  question: string;
  locale: "zh" | "en";
  cards: DrawnCard[];
  interpretation: string;
  is_favorited: boolean;
  created_at: string;
}

export interface UserPoints {
  user_id: string;
  balance: number;
  updated_at: string;
}

export interface PointsTransaction {
  id: string;
  user_id: string;
  amount: number;
  type: "draw" | "interpret" | "admin_recharge" | "signup_bonus";
  balance_after: number;
  created_at: string;
}

export type RitualPhase =
  | "idle"
  | "question_input"
  | "shuffle"
  | "pick_1"
  | "pick_2"
  | "pick_3"
  | "reveal"
  | "interpretation";

export type Locale = "zh" | "en";
