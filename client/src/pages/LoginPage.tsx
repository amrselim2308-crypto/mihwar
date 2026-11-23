import { useMemo, useState, type FormEvent } from "react";
import { Link } from "wouter";
import { ArrowUpLeft, BookOpen, KeyRound, Lock, Mail, ShieldAlert, Sparkles, User } from "lucide-react";

type Mode = "login" | "register";

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminSetupToken, setAdminSetupToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const next = useMemo(() => {
    const requested = new URLSearchParams(window.location.search).get("next") || "/";
    return requested.startsWith("/") && !requested.startsWith("//") && !requested.includes("\\") ? requested : "/";
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, email, password, ...(mode === "register" && adminSetupToken ? { adminSetupToken } : {}) }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "تعذر إتمام العملية.");
      window.location.assign(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع.");
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#041210] relative flex items-center justify-center px-4 py-12 text-[#f3efe6] overflow-hidden" dir="rtl">
      {/* Cinematic Ambient Glow & Embers */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#0d5b55]/30 via-[#041210]/90 to-[#020908] pointer-events-none" />
      <div className="absolute top-1/4 -right-24 w-96 h-96 bg-[#14b8a6]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -left-24 w-96 h-96 bg-[#f59e0b]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md my-auto">
        {/* Brand Lockup */}
        <div className="mb-7 text-center">
          <Link href="/" className="inline-flex items-center gap-3 group transition-transform hover:scale-105">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0d5b55] to-[#14b8a6] text-white flex items-center justify-center font-extrabold text-2xl shadow-[0_0_24px_rgba(20,184,166,0.45)] border border-[#2dd4bf]/40">
              <svg width="28" height="28" viewBox="0 0 44 44" fill="none"><path d="M8 30.5C8 18.7 14.5 9 22 9s14 9.7 14 21.5" stroke="#ffffff" strokeWidth="2.8" strokeLinecap="round"/><path d="M13.5 31c1.1-6.7 4.1-11 8.5-11s7.4 4.3 8.5 11" stroke="#ffffff" strokeWidth="2.8" strokeLinecap="round"/><circle cx="22" cy="31.5" r="3.5" fill="#fef08a"/><path d="M22 35v4" stroke="#ffffff" strokeWidth="2.8" strokeLinecap="round"/></svg>
            </div>
            <div className="text-right">
              <span className="text-3xl font-black tracking-tight text-white block leading-none">مِحور</span>
              <span className="text-[10px] font-bold tracking-[0.24em] text-[#a7f3d0] uppercase">MIHWAR</span>
            </div>
          </Link>
        </div>

        {/* Cinematic Glassmorphism Card */}
        <section className="rounded-3xl border border-[#2dd4bf]/30 bg-[#061a17]/85 backdrop-blur-xl p-6 sm:p-8 shadow-[0_20px_55px_rgba(0,0,0,0.6)]">
          <div className="mb-6 text-center">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-[#6ee7b7] tracking-wider mb-2">
              <Sparkles size={14} className="text-[#fef08a]" />
              <span>بوابة التعليم والمستقبل</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-white via-[#fef08a] to-[#f59e0b] bg-clip-text text-transparent">
              {mode === "login" ? "تسجيل الدخول" : "إنشاء حساب جديد"}
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-[#cbd5e1]">
              {mode === "login" ? "ادخل إلى حسابك لمتابعة دروسك ورحلتك التعليمية." : "انضم إلى عائلة مِحور واستكشف أفضل المعلمين والمقررات."}
            </p>
          </div>

          {/* Mode Switcher Pills */}
          <div className="mb-6 grid grid-cols-2 rounded-2xl bg-[#031411]/80 p-1.5 border border-[#2dd4bf]/20 text-sm font-bold">
            <button
              type="button"
              onClick={() => { setMode("login"); setError(""); }}
              className={`rounded-xl py-2.5 transition-all duration-200 ${mode === "login" ? "bg-gradient-to-r from-[#0d5b55] to-[#14b8a6] text-white shadow-lg border border-[#5eead4]/40" : "text-[#8bb5a6] hover:text-white"}`}
            >
              تسجيل الدخول
            </button>
            <button
              type="button"
              onClick={() => { setMode("register"); setError(""); }}
              className={`rounded-xl py-2.5 transition-all duration-200 ${mode === "register" ? "bg-gradient-to-r from-[#0d5b55] to-[#14b8a6] text-white shadow-lg border border-[#5eead4]/40" : "text-[#8bb5a6] hover:text-white"}`}
            >
              حساب جديد
            </button>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="block text-xs font-bold text-[#a7f3d0] mb-1.5">الاسم الكامل</label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-[#2dd4bf]">
                    <User size={17} />
                  </div>
                  <input
                    required
                    minLength={2}
                    maxLength={160}
                    value={name}
                    onChange={e => setName(e.target.value)}
                    autoComplete="name"
                    className="w-full rounded-xl border border-[#2dd4bf]/30 bg-[#082622]/90 pr-10 pl-4 py-3 text-sm text-white placeholder-[#719889] outline-none transition focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8]"
                    placeholder="اسمك الكامل"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[#a7f3d0] mb-1.5">البريد الإلكتروني</label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-[#2dd4bf]">
                  <Mail size={17} />
                </div>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                  className="w-full rounded-xl border border-[#2dd4bf]/30 bg-[#082622]/90 pr-10 pl-4 py-3 text-sm text-white placeholder-[#719889] outline-none transition focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8]"
                  placeholder="name@example.com"
                  dir="ltr"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#a7f3d0] mb-1.5">كلمة المرور</label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-[#2dd4bf]">
                  <Lock size={17} />
                </div>
                <input
                  required
                  type="password"
                  minLength={mode === "register" ? 10 : 1}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  className="w-full rounded-xl border border-[#2dd4bf]/30 bg-[#082622]/90 pr-10 pl-4 py-3 text-sm text-white placeholder-[#719889] outline-none transition focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8]"
                  placeholder={mode === "register" ? "10 أحرف على الأقل" : "كلمة المرور"}
                  dir="ltr"
                />
              </div>
            </div>

            {mode === "register" && (
              <details className="rounded-xl border border-[#2dd4bf]/20 bg-[#051a17]/60 p-3.5">
                <summary className="cursor-pointer text-xs font-bold text-[#fef08a] flex items-center gap-2">
                  <KeyRound size={14} />
                  <span>إعداد حساب مدير المنصة (للمالك فقط)</span>
                </summary>
                <div className="mt-3">
                  <label className="block text-xs font-bold text-[#a7f3d0] mb-1">رمز التأسيس الأمني</label>
                  <input
                    type="password"
                    value={adminSetupToken}
                    onChange={e => setAdminSetupToken(e.target.value)}
                    autoComplete="off"
                    className="w-full rounded-lg border border-[#2dd4bf]/30 bg-[#082622] px-3 py-2 text-xs text-white placeholder-[#719889] outline-none focus:border-[#38bdf8]"
                    placeholder="ADMIN_SETUP_TOKEN"
                    dir="ltr"
                  />
                  <p className="mt-2 text-[10.5px] leading-relaxed text-[#94a3b8]">
                    يلزم إدخال رمز التأسيس السري الموجود في ملف إعداد الخادم للحصول على صلاحيات الإدارة الكاملة.
                  </p>
                </div>
              </details>
            )}

            {error && (
              <div role="alert" className="flex items-center gap-2 rounded-xl bg-red-950/60 border border-red-500/40 px-4 py-3 text-xs font-medium text-red-200">
                <ShieldAlert size={16} className="text-red-400 flex-none" />
                <span>{error}</span>
              </div>
            )}

            <button
              disabled={busy}
              className="w-full rounded-full bg-gradient-to-r from-[#14b8a6] to-[#0d9488] hover:brightness-110 py-3.5 text-sm font-bold text-white transition-all shadow-[0_0_24px_rgba(20,184,166,0.45)] border border-[#5eead4]/50 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
            >
              {busy ? "جارٍ التحقق…" : mode === "login" ? "دخول إلى مِحور" : "إنشاء الحساب ومتابعة التعلم"}
            </button>
          </form>

          <p className="mt-5 text-center text-[11px] leading-relaxed text-[#94a3b8]">
            بالمتابعة، أنت توافق على شروط الاستخدام وسياسة الخصوصية الخاصة بمِحور.
          </p>
        </section>

        {/* Back Link */}
        <div className="mt-6 text-center">
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#a7f3d0] hover:text-white transition-colors">
            <ArrowUpLeft size={15} />
            <span>العودة إلى الصفحة الرئيسية</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
