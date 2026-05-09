import { Link } from "react-router-dom";
import { Languages, LogIn, ShieldCheck, Waves } from "lucide-react";
import { PORTAL_LANGUAGE_OPTIONS, getPublicText } from "../../i18n/public";

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
  const commonText = getPublicText(language).common;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.16),_transparent_18%),linear-gradient(145deg,_#070b18,_#101726_48%,_#1a2336)] p-4 md:p-6">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-7xl grid-cols-1 overflow-hidden rounded-[28px] border border-cyan-400/10 bg-white/6 shadow-[0_32px_120px_rgba(5,10,25,0.52)] backdrop-blur xl:grid-cols-[1.05fr_0.95fr]">
        <section className="relative overflow-hidden px-6 py-6 text-white md:px-10 md:py-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.12),_transparent_30%),linear-gradient(150deg,_rgba(7,11,24,0.72),_rgba(15,23,42,0.36))]" />
          <div className="relative z-10 flex h-full flex-col">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Link to="/" className="inline-flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400 text-xl font-bold text-slate-950 shadow-lg shadow-cyan-900/30 ring-2 ring-cyan-200/40">
                  JS
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-300">{eyebrow}</p>
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
                  aria-label={commonText.language}
                >
                  {PORTAL_LANGUAGE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value} className="text-slate-900">
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-10 max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-cyan-300">
                {commonText.livePlatform}
              </p>
              <h2 className="mt-3 text-4xl font-extrabold leading-tight md:text-5xl">{description}</h2>
              <div className="mt-6 flex flex-wrap gap-2">
                {badges.map((badge) => (
                  <span
                    key={badge}
                  className="rounded-full border border-cyan-300/10 bg-white/8 px-3 py-1.5 text-xs font-medium text-white backdrop-blur"
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
                  className="rounded-3xl border border-cyan-300/10 bg-white/8 p-4 shadow-[0_16px_40px_rgba(8,15,32,0.28)] backdrop-blur"
                >
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 text-white">
                    <point.icon size={18} />
                  </div>
                  <h3 className="text-sm font-semibold">{point.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-200">{point.text}</p>
                </div>
              ))}
            </div>

            <div className="mt-auto rounded-[24px] border border-cyan-300/10 bg-[#0d1626]/70 p-5 shadow-[0_24px_80px_rgba(8,15,32,0.38)] backdrop-blur">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-400 text-slate-950 shadow-lg">
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
                  {commonText.backToPortal}
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300"
                >
                  <LogIn size={15} />
                  {commonText.openLogin}
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#f6fbff] px-5 py-6 md:px-8 md:py-8">
          <div className="mx-auto flex h-full max-w-xl flex-col">
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(8,15,32,0.1)] md:p-8">
              {children}
            </div>
            {footer ? <div className="mt-4">{footer}</div> : null}
          </div>
        </section>
      </div>
    </div>
  );
}
