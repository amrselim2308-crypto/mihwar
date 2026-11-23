import { Link } from "wouter";
import { ArrowUpRight, BookOpenCheck, Globe2, LogIn, LogOut, Menu, Sparkles } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { t, type Language } from "@/lib/i18n";
import type { CurrentUser } from "@/lib/types";
import { FloatingAIChat } from "@/components/FloatingAIChat";

export function Brand({ small = false }: { small?: boolean }) {
  return (
    <Link href="/" className={`brand-lockup ${small ? "brand-lockup-small" : ""}`} aria-label="Mihwar home">
      <span className="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 44 44" fill="none"><path d="M8 30.5C8 18.7 14.5 9 22 9s14 9.7 14 21.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/><path d="M13.5 31c1.1-6.7 4.1-11 8.5-11s7.4 4.3 8.5 11" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/><circle cx="22" cy="31.5" r="3.5" fill="currentColor"/><path d="M22 35v4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>
      </span>
      <span className="brand-wordmark"><strong>مِحور</strong><span>MIHWAR</span></span>
    </Link>
  );
}

export function SiteShell({
  children,
  lang,
  setLang,
  user,
  onLogin,
}: {
  children: React.ReactNode;
  lang: Language;
  setLang: (language: Language) => void;
  user: CurrentUser | null;
  onLogin: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const logout = trpc.auth.logout.useMutation({ onSuccess: () => window.location.assign("/") });
  const navItems = [
    ["/", t(lang, "Home", "الرئيسية")],
    ["/teachers", t(lang, "Teachers", "المعلمون")],
    ["/library", t(lang, "Library", "المكتبة")],
    ["/study", t(lang, "AI Study", "مساعد الدراسة")],
    ["/parent", t(lang, "Parents", "أولياء الأمور")],
    ["/teacher/apply", t(lang, "Join as Teacher", "انضم كمعلم")],
  ] as const;

  return (
    <div className="site-frame" dir={lang === "ar" ? "rtl" : "ltr"}>
      <div className="announcement-bar"><span className="announcement-dot" />{t(lang, "A more personal way to learn — built around your child's curriculum.", "تعلّم أكثر خصوصية، يبدأ من منهج طفلك واحتياجه.")}<ArrowUpRight size={14} /></div>
      <header className="site-header">
        <div className="header-inner">
          <Brand />
          <nav className={`main-nav ${menuOpen ? "main-nav-open" : ""}`} aria-label={t(lang, "Main navigation", "التنقل الرئيسي")}>
            {navItems.map(([href, label]) => <Link key={href} href={href} onClick={() => setMenuOpen(false)}>{label}</Link>)}
          </nav>
          <div className="header-actions">
            <Link href="/teachers" className="nav-book-btn">
              {t(lang, "Book a Lesson", "احجز حصة")}
            </Link>
            <button className="language-button" onClick={() => setLang(lang === "ar" ? "en" : "ar")} aria-label={t(lang, "Switch language", "تغيير اللغة")}><Globe2 size={17} /><span>{lang === "ar" ? "EN" : "عربي"}</span></button>
            {user ? <>
              <Link className="header-user" href={user.role === "admin" ? "/admin" : "/parent"}><span className="user-dot" />{user.name || t(lang, "My account", "حسابي")}</Link>
              <button className="icon-button signout-button" onClick={() => logout.mutate()} aria-label={t(lang, "Sign out", "تسجيل الخروج")}><LogOut size={16} /></button>
            </> : <button className="nav-login-btn" onClick={onLogin}><LogIn size={15} /><span>{t(lang, "Sign in", "تسجيل الدخول")}</span></button>}
            <button className="menu-toggle" onClick={() => setMenuOpen(value => !value)} aria-label={t(lang, "Toggle menu", "فتح القائمة")}><Menu size={21} /></button>
          </div>
        </div>
      </header>
      {children}
      <footer className="site-footer" id="contact">
        <div className="footer-main">
          <div className="footer-brand-block"><Brand small /><p>{t(lang, "A thoughtful tutoring experience for families navigating different curricula across the UAE, Egypt and Saudi Arabia.", "تجربة تعليم خصوصي مدروسة للعائلات مع تنوّع المناهج في الإمارات ومصر والسعودية.")}</p></div>
          <div className="footer-col"><h3>{t(lang, "Explore", "اكتشف")}</h3><Link href="/teachers">{t(lang, "Find a teacher", "ابحث عن معلّم")}</Link><Link href="/teacher/apply">{t(lang, "For teachers", "للمعلمين")}</Link><Link href="/study">{t(lang, "Study guide", "مساعد الدراسة")}</Link><Link href="/library">{t(lang, "Digital library", "المكتبة الرقمية")}</Link></div>
          <div className="footer-col"><h3>{t(lang, "The Mihwar promise", "وعد محور")}</h3><span>{t(lang, "Profiles reviewed before listing", "مراجعة الملفات قبل عرضها")}</span><span>{t(lang, "Clear lesson requests", "طلبات دروس واضحة")}</span><span>{t(lang, "Progress parents can follow", "تقدم يمكن لولي الأمر متابعته")}</span></div>
          <div className="footer-col"><h3>{t(lang, "Important", "معلومات")}</h3><a href="/#faq">{t(lang, "Frequently asked questions", "الأسئلة الشائعة")}</a><span>{t(lang, "Support contact will be published before launch", "ستُنشر قناة الدعم قبل الإطلاق")}</span><span className="footer-note">{t(lang, "Policies and local licensing review are required before commercial launch.", "تُستكمل السياسات ومراجعة التراخيص المحلية قبل الإطلاق التجاري.")}</span></div>
        </div>
        <div className="footer-bottom"><span>© {new Date().getFullYear()} Mihwar</span><span>{t(lang, "A clear path to progress.", "طريق أوضح نحو التقدم.")}</span><span><BookOpenCheck size={14} />{t(lang, "Learning, with intention", "تعلّم بقصد")}</span></div>
      </footer>
      <FloatingAIChat lang={lang} />
    </div>
  );
}

export default SiteShell;

export function SectionEyebrow({ icon = true, children }: { icon?: boolean; children: React.ReactNode }) {
  return <div className="section-eyebrow">{icon && <Sparkles size={14} />}{children}</div>;
}
