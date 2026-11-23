import React, { useState, useRef, useEffect } from "react";
import {
  BookOpen,
  Bot,
  Brain,
  Check,
  ChevronDown,
  Copy,
  GraduationCap,
  Lightbulb,
  Maximize2,
  MessageSquare,
  Minimize2,
  RefreshCw,
  Send,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { t, type Language } from "@/lib/i18n";
import { subjects } from "@/pages/Home";

type FloatingAIChatProps = {
  lang: Language;
};

type QuickMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export function FloatingAIChat({ lang }: FloatingAIChatProps) {
  const isAr = lang === "ar";
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState("");
  const [selectedSubject, setSelectedSubject] = useState(isAr ? "الرياضيات" : "Mathematics");
  const [activeMode, setActiveMode] = useState<"explain" | "step_by_step" | "quiz">("explain");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [messages, setMessages] = useState<QuickMessage[]>([
    {
      id: "initial",
      role: "assistant",
      content: isAr
        ? "مرحباً بك! أنا رفيقك الدراسي الذكي 🌟 اكتب سؤالك أو اختر موضوعاً للمساعدة في الشرح والحل خطوة بخطوة."
        : "Hello! I am your AI study companion 🌟 Ask any question or pick a topic for step-by-step guidance.",
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const tutorMutation = trpc.ai.tutor.useMutation({
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substring(7),
          role: "assistant",
          content: data.content,
        },
      ]);
    },
    onError: () => {
      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substring(7),
          role: "assistant",
          content: isAr
            ? "حدث انقطاع مؤقت. يرجى تجربة إرسال السؤال مرة أخرى."
            : "Temporary connection error. Please try sending your question again.",
        },
      ]);
    },
  });

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, tutorMutation.isPending]);

  const handleSend = (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || tutorMutation.isPending) return;

    const userMsg: QuickMessage = {
      id: Math.random().toString(36).substring(7),
      role: "user",
      content: text,
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput("");

    tutorMutation.mutate({
      language: lang,
      subject: selectedSubject,
      mode: activeMode,
      messages: newHistory
        .filter((m) => m.id !== "initial")
        .slice(-6)
        .map(({ role, content }) => ({ role, content })),
    });
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed bottom-5 inset-inline-end-5 z-50 font-sans">
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-[#0d5b55] to-[#14b8a6] text-white shadow-2xl hover:brightness-110 hover:scale-105 transition-all duration-200 border border-[#2dd4bf]/40"
          aria-label={t(lang, "Open AI Study Assistant", "فتح مساعد مِحور الذكي")}
        >
          <div className="relative">
            <span className="w-8 h-8 rounded-full bg-[#062420] flex items-center justify-center text-white">
              <Sparkles size={16} className="text-[#fef08a] animate-pulse" />
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] ring-2 ring-[#062420] absolute -bottom-0.5 -end-0.5"></span>
          </div>
          <div className="text-start pe-1">
            <span className="text-[12px] font-bold block leading-tight text-white">
              {t(lang, "Mihwar AI Assistant", "مساعد مِحور الذكي")}
            </span>
            <span className="text-[9.5px] text-[#a7f3d0] block">
              {t(lang, "Ask any lesson question", "اسأل عن أي درس أو مسألة")}
            </span>
          </div>
        </button>
      )}

      {/* Floating Chat Window */}
      {isOpen && (
        <div
          className={`flex flex-col bg-[#051a17]/95 backdrop-blur-xl border border-[#2dd4bf]/35 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 w-[min(420px,94vw)] ${
            isMinimized ? "h-14" : "h-[560px]"
          }`}
        >
          {/* Header */}
          <div className="bg-[#041512] text-white px-4 py-3 flex items-center justify-between shrink-0 select-none border-b border-[#2dd4bf]/20">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#10b981] to-[#0d9488] flex items-center justify-center text-white font-extrabold text-sm shadow">
                مـ
              </div>
              <div>
                <strong className="text-xs font-bold block leading-tight text-white">
                  {t(lang, "Mihwar AI Study Guide", "مساعد مِحور الذكي")}
                </strong>
                <span className="text-[9px] text-[#34d399] flex items-center gap-1 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse"></span>
                  {t(lang, "Active Curriculum Tutor", "جاهز للمساعدة خطوة بخطوة")}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsMinimized((prev) => !prev)}
                className="p-1 rounded text-[#a7f3d0] hover:text-white hover:bg-white/10 transition-colors"
                title={isMinimized ? (isAr ? "تكبير" : "Expand") : (isAr ? "تصغير" : "Minimize")}
              >
                {isMinimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded text-[#a7f3d0] hover:text-white hover:bg-white/10 transition-colors"
                title={t(lang, "Close", "إغلاق")}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Body when not minimized */}
          {!isMinimized && (
            <>
              {/* Quick Selectors Bar */}
              <div className="bg-[#031411] border-b border-[#2dd4bf]/20 px-3 py-2 flex items-center justify-between gap-2 text-[10.5px]">
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <BookOpen size={13} className="text-[#38bdf8] shrink-0" />
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="bg-transparent border-0 outline-none text-[#e2ece6] font-semibold text-[11px] truncate cursor-pointer"
                  >
                    {subjects.map((s) => (
                      <option key={s.en} value={isAr ? s.ar : s.en} className="bg-[#051a17] text-white">
                        {isAr ? s.ar : s.en}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setActiveMode("explain")}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                      activeMode === "explain"
                        ? "bg-[#14b8a6] text-white"
                        : "bg-[#082622] text-[#a7f3d0] hover:bg-[#0d3b35]"
                    }`}
                  >
                    {isAr ? "شرح" : "Explain"}
                  </button>
                  <button
                    onClick={() => setActiveMode("step_by_step")}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                      activeMode === "step_by_step"
                        ? "bg-[#14b8a6] text-white"
                        : "bg-[#082622] text-[#a7f3d0] hover:bg-[#0d3b35]"
                    }`}
                  >
                    {isAr ? "خطوات" : "Steps"}
                  </button>
                </div>
              </div>

              {/* Message List */}
              <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-gradient-to-b from-[#03120f]/60 to-[#051a16]/80">
                {messages.map((msg) => {
                  const isAssistant = msg.role === "assistant";
                  return (
                    <div
                      key={msg.id}
                      className={`flex items-start gap-2 ${isAssistant ? "justify-start" : "justify-end"}`}
                    >
                      {isAssistant && (
                        <div className="w-6 h-6 rounded-md bg-[#0d5b55] text-white flex items-center justify-center shrink-0 mt-1 border border-[#2dd4bf]/40 shadow">
                          <Sparkles size={13} className="text-[#fef08a]" />
                        </div>
                      )}

                      <div
                        className={`max-w-[85%] rounded-xl px-3 py-2 text-[11.5px] leading-relaxed shadow-sm ${
                          isAssistant
                            ? "bg-[#072420]/95 text-[#f5efe6] border border-[#2dd4bf]/25"
                            : "bg-gradient-to-r from-[#0d9488] to-[#14b8a6] text-white"
                        }`}
                      >
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                        {isAssistant && msg.id !== "initial" && (
                          <div className="mt-1.5 pt-1 border-t border-[#2dd4bf]/20 flex justify-end">
                            <button
                              onClick={() => handleCopy(msg.id, msg.content)}
                              className="text-[9.5px] text-[#a7f3d0] hover:text-[#38bdf8] flex items-center gap-1"
                            >
                              {copiedId === msg.id ? <Check size={11} className="text-[#34d399]" /> : <Copy size={11} />}
                              <span>{copiedId === msg.id ? (isAr ? "تم النسخ" : "Copied") : (isAr ? "نسخ" : "Copy")}</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {!isAssistant && (
                        <div className="w-6 h-6 rounded-md bg-[#093530] text-[#a7f3d0] border border-[#2dd4bf]/40 flex items-center justify-center shrink-0 mt-1 shadow">
                          <User size={13} />
                        </div>
                      )}
                    </div>
                  );
                })}

                {tutorMutation.isPending && (
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-md bg-[#0d5b55] text-white flex items-center justify-center shrink-0 mt-1">
                      <Sparkles size={13} className="animate-spin text-[#fef08a]" />
                    </div>
                    <div className="bg-[#072420]/95 border border-[#2dd4bf]/25 rounded-xl px-3 py-2 text-[11px] text-[#a7f3d0] flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#34d399] animate-bounce"></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#34d399] animate-bounce [animation-delay:0.2s]"></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#34d399] animate-bounce [animation-delay:0.4s]"></span>
                      <span>{isAr ? "جارٍ التفكير والشرح..." : "Thinking..."}</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-2.5 bg-[#041512] border-t border-[#2dd4bf]/20">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                  className="flex items-center gap-1.5 bg-[#020e0c] border border-[#2dd4bf]/30 rounded-xl px-2 py-1.5 focus-within:border-[#38bdf8] focus-within:ring-2 focus-within:ring-[#38bdf8]/20"
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={
                      isAr
                        ? `اسأل في ${selectedSubject}...`
                        : `Ask about ${selectedSubject}...`
                    }
                    className="flex-1 bg-transparent border-0 outline-none text-xs text-white placeholder-[#788e84] px-1"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || tutorMutation.isPending}
                    className="w-7 h-7 rounded-lg bg-gradient-to-r from-[#14b8a6] to-[#0d9488] text-white flex items-center justify-center hover:brightness-110 disabled:opacity-40 transition-colors shrink-0"
                  >
                    <Send size={13} className={isAr ? "rotate-180" : ""} />
                  </button>
                </form>

                <div className="flex items-center justify-between mt-1.5 px-1 text-[9px] text-[#a0b0a8]">
                  <span>{t(lang, "AI study guide", "مساعد دراسي إرشادي")}</span>
                  <Link href="/study" className="text-[#38bdf8] hover:underline font-bold">
                    {t(lang, "Open Full Assistant", "فتح الشاشة الكاملة")} ↗
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
