import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Sparkles, Moon, Star } from "lucide-react";
import { getTranslations } from "next-intl/server";

export default function HomePage() {
  return (
    <div className="relative min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center px-4 text-center">
      <div className="relative z-10 max-w-2xl mx-auto">
        <div className="flex justify-center mb-8">
          <div className="relative">
            <Moon className="w-24 h-24 text-purple-400 opacity-80" />
            <Star className="w-6 h-6 text-amber-400 absolute top-2 right-2 animate-pulse" />
            <Sparkles className="w-5 h-5 text-purple-300 absolute bottom-0 -left-2 animate-pulse" />
          </div>
        </div>

        <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-purple-300 via-amber-200 to-purple-300 bg-clip-text text-transparent">
          <HomeTitle />
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-lg mx-auto">
          <HomeSubtitle />
        </p>

        <Button asChild size="lg" className="text-lg px-8 py-6 rounded-full bg-gradient-to-r from-purple-600 to-amber-600 hover:from-purple-500 hover:to-amber-500 shadow-lg shadow-purple-900/30">
          <Link href="/ritual">
            <Sparkles className="w-5 h-5 mr-2" />
            <HomeCta />
          </Link>
        </Button>

        <div className="mt-12 grid grid-cols-3 gap-6 max-w-md mx-auto text-sm text-muted-foreground">
          <div className="flex flex-col items-center gap-1">
            <span className="text-2xl">🔮</span>
            <span className="text-xs"><Feature1 /></span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-2xl">✨</span>
            <span className="text-xs"><Feature2 /></span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-2xl">🌙</span>
            <span className="text-xs"><Feature3 /></span>
          </div>
        </div>
      </div>
    </div>
  );
}

function HomeTitle() {
  const t = useTranslations("home");
  return <>{t("title")}</>;
}

function HomeSubtitle() {
  const t = useTranslations("home");
  return <>{t("subtitle")}</>;
}

function HomeCta() {
  const t = useTranslations("home");
  return <>{t("cta")}</>;
}

function Feature1() {
  const t = useTranslations();
  return <>{t("ritual.past")} · {t("ritual.present")} · {t("ritual.future")}</>;
}

function Feature2() {
  const t = useTranslations();
  return <>{t("common.appName")}</>;
}

function Feature3() {
  const t = useTranslations();
  return <>{t("points.bonus")}</>;
}
