"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Coins } from "lucide-react";
import { useTranslations } from "next-intl";

export function PointsDisplay() {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number | null>(null);
  const t = useTranslations("points");

  useEffect(() => {
    if (!user) return;
    const supabase = createSupabaseBrowserClient();

    supabase
      .from("user_points")
      .select("balance")
      .eq("user_id", user.id)
      .single()
      .then((result: any) => {
        if (result.data) setBalance(result.data.balance);
      });
  }, [user]);

  if (!user || balance === null) return null;

  return (
    <div className="flex items-center gap-1.5 text-sm text-purple-300">
      <Coins className="w-4 h-4 text-amber-400" />
      <span>
        {t("balance")}: <span className="font-bold text-amber-400">{balance}</span>
      </span>
    </div>
  );
}
