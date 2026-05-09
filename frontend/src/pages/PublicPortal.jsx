import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { ArrowRight, FileText, Languages, LogIn, MapPinned, Search, ShieldCheck, UserPlus, Waves } from "lucide-react";
import { getPortalLanguage, setPortalLanguage, getPublicText, PORTAL_LANGUAGE_OPTIONS } from "../i18n/public";

function usePortalLanguage() {
  const [language, setLanguage] = useState(() => {
    return getPortalLanguage();
  });

  useEffect(() => {
    setPortalLanguage(language);
  }, [language]);

  return [language, setLanguage];
}

function ActionCard({ icon: Icon, title, text, action, to, accent }) {
  return (
    <article className="rounded-[28px] border border-white/12 bg-white/10 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.24)] backdrop-blur">
      <div
        className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-lg ${accent}`}
      >
        <Icon size={20} />
      </div>
      <h2 className="text-xl font-bold text-white">{title}</h2>
      <p className="mt-3 text-sm leading-7 text-slate-200">{text}</p>
      <Link
        to={to}
        className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
      >
        <Icon size={16} />
        {action}
      </Link>
    </article>
  );
}

export function ProcessFlowPage() {
  return <Navigate to="/" replace />;
}

export function SitemapPage() {
  return <Navigate to="/" replace />;
}

export default function PublicPortal() {
  const [language, setLanguage] = usePortalLanguage();
  const t = useMemo(() => getPublicText(language), [language]);
  const common = t.common;
  const portal = t.portal;
  const scrollToGuide = () => {
    if (typeof document === "undefined") return;
    document.getElementById("citizen-guide")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.14),_transparent_18%),linear-gradient(145deg,_#0f172a,_#1e3a8a_45%,_#312e81)] px-4 py-4 md:px-8 md:py-6">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[32px] border border-white/12 bg-white/8 shadow-[0_40px_120px_rgba(15,23,42,0.38)] backdrop-blur">
        <header className="border-b border-white/10 bg-white/92 px-5 py-4 md:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-950 text-xl font-bold text-white shadow-lg shadow-indigo-950/40 ring-2 ring-amber-400/70">
                JS
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">{common.eyebrow}</p>
                <h1 className="text-2xl font-bold text-slate-950">{common.title}</h1>
                <p className="text-sm text-slate-600">{portal.subtitle}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm">
                <Languages size={16} />
                <span>{common.language}</span>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="bg-transparent pr-1 outline-none"
                  aria-label={common.language}
                >
                  {PORTAL_LANGUAGE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>

              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-300"
              >
                <LogIn size={16} />
                {portal.login}
              </Link>
            </div>
          </div>
        </header>

        <main className="px-5 py-10 md:px-8 md:py-14">
          <section className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-200 backdrop-blur">
                <Waves size={15} />
                {portal.accessTag}
              </div>
              <h2 className="mt-6 text-5xl font-extrabold leading-[1.05] text-white md:text-6xl">
                {portal.heroTitle}
              </h2>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-200">{portal.heroText}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-300"
                >
                  <UserPlus size={17} />
                  {portal.actionRegister}
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
                >
                  <LogIn size={17} />
                  {portal.actionLogin}
                </Link>
                <Link
                  to="/track"
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
                >
                  <Search size={17} />
                  {portal.actionTrack}
                </Link>
                <button
                  type="button"
                  onClick={scrollToGuide}
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
                >
                  <FileText size={17} />
                  {portal.actionHowItWorks}
                </button>
              </div>
            </div>

            <section className="rounded-[30px] border border-white/12 bg-white/8 p-5 shadow-[0_24px_90px_rgba(15,23,42,0.22)] backdrop-blur md:p-6">
              <h3 className="text-2xl font-bold text-white">{portal.cardTitle}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-200">{portal.cardText}</p>
              <div className="mt-6 grid gap-4 md:grid-cols-3 lg:grid-cols-1">
                <ActionCard
                  icon={LogIn}
                  title={portal.login}
                  text={portal.loginText}
                  action={portal.actionLogin}
                  to="/login"
                  accent="bg-gradient-to-br from-indigo-600 to-indigo-800"
                />
                <ActionCard
                  icon={UserPlus}
                  title={portal.register}
                  text={portal.registerText}
                  action={portal.actionRegister}
                  to="/register"
                  accent="bg-gradient-to-br from-amber-500 to-orange-500"
                />
                <ActionCard
                  icon={Search}
                  title={portal.track}
                  text={portal.trackText}
                  action={portal.actionTrack}
                  to="/track"
                  accent="bg-gradient-to-br from-sky-500 to-indigo-600"
                />
              </div>
            </section>
          </section>

          <section
            id="citizen-guide"
            className="mt-12 rounded-[30px] border border-white/12 bg-white/8 p-5 shadow-[0_24px_90px_rgba(15,23,42,0.22)] backdrop-blur md:p-6"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">
                  <ShieldCheck size={14} />
                  Citizen guide
                </div>
                <h3 className="mt-4 text-3xl font-bold text-white">{portal.guideTitle}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-200">{portal.guideText}</p>
              </div>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-300"
              >
                <UserPlus size={16} />
                {portal.actionRegister}
              </Link>
            </div>

            <div className="mt-6 grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
                {portal.guideSteps.map((step, index) => (
                  <article
                    key={step.title}
                    className="rounded-[24px] border border-white/12 bg-white/10 p-4 shadow-[0_16px_40px_rgba(15,23,42,0.18)]"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-700 text-sm font-bold text-white">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="text-base font-semibold text-white">{step.title}</h4>
                        <p className="mt-2 text-sm leading-7 text-slate-200">{step.text}</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              <aside className="rounded-[24px] border border-white/12 bg-white/10 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.18)]">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white">
                    <MapPinned size={20} />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-white">{portal.guideTipsTitle}</h4>
                    <p className="text-sm text-slate-300">Make complaints easier to route and resolve.</p>
                  </div>
                </div>

                <ul className="mt-5 space-y-3">
                  {portal.guideTips.map((tip) => (
                    <li key={tip} className="flex items-start gap-3 text-sm leading-7 text-slate-200">
                      <span className="mt-1 inline-block h-2.5 w-2.5 rounded-full bg-amber-300" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    to="/register"
                    className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
                  >
                    <UserPlus size={16} />
                    {portal.actionRegister}
                  </Link>
                  <Link
                    to="/track"
                    className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
                  >
                    <ArrowRight size={16} />
                    {portal.actionTrack}
                  </Link>
                </div>
              </aside>
            </div>
          </section>
        </main>

        <footer className="border-t border-white/10 bg-indigo-950/70 px-5 py-4 text-center text-sm text-slate-200 md:px-8">
          <div className="inline-flex items-center gap-2">
            <ShieldCheck size={16} />
            <span>{portal.footer}</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
