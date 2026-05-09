import { Link } from "react-router-dom";
import { Languages, LogIn, ShieldCheck, Waves } from "lucide-react";

const PORTAL_LANGUAGE_KEY = "portal_language";

export function getPortalLanguage() {
  if (typeof window === "undefined") return "en";
  return localStorage.getItem(PORTAL_LANGUAGE_KEY) || "en";
}

export function setPortalLanguage(language) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PORTAL_LANGUAGE_KEY, language);
  document.documentElement.lang = language === "hi" ? "hi" : "en";
}

export default function PortalEntryShell({
  language = "en",
  onLanguageChange,
  title,
  subtitle,
  eyebrow,
  description,
  badges = [],
  asideTitle,
  asideText,
  asidePoints = [],
  children,
  footer,
}) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.16),_transparent_18%),linear-gradient(140deg,_#0f172a,_#1d4ed8_48%,_#312e81)] p-4 md:p-6">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-7xl grid-cols-1 overflow-hidden rounded-[28px] border border-white/15 bg-white/8 shadow-[0_32px_120px_rgba(15,23,42,0.45)] backdrop-blur xl:grid-cols-[1.05fr_0.95fr]">
        <section className="relative overflow-hidden px-6 py-6 text-white md:px-10 md:py-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.12),_transparent_32%),linear-gradient(150deg,_rgba(15,23,42,0.55),_rgba(49,46,129,0.34))]" />
          <div className="relative z-10 flex h-full flex-col">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Link to="/" className="inline-flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-950 text-xl font-bold text-white shadow-lg shadow-indigo-950/40 ring-2 ring-amber-400/60">
                  JS
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-amber-200">{eyebrow}</p>
                  <h1 className="text-lg font-bold">{title}</h1>
                  <p className="text-sm text-slate-200">{subtitle}</p>
                </div>
              </Link>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs text-white/90 backdrop-blur">
                <Languages size={14} />
                <select
                  value={language}
                  onChange={(e) => onLanguageChange?.(e.target.value)}
                  className="bg-transparent outline-none"
                  aria-label={language === "hi" ? "भाषा" : "Language"}
                >
                  <option value="en" className="text-slate-900">English</option>
                  <option value="hi" className="text-slate-900">Hindi</option>
                </select>
              </div>
            </div>

            <div className="mt-10 max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-amber-200">
                {language === "hi" ? "लाइव जल शिकायत डेमो" : "Live water grievance demo"}
              </p>
              <h2 className="mt-3 text-4xl font-extrabold leading-tight md:text-5xl">{description}</h2>
              <div className="mt-6 flex flex-wrap gap-2">
                {badges.map((badge) => (
                  <span
                    key={badge}
                    className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-white backdrop-blur"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {asidePoints.map((point) => (
                <div
                  key={point.title}
                  className="rounded-3xl border border-white/12 bg-white/10 p-4 shadow-[0_16px_40px_rgba(15,23,42,0.22)] backdrop-blur"
                >
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 text-white">
                    <point.icon size={18} />
                  </div>
                  <h3 className="text-sm font-semibold">{point.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-200">{point.text}</p>
                </div>
              ))}
            </div>

            <div className="mt-auto rounded-[24px] border border-white/12 bg-slate-950/35 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.32)] backdrop-blur">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-400 text-slate-950 shadow-lg">
                  <Waves size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold">{asideTitle}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-200">{asideText}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/15"
                >
                  <ShieldCheck size={15} />
                  {language === "hi" ? "पोर्टल पर वापस जाएँ" : "Back to portal"}
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-300"
                >
                  <LogIn size={15} />
                  {language === "hi" ? "लॉगिन खोलें" : "Open login"}
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white/96 px-5 py-6 md:px-8 md:py-8">
          <div className="mx-auto flex h-full max-w-xl flex-col">
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] md:p-8">
              {children}
            </div>
            {footer ? <div className="mt-4">{footer}</div> : null}
          </div>
        </section>
      </div>
    </div>
  );
}
