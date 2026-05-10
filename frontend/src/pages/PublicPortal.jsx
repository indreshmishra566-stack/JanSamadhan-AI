import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  CircleHelp,
  Clock3,
  FileText,
  Home,
  Info,
  Languages,
  LockKeyhole,
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
import citizenGuidanceArt from "../assets/citizen-grievance-hero.svg";

function usePortalLanguage() {
  const [language, setLanguageState] = useState(() => getPortalLanguage());

  useEffect(() => {
    setPortalLanguage(language);
  }, [language]);

  return [language, setLanguageState];
}

function UtilityLink({ to, icon: Icon, label, active }) {
  return (
    <Link to={to} className={`portal-utility-link ${active ? "active" : ""}`}>
      <Icon size={14} />
      <span>{label}</span>
    </Link>
  );
}

function UtilityNav({ portal }) {
  const location = useLocation();
  const isActive = (to) => location.pathname === to;

  return (
    <nav className="portal-utility-nav" aria-label={portal.utilityNavLabel}>
      <UtilityLink to="/" icon={Home} label={portal.utilityHome} active={isActive("/")} />
      <UtilityLink to="/contact-us" icon={Phone} label={portal.utilityContact} active={isActive("/contact-us")} />
      <UtilityLink to="/about-us" icon={Info} label={portal.utilityAbout} active={isActive("/about-us")} />
      <UtilityLink to="/faq-help" icon={CircleHelp} label={portal.utilityFaq} active={isActive("/faq-help")} />
      <UtilityLink to="/site-map" icon={Map} label={portal.utilitySiteMap} active={isActive("/site-map")} />
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
    <div id="top" className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.12),_transparent_18%),linear-gradient(145deg,_#070b18,_#101726_45%,_#1a2336)] px-2 py-2 md:px-3 md:py-3">
      <UtilityNav portal={portal} />
      <div className="portal-shell w-full min-h-[calc(100vh-1rem)] overflow-hidden rounded-[28px] border border-cyan-300/10 bg-white/6 shadow-[0_40px_120px_rgba(8,15,32,0.3)] backdrop-blur md:min-h-[calc(100vh-1.5rem)] md:rounded-[36px]">
        <header className="px-5 py-4 md:px-8 xl:px-10">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <Link
              to="/"
              className="portal-brand-card"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400 text-xl font-bold text-slate-950 shadow-lg shadow-cyan-900/30 ring-2 ring-cyan-200/40">
                JS
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">{common.eyebrow}</p>
                <h1 className="text-2xl font-bold text-white">{common.title}</h1>
                <p className="text-sm text-slate-400">{portal.subtitle}</p>
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
                className="inline-flex items-center gap-2 rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
              >
                <LogIn size={16} />
                {portal.login}
              </Link>
            </div>
          </div>
        </header>

        {children}

        <footer className="bg-[#0b1120]/90 px-5 py-4 text-center text-sm text-slate-200 md:px-8">
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
  const trustSignals = [
    { icon: ShieldCheck, label: "Protected citizen sign-in" },
    { icon: Clock3, label: "Ticket status visibility" },
    { icon: Building2, label: "Department routing ready" },
    { icon: LockKeyhole, label: "Internal access stays gated" },
  ];

  return (
    <PublicShell language={language} setLanguage={setLanguage}>
      <main className="portal-public-main">
        <section className="portal-public-hero">
          <div className="portal-public-copy">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300 backdrop-blur shadow-[0_10px_24px_rgba(34,211,238,0.12)]">
              <Waves size={15} />
              {portal.accessTag}
            </div>
            <h2 className="mt-5 text-5xl font-extrabold leading-[1.04] text-white md:text-6xl">{portal.heroTitle}</h2>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-200">{portal.heroText}</p>
            <div className="portal-trust-strip">
              {trustSignals.map(({ icon: Icon, label }) => (
                <span key={label}>
                  <Icon size={14} />
                  {label}
                </span>
              ))}
            </div>
            <figure className="portal-hero-visual">
              <img
                src={citizenGuidanceArt}
                alt="Citizen using a phone to submit a grievance with location and department routing guidance"
                className="h-full w-full object-contain object-center drop-shadow-[0_24px_54px_rgba(8,15,32,0.32)]"
              />
              <figcaption className="portal-hero-caption">
                <span>Citizen-friendly complaint filing and smart routing</span>
                <span className="text-cyan-300">Local project illustration</span>
              </figcaption>
            </figure>
            <div className="portal-action-row">
              <Link
                to="/register"
                className="portal-action-primary"
              >
                <UserPlus size={17} />
                {portal.actionRegister}
              </Link>
              <Link
                to="/login"
                className="portal-action-secondary"
              >
                <LogIn size={17} />
                {portal.actionLogin}
              </Link>
              <Link
                to="/track"
                className="portal-action-secondary"
              >
                <Search size={17} />
                {portal.actionTrack}
              </Link>
              <Link
                to="/about-us"
                className="portal-action-tertiary"
              >
                <FileText size={17} />
                {portal.actionHowItWorks}
              </Link>
            </div>
          </div>

          <section className="portal-guide-panel">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300 backdrop-blur">
              <ShieldCheck size={14} />
              {portal.guideBadge}
            </div>
            <h3 className="mt-4 text-2xl font-bold text-white">{portal.guideTitle}</h3>
            <p className="mt-3 text-sm leading-7 text-slate-200">{portal.guideText}</p>

            <div className="mt-6 space-y-3">
              {portal.guideSteps.map((step, index) => (
                <article
                  key={step.title}
                  className="portal-guide-step"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-sky-500 text-sm font-bold text-slate-950 shadow-lg">
                      {String(index + 1).padStart(2, "0")}
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-white">{step.title}</h4>
                      <p className="mt-2 text-sm leading-6 text-slate-200">{step.text}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <article className="portal-guide-tips">
              <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">
                {portal.guideTipsTitle}
              </h4>
              <p className="mt-2 text-sm leading-6 text-slate-300">{portal.guideTipsText}</p>
              <ul className="mt-3 space-y-2">
                {portal.guideTips.map((tip) => (
                  <li key={tip} className="flex items-start gap-3 text-sm leading-6 text-slate-200">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-cyan-300" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </article>
          </section>
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
                className="inline-flex items-center gap-2 rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
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
          <ActionCard icon={UserPlus} title={portal.register} text={portal.siteMapRegisterText} action={portal.actionRegister} to="/register" accent="bg-gradient-to-br from-cyan-400 to-sky-500" />
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
                      ? "bg-gradient-to-br from-cyan-500 to-blue-600"
                      : index === 2
                        ? "bg-gradient-to-br from-sky-500 to-indigo-600"
                        : index === 3
                          ? "bg-gradient-to-br from-indigo-500 to-slate-700"
                          : "bg-gradient-to-br from-cyan-400 to-sky-500"
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
                      <span className="mt-2 inline-block h-2 w-2 rounded-full bg-cyan-300" />
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
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 text-sm font-bold text-slate-950">
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
                  <span className="mt-1 inline-block h-2.5 w-2.5 rounded-full bg-cyan-300" />
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
