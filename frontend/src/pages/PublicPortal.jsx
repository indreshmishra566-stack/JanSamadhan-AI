import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Languages, LogIn, Search, ShieldCheck, UserPlus, Waves } from "lucide-react";

const PORTAL_LANGUAGE_KEY = "portal_language";

const copy = {
  en: {
    eyebrow: "Trusted digital public grievance system",
    title: "Jan Samadhan AI",
    subtitle: "AI-assisted water grievance redressal portal",
    language: "Language",
    heroTitle: "Public Water Grievance Access",
    heroText:
      "A clean public entry for citizens: register, sign in, or track an existing grievance ticket.",
    cardTitle: "Available public actions",
    cardText:
      "The public frontend is intentionally limited to only the working services. Internal officer and admin workflows stay behind sign-in.",
    login: "Sign In",
    loginText: "Access citizen, officer, or admin workspace using your account.",
    register: "Register",
    registerText: "Create a citizen account and start lodging grievances.",
    track: "Track",
    trackText: "Search an existing ticket without logging in.",
    actionLogin: "Open Login",
    actionRegister: "Open Registration",
    actionTrack: "Track Complaint",
    footer: "Citizen-facing entry only. Internal workflows remain protected after sign-in.",
  },
  hi: {
    eyebrow: "विश्वसनीय डिजिटल जन शिकायत प्रणाली",
    title: "जन समाधान एआई",
    subtitle: "एआई-सहायित जल शिकायत निवारण पोर्टल",
    language: "भाषा",
    heroTitle: "सार्वजनिक जल शिकायत प्रवेश",
    heroText:
      "नागरिकों के लिए सरल सार्वजनिक प्रवेश: पंजीकरण करें, साइन इन करें, या मौजूदा शिकायत टिकट ट्रैक करें।",
    cardTitle: "उपलब्ध सार्वजनिक सेवाएँ",
    cardText:
      "सार्वजनिक फ्रंटएंड को केवल कार्यशील सेवाओं तक सीमित रखा गया है। आंतरिक अधिकारी और एडमिन वर्कफ़्लो साइन-इन के बाद सुरक्षित रहते हैं।",
    login: "साइन इन",
    loginText: "अपने खाते से नागरिक, अधिकारी या एडमिन कार्यक्षेत्र में प्रवेश करें।",
    register: "पंजीकरण",
    registerText: "नागरिक खाता बनाएँ और शिकायत दर्ज करना शुरू करें।",
    track: "ट्रैक करें",
    trackText: "बिना लॉगिन मौजूदा टिकट खोजें।",
    actionLogin: "लॉगिन खोलें",
    actionRegister: "पंजीकरण खोलें",
    actionTrack: "शिकायत ट्रैक करें",
    footer: "केवल नागरिक प्रवेश। आंतरिक वर्कफ़्लो साइन-इन के बाद सुरक्षित हैं।",
  },
};

function usePortalLanguage() {
  const [language, setLanguage] = useState(() => {
    if (typeof window === "undefined") return "en";
    return localStorage.getItem(PORTAL_LANGUAGE_KEY) || "en";
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(PORTAL_LANGUAGE_KEY, language);
    document.documentElement.lang = language === "hi" ? "hi" : "en";
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
  const t = useMemo(() => copy[language] || copy.en, [language]);

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
                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">{t.eyebrow}</p>
                <h1 className="text-2xl font-bold text-slate-950">{t.title}</h1>
                <p className="text-sm text-slate-600">{t.subtitle}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm">
                <Languages size={16} />
                <span>{t.language}</span>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="bg-transparent pr-1 outline-none"
                  aria-label={t.language}
                >
                  <option value="en">English</option>
                  <option value="hi">Hindi</option>
                </select>
              </label>

              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-300"
              >
                <LogIn size={16} />
                {t.login}
              </Link>
            </div>
          </div>
        </header>

        <main className="px-5 py-10 md:px-8 md:py-14">
          <section className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-200 backdrop-blur">
                <Waves size={15} />
                Water Department Access
              </div>
              <h2 className="mt-6 text-5xl font-extrabold leading-[1.05] text-white md:text-6xl">
                {t.heroTitle}
              </h2>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-200">{t.heroText}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-300"
                >
                  <UserPlus size={17} />
                  {t.actionRegister}
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
                >
                  <LogIn size={17} />
                  {t.actionLogin}
                </Link>
                <Link
                  to="/track"
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
                >
                  <Search size={17} />
                  {t.actionTrack}
                </Link>
              </div>
            </div>

            <section className="rounded-[30px] border border-white/12 bg-white/8 p-5 shadow-[0_24px_90px_rgba(15,23,42,0.22)] backdrop-blur md:p-6">
              <h3 className="text-2xl font-bold text-white">{t.cardTitle}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-200">{t.cardText}</p>
              <div className="mt-6 grid gap-4 md:grid-cols-3 lg:grid-cols-1">
                <ActionCard
                  icon={LogIn}
                  title={t.login}
                  text={t.loginText}
                  action={t.actionLogin}
                  to="/login"
                  accent="bg-gradient-to-br from-indigo-600 to-indigo-800"
                />
                <ActionCard
                  icon={UserPlus}
                  title={t.register}
                  text={t.registerText}
                  action={t.actionRegister}
                  to="/register"
                  accent="bg-gradient-to-br from-amber-500 to-orange-500"
                />
                <ActionCard
                  icon={Search}
                  title={t.track}
                  text={t.trackText}
                  action={t.actionTrack}
                  to="/track"
                  accent="bg-gradient-to-br from-sky-500 to-indigo-600"
                />
              </div>
            </section>
          </section>
        </main>

        <footer className="border-t border-white/10 bg-indigo-950/70 px-5 py-4 text-center text-sm text-slate-200 md:px-8">
          <div className="inline-flex items-center gap-2">
            <ShieldCheck size={16} />
            <span>{t.footer}</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
