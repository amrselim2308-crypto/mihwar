import React, { useState, useRef, useEffect } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpLeft,
  ArrowUpRight,
  Atom,
  Award,
  BookOpen,
  BookOpenCheck,
  Brain,
  Calculator,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  Compass,
  Copy,
  Cpu,
  Dna,
  FlaskConical,
  GraduationCap,
  HelpCircle,
  Landmark,
  Languages,
  Lightbulb,
  MessageSquare,
  Microscope,
  Mountain,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  User,
  UsersRound,
  Volume2,
  X,
} from "lucide-react";
import { Link } from "wouter";
import SiteShell, { SectionEyebrow } from "@/components/SiteShell";
import { t } from "@/lib/i18n";
import { curricula, curriculumLabel } from "@/lib/curricula";
import type { SharedPageProps } from "@/pages/Home";
import { trpc } from "@/lib/trpc";
import { subjects } from "@/pages/Home";

type StudyMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  mode?: "explain" | "step_by_step" | "quiz" | "summary";
};

type AIMode = "explain" | "step_by_step" | "quiz" | "summary";

const subjectPromptMap: Record<string, { ar: string[]; en: string[] }> = {
  الرياضيات: {
    ar: [
      "كيف أحل معادلة تربيعية بالقانون العام مع مثال خطوة بخطوة؟",
      "اشرح لي نظرية فيثاغورس وكيف أطبقها في المثلث القائم؟",
      "ما الفرق بين التباديل والتوافيق بطريقة عملية بسيطة؟",
      "كيف أحسب النسبة المئوية ومعدل التغير في مسألة لفظية؟",
    ],
    en: [
      "How do I solve a quadratic equation using the quadratic formula step by step?",
      "Explain the Pythagorean theorem with a real-life example",
      "What is the difference between permutations and combinations?",
      "How do I calculate percentages and rate of change in word problems?",
    ],
  },
  الفيزياء: {
    ar: [
      "اشرح لي قوانين نيوتن الثلاثة للحركة بأمثلة من واقع الحياة",
      "ما الفرق بين السرعة المتجهة والسرعة القياسية؟",
      "كيف يعمل قانون أوم لحساب الجهد والتيار والمقاومة؟",
      "ما معنى حفظ الطاقة الحركية وطاقة الوضع؟",
    ],
    en: [
      "Explain Newton's three laws of motion with real-world examples",
      "What is the difference between velocity and speed?",
      "How does Ohm's Law work for voltage, current, and resistance?",
      "Explain conservation of mechanical energy simply",
    ],
  },
  الكيمياء: {
    ar: [
      "كيف أقوم بوزن معادلة كيميائية صعبة بخطوات واضحة؟",
      "ما الفرق بين الرابطة الأيونية والرابطة التساهمية؟",
      "كيف أميز بين الأحماض والقواعد ومقياس الرقم الهيدروجيني pH؟",
      "ما هو مفهوم المول والكتلة المولية وكيف أستخدمهما في الحسابات؟",
    ],
    en: [
      "How do I balance a tricky chemical equation step by step?",
      "What is the difference between ionic and covalent bonds?",
      "How do I understand acids, bases, and the pH scale?",
      "Explain the mole concept and molar mass calculation",
    ],
  },
  "اللغة العربية": {
    ar: [
      "اشرح لي إعراب كان وأخواتها وإن وأخواتها مع أمثلة للتفريق بينهما",
      "كيف أميز بين التشبيه والاستعارة والمكنية في البلاغة؟",
      "ما هي القواعد الذهبية لكتابة الهمزة المتوسطة والمتطرفة؟",
      "ما هي شروط عمل اسم الفاعل واسم المفعول في الجملة؟",
    ],
    en: [
      "Explain the grammar of Inna and Kana in Arabic with examples",
      "What is the difference between simile and metaphor in Arabic rhetoric?",
      "What are the rules for writing the middle and end Hamza?",
      "Explain active and passive participles in Arabic grammar",
    ],
  },
  "اللغة الإنجليزية": {
    ar: [
      "ما الفرق بين Present Perfect و Past Simple ومتى أستخدم كل منهما؟",
      "كيف أكتب مقدمة مقال تحليلي قوية ومقنعة (IELTS / EmSAT / TOEFL)؟",
      "اشرح لي قاعدة الـ Conditionals (الحالات الشرطية 0, 1, 2, 3)",
      "كيف أوسع مفرداتي الأكاديمية بطريقة منتظمة؟",
    ],
    en: [
      "What is the difference between Present Perfect and Past Simple?",
      "How do I write a compelling academic essay introduction?",
      "Explain English conditional sentences (0, 1, 2, 3)",
      "How do I expand my academic vocabulary effectively?",
    ],
  },
  "الحاسب والذكاء الاصطناعي": {
    ar: [
      "ما الفرق بين الذكاء الاصطناعي، وتعلم الآلة، والتعلم العميق؟",
      "كيف تعمل الدوال والمتغيرات والحلقات التكرارية (Loops) في البرمجة؟",
      "ما هي الخوارزمية وكيف أقيس كفاءتها في حل المشكلات؟",
      "كيف تتدرب نماذج اللغات الكبيرة (LLMs) على فهم النصوص؟",
    ],
    en: [
      "What is the difference between AI, Machine Learning, and Deep Learning?",
      "How do loops, functions, and variables work in Python?",
      "What is an algorithm and how do we measure computational complexity?",
      "How do Large Language Models (LLMs) learn and generate text?",
    ],
  },
};

const defaultPromptsAr = [
  "اشرح لي النسبة المئوية والتناسب بمثال من الحياة اليومية",
  "كيف أبدأ بحل معادلة خطية خطوة بخطوة؟",
  "ما الفرق بين التفاعل الطارد والماص للحرارة في العلوم؟",
  "كيف أنظم وقتي وجدول مذاكرتي للامتحانات النهائية؟",
];

const defaultPromptsEn = [
  "Explain percentages and ratios with a practical everyday example",
  "How do I solve a linear equation step by step?",
  "What is the difference between endothermic and exothermic reactions?",
  "How can I structure an effective study timetable for exams?",
];

export default function StudyAssistantPage({ lang, setLang, user, onLogin }: SharedPageProps) {
  const isAr = lang === "ar";
  const Arrow = isAr ? ArrowUpLeft : ArrowUpRight;
  const BackArrow = isAr ? ArrowRight : ArrowLeft;

  const [messages, setMessages] = useState<StudyMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: isAr
        ? "مرحباً بك في **مساعد مِحور الذكي** 🌟\n\nأنا رفيقك الدراسي المصمم خصيصاً لمساعدتك على **فهم المفاهيم خطوة بخطوة** بدلاً من الاكتفاء بالحفظ السطحي. اختر المنهج والصف والمادة، وحدد الوضع الذي تفضله (شرح، خطوات حل، تدريب، أو تلخيص) واسأل عن أي درس أو مسألة تواجهك!"
        : "Welcome to **Mihwar AI Study Guide** 🌟\n\nI am your dedicated academic study companion, built to help you **understand concepts step-by-step** rather than just memorizing answers. Select your curriculum, grade, and subject, choose your preferred mode, and ask anything about your lessons!",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      mode: "explain",
    },
  ]);

  const [input, setInput] = useState("");
  const [selectedCurriculum, setSelectedCurriculum] = useState("UAE Ministry");
  const [selectedGrade, setSelectedGrade] = useState("Grade 10");
  const [selectedSubject, setSelectedSubject] = useState("الرياضيات");
  const [activeMode, setActiveMode] = useState<AIMode>("explain");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const tutorMutation = trpc.ai.tutor.useMutation({
    onSuccess: (data) => {
      const newMsg: StudyMessage = {
        id: Math.random().toString(36).substring(7),
        role: "assistant",
        content: data.content,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        mode: activeMode,
      };
      setMessages((prev) => [...prev, newMsg]);
    },
    onError: (err) => {
      const errorMsg: StudyMessage = {
        id: Math.random().toString(36).substring(7),
        role: "assistant",
        content: isAr
          ? "عذراً، حدث انقطاع مؤقت في الاتصال بالمساعد الذكي. يرجى إعادة المحاولة بعد ثوانٍ قليلة."
          : "Sorry, a temporary connection hiccup occurred. Please retry in a few moments.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, tutorMutation.isPending]);

  const handleSend = (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || tutorMutation.isPending) return;

    const userMsg: StudyMessage = {
      id: Math.random().toString(36).substring(7),
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput("");

    // Call tRPC endpoint with full educational context
    tutorMutation.mutate({
      language: lang,
      curriculum: selectedCurriculum,
      grade: selectedGrade,
      subject: selectedSubject,
      mode: activeMode,
      messages: newHistory
        .filter((m) => m.id !== "welcome")
        .slice(-8)
        .map(({ role, content }) => ({ role, content })),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSpeak = (id: string, text: string) => {
    if (!("speechSynthesis" in window)) return;
    if (isSpeaking === id) {
      window.speechSynthesis.cancel();
      setIsSpeaking(null);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.replace(/[*#_`]/g, ""));
    utterance.lang = isAr ? "ar-SA" : "en-US";
    utterance.onend = () => setIsSpeaking(null);
    utterance.onerror = () => setIsSpeaking(null);
    setIsSpeaking(id);
    window.speechSynthesis.speak(utterance);
  };

  const clearChat = () => {
    if (window.confirm(isAr ? "هل تود مسح المحادثة وبدء جلسة جديدة؟" : "Clear conversation and start fresh?")) {
      setMessages([
        {
          id: "welcome-reset",
          role: "assistant",
          content: isAr
            ? "بدأنا جلسة دراسية جديدة! عن أي مفهوم أو مسألة ترغب في المناقشة الآن؟"
            : "Started a fresh study session! What concept or question would you like to explore now?",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          mode: activeMode,
        },
      ]);
    }
  };

  // Get prompts for currently selected subject
  const currentPrompts =
    subjectPromptMap[selectedSubject]?.[isAr ? "ar" : "en"] || (isAr ? defaultPromptsAr : defaultPromptsEn);

  return (
    <SiteShell lang={lang} setLang={setLang} user={user} onLogin={onLogin}>
      <main className="min-h-screen bg-[#041210] text-[#f3ece0] pb-16 pt-6 px-3 sm:px-6 max-w-7xl mx-auto relative">
        
        {/* Subtle ambient lighting & library warmth */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#0d5b55]/20 via-[#041412]/50 to-transparent pointer-events-none" />

        {/* Top Header */}
        <div className="relative z-10 mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-[#2dd4bf]/20">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold text-[#6ee7b7] tracking-wide mb-2 bg-[#062420]/80 px-3.5 py-1 rounded-full border border-[#2dd4bf]/30 shadow-xs">
              <Sparkles size={14} className="text-[#fef08a]" />
              <span>{t(lang, "MIHWAR AI ACADEMIC COMPANION", "مساعد مِحور الذكي · الذكاء الاصطناعي الأكاديمي الموجه")}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-amber-100 to-amber-400 bg-clip-text text-transparent drop-shadow-sm">
              {t(lang, "Understand the logic. Master your curriculum.", "افهم الفكرة.. وطوّر مهاراتك خطوة بخطوة")}
            </h1>
            <p className="text-xs sm:text-sm text-[#c7bfb0] mt-1 max-w-2xl leading-relaxed">
              {t(
                lang,
                "A patient AI tutor aligned with UAE, Egyptian, Saudi, and international curricula. Designed to foster analytical thinking, step-by-step problem solving, and genuine comprehension.",
                "مساعد دراسة هادئ وموجّه صُمم خصيصاً لمناهج الإمارات ومصر والسعودية والبريطاني والأمريكي، يدرّبك على التفكير والحل المتدرج ولا يكتفي بتقديم إجابات جاهزة."
              )}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/teachers" className="inline-flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-full bg-[#0d5b55]/70 border border-[#2dd4bf]/40 text-white hover:bg-[#14b8a6] hover:border-[#5eead4] transition-all shadow-md">
              <GraduationCap size={15} className="text-[#fef08a]" />
              <span>{t(lang, "Find Human Teacher", "احجز معلماً خصوصياً")}</span>
              <Arrow size={14} />
            </Link>
            <button
              onClick={clearChat}
              className="inline-flex items-center gap-1.5 text-xs text-[#a0b0a8] hover:text-[#f87171] px-3 py-2 rounded-full border border-[#2dd4bf]/20 bg-[#06201c]/60 hover:bg-[#331111]/40 transition-colors"
              title={t(lang, "Clear conversation", "مسح المحادثة")}
            >
              <RefreshCw size={14} />
              <span className="hidden sm:inline">{t(lang, "New Session", "جلسة جديدة")}</span>
            </button>
          </div>
        </div>

        {/* Main Workspace Layout */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          
          {/* Sidebar / Configuration & Learning Tips (4 Cols) */}
          <aside className="lg:col-span-4 flex flex-col gap-4">
            
            {/* Control Panel: Curriculum, Grade, Subject */}
            <div className="bg-[#06201c]/80 backdrop-blur-md border border-[#2dd4bf]/25 rounded-2xl p-4 shadow-xl">
              <h2 className="text-xs font-bold text-[#fef08a] flex items-center gap-2 mb-3 pb-2 border-b border-[#2dd4bf]/20">
                <Compass size={15} className="text-[#0d5b55]" />
                <span>{t(lang, "Curriculum & Study Target", "تخصيص المنهج والمادة")}</span>
              </h2>

              <div className="space-y-3">
                {/* Curriculum */}
                <div>
                  <label className="text-[11px] font-semibold text-[#a7f3d0] block mb-1">
                    {t(lang, "Curriculum", "المنهج التعليمي")}
                  </label>
                  <select
                    value={selectedCurriculum}
                    onChange={(e) => setSelectedCurriculum(e.target.value)}
                    className="w-full text-xs bg-[#031411] border border-[#2dd4bf]/30 rounded-xl px-3 py-2 text-[#f3ece0] focus:outline-none focus:border-[#38bdf8]"
                  >
                    {curricula.map((c) => (
                      <option key={c.value} value={c.value} className="bg-[#06201c] text-white">
                        {curriculumLabel(c.value, lang)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Grade */}
                <div>
                  <label className="text-[11px] font-semibold text-[#a7f3d0] block mb-1">
                    {t(lang, "Grade Level", "الصف الدراسي")}
                  </label>
                  <select
                    value={selectedGrade}
                    onChange={(e) => setSelectedGrade(e.target.value)}
                    className="w-full text-xs bg-[#031411] border border-[#2dd4bf]/30 rounded-xl px-3 py-2 text-[#f3ece0] focus:outline-none focus:border-[#38bdf8]"
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={`Grade ${i + 1}`} className="bg-[#06201c] text-white">
                        {isAr ? `الصف ${i + 1}` : `Grade ${i + 1}`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Subject (16 Subjects) */}
                <div>
                  <label className="text-[11px] font-semibold text-[#a7f3d0] block mb-1">
                    {t(lang, "Subject", "المادة الدراسية (16 مادة)")}
                  </label>
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="w-full text-xs bg-[#031411] border border-[#2dd4bf]/30 rounded-xl px-3 py-2 text-[#f3ece0] focus:outline-none focus:border-[#38bdf8]"
                  >
                    {subjects.map((s) => (
                      <option key={s.en} value={isAr ? s.ar : s.en} className="bg-[#06201c] text-white">
                        {isAr ? s.ar : s.en}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Mode Selector */}
              <div className="mt-4 pt-3 border-t border-[#2dd4bf]/20">
                <label className="text-[11px] font-semibold text-[#a7f3d0] block mb-2">
                  {t(lang, "AI Tutor Approach", "أسلوب الشرح والتوجيه")}
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setActiveMode("explain")}
                    className={`flex items-center gap-1.5 p-2 rounded-xl text-[11px] font-semibold border transition-all text-start ${
                      activeMode === "explain"
                        ? "bg-[#14b8a6]/25 border-[#2dd4bf] text-[#5eead4] shadow-xs"
                        : "bg-[#031411]/60 border-[#2dd4bf]/20 text-[#a0b0a8] hover:bg-[#062420]"
                    }`}
                  >
                    <Lightbulb size={14} className="shrink-0 text-[#fef08a]" />
                    <span>{t(lang, "Explain Concept", "شرح مفاهيمي")}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveMode("step_by_step")}
                    className={`flex items-center gap-1.5 p-2 rounded-xl text-[11px] font-semibold border transition-all text-start ${
                      activeMode === "step_by_step"
                        ? "bg-[#14b8a6]/25 border-[#2dd4bf] text-[#5eead4] shadow-xs"
                        : "bg-[#031411]/60 border-[#2dd4bf]/20 text-[#a0b0a8] hover:bg-[#062420]"
                    }`}
                  >
                    <Calculator size={14} className="shrink-0 text-[#38bdf8]" />
                    <span>{t(lang, "Step-by-Step", "خطوة بخطوة")}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveMode("quiz")}
                    className={`flex items-center gap-1.5 p-2 rounded-xl text-[11px] font-semibold border transition-all text-start ${
                      activeMode === "quiz"
                        ? "bg-[#14b8a6]/25 border-[#2dd4bf] text-[#5eead4] shadow-xs"
                        : "bg-[#031411]/60 border-[#2dd4bf]/20 text-[#a0b0a8] hover:bg-[#062420]"
                    }`}
                  >
                    <Brain size={14} className="shrink-0 text-[#c084fc]" />
                    <span>{t(lang, "Practice Quiz", "اختبار تدريبي")}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveMode("summary")}
                    className={`flex items-center gap-1.5 p-2 rounded-xl text-[11px] font-semibold border transition-all text-start ${
                      activeMode === "summary"
                        ? "bg-[#14b8a6]/25 border-[#2dd4bf] text-[#5eead4] shadow-xs"
                        : "bg-[#031411]/60 border-[#2dd4bf]/20 text-[#a0b0a8] hover:bg-[#062420]"
                    }`}
                  >
                    <BookOpenCheck size={14} className="shrink-0 text-[#f43f5e]" />
                    <span>{t(lang, "Key Summary", "تلخيص مركز")}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Smart Practice Prompts Card */}
            <div className="bg-[#06201c]/80 backdrop-blur-md border border-[#2dd4bf]/25 rounded-2xl p-4 shadow-xl">
              <h3 className="text-xs font-bold text-[#fef08a] flex items-center gap-2 mb-2.5">
                <Sparkles size={14} className="text-[#f59e0b]" />
                <span>{t(lang, `Quick Questions for ${selectedSubject}`, `أسئلة مقترحة لـ ${selectedSubject}`)}</span>
              </h3>
              <div className="flex flex-col gap-1.5">
                {currentPrompts.map((promptText, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(promptText)}
                    disabled={tutorMutation.isPending}
                    className="text-start text-[11px] p-2.5 rounded-xl bg-[#031411]/60 hover:bg-[#0d3b35] hover:border-[#38bdf8] border border-[#2dd4bf]/20 text-[#d8d2c4] transition-all leading-relaxed line-clamp-2"
                  >
                    {promptText}
                  </button>
                ))}
              </div>
            </div>

            {/* Privacy & Safe Study Policy */}
            <div className="bg-[#051815]/80 border border-[#2dd4bf]/20 rounded-2xl p-3.5 text-[11px] text-[#a0b0a8] space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-[#6ee7b7]">
                <ShieldCheck size={16} className="text-[#2dd4bf]" />
                <span>{t(lang, "Pedagogical & Privacy Guarantee", "مبادئ الأمان والتعلم الأصيل")}</span>
              </div>
              <p className="leading-relaxed">
                {t(
                  lang,
                  "Mihwar AI encourages step-by-step thinking and does not give answers for homework cheating. Always verify key exam details with your school teacher or textbook.",
                  "يساعدك الذكاء الاصطناعي على فهم الخطوات والمنطق ولا يقدم حلولاً جاهزة للغش في الواجبات. مرجعك الدائم هو كتابك المدرسي ومعلمك المعتمد."
                )}
              </p>
            </div>
          </aside>

          {/* Chat Workspace (8 Cols) */}
          <section className="lg:col-span-8 flex flex-col bg-[#061d19]/85 backdrop-blur-xl border border-[#2dd4bf]/30 rounded-3xl shadow-2xl h-[720px] overflow-hidden">
            
            {/* Chat Head Status Bar */}
            <div className="px-5 py-3.5 bg-[#041512]/90 border-b border-[#2dd4bf]/20 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#10b981] to-[#0d9488] text-white flex items-center justify-center font-extrabold text-base shadow-md">
                    مـ
                  </div>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] ring-2 ring-[#041512] absolute -bottom-0.5 -end-0.5"></span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <strong className="text-sm font-bold text-white">مساعد مِحور الذكي</strong>
                    <span className="text-[10px] bg-[#10b981]/20 text-[#6ee7b7] px-2.5 py-0.5 rounded-full font-bold border border-[#10b981]/35">
                      {selectedSubject} · {selectedGrade}
                    </span>
                  </div>
                  <span className="text-[10.5px] text-[#a7f3d0] block">
                    {selectedCurriculum} ·{" "}
                    {activeMode === "explain"
                      ? "وضع الشرح المفاهيمي"
                      : activeMode === "step_by_step"
                      ? "وضع الحل المتدرج"
                      : activeMode === "quiz"
                      ? "وضع الاختبار التفاعلي"
                      : "وضع التلخيص"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={clearChat}
                  className="p-2 rounded-lg text-[#a0b0a8] hover:bg-[#062420] hover:text-[#f87171] transition-colors"
                  title={t(lang, "Clear chat", "مسح المحادثة")}
                >
                  <RefreshCw size={15} />
                </button>
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-gradient-to-b from-[#03120f]/60 to-[#051a16]/80">
              {messages.map((msg) => {
                const isAssistant = msg.role === "assistant";
                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-3 ${isAssistant ? "justify-start" : "justify-end"}`}
                  >
                    {isAssistant && (
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0d5b55] to-[#14b8a6] text-white flex items-center justify-center shrink-0 mt-1 shadow-md border border-[#2dd4bf]/40">
                        <Sparkles size={16} className="text-[#fef08a]" />
                      </div>
                    )}

                    <div
                      className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed transition-all shadow-md ${
                        isAssistant
                          ? "bg-[#072420]/90 text-[#f5efe6] border border-[#2dd4bf]/30 rounded-ts-xs"
                          : "bg-gradient-to-r from-[#0d9488] to-[#14b8a6] text-white rounded-te-xs shadow-[0_4px_16px_rgba(20,184,166,0.3)]"
                      }`}
                    >
                      {/* Message Content with simple formatting */}
                      <div className="whitespace-pre-wrap font-normal space-y-1.5">
                        {msg.content}
                      </div>

                      {/* Footer Actions for Assistant message */}
                      {isAssistant && msg.id !== "welcome" && (
                        <div className="mt-3 pt-2 border-t border-[#2dd4bf]/20 flex items-center justify-between text-[10px] text-[#a0b0a8]">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleCopy(msg.id, msg.content)}
                              className="inline-flex items-center gap-1 hover:text-[#38bdf8] transition-colors"
                            >
                              {copiedId === msg.id ? <Check size={12} className="text-[#34d399]" /> : <Copy size={12} />}
                              <span>{copiedId === msg.id ? (isAr ? "تم النسخ" : "Copied") : (isAr ? "نسخ" : "Copy")}</span>
                            </button>

                            <button
                              onClick={() => handleSpeak(msg.id, msg.content)}
                              className="inline-flex items-center gap-1 hover:text-[#38bdf8] transition-colors"
                            >
                              <Volume2 size={12} className={isSpeaking === msg.id ? "text-[#38bdf8] animate-pulse" : ""} />
                              <span>{isSpeaking === msg.id ? (isAr ? "جارٍ القراءة..." : "Reading...") : (isAr ? "استماع" : "Listen")}</span>
                            </button>
                          </div>
                          <span>{msg.timestamp}</span>
                        </div>
                      )}
                    </div>

                    {!isAssistant && (
                      <div className="w-8 h-8 rounded-xl bg-[#093530] text-[#a7f3d0] border border-[#2dd4bf]/40 flex items-center justify-center shrink-0 mt-1 shadow-sm">
                        <User size={16} />
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Thinking / Loading Animation */}
              {tutorMutation.isPending && (
                <div className="flex items-start gap-3 justify-start">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0d5b55] to-[#14b8a6] text-white flex items-center justify-center shrink-0 mt-1 shadow-md border border-[#2dd4bf]/40">
                    <Sparkles size={16} className="animate-spin text-[#fef08a]" />
                  </div>
                  <div className="bg-[#072420]/90 border border-[#2dd4bf]/30 rounded-2xl rounded-ts-xs px-4 py-3 shadow-md">
                    <div className="flex items-center gap-2 text-xs text-[#a7f3d0]">
                      <span className="w-2 h-2 rounded-full bg-[#34d399] animate-bounce"></span>
                      <span className="w-2 h-2 rounded-full bg-[#34d399] animate-bounce [animation-delay:0.2s]"></span>
                      <span className="w-2 h-2 rounded-full bg-[#34d399] animate-bounce [animation-delay:0.4s]"></span>
                      <span className="text-[11px] font-semibold ms-1">
                        {isAr ? "جارٍ تحليل المسألة وصياغة الشرح التعليمي..." : "Analyzing concept and formatting guidance..."}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Math & Science Symbols Toolbar */}
            <div className="px-4 py-2 bg-[#041512] border-t border-[#2dd4bf]/20 flex items-center gap-1.5 overflow-x-auto text-xs text-[#a7f3d0]">
              <span className="text-[10px] font-bold text-[#6ee7b7] shrink-0 me-1">رموز سريعة:</span>
              {["π", "√x", "x²", "θ", "Δ", "±", "×", "÷", "≈", "→", "≤", "≥", "∞", "∫", "∑", "α", "β", "λ"].map((sym) => (
                <button
                  key={sym}
                  type="button"
                  onClick={() => setInput((prev) => prev + sym)}
                  className="px-2 py-0.5 rounded-md bg-[#082622] hover:bg-[#14b8a6] hover:text-white border border-[#2dd4bf]/25 transition-colors font-mono shrink-0"
                  title={`إدراج ${sym}`}
                >
                  {sym}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <div className="p-3 sm:p-4 bg-[#041512]/95 border-t border-[#2dd4bf]/20">
              <div className="flex items-end gap-2 bg-[#020e0c] border border-[#2dd4bf]/30 rounded-2xl p-2 focus-within:border-[#38bdf8] focus-within:ring-2 focus-within:ring-[#38bdf8]/20 shadow-md transition-all">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    isAr
                      ? `اكتب سؤالك في ${selectedSubject} لمرحلة ${selectedGrade} (اضغط Enter للإرسال)...`
                      : `Type your question in ${selectedSubject} for ${selectedGrade} (Press Enter to send)...`
                  }
                  rows={2}
                  className="flex-1 bg-transparent border-0 outline-none resize-none text-xs sm:text-sm text-white placeholder-[#788e84] px-2 py-1 leading-relaxed"
                />

                <button
                  type="button"
                  onClick={() => handleSend()}
                  disabled={!input.trim() || tutorMutation.isPending}
                  className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-r from-[#14b8a6] to-[#0d9488] text-white hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shrink-0"
                  title={isAr ? "إرسال السؤال" : "Send question"}
                >
                  <Send size={16} className={isAr ? "rotate-180" : ""} />
                </button>
              </div>

              <div className="flex items-center justify-between mt-2 px-1 text-[10px] text-[#a0b0a8]">
                <span>{t(lang, "Press Enter to send, Shift + Enter for new line", "اضغط Enter للإرسال، أو Shift + Enter لسطر جديد")}</span>
                <span className="flex items-center gap-1 text-[#34d399] font-semibold">
                  <CheckCircle2 size={11} />
                  {t(lang, "Curriculum AI Engine Active", "محرك الذكاء الأكاديمي نشط وموجّه")}
                </span>
              </div>
            </div>

          </section>

        </div>

      </main>
    </SiteShell>
  );
}
