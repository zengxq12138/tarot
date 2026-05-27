"use client";

import { useTranslations, useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { PointsDisplay } from "@/components/points/points-display";
import { Menu, X, Moon, Globe, History, Heart, Shield } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

export function Navbar() {
  const t = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const switchLocale = () => {
    const nextLocale = locale === "zh" ? "en" : "zh";
    router.replace(pathname, { locale: nextLocale });
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-purple-900/30 bg-background/80 backdrop-blur-md">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold text-purple-300 hover:text-purple-200 transition-colors">
          <Moon className="w-5 h-5 text-purple-400" />
          {t("appName")}
        </Link>

        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <PointsDisplay />
              <Button variant="ghost" size="sm" asChild>
                <Link href="/history">
                  <History className="w-4 h-4 mr-1" />
                  {t("history")}
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/favorites">
                  <Heart className="w-4 h-4 mr-1" />
                  {t("favorites")}
                </Link>
              </Button>
              {user.user_metadata?.is_admin && (
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/admin">
                    <Shield className="w-4 h-4 mr-1" />
                    {t("admin")}
                  </Link>
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={switchLocale}>
                <Globe className="w-4 h-4 mr-1" />
                {locale === "zh" ? "EN" : "中文"}
              </Button>
              <Button variant="outline" size="sm" onClick={signOut}>
                {t("logout")}
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={switchLocale}>
                <Globe className="w-4 h-4 mr-1" />
                {locale === "zh" ? "EN" : "中文"}
              </Button>
              {!loading && (
                <>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/login">{t("login")}</Link>
                  </Button>
                  <Button size="sm" asChild>
                    <Link href="/register">{t("register")}</Link>
                  </Button>
                </>
              )}
            </>
          )}
        </div>

        <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-purple-900/30 bg-background p-4 flex flex-col gap-2">
          {user ? (
            <>
              <PointsDisplay />
              <Link href="/history" className="py-2 text-sm">{t("history")}</Link>
              <Link href="/favorites" className="py-2 text-sm">{t("favorites")}</Link>
              <button onClick={switchLocale} className="py-2 text-sm text-left">
                {locale === "zh" ? "English" : "中文"}
              </button>
              <button onClick={signOut} className="py-2 text-sm text-left text-red-400">
                {t("logout")}
              </button>
            </>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/login">{t("login")}</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/register">{t("register")}</Link>
              </Button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
