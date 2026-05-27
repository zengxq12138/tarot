"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import type { Reading } from "@/lib/types";
import tarotCards from "@/data/tarot-cards.json";

export default function ReadingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const supabase = createSupabaseBrowserClient();

  const [reading, setReading] = useState<Reading | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !id) return;
    supabase
      .from("readings")
      .select("*")
      .eq("id", id)
      .single()
      .then((result: any) => {
        if (result.data) setReading(result.data as Reading);
        setLoading(false);
      });
  }, [id, user, supabase]);

  const toggleFavorite = async () => {
    if (!reading) return;
    const next = !reading.is_favorited;
    setReading({ ...reading, is_favorited: next });
    await supabase.from("readings").update({ is_favorited: next }).eq("id", reading.id);
  };

  const getCardName = (cardId: number) => {
    const card = (tarotCards as any[]).find((c) => c.id === cardId);
    return card?.name_zh ?? `Card ${cardId}`;
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
      </div>
    );
  }

  if (!reading) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">未找到占卜记录</p>
        <Button asChild variant="outline">
          <Link href="/history">返回历史</Link>
        </Button>
      </div>
    );
  }

  const cardsData = (reading.cards as any[]).map((dc: any) => ({
    ...dc,
    name: getCardName(dc.card_id),
  }));

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/history">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-lg font-semibold">{reading.question}</h1>
          <p className="text-xs text-muted-foreground">
            {new Date(reading.created_at).toLocaleString("zh-CN")}
          </p>
        </div>
        <Button variant="outline" size="icon" onClick={toggleFavorite}>
          <Heart
            className={`w-4 h-4 ${
              reading.is_favorited
                ? "fill-red-400 text-red-400"
                : "text-muted-foreground"
            }`}
          />
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {cardsData.map((card: any, i: number) => (
          <Card key={i} className="text-center border-purple-800/30 bg-card/60">
            <CardHeader className="p-3 pb-1">
              <CardTitle className="text-sm">{card.name}</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <p className="text-xs text-muted-foreground">
                {card.position === "past"
                  ? "过去"
                  : card.position === "present"
                  ? "现在"
                  : "未来"}
              </p>
              <span
                className={`text-xs ${
                  card.is_reversed ? "text-red-400" : "text-green-400"
                }`}
              >
                {card.is_reversed ? "逆位" : "正位"}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-purple-800/30 bg-card/80">
        <CardContent className="p-6">
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-purple-100/90">
            {reading.interpretation || "解读内容未保存"}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
