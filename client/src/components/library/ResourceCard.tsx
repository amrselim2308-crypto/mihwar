import { ArrowUpLeft, ArrowUpRight, Bookmark, BookOpen, ExternalLink, FileText, Play, ShieldCheck } from "lucide-react";
import { LIBRARY_CATEGORIES, LIBRARY_COUNTRY_LABELS, LIBRARY_FORMATS, LIBRARY_SUBJECTS, LIBRARY_TERMS, gradeForCode, localizedOption } from "../../../../shared/library-catalog";
import { t } from "@/lib/i18n";
import type { Language } from "@/lib/i18n";
import type { LibraryResourceItem } from "./types";

type Props = {
  resource: LibraryResourceItem;
  lang: Language;
  saved?: boolean;
  onOpen: (resource: LibraryResourceItem) => void;
  onToggleSave?: (resource: LibraryResourceItem, saved: boolean) => void;
  onLogin?: () => void;
  signedIn?: boolean;
};

export default function ResourceCard({ resource, lang, saved = false, onOpen, onToggleSave, onLogin, signedIn = false }: Props) {
  const grade = gradeForCode(resource.countryCode, resource.gradeCode);
  const category = LIBRARY_CATEGORIES.find(item => item.value === resource.category);
  const format = LIBRARY_FORMATS.find(item => item.value === resource.format);
  const subject = LIBRARY_SUBJECTS.find(item => item.value === resource.subjectCode);
  const term = LIBRARY_TERMS.find(item => item.value === resource.termCode);
  const Arrow = lang === "ar" ? ArrowUpLeft : ArrowUpRight;
  const canBookmark = resource.format === "pdf";
  const SourceIcon = resource.format === "video_summary" ? Play : resource.hasFile ? FileText : ExternalLink;
  return <article className="library-resource-card">
    <div className="library-resource-card-top"><span className="library-format-icon"><SourceIcon size={18} /></span><span className="library-format-pill">{format ? localizedOption(format, lang) : resource.format}</span></div>
    <div className="library-resource-copy"><div className="library-resource-eyebrow">{category ? localizedOption(category, lang) : resource.category}</div><h3>{resource.title}</h3>{resource.description && <p>{resource.description}</p>}</div>
    <div className="library-resource-taxonomy"><span>{localizedOption(LIBRARY_COUNTRY_LABELS[resource.countryCode], lang)}</span>{grade && <span>{lang === "ar" ? grade.gradeLabelAr : grade.gradeLabelEn}</span>}{subject && <span>{localizedOption(subject, lang)}</span>}{term && <span>{localizedOption(term, lang)}</span>}</div>
    <div className="library-resource-source">{resource.publisherName && <span>{resource.publisherName}</span>}<span className="rights-indicator"><ShieldCheck size={13} />{t(lang, "Rights reviewed", "الحقوق موضحة")}</span></div>
    <div className="library-resource-actions"><button type="button" className="button button-primary library-open-button" onClick={() => onOpen(resource)} disabled={!resource.hasFile && !resource.externalUrl}><BookOpen size={15} />{resource.hasFile ? t(lang, "Read PDF", "قراءة PDF") : resource.format === "video_summary" ? t(lang, "Open video", "فتح الفيديو") : resource.format === "interactive_quiz" ? t(lang, "Open quiz", "فتح الاختبار") : t(lang, "Open source", "فتح المصدر")}<Arrow size={14} /></button>
      {canBookmark && onToggleSave && <button type="button" className={`library-save-button${saved ? " is-saved" : ""}`} aria-label={saved ? t(lang, "Remove bookmark", "إزالة الحفظ") : t(lang, "Save resource", "حفظ المورد")} onClick={() => signedIn ? onToggleSave(resource, saved) : onLogin?.()}><Bookmark size={16} fill={saved ? "currentColor" : "none"} /><span>{saved ? t(lang, "Saved", "محفوظ") : t(lang, "Save", "حفظ")}</span></button>}
    </div>
  </article>;
}
