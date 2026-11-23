import { ArrowLeft, ArrowRight, BookmarkCheck, ExternalLink, X } from "lucide-react";
import { useEffect, useState } from "react";
import { t } from "@/lib/i18n";
import type { Language } from "@/lib/i18n";
import type { LibraryResourceItem } from "./types";

type Props = {
  resource: LibraryResourceItem;
  url: string;
  initialPage: number;
  lang: Language;
  onSavePage: (pageNumber: number) => void;
  onClose: () => void;
};

export default function PdfReader({ resource, url, initialPage, lang, onSavePage, onClose }: Props) {
  const [page, setPage] = useState(initialPage);
  useEffect(() => setPage(initialPage), [resource.id, initialPage]);
  const Back = lang === "ar" ? ArrowRight : ArrowLeft;
  const pageUrl = `${url}#page=${page}`;
  return <div className="library-reader-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="library-reader" role="dialog" aria-modal="true" aria-labelledby="library-reader-title">
      <header className="library-reader-head"><div><span>{t(lang, "READING ROOM", "قاعة القراءة")}</span><h2 id="library-reader-title">{resource.title}</h2></div><button type="button" className="library-reader-close" aria-label={t(lang, "Close reader", "إغلاق القارئ")} onClick={onClose}><X size={19} /></button></header>
      <div className="library-reader-toolbar"><label>{t(lang, "Go to page", "الانتقال للصفحة")}<input type="number" min={1} max={100000} value={page} onChange={event => setPage(Math.max(1, Number(event.target.value) || 1))} /></label><button type="button" className="button button-outline" onClick={() => onSavePage(page)}><BookmarkCheck size={15} />{t(lang, "Save position", "حفظ الموضع")}</button><a href={pageUrl} target="_blank" rel="noopener noreferrer" className="library-reader-external">{t(lang, "Open in browser", "فتح في المتصفح")}<ExternalLink size={14} /></a></div>
      <iframe key={pageUrl} src={pageUrl} title={resource.title} className="library-pdf-frame" />
      <footer className="library-reader-foot"><Back size={14} />{t(lang, "The built-in browser PDF viewer is used. If it is unavailable on this phone, open the PDF in your browser.", "يُستخدم عارض PDF المدمج بالمتصفح. إن لم يعمل على هاتفك، افتح الملف في المتصفح.")}</footer>
    </section>
  </div>;
}
