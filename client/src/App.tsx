import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import { lazy, Suspense, useEffect, useState } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { trpc } from "./lib/trpc";
import type { Language } from "./lib/i18n";
import { startLogin } from "./const";

const HomePage = lazy(() => import("./pages/Home"));
const TeachersPage = lazy(() => import("./pages/Teachers"));
const TeacherProfilePage = lazy(() => import("./pages/TeacherProfile"));
const ParentDashboard = lazy(() => import("./pages/ParentDashboard"));
const TeacherPortal = lazy(() => import("./pages/TeacherPortal"));
const TeacherApplyPage = lazy(() => import("./pages/TeacherApplyPage"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const StudyAssistant = lazy(() => import("./pages/StudyAssistant"));
const LibraryPage = lazy(() => import("./pages/LibraryPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));

function AppRouter() {
  const [lang, setLangState] = useState<Language>(() => {
    try { return localStorage.getItem("mihwar-language") === "en" ? "en" : "ar"; } catch { return "ar"; }
  });
  const auth = trpc.auth.me.useQuery();
  const user = auth.data ?? null;
  const setLang = (language: Language) => {
    setLangState(language);
    try { localStorage.setItem("mihwar-language", language); } catch { /* local preferences are optional */ }
  };
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);
  const onLogin = () => {
    try { startLogin(); } catch (error) { console.error("Login is not configured", error); }
  };
  const shared = { lang, setLang, user, onLogin };

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Suspense fallback={<div className="route-loading" role="status">{lang === "ar" ? "جارٍ التحميل…" : "Loading page…"}</div>}>
            <Switch>
              <Route path="/login">{() => <LoginPage />}</Route>
              <Route path="/">{() => <HomePage {...shared} />}</Route>
              <Route path="/teachers">{() => <TeachersPage {...shared} />}</Route>
              <Route path="/teachers/:id">{params => <TeacherProfilePage {...shared} teacherId={Number(params.id)} />}</Route>
              <Route path="/parent">{() => <ParentDashboard {...shared} />}</Route>
              <Route path="/teacher/apply">{() => <TeacherApplyPage {...shared} />}</Route>
              <Route path="/teacher">{() => <TeacherPortal {...shared} />}</Route>
              <Route path="/admin">{() => <AdminDashboard {...shared} />}</Route>
              <Route path="/study">{() => <StudyAssistant {...shared} />}</Route>
              <Route path="/library">{() => <LibraryPage {...shared} />}</Route>
              <Route path="/404">{() => <NotFound />}</Route>
              <Route>{() => <NotFound />}</Route>
            </Switch>
          </Suspense>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default AppRouter;
