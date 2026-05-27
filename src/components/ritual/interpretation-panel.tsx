"use client";

import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShareCard } from "@/components/share/share-card";
import { DrawnCard } from "@/lib/types";
import tarotCards from "@/data/tarot-cards.json";
import { Loader2, Share2, Heart } from "lucide-react";
import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface InterpretationPanelProps {
  question: string;
  drawnCards: DrawnCard[];
  interpretation: string;
  readingId: string | null;
  onRestart?: () => void;
}

function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div className="prose prose-invert max-w-none
      prose-headings:text-purple-200 prose-headings:font-semibold
      prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-4 prose-h2:pb-2 prose-h2:border-b prose-h2:border-purple-800/40
      prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-3 prose-h3:text-amber-200/90
      prose-p:text-purple-100/85 prose-p:leading-relaxed prose-p:my-3
      prose-strong:text-amber-200 prose-strong:font-semibold
      prose-em:text-purple-300/80
      prose-li:text-purple-100/80 prose-li:my-1
      prose-hr:border-purple-800/30
      [&_ul]:list-disc [&_ol]:list-decimal
      [&_blockquote]:border-l-4 [&_blockquote]:border-amber-500/40 [&_blockquote]:pl-4 [&_blockquote]:text-purple-200/70 [&_blockquote]:italic
      [&_code]:bg-purple-900/30 [&_code]:text-amber-200 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm
    ">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    </div>
  );
}

export function InterpretationPanel({
  question,
  drawnCards,
  interpretation,
  readingId,
  onRestart,
}: InterpretationPanelProps) {
  const t = useTranslations("interpretation");
  const tr = useTranslations("ritual");
  const locale = useLocale() as "zh" | "en";
  const supabase = createSupabaseBrowserClient();

  const [isFavorited, setIsFavorited] = useState(false);
  const [showShare, setShowShare] = useState(false);

  const toggleFavorite = async () => {
    if (!readingId) return;
    const next = !isFavorited;
    setIsFavorited(next);
    await supabase.from("readings").update({ is_favorited: next }).eq("id", readingId);
  };

  const getCardInfo = (cardId: number) => {
    const card = (tarotCards as any[]).find((c) => c.id === cardId);
    return {
      name: locale === "zh" ? card?.name_zh : card?.name_en ?? `Card ${cardId}`,
      image: card?.image ?? `/cards/rws/${String(cardId).padStart(2, "0")}-unknown.png`,
    };
  };

  const cards = drawnCards.map((dc) => ({
    ...dc,
    ...getCardInfo(dc.card_id),
  }));

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 pb-16">
      {/* Question */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground">{"你的问题"}</p>
        <p className="text-lg text-purple-200 font-medium">{question}</p>
      </div>

      {/* Drawn cards with images */}
      <div className="grid grid-cols-3 gap-4">
        {cards.map((card, i) => (
          <Card
            key={i}
            className="text-center border-purple-800/30 bg-card/60 backdrop-blur overflow-hidden"
          >
            <div className="relative w-full aspect-[3/5] bg-[#1a1035]">
              <Image
                src={card.image}
                alt={card.name}
                fill
                className={`object-cover ${card.is_reversed ? "rotate-180" : ""}`}
                sizes="(max-width: 768px) 30vw, 200px"
              />
              {/* Overlay gradient at bottom for text readability */}
              <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#1a1035]/90 to-transparent" />
            </div>
            <CardHeader className="p-3 pb-1">
              <CardTitle className="text-sm">{card.name}</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <p className="text-xs text-muted-foreground">
                {tr(
                  card.position === "past"
                    ? "past"
                    : card.position === "present"
                    ? "present"
                    : "future"
                )}
              </p>
              <span
                className={`text-xs ${
                  card.is_reversed ? "text-red-400" : "text-green-400"
                }`}
              >
                {card.is_reversed ? tr("reversed") : tr("upright")}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Interpretation */}
      <Card className="border-purple-800/30 bg-card/80 backdrop-blur-md">
        <CardContent className="p-6 space-y-4">
          {!interpretation && (
            <div className="flex items-center justify-center gap-2 py-8 text-purple-300">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>{tr("interpreting")}</span>
            </div>
          )}

          {interpretation && (
            <MarkdownRenderer content={interpretation} />
          )}

          {interpretation && (
            <>
              <div className="pt-4 border-t border-purple-800/30 flex items-center gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleFavorite}
                  className="gap-1"
                >
                  <Heart
                    className={`w-4 h-4 ${
                      isFavorited ? "fill-red-400 text-red-400" : ""
                    }`}
                  />
                  {isFavorited ? "已收藏" : "收藏"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowShare(true)}
                  className="gap-1"
                >
                  <Share2 className="w-4 h-4" />
                  {"分享"}
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/history">{"查看历史"}</Link>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto"
                  onClick={() => onRestart?.()}
                >
                  {"再来一次"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center pt-2">
                {t("disclaimer")}
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Share card modal */}
      {showShare && interpretation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md border-purple-800/30 bg-card/95">
            <CardHeader>
              <CardTitle className="text-center">{"分享占卜结果"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ShareCard
                question={question}
                cards={cards}
                interpretation={interpretation}
              />
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => setShowShare(false)}
              >
                {"关闭"}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
