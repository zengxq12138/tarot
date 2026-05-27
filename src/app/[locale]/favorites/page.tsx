"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/components/auth/auth-provider";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Clock, Loader2, Star } from "lucide-react";
import Link from "next/link";
import type { Reading } from "@/lib/types";

export default function FavoritesPage() {
  const t = useTranslations("history");
  const tc = useTranslations("common");
  const { user } = useAuth();
  const supabase = createSupabaseBrowserClient();

  const [readings, setReadings] = useState<Reading[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("readings")
      .select("*")
      .eq("is_favorited", true)
      .order("created_at", { ascending: false })
      .limit(50)
      .then((result: any) => {
        if (result.data) setReadings(result.data as Reading[]);
        setLoading(false);
      });
  }, [user, supabase]);

  const unfavorite = async (id: string) => {
    setReadings((prev) => prev.filter((r) => r.id !== id));
    await supabase.from("readings").update({ is_favorited: false }).eq("id", id);
  };

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center">
        <p className="text-muted-foreground">{"请先登录"}</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Star className="w-5 h-5 text-amber-400" />
        {tc("favorites")}
      </h1>

      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
        </div>
      )}

      {!loading && readings.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>{t("noFavorites")}</p>
          <Button asChild className="mt-4">
            <Link href="/ritual">{tc("startReading")}</Link>
          </Button>
        </div>
      )}

      <div className="space-y-3">
        {readings.map((reading) => (
          <Card
            key={reading.id}
            className="border-purple-800/20 bg-card/60 hover:bg-card/80 transition-colors"
          >
            <CardHeader className="p-4 pb-2">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/reading/${reading.id}`}
                    className="text-sm font-medium text-purple-200 hover:text-purple-100 line-clamp-1"
                  >
                    {reading.question}
                  </Link>
                  <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>
                      {new Date(reading.created_at).toLocaleDateString("zh-CN", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
                <button onClick={() => unfavorite(reading.id)} className="shrink-0 ml-2">
                  <Heart className="w-4 h-4 fill-red-400 text-red-400" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-xs text-muted-foreground line-clamp-2">
                {reading.interpretation?.slice(0, 120) || "等待解读..."}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
