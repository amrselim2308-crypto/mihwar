import { Link, useLocation } from "wouter";
import { ArrowUpLeft, BookOpen, Compass, Home, Sparkles } from "lucide-react";
import { useEffect } from "react";

const NOT_FOUND_PATH = "/404";

export default function NotFound() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    const robots = document.createElement("meta");
    robots.name = "robots";
    robots.content = "noindex";
    document.head.appendChild(robots);

    if (window.location.pathname.replace(/\/$/, "") !== NOT_FOUND_PATH) {
      window.location.replace(NOT_FOUND_PATH);
    }

    return () => robots.remove();
  }, []);

  return (
    <main className="min-h-screen bg-[#041210] relative flex items-center justify-center px-4 py-16 text-[#f3efe6] overflow-hidden" dir="rtl">
      {/* Cinematic Ambient Glow & Vintage Embers */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#0d5b55]/25 via-[#041210]/95 to-[#020908] pointer-events-none" />
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#2dd4bf]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-[#f59e0b]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-lg text-center">
        {/* Brand Lockup */}
        <Link href="/" className="inline-flex items-center gap-3 mb-8 group transition-transform hover:scale-105">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0d5b55] to-[#14b8a6] text-white flex items-center justify-center font-extrabold text-2xl shadow-[0_0_24px_rgba(20,184,166,0.45)] border border-[#2dd4bf]/40">
            <svg width="28" height="28" viewBox="0 0 44 44" fill="none"><path d="M8 30.5C8 18.7 14.5 9 22 9s14 9.7 14 21.5" stroke="#ffffff" strokeWidth="2.8" strokeLinecap="round"/><path d="M13.5 31c1.1-6.7 4.1-11 8.5-11s7.4 4.3 8.5 11" stroke="#ffffff" strokeWidth="2.8" strokeLinecap="round"/><circle cx="22" cy="31.5" r="3.5" fill="#fef08a"/><path d="M22 35v4" stroke="#ffffff" strokeWidth="2.8" strokeLinecap="round"/></svg>
          </div>
          <div className="text-right">
            <span className="text-3xl font-black tracking-tight text-white block leading-none">مِحور</span>
            <span className="text-[10px] font-bold tracking-[0.24em] text-[#a7f3d0] uppercase">MIHWAR</span>
          </div>
        </Link>

        {/* 404 Card Glassmorphism */}
        <section className="rounded-3xl border border-[#2dd4bf]/30 bg-[#061a17]/85 backdrop-blur-xl p-8 sm:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-[#0d5b55]/40 border border-[#2dd4bf]/40 flex items-center justify-center text-[#2dd4bf] shadow-[0_0_24px_rgba(20,184,166,0.3)]">
            <Compass size={40} className="text-[#38bdf8] animate-spin" style={{ animationDuration: "12s" }} />
          </div>

          <div className="text-6xl sm:text-7xl font-black tracking-tight bg-gradient-to-r from-white via-[#fef08a] to-[#f59e0b] bg-clip-text text-transparent mb-3 drop-shadow-[0_0_20px_rgba(245,158,11,0.4)]">
            404
          </div>

          <h1 className="text-2xl font-bold text-white mb-3">
            الصفحة غير موجودة في المكتبة
          </h1>

          <p className="text-sm leading-relaxed text-[#cbd5e1] max-w-sm mx-auto mb-8">
            يبدو أنك سلكت مساراً غير مألوف بين أرفف المعرفة. لا تقلق، يمكنك العودة دائماً إلى البداية لمواصلة تعلّمك.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#14b8a6] to-[#0d9488] hover:brightness-110 px-7 py-3 text-sm font-bold text-white transition-all shadow-[0_0_20px_rgba(20,184,166,0.45)] border border-[#5eead4]/50 cursor-pointer"
            >
              <Home size={16} />
              <span>الصفحة الرئيسية</span>
            </Link>

            <Link
              href="/teachers"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-[#082622] hover:bg-[#0d3b35] px-6 py-3 text-sm font-bold text-[#a7f3d0] border border-[#2dd4bf]/40 transition-all cursor-pointer"
            >
              <BookOpen size={16} />
              <span>تصفح المعلمين</span>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
