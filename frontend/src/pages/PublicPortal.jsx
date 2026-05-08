import { Link } from "react-router-dom";
import {
  Activity,
  BarChart3,
  ChevronDown,
  ClipboardList,
  FileCheck2,
  FileText,
  Home,
  Languages,
  LogIn,
  MailCheck,
  MapPinned,
  MessageSquareText,
  MonitorCheck,
  Network,
  Search,
  Send,
  ShieldCheck,
  Smartphone,
  Star,
  UserPlus,
  Users,
} from "lucide-react";

const homeLinks = [
  { label: "Contact Us", to: "#contact" },
  { label: "About Us", to: "#about" },
  { label: "FAQ/Help", to: "#faq" },
  { label: "Department Officers", to: "#officers" },
  { label: "Officer Branches", to: "#officers" },
  { label: "Redressal Process Flow", to: "/process-flow" },
];

const citizenSteps = [
  { icon: Users, title: "Citizens", text: "Submit public grievances through portal or mobile app." },
  { icon: MonitorCheck, title: "Jan Samadhan Portal / App", text: "Single entry point for registration, login, grievance, tracking, and reminders." },
  { icon: ClipboardList, title: "Complaint Module", text: "Lodge grievance with title, description, GPS location, attachment, and AI classification." },
  { icon: UserPlus, title: "User Module", text: "Citizen registration, secure login, profile context, and public ticket lookup." },
  { icon: Search, title: "Tracking Module", text: "Track ticket status, current level, SLA deadline, and forwarding trail." },
  { icon: MapPinned, title: "Ministry / State / Department Mapping", text: "AI-assisted routing maps grievances to the right department and officer level." },
  { icon: ShieldCheck, title: "Grievance Officer Dashboard", text: "Officers view assigned cases, priority, SLA breach, category, and history." },
  { icon: Send, title: "Action / Forward / Resolve", text: "Officers update status, forward to field desks, escalate, and upload proof." },
  { icon: BarChart3, title: "Monitoring & Analytics System", text: "Admin and hierarchy dashboards monitor workload, progress, risk, and resolution." },
  { icon: Star, title: "Citizen Feedback / Appeal", text: "Resolved grievances collect citizen rating and comments for closure quality." },
];

const moduleCards = [
  {
    icon: ClipboardList,
    title: "Complaint Module",
    text: "Lodge grievance, attach proof, add location, and let Jan Samadhan AI classify the issue.",
    action: "Lodge Grievance",
    to: "/citizen/dashboard",
  },
  {
    icon: UserPlus,
    title: "User Module",
    text: "Register, sign in, recover access, and keep citizen/officer journeys separated by role.",
    action: "User Registration",
    to: "/register",
  },
  {
    icon: Search,
    title: "Tracking Module",
    text: "View status, SLA, department mapping, forwarding records, and resolution progress.",
    action: "View Status",
    to: "/track",
  },
];

function PortalHeader() {
  return (
    <header className="portal-header">
      <div className="portal-brandbar">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-slate-500">Trusted digital public grievance system</p>
          <div className="flex items-center gap-3">
            <div className="portal-emblem">JS</div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight">Jan Samadhan AI</h1>
              <p className="text-xs text-slate-500">AI-assisted citizen grievance redressal portal</p>
            </div>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 text-xs text-slate-600">
          <Languages size={15} />
          <span>Language</span>
          <select className="portal-select" aria-label="Language">
            <option>English</option>
            <option>Hindi</option>
          </select>
          <Link to="/login" className="portal-signin">
            <LogIn size={15} /> Sign In
          </Link>
        </div>
      </div>
      <nav className="portal-nav" aria-label="Portal navigation">
        <Link to="/track"><Search size={14} /> View Status</Link>
        <a href="#officers"><Users size={14} /> Officers</a>
        <Link to="/process-flow"><Network size={14} /> Redress Process</Link>
        <Link to="/citizen/dashboard"><FileText size={14} /> Grievance</Link>
        <Link to="/officer/dashboard"><ShieldCheck size={14} /> Officer Dashboard</Link>
        <a href="#mobile"><Smartphone size={14} /> Mobile App</a>
        <Link to="/sitemap" className="ml-auto hidden lg:inline-flex"><Network size={14} /> Sitemap</Link>
      </nav>
    </header>
  );
}

function PortalFooter() {
  return (
    <footer className="portal-footer">
      <div className="flex justify-center gap-3 py-3 text-white">
        <span className="portal-social">f</span>
        <span className="portal-social">x</span>
        <span className="portal-social">yt</span>
      </div>
      <p>Jan Samadhan AI routes grievances to the right department, officer desk, and reporting branch.</p>
      <p className="text-[11px] opacity-80">Compatible with modern browsers. Version 1.0.0 | Updated on 07-05-2026</p>
    </footer>
  );
}

function FlowNode({ icon: Icon, title, text }) {
  return (
    <div className="portal-flow-node">
      <div className="portal-flow-icon"><Icon size={18} /></div>
      <div>
        <h3>{title}</h3>
        <p>{text}</p>
      </div>
    </div>
  );
}

export function ProcessFlowPage() {
  return (
    <div className="min-h-screen bg-slate-100">
      <PortalHeader />
      <main className="portal-page">
        <section className="portal-panel">
          <p className="text-center text-sm font-semibold text-slate-700 mb-6">Redress Process Flow</p>
          <h2 className="portal-title">JAN SAMADHAN PROCESS FLOW</h2>
          <div className="portal-process-canvas">
            <div className="process-citizen">
              <Users size={32} />
              <span>Citizen</span>
            </div>
            <div className="process-box process-login">One Time Registration & Login</div>
            <div className="process-box process-register">Registration with Department / Organisation & Grievance Unique ID</div>
            <div className="process-box process-transfer">Transmission of Grievance to PGO / Field Office</div>
            <div className="process-box process-portal">Jan Samadhan Web Portal, Mobile App, Help Desk</div>
            <div className="process-box process-atr"><MailCheck size={22} /> ATR to citizen through SMS / Email</div>
            <div className="process-pill process-resolution">Resolution</div>
            <div className="process-time">Resolution Time<br /><strong>21 days</strong></div>
            <div className="process-pill process-feedback">Feedback</div>
            <div className="process-diamond">Satisfied?</div>
            <div className="process-box process-closure">Closure</div>
            <div className="process-box process-appeal">Department Appellate Authority / Senior Review Desk</div>
            <div className="process-pill process-final">Final Resolution</div>
            <svg className="process-lines" viewBox="0 0 960 480" aria-hidden="true">
              <defs>
                <marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                  <path d="M0,0 L8,4 L0,8 Z" fill="#111827" />
                </marker>
              </defs>
              <path d="M170 70 H330" markerEnd="url(#arrow)" />
              <path d="M470 70 H560" markerEnd="url(#arrow)" />
              <path d="M740 70 H835 V165" markerEnd="url(#arrow)" />
              <path d="M170 165 H835" markerEnd="url(#arrow)" />
              <path d="M835 215 V275 H625" markerEnd="url(#arrow)" />
              <path d="M555 275 H420" markerEnd="url(#arrow)" />
              <path d="M330 275 H205" markerEnd="url(#arrow)" />
              <path d="M160 305 V360 H290" markerEnd="url(#arrow)" />
              <path d="M390 360 H520" markerEnd="url(#arrow)" />
              <path d="M575 350 H660" markerEnd="url(#arrow)" />
              <path d="M545 386 V430 H390" markerEnd="url(#arrow)" />
              <path d="M300 430 H175" markerEnd="url(#arrow)" />
              <path d="M135 420 V80" markerEnd="url(#arrow)" />
            </svg>
          </div>
        </section>
      </main>
      <PortalFooter />
    </div>
  );
}

export function SitemapPage() {
  return (
    <div className="min-h-screen bg-slate-100">
      <PortalHeader />
      <main className="portal-page">
        <section className="portal-panel overflow-x-auto">
          <h2 className="text-xl font-semibold text-slate-900 mb-8">Sitemap</h2>
          <div className="sitemap-tree min-w-[820px]">
            <div className="sitemap-level">
              <Link to="/" className="sitemap-box sitemap-home"><Home size={14} /> Home page</Link>
            </div>
            <div className="sitemap-branches four">
              <div className="sitemap-column">
                <div className="sitemap-box">#Home</div>
                {homeLinks.map((item) => (
                  item.to.startsWith("/") ? (
                    <Link key={item.label} to={item.to} className="sitemap-box small">{item.label}</Link>
                  ) : (
                    <a key={item.label} href={item.to} className="sitemap-box small">{item.label}</a>
                  )
                ))}
                <ChevronDown className="mx-auto text-slate-600" size={16} />
              </div>
              <div className="sitemap-column">
                <div className="sitemap-box">#Appeal</div>
                <Link to="/track" className="sitemap-box small">View Status</Link>
              </div>
              <div className="sitemap-column">
                <div className="sitemap-box">#Grievance</div>
                <Link to="/track" className="sitemap-box small">View Status</Link>
              </div>
              <div className="sitemap-column">
                <Link to="/track" className="sitemap-box">Send Reminder</Link>
              </div>
            </div>
            <div className="sitemap-branches login-row">
              <div className="sitemap-column">
                <Link to="/login" className="sitemap-box small">User Login</Link>
                <Link to="/citizen/dashboard" className="sitemap-box small">Lodge Grievance</Link>
                <Link to="/track" className="sitemap-box small">View Status</Link>
                <Link to="/citizen/dashboard" className="sitemap-box small">Rate Grievance</Link>
              </div>
              <Link to="/register" className="sitemap-box small">User Registration</Link>
              <Link to="/login" className="sitemap-box small">Forgot Password</Link>
              <Link to="/login" className="sitemap-box small">Forgot Username</Link>
            </div>
          </div>
        </section>
      </main>
      <PortalFooter />
    </div>
  );
}

export default function PublicPortal() {
  return (
    <div className="min-h-screen bg-slate-100">
      <PortalHeader />
      <main>
        <section className="portal-hero">
          <div className="portal-hero-copy">
            <p className="portal-kicker">Citizens {"->"} Jan Samadhan Portal / App {"->"} Department Redressal</p>
            <h2>Jan Samadhan AI</h2>
            <p>
              A modern grievance system for citizens, departments, and officers:
              AI classification, officer routing, forwarding, monitoring, feedback, and appeal-ready tracking.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/register" className="portal-primary"><UserPlus size={17} /> Register Citizen</Link>
              <Link to="/track" className="portal-secondary"><Search size={17} /> View Status</Link>
              <Link to="/login" className="portal-secondary"><LogIn size={17} /> Sign In</Link>
            </div>
          </div>
          <div className="portal-hero-board" aria-label="Jan Samadhan system diagram">
            {citizenSteps.map((step, index) => (
              <div key={step.title} className="portal-mini-step">
                <step.icon size={18} />
                <span>{step.title}</span>
                {index < citizenSteps.length - 1 && <i />}
              </div>
            ))}
          </div>
        </section>

        <section className="portal-page" id="modules">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {moduleCards.map((card) => (
              <article key={card.title} className="portal-module">
                <card.icon size={24} />
                <h3>{card.title}</h3>
                <p>{card.text}</p>
                <Link to={card.to}>{card.action}</Link>
              </article>
            ))}
          </div>
        </section>

        <section className="portal-page">
          <div className="portal-panel">
            <h2 className="portal-section-title">End-to-End System Flow</h2>
            <div className="portal-flow-grid">
              {citizenSteps.map((step) => <FlowNode key={step.title} {...step} />)}
            </div>
          </div>
        </section>

        <section className="portal-page grid grid-cols-1 lg:grid-cols-3 gap-4" id="about">
          <div className="portal-info" id="officers">
            <ShieldCheck size={22} />
            <h3>Officers</h3>
            <p>Officer dashboards support department cases, action notes, proof of resolution, forwarding, and escalation.</p>
            <Link to="/officer/dashboard">Open officer dashboard</Link>
          </div>
          <div className="portal-info" id="faq">
            <MessageSquareText size={22} />
            <h3>FAQ / Help</h3>
            <p>Citizens can register, lodge a grievance, track status by ticket ID, and give feedback after resolution.</p>
            <Link to="/sitemap">View sitemap</Link>
          </div>
          <div className="portal-info" id="mobile">
            <Activity size={22} />
            <h3>Monitoring & Analytics</h3>
            <p>Admin and hierarchy roles can monitor workload, SLA risk, escalation, and resolution trends.</p>
            <Link to="/admin/dashboard">Open analytics</Link>
          </div>
        </section>

        <section className="portal-page" id="contact">
          <div className="portal-contact">
            <FileCheck2 size={22} />
            <div>
              <h3>Citizen Feedback / Appeal</h3>
              <p>Once an officer resolves a case, the citizen dashboard keeps your feedback and rating feature available for closure quality.</p>
            </div>
            <Link to="/citizen/dashboard">Rate Grievance</Link>
          </div>
        </section>
      </main>
      <PortalFooter />
    </div>
  );
}
