"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { TarotScene } from "@/components/ritual/tarot-scene";
import { InterpretationPanel } from "@/components/ritual/interpretation-panel";
import { useToast } from "@/components/ui/use-toast";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { RitualPhase, DrawnCard } from "@/lib/types";
import { Loader2, Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function RitualPage() {
  const t = useTranslations("ritual");
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [phase, setPhase] = useState<RitualPhase>("question_input");
  const [question, setQuestion] = useState("");
  const [drawnCards, setDrawnCards] = useState<DrawnCard[]>([]);
  const [interpretation, setInterpretation] = useState("");
  const [isRevealing, setIsRevealing] = useState(false);
  const [readingId, setReadingId] = useState<string | null>(null);
  const [cardHovered, setCardHovered] = useState(false);

  const handleRestart = useCallback(() => {
    setPhase("question_input");
    setQuestion("");
    setDrawnCards([]);
    setInterpretation("");
    setIsRevealing(false);
    setReadingId(null);
    setCardHovered(false);
  }, []);

  // Phase transition effect: moves to next pick phase or reveal after cards are drawn
  useEffect(() => {
    const count = drawnCards.length;
    if (count === 0) return;

    const timer = setTimeout(() => {
      if (count === 3) {
        setPhase("reveal");
      } else {
        setPhase(`pick_${(count + 1) as 1 | 2 | 3}` as RitualPhase);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [drawnCards.length]);

  const handleDrawCard = useCallback(
    (cardId: number) => {
      if (!user) return;

      setDrawnCards((prev) => {
        const posIndex = prev.length;
        const position =
          posIndex === 0 ? "past" : posIndex === 1 ? "present" : "future";

        return [
          ...prev,
          {
            card_id: cardId,
            position,
            is_reversed: Math.random() > 0.5,
          },
        ];
      });

      // Fire-and-forget: deduct 1 point for draw
      supabase.rpc("deduct_points", {
        p_user_id: user.id,
        p_amount: 1,
        p_type: "draw",
      }).then(({ error }: any) => {
        if (error) console.warn("Points deduction warning:", error.message);
      }).catch((err: any) => {
        console.warn("Points deduction failed:", err?.message ?? err);
      });
    },
    [user, supabase]
  );

  const handleStartShuffle = () => {
    if (!question.trim()) return;
    setPhase("shuffle");
  };

  const handleReveal = async () => {
    if (!user) return;
    setIsRevealing(true);

    // Deduct 2 points for interpretation
    const { error: ptsErr } = await supabase.rpc("deduct_points", {
      p_user_id: user.id,
      p_amount: 2,
      p_type: "interpret",
    });

    if (ptsErr) {
      toast({ title: t("points.insufficient"), variant: "destructive" });
      setIsRevealing(false);
      return;
    }

    // Save reading record
    const { data: reading, error } = await supabase.from("readings").insert({
      user_id: user.id,
      question,
      cards: drawnCards,
      locale: "zh",
    }).select("id").single();

    if (error) {
      toast({ title: "Failed to save reading", variant: "destructive" });
    } else if (reading) {
      setReadingId(reading.id);
    }

    // Start streaming interpretation
    setPhase("interpretation");
    setIsRevealing(false);

    await streamInterpretation(question, drawnCards);
  };

  const streamInterpretation = async (
    q: string,
    cards: DrawnCard[]
  ) => {
    try {
      const response = await fetch("/api/divination/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, cards, readingId }),
      });

      if (!response.ok) throw new Error("Stream failed");

      const reader = response.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let result = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                result += parsed.content;
                setInterpretation(result);
              }
            } catch {
              result += data;
              setInterpretation(result);
            }
          }
        }
      }

      // Update reading with interpretation
      if (readingId) {
        await supabase.from("readings").update({ interpretation: result }).eq("id", readingId);
      }
    } catch (err) {
      console.error("Stream error:", err);
      setInterpretation((prev) => prev + "\n\n[解读中断，请刷新重试]");
    }
  };

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-lg text-muted-foreground">
          {"请先登录以开始占卜"}
        </p>
        <Button asChild>
          <Link href="/login">{"登录"}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-3.5rem)]">
      {/* Three.js background scene */}
      <TarotScene
        phase={phase}
        drawnCards={drawnCards}
        onPickCard={handleDrawCard}
        onCardHover={setCardHovered}
      />

      {/* UI Overlay — pointer-events-none during pick phases so clicks pass through to 3D canvas */}
      <div
        className={`relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] px-4 ${
          phase === "pick_1" || phase === "pick_2" || phase === "pick_3"
            ? "pointer-events-none"
            : ""
        }`}
      >
        {phase === "question_input" && (
          <Card className="w-full max-w-lg border-purple-800/30 bg-card/80 backdrop-blur-md">
            <CardContent className="p-6 pt-6 space-y-4">
              <h2 className="text-xl font-semibold text-center text-purple-200">
                {t("askQuestion")}
              </h2>
              <Input
                placeholder={t("questionPlaceholder")}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleStartShuffle()}
                className="bg-background/50 text-lg py-6"
                autoFocus
              />
              <Button
                onClick={handleStartShuffle}
                disabled={!question.trim()}
                className="w-full"
                size="lg"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {t("startShuffle")}
              </Button>
            </CardContent>
          </Card>
        )}

        {phase === "shuffle" && (
          <div className="text-center space-y-2">
            <p className="text-2xl text-purple-200 animate-pulse">
              {"正在洗牌..."}
            </p>
            <p className="text-sm text-muted-foreground">
              {"牌面正在重新排列，稍后选出三张牌"}
            </p>
            <Button onClick={() => setPhase("pick_1")} className="mt-4">
              {"开始选牌"}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {(phase === "pick_1" || phase === "pick_2" || phase === "pick_3") && (
          <div className="text-center space-y-2">
            <p className="text-2xl text-purple-200">
              {t("pickCard", {
                position:
                  phase === "pick_1" ? "1" : phase === "pick_2" ? "2" : "3",
              })}
            </p>
            <p className="text-sm text-muted-foreground">
              {phase === "pick_1"
                ? "代表 过去"
                : phase === "pick_2"
                ? "代表 现在"
                : "代表 未来"}
            </p>
            {cardHovered && (
              <p className="text-xs text-amber-300/80 animate-pulse mt-2">
                {"点击悬浮的牌面进行选择"}
              </p>
            )}
          </div>
        )}

        {phase === "reveal" && (
          <div className="text-center space-y-4">
            <p className="text-2xl text-purple-200">
              {"三张牌已选出"}
            </p>
            <Button
              onClick={handleReveal}
              disabled={isRevealing}
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-amber-600"
            >
              {isRevealing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <Sparkles className="w-4 h-4 mr-2" />
              {t("reveal")}
            </Button>
          </div>
        )}

        {phase === "interpretation" && (
          <InterpretationPanel
            question={question}
            drawnCards={drawnCards}
            interpretation={interpretation}
            readingId={readingId}
            onRestart={handleRestart}
          />
        )}
      </div>
    </div>
  );
}
