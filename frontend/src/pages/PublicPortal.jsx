import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ArrowRight,
  CircleHelp,
  FileText,
  Home,
  Info,
  Languages,
  LogIn,
  Mail,
  Map,
  MapPinned,
  Phone,
  Search,
  ShieldCheck,
  UserPlus,
  Waves,
} from "lucide-react";
import { getPortalLanguage, setPortalLanguage, getPublicText, PORTAL_LANGUAGE_OPTIONS } from "../i18n/public";

function usePortalLanguage() {
  const [language, setLanguageState] = useState(() => getPortalLanguage());

  useEffect(() => {
    setPortalLanguage(language);
  }, [language]);

  return [language, setLanguageState];
}

function UtilityLink({ to, icon: Icon, label }) {
  return (
    <Link to={to} className="portal-utility-link">
      <Icon size={14} />
      <span>{label}</span>
    </Link>
  );
}

function UtilityNav({ portal }) {
  return (
    <nav className="portal-utility-nav" aria-label={portal.utilityNavLabel}>
      <UtilityLink to="/" icon={Home} label={portal.utilityHome} />
      <UtilityLink to="/contact-us" icon={Phone} label={portal.utilityContact} />
      <UtilityLink to="/about-us" icon={Info} label={portal.utilityAbout} />
      <UtilityLink to="/faq-help" icon={CircleHelp} label={portal.utilityFaq} />
      <UtilityLink to="/site-map" icon={Map} label={portal.utilitySiteMap} />
    </nav>
  );
}

function PublicShell({ language, setLanguage, children }) {
  const location = useLocation();
  const t = useMemo(() => getPublicText(language), [language]);
  const common = t.common;
  const portal = t.portal;

  useEffect(() => {
    if (!location.hash) return;
    const target = document.getElementById(location.hash.slice(1));
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [location.hash]);

  return (
    <div id="top" className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.14),_transparent_18%),linear-gradient(145deg,_#0f172a,_#1e3a8a_45%,_#312e81)] px-0 py-0 md:px-3 md:py-3">
      <div className="w-full min-h-screen bg-white/8 shadow-[0_40px_120px_rgba(15,23,42,0.22)] backdrop-blur">
        <UtilityNav portal={portal} />

        <header className="bg-white/92 px-5 py-4 md:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <Link to="/" className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-950 text-xl font-bold text-white shadow-lg shadow-indigo-950/40 ring-2 ring-amber-400/70">
                JS
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">{common.eyebrow}</p>
                <h1 className="text-2xl font-bold text-slate-950">{common.title}</h1>
                <p className="text-sm text-slate-600">{portal.subtitle}</p>
              </div>
            </Link>

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
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
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

        {children}

        <footer className="bg-indigo-950/70 px-5 py-4 text-center text-sm text-slate-200 md:px-8">
          <div className="inline-flex items-center gap-2">
            <ShieldCheck size={16} />
            <span>{portal.footer}</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

function ActionCard({ icon: Icon, title, text, action, to, accent = "bg-gradient-to-br from-indigo-600 to-indigo-800" }) {
  return (
    <article className="rounded-[28px] bg-white/10 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.24)] backdrop-blur">
      <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-lg ${accent}`}>
        <Icon size={20} />
      </div>
      <h3 className="text-xl font-bold text-white">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-slate-200">{text}</p>
      <Link
        to={to}
        className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
      >
        <Icon size={16} />
        {action}
      </Link>
    </article>
  );
}

function FlowNode({ icon: Icon, step, title, text }) {
  return (
    <article className="rounded-[24px] bg-white/10 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.18)]">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 via-blue-600 to-fuchsia-700 text-white shadow-lg">
          <Icon size={18} />
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-200">{step}</p>
          <h3 className="mt-1 text-lg font-semibold text-white">{title}</h3>
          <p className="mt-2 text-sm leading-7 text-slate-200">{text}</p>
        </div>
      </div>
    </article>
  );
}

function PublicPageSection({ title, intro, children }) {
  return (
    <main className="px-5 py-10 md:px-8 md:py-12 xl:px-12">
      <section className="rounded-[30px] bg-white/8 p-6 shadow-[0_24px_90px_rgba(15,23,42,0.22)] backdrop-blur md:p-8">
        <div className="max-w-6xl">
          <h2 className="text-4xl font-extrabold text-white">{title}</h2>
          {intro ? <p className="mt-4 text-sm leading-7 text-slate-200">{intro}</p> : null}
        </div>
        <div className="mt-8">{children}</div>
      </section>
    </main>
  );
}

export default function PublicPortal() {
  const [language, setLanguage] = usePortalLanguage();
  const t = useMemo(() => getPublicText(language), [language]);
  const portal = t.portal;

  return (
    <PublicShell language={language} setLanguage={setLanguage}>
      <main className="px-5 py-10 md:px-8 md:py-14">
        <section className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-200 backdrop-blur">
              <Waves size={15} />
              {portal.accessTag}
            </div>
            <h2 className="mt-6 text-5xl font-extrabold leading-[1.05] text-white md:text-6xl">{portal.heroTitle}</h2>
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
                className="inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                <LogIn size={17} />
                {portal.actionLogin}
              </Link>
              <Link
                to="/track"
                className="inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                <Search size={17} />
                {portal.actionTrack}
              </Link>
              <Link
                to="/about-us"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                <FileText size={17} />
                {portal.actionHowItWorks}
              </Link>
            </div>
          </div>

          <section className="rounded-[30px] bg-white/8 p-5 shadow-[0_24px_90px_rgba(15,23,42,0.22)] backdrop-blur md:p-6">
            <h3 className="text-2xl font-bold text-white">{portal.cardTitle}</h3>
            <p className="mt-3 text-sm leading-7 text-slate-200">{portal.cardText}</p>
            <div className="mt-6 grid gap-4 md:grid-cols-3 lg:grid-cols-1">
              <ActionCard icon={LogIn} title={portal.login} text={portal.loginText} action={portal.actionLogin} to="/login" />
              <ActionCard icon={UserPlus} title={portal.register} text={portal.registerText} action={portal.actionRegister} to="/register" accent="bg-gradient-to-br from-amber-500 to-orange-500" />
              <ActionCard icon={Search} title={portal.track} text={portal.trackText} action={portal.actionTrack} to="/track" accent="bg-gradient-to-br from-sky-500 to-indigo-600" />
            </div>
          </section>
        </section>

        <section className="mt-12 grid gap-4 md:grid-cols-3">
          {portal.aboutCards.map((card, index) => (
            <article
              key={card.title}
              className="rounded-[26px] bg-white/10 p-5 shadow-[0_18px_48px_rgba(15,23,42,0.22)] backdrop-blur"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-700 text-white shadow-lg">
                {index === 0 ? <UserPlus size={18} /> : index === 1 ? <MapPinned size={18} /> : <ShieldCheck size={18} />}
              </div>
              <h3 className="text-lg font-bold text-white">{card.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-200">{card.text}</p>
            </article>
          ))}
        </section>

        <section id="about" className="scroll-mt-28 mt-14 rounded-[30px] bg-white/8 p-6 shadow-[0_24px_90px_rgba(15,23,42,0.22)] backdrop-blur md:p-8">
          <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">{portal.utilityAbout}</p>
              <h3 className="mt-3 text-3xl font-extrabold text-white">{portal.aboutTitle}</h3>
              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-200">{portal.aboutText}</p>
              <Link to="/about-us" className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15">
                <Info size={16} />
                {portal.openPageLabel}
              </Link>
            </div>
            <div className="grid gap-4">
              {portal.aboutCards.map((card) => (
                <article key={card.title} className="rounded-[24px] bg-white/10 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.18)]">
                  <h4 className="text-lg font-semibold text-white">{card.title}</h4>
                  <p className="mt-3 text-sm leading-7 text-slate-200">{card.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="process" className="scroll-mt-28 mt-12 rounded-[30px] bg-white/8 p-6 shadow-[0_24px_90px_rgba(15,23,42,0.22)] backdrop-blur md:p-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="max-w-4xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">{portal.guideBadge}</p>
              <h3 className="mt-2 text-3xl font-extrabold text-white">{portal.guideTitle}</h3>
              <p className="mt-4 text-base leading-8 text-slate-200">{portal.guideText}</p>
            </div>
            <Link to="/process-flow" className="inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15">
              <MapPinned size={16} />
              {portal.openPageLabel}
            </Link>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {portal.guideSteps.map((step, index) => (
              <FlowNode key={step.title} icon={index % 2 === 0 ? UserPlus : FileText} step={String(index + 1).padStart(2, "0")} title={step.title} text={step.text} />
            ))}
          </div>
        </section>

        <section id="faq" className="scroll-mt-28 mt-12 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[30px] bg-white/8 p-6 shadow-[0_24px_90px_rgba(15,23,42,0.22)] backdrop-blur md:p-8">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div className="max-w-3xl">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">{portal.utilityFaq}</p>
                <h3 className="mt-2 text-3xl font-extrabold text-white">{portal.faqTitle}</h3>
                <p className="mt-4 text-base leading-8 text-slate-200">{portal.faqText}</p>
              </div>
              <Link to="/faq-help" className="inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15">
                <CircleHelp size={16} />
                {portal.openPageLabel}
              </Link>
            </div>
            <div className="mt-8 space-y-4">
              {portal.faqItems.map((item) => (
                <details key={item.question} className="rounded-[22px] bg-white/10 p-5 text-white shadow-[0_16px_40px_rgba(15,23,42,0.18)]">
                  <summary className="cursor-pointer list-none text-base font-semibold">{item.question}</summary>
                  <p className="mt-3 text-sm leading-7 text-slate-200">{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
          <aside id="contact" className="scroll-mt-28 rounded-[30px] bg-white/8 p-6 shadow-[0_24px_90px_rgba(15,23,42,0.22)] backdrop-blur md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">{portal.utilityContact}</p>
            <h3 className="mt-2 text-3xl font-extrabold text-white">{portal.contactTitle}</h3>
            <p className="mt-4 text-base leading-8 text-slate-200">{portal.contactText}</p>
            <div className="mt-8 grid gap-4">
              <div className="rounded-[24px] bg-white/10 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.18)]">
                <div className="flex items-center gap-3 text-white">
                  <Phone size={18} />
                  <h4 className="text-lg font-semibold">{portal.contactCallTitle}</h4>
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-200">{portal.contactCallText}</p>
              </div>
              <div className="rounded-[24px] bg-white/10 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.18)]">
                <div className="flex items-center gap-3 text-white">
                  <Mail size={18} />
                  <h4 className="text-lg font-semibold">{portal.contactSupportTitle}</h4>
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-200">{portal.contactSupportText}</p>
              </div>
              <Link to="/contact-us" className="inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15">
                <Phone size={16} />
                {portal.openPageLabel}
              </Link>
            </div>
          </aside>
        </section>

        <section id="site-map" className="scroll-mt-28 mt-12 rounded-[30px] bg-white/8 p-6 shadow-[0_24px_90px_rgba(15,23,42,0.22)] backdrop-blur md:p-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="max-w-4xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">{portal.utilitySiteMap}</p>
              <h3 className="mt-2 text-3xl font-extrabold text-white">{portal.siteMapTitle}</h3>
              <p className="mt-4 text-base leading-8 text-slate-200">{portal.siteMapText}</p>
            </div>
            <Link to="/site-map" className="inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15">
              <Map size={16} />
              {portal.openPageLabel}
            </Link>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <ActionCard icon={UserPlus} title={portal.register} text={portal.siteMapRegisterText} action={portal.actionRegister} to="/register" accent="bg-gradient-to-br from-amber-500 to-orange-500" />
            <ActionCard icon={LogIn} title={portal.login} text={portal.siteMapLoginText} action={portal.actionLogin} to="/login" />
            <ActionCard icon={Search} title={portal.track} text={portal.siteMapTrackText} action={portal.actionTrack} to="/track" accent="bg-gradient-to-br from-sky-500 to-indigo-600" />
          </div>
        </section>
      </main>
    </PublicShell>
  );
}

export function AboutUsPage() {
  const [language, setLanguage] = usePortalLanguage();
  const t = useMemo(() => getPublicText(language), [language]);
  const portal = t.portal;

  return (
    <PublicShell language={language} setLanguage={setLanguage}>
      <PublicPageSection title={portal.aboutTitle} intro={portal.aboutText}>
        <div className="grid gap-4 md:grid-cols-3">
          {portal.aboutCards.map((card) => (
            <article key={card.title} className="rounded-[24px] bg-white/10 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.18)]">
              <h3 className="text-lg font-semibold text-white">{card.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-200">{card.text}</p>
            </article>
          ))}
        </div>
      </PublicPageSection>
    </PublicShell>
  );
}

export function ContactUsPage() {
  const [language, setLanguage] = usePortalLanguage();
  const t = useMemo(() => getPublicText(language), [language]);
  const portal = t.portal;

  return (
    <PublicShell language={language} setLanguage={setLanguage}>
      <PublicPageSection title={portal.contactTitle} intro={portal.contactText}>
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-[24px] bg-white/10 p-6 shadow-[0_16px_40px_rgba(15,23,42,0.18)]">
            <div className="flex items-center gap-3 text-white">
              <Phone size={18} />
              <h3 className="text-lg font-semibold">{portal.contactCallTitle}</h3>
            </div>
            <p className="mt-3 text-sm leading-7 text-slate-200">{portal.contactCallText}</p>
            <div className="mt-6">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-300"
              >
                <UserPlus size={16} />
                {portal.actionRegister}
              </Link>
            </div>
          </div>

          <div className="rounded-[24px] bg-white/10 p-6 shadow-[0_16px_40px_rgba(15,23,42,0.18)]">
            <div className="flex items-center gap-3 text-white">
              <Mail size={18} />
              <h3 className="text-lg font-semibold">{portal.contactSupportTitle}</h3>
            </div>
            <p className="mt-3 text-sm leading-7 text-slate-200">{portal.contactSupportText}</p>
            <div className="mt-6">
              <Link
                to="/track"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                <Search size={16} />
                {portal.actionTrack}
              </Link>
            </div>
          </div>
        </div>
      </PublicPageSection>
    </PublicShell>
  );
}

export function FAQPage() {
  const [language, setLanguage] = usePortalLanguage();
  const t = useMemo(() => getPublicText(language), [language]);
  const portal = t.portal;

  return (
    <PublicShell language={language} setLanguage={setLanguage}>
      <PublicPageSection title={portal.faqTitle} intro={portal.faqText}>
        <div className="space-y-4">
          {portal.faqItems.map((item) => (
            <details key={item.question} className="rounded-[22px] bg-white/10 p-5 text-white shadow-[0_16px_40px_rgba(15,23,42,0.18)]">
              <summary className="cursor-pointer list-none text-base font-semibold">{item.question}</summary>
              <p className="mt-3 text-sm leading-7 text-slate-200">{item.answer}</p>
            </details>
          ))}
        </div>
      </PublicPageSection>
    </PublicShell>
  );
}

export function SitemapPage() {
  const [language, setLanguage] = usePortalLanguage();
  const t = useMemo(() => getPublicText(language), [language]);
  const portal = t.portal;
  const flowIcons = [UserPlus, FileText, MapPinned, ShieldCheck, Search, ArrowRight];
  const quickPageLinks = [
    { icon: Home, title: portal.utilityHome, text: portal.siteMapHomeText, to: "/" },
    { icon: UserPlus, title: portal.register, text: portal.siteMapRegisterText, to: "/register" },
    { icon: LogIn, title: portal.login, text: portal.siteMapLoginText, to: "/login" },
    { icon: Search, title: portal.track, text: portal.siteMapTrackText, to: "/track" },
    { icon: CircleHelp, title: portal.utilityFaq, text: portal.siteMapFaqText, to: "/faq-help" },
    { icon: Phone, title: portal.utilityContact, text: portal.siteMapContactText, to: "/contact-us" },
    { icon: Info, title: portal.utilityAbout, text: portal.siteMapAboutText, to: "/about-us" },
    { icon: MapPinned, title: portal.processTitle, text: portal.siteMapProcessText, to: "/process-flow" },
  ];

  return (
    <PublicShell language={language} setLanguage={setLanguage}>
      <PublicPageSection title={portal.siteMapTitle} intro={portal.siteMapText}>
        <div className="grid gap-4 md:grid-cols-3">
          <ActionCard icon={UserPlus} title={portal.register} text={portal.siteMapRegisterText} action={portal.actionRegister} to="/register" accent="bg-gradient-to-br from-amber-500 to-orange-500" />
          <ActionCard icon={LogIn} title={portal.login} text={portal.siteMapLoginText} action={portal.actionLogin} to="/login" />
          <ActionCard icon={Search} title={portal.track} text={portal.siteMapTrackText} action={portal.actionTrack} to="/track" accent="bg-gradient-to-br from-sky-500 to-indigo-600" />
        </div>

        <section className="portal-flow-shell mt-10">
          <div className="max-w-4xl">
            <h3 className="text-2xl font-bold text-white">{portal.siteMapPagesTitle}</h3>
            <p className="mt-3 text-sm leading-7 text-slate-200">{portal.siteMapPagesText}</p>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {quickPageLinks.map((item, index) => (
              <ActionCard
                key={item.title}
                icon={item.icon}
                title={item.title}
                text={item.text}
                action={portal.openPageLabel}
                to={item.to}
                accent={
                  index === 0
                    ? "bg-gradient-to-br from-indigo-600 to-indigo-800"
                    : index === 1
                      ? "bg-gradient-to-br from-fuchsia-600 to-rose-700"
                      : index === 2
                        ? "bg-gradient-to-br from-sky-500 to-indigo-600"
                        : index === 3
                          ? "bg-gradient-to-br from-violet-600 to-indigo-700"
                          : "bg-gradient-to-br from-amber-500 to-orange-500"
                }
              />
            ))}
          </div>
        </section>

        <section className="portal-flow-shell mt-10">
          <div className="max-w-4xl">
            <h3 className="text-2xl font-bold text-white">{portal.siteMapFlowTitle}</h3>
            <p className="mt-3 text-sm leading-7 text-slate-200">{portal.siteMapFlowText}</p>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {portal.siteMapFlowSteps.map((step, index) => {
              const Icon = flowIcons[index] ?? ArrowRight;
              return <FlowNode key={step.title} icon={Icon} step={String(index + 1).padStart(2, "0")} title={step.title} text={step.text} />;
            })}
          </div>
        </section>

        <section className="portal-flow-shell mt-10">
          <div className="max-w-4xl">
            <h3 className="text-2xl font-bold text-white">{portal.siteMapCitizenGuideTitle}</h3>
            <p className="mt-3 text-sm leading-7 text-slate-200">{portal.siteMapCitizenGuideText}</p>
          </div>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {portal.siteMapCitizenGuides.map((guide) => (
              <article key={guide.title} className="rounded-[24px] bg-white/10 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.18)]">
                <h4 className="text-lg font-semibold text-white">{guide.title}</h4>
                <p className="mt-3 text-sm leading-7 text-slate-200">{guide.text}</p>
                <ul className="mt-4 space-y-2">
                  {guide.steps.map((step) => (
                    <li key={step} className="flex items-start gap-3 text-sm leading-6 text-slate-200">
                      <span className="mt-2 inline-block h-2 w-2 rounded-full bg-amber-300" />
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>
      </PublicPageSection>
    </PublicShell>
  );
}

export function ProcessFlowPage() {
  const [language, setLanguage] = usePortalLanguage();
  const t = useMemo(() => getPublicText(language), [language]);
  const portal = t.portal;

  return (
    <PublicShell language={language} setLanguage={setLanguage}>
      <PublicPageSection title={portal.guideTitle} intro={portal.guideText}>
        <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="grid gap-4">
            {portal.guideSteps.map((step, index) => (
              <article key={step.title} className="rounded-[24px] border border-white/12 bg-white/10 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.18)]">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-700 text-sm font-bold text-white">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{step.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-200">{step.text}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <aside className="rounded-[24px] border border-white/12 bg-white/10 p-6 shadow-[0_16px_40px_rgba(15,23,42,0.18)]">
            <div className="flex items-center gap-3 text-white">
              <MapPinned size={20} />
              <h3 className="text-lg font-semibold">{portal.guideTipsTitle}</h3>
            </div>
            <p className="mt-2 text-sm text-slate-300">{portal.guideTipsText}</p>
            <ul className="mt-5 space-y-3">
              {portal.guideTips.map((tip) => (
                <li key={tip} className="flex items-start gap-3 text-sm leading-7 text-slate-200">
                  <span className="mt-1 inline-block h-2.5 w-2.5 rounded-full bg-amber-300" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </PublicPageSection>
    </PublicShell>
  );
}
