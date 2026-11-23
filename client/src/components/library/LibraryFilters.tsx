import { Filter, RotateCcw, Search } from "lucide-react";
import { LIBRARY_CATEGORIES, LIBRARY_COUNTRIES, LIBRARY_COUNTRY_LABELS, LIBRARY_FORMATS, LIBRARY_SUBJECTS, LIBRARY_TERMS, gradesForCountry, localizedOption } from "../../../../shared/library-catalog";
import { t } from "@/lib/i18n";
import type { Language } from "@/lib/i18n";
import type { LibraryFiltersState } from "./types";

type Props = {
  lang: Language;
  filters: LibraryFiltersState;
  onChange: (next: LibraryFiltersState) => void;
  onClear: () => void;
};

export default function LibraryFilters({ lang, filters, onChange, onClear }: Props) {
  const set = (key: keyof LibraryFiltersState, value: string) => onChange({ ...filters, [key]: value });
  const grades = filters.countryCode ? gradesForCountry(filters.countryCode) : [];
  return <aside className="library-filter-panel" aria-label={t(lang, "Library filters", "مرشحات المكتبة")}>
    <div className="library-filter-title"><h2><Filter size={17} />{t(lang, "Refine resources", "تصفية الموارد")}</h2><button type="button" className="library-clear" onClick={onClear}><RotateCcw size={13} />{t(lang, "Clear", "مسح")}</button></div>
    <label className="library-field"><span>{t(lang, "Curriculum track", "مسار المنهج")}</span><select value={filters.countryCode} onChange={event => onChange({ ...filters, countryCode: event.target.value as LibraryFiltersState["countryCode"], gradeCode: "" })}>
      <option value="">{t(lang, "Choose a country", "اختر الدولة")}</option>{LIBRARY_COUNTRIES.map(country => <option key={country} value={country}>{localizedOption(LIBRARY_COUNTRY_LABELS[country], lang)}</option>)}
    </select></label>
    <label className="library-field"><span>{t(lang, "Stage & grade", "المرحلة والصف")}</span><select value={filters.gradeCode} onChange={event => set("gradeCode", event.target.value)} disabled={!filters.countryCode}>
      <option value="">{filters.countryCode ? t(lang, "All grades", "كل الصفوف") : t(lang, "Choose a track first", "اختر المسار أولًا")}</option>{grades.map(grade => <option key={grade.gradeCode} value={grade.gradeCode}>{localizedOption({ en: `${grade.stageLabelEn} · ${grade.gradeLabelEn}`, ar: `${grade.stageLabelAr} · ${grade.gradeLabelAr}` }, lang)}</option>)}
    </select></label>
    <label className="library-field"><span>{t(lang, "Subject", "المادة")}</span><select value={filters.subjectCode} onChange={event => set("subjectCode", event.target.value)}><option value="">{t(lang, "All subjects", "كل المواد")}</option>{LIBRARY_SUBJECTS.map(item => <option key={item.value} value={item.value}>{localizedOption(item, lang)}</option>)}</select></label>
    <label className="library-field"><span>{t(lang, "Term", "الفصل الدراسي")}</span><select value={filters.termCode} onChange={event => set("termCode", event.target.value)}><option value="">{t(lang, "All terms", "كل الفصول")}</option>{LIBRARY_TERMS.map(item => <option key={item.value} value={item.value}>{localizedOption(item, lang)}</option>)}</select></label>
    <label className="library-field"><span>{t(lang, "Resource category", "تصنيف المورد")}</span><select value={filters.category} onChange={event => set("category", event.target.value)}><option value="">{t(lang, "All categories", "كل التصنيفات")}</option>{LIBRARY_CATEGORIES.map(item => <option key={item.value} value={item.value}>{localizedOption(item, lang)}</option>)}</select></label>
    <label className="library-field"><span>{t(lang, "Format", "نوع الملف")}</span><select value={filters.format} onChange={event => set("format", event.target.value)}><option value="">{t(lang, "All formats", "كل الصيغ")}</option>{LIBRARY_FORMATS.map(item => <option key={item.value} value={item.value}>{localizedOption(item, lang)}</option>)}</select></label>
    <label className="library-field"><span>{t(lang, "Search", "بحث")}</span><span className="library-search-wrap"><Search size={15} /><input value={filters.query} onChange={event => set("query", event.target.value)} placeholder={t(lang, "Title, subject, publisher…", "العنوان أو المادة أو الناشر…")} /></span></label>
  </aside>;
}
