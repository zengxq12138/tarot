"use client";

import { useRef, useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import html2canvas from "html2canvas";

interface ShareCardProps {
  question: string;
  cards: Array<{
    card_id: number;
    position: string;
    is_reversed: boolean;
    name: string;
  }>;
  interpretation: string;
}

export function ShareCard({ question, cards, interpretation }: ShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const getFirstLine = (text: string) => {
    const lines = text.split("\n").filter((l) => l.trim());
    return lines[0]?.slice(0, 100) ?? "";
  };

  const handleDownload = useCallback(async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: "#0a0a12",
        scale: 2,
        useCORS: true,
      });
      const link = document.createElement("a");
      link.download = `tarot-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (e) {
      console.error("Share card generation failed:", e);
    }
    setDownloading(false);
  }, []);

  return (
    <div className="space-y-4">
      <div
        ref={cardRef}
        className="w-full bg-[#0a0a12] p-6 rounded-xl border border-purple-800/40 shadow-xl"
        style={{ minHeight: 400 }}
      >
        <div className="text-center mb-6">
          <p className="text-lg font-bold text-purple-300 mb-1">塔罗占卜</p>
          <p className="text-sm text-muted-foreground">✨ AI Tarot Reading</p>
        </div>

        <div className="mb-4 p-3 rounded-lg bg-purple-900/20 border border-purple-800/20">
          <p className="text-xs text-muted-foreground mb-1">问题</p>
          <p className="text-sm text-purple-100">{question}</p>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          {cards.map((card, i) => (
            <div
              key={i}
              className="text-center p-2 rounded-lg bg-purple-900/10 border border-purple-800/10"
            >
              <p className="text-xs font-bold text-purple-300">{card.name}</p>
              <p className="text-[10px] text-muted-foreground">
                {card.position === "past"
                  ? "过去"
                  : card.position === "present"
                  ? "现在"
                  : "未来"}
                {" · "}
                <span
                  className={
                    card.is_reversed ? "text-red-400" : "text-green-400"
                  }
                >
                  {card.is_reversed ? "逆位" : "正位"}
                </span>
              </p>
            </div>
          ))}
        </div>

        <div className="p-3 rounded-lg bg-purple-900/10 border border-purple-800/10">
          <p className="text-[11px] text-purple-200/80 leading-relaxed line-clamp-6">
            {getFirstLine(interpretation)}
          </p>
          <p className="text-[10px] text-muted-foreground mt-2 text-center">
            🔮 探索命运 · 了解自己
          </p>
        </div>
      </div>

      <Button
        onClick={handleDownload}
        disabled={downloading}
        className="w-full"
      >
        {downloading ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Download className="w-4 h-4 mr-2" />
        )}
        {"下载图片"}
      </Button>
    </div>
  );
}
