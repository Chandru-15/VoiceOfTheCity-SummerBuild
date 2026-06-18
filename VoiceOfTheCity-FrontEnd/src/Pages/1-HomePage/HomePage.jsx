import { Link } from "react-router";
import Layout from "../../components/Layout.jsx";
import "./HomePage.css";

/* ---------- inline icons (no external icon library required) ---------- */

const IconCamera = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
    <path d="M4 8.5C4 7.67 4.67 7 5.5 7H8l1.2-1.8c.2-.3.5-.45.85-.45h3.9c.35 0 .65.15.85.45L16 7h2.5c.83 0 1.5.67 1.5 1.5v9c0 .83-.67 1.5-1.5 1.5h-13C4.67 19 4 18.33 4 17.5v-9Z" />
    <circle cx="12" cy="12.5" r="3.2" />
  </svg>
);

const IconSparkle = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
    <path d="M12 4v3M12 17v3M4 12h3M17 12h3M6.3 6.3l2 2M15.7 15.7l2 2M17.7 6.3l-2 2M8.3 15.7l-2 2" />
    <circle cx="12" cy="12" r="2.2" />
  </svg>
);

const IconBuilding = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
    <rect x="5" y="4" width="14" height="16" rx="1.2" />
    <path d="M9 8h1.4M13.6 8H15M9 11.5h1.4M13.6 11.5H15M9 15h1.4M13.6 15H15" />
    <path d="M10 20v-3h4v3" />
  </svg>
);

const IconUsers = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
    <circle cx="9" cy="9" r="2.6" />
    <path d="M3.5 18c0-2.8 2.5-4.6 5.5-4.6s5.5 1.8 5.5 4.6" />
    <circle cx="17" cy="9.5" r="2.1" />
    <path d="M14.8 13.6c2.5.2 4.7 1.9 4.7 4.4" />
  </svg>
);

const IconCheck = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
    <circle cx="12" cy="12" r="8.3" />
    <path d="M8.5 12.3l2.3 2.3 4.7-5" />
  </svg>
);

const IconShield = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
    <path d="M12 3.5l7 2.5v5.4c0 4.6-3 7.7-7 9.1-4-1.4-7-4.5-7-9.1V6l7-2.5Z" />
    <path d="M9.3 12.1l1.9 1.9 3.6-3.9" />
  </svg>
);

const IconBolt = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
    <path d="M12.8 3 6 13h4.6L10 21l6.8-10h-4.6L12.8 3Z" />
  </svg>
);

const IconArrow = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

/* ---------------------------------- data ---------------------------------- */

const STATS = [
  { value: "18K+", label: "Active citizens" },
  { value: "64,200", label: "Issues reported" },
  { value: "92%", label: "Resolution rate" },
  { value: "<36h", label: "Avg. response" },
];

const MAP_PINS = [
  { label: "Pothole", top: "34%", left: "24%", tone: "cyan", size: "lg" },
  { label: "Streetlight", top: "20%", left: "44%", tone: "green", size: "sm" },
  { label: "Flooding", top: "52%", left: "63%", tone: "cyan", size: "sm" },
  { label: "Faulty signage", top: "24%", left: "78%", tone: "green", size: "sm" },
  { label: "Litter", top: "70%", left: "32%", tone: "cyan", size: "sm" },
  { label: "Graffiti", top: "46%", left: "12%", tone: "pink", size: "sm" },
];

const TIMELINE = [
  {
    time: "0s",
    title: "Report submitted",
    body: "Photo and location captured.",
    icon: IconCamera,
  },
  {
    time: "8s",
    title: "AI analysed",
    body: "Reka AI checks category, severity, and duplicates.",
    icon: IconSparkle,
  },
  {
    time: "30s",
    title: "Agency notified",
    body: "Routed to the department responsible.",
    icon: IconBuilding,
  },
  {
    time: "4h",
    title: "Crew dispatched",
    body: "Field team confirmed on site.",
    icon: IconUsers,
  },
  {
    time: "Done",
    title: "Resolved",
    body: "You're notified the moment it's fixed.",
    icon: IconCheck,
  },
];

const AGENCIES = ["LTA", "NEA", "SCDF", "Town Council", "PUB", "HDB", "NParks", "SPF"];

const HomePage = () => {
  return (
    <Layout>
      <div className="home-page">
        {/* ---------------- hero ---------------- */}
        <section className="home-hero">
          <div className="home-hero-inner">
            <div className="home-hero-content">
              <span className="home-eyebrow">
                <span className="home-eyebrow-dot" />
                Community-powered urban intelligence
              </span>
              <h1 className="home-heading">
                See a problem.
                <br />
                Help fix <span className="home-heading-accent">your city.</span>
              </h1>
              <p className="home-lead">
                Take a photo, let AI identify the issue, match it against nearby reports, and route
                it straight to the agency that can fix it — LTA, NEA, SCDF, your Town Council, and
                more.
              </p>
              <div className="home-actions">
                <Link to="/submit" className="home-btn home-btn--primary">
                  <IconCamera className="home-btn-icon" />
                  Report an issue
                </Link>
                <a href="#how-it-works" className="home-btn home-btn--secondary">
                  See how it works
                  <IconArrow className="home-btn-icon" />
                </a>
              </div>
              <div className="home-trust">
                <span>
                  <IconShield className="home-trust-icon" /> End-to-end encrypted
                </span>
                <span>
                  <IconBolt className="home-trust-icon" /> 30-second reports
                </span>
                <span>
                  <IconUsers className="home-trust-icon" /> 18K+ citizens
                </span>
              </div>
            </div>

            <div className="home-hero-visual" aria-hidden="true">
              <div className="home-float-card home-float-card--top">
                <span className="home-float-label">
                  <IconSparkle className="home-float-icon" /> AI Detection
                </span>
                <strong>9 similar reports nearby</strong>
                <span className="home-avatar-row">
                  <i className="home-avatar home-avatar--cyan" />
                  <i className="home-avatar home-avatar--green" />
                  <i className="home-avatar home-avatar--purple" />
                  <small>+6</small>
                </span>
              </div>

              <div className="home-phone">
                <div className="home-phone-statusbar">
                  <span>9:41</span>
                  <span className="home-phone-live">● Live</span>
                </div>
                <div className="home-phone-photo">
                  <span className="home-phone-tag">POTHOLE · 96%</span>
                  <div className="home-phone-photo-frame" />
                </div>
                <div className="home-phone-result">
                  <span className="home-phone-result-label">
                    <IconSparkle className="home-float-icon" /> AI analysis complete
                  </span>
                  <strong>Road surface damage</strong>
                  <small>Clementi Ave 2 · matched to 9 reports</small>
                  <div className="home-phone-result-row">
                    <span className="home-pill">LTA</span>
                    <span className="home-status home-status--ok">Routed ✓</span>
                  </div>
                </div>
                <div className="home-phone-submit">Submit report</div>
              </div>

              <div className="home-float-card home-float-card--bottom">
                <span className="home-float-label">
                  <IconBuilding className="home-float-icon" /> Routed
                  <small className="home-float-time">2 min ago</small>
                </span>
                <strong>LTA · Roads Branch</strong>
                <small>Crew dispatched · ETA 4h</small>
                <div className="home-progress">
                  <i style={{ width: "38%" }} />
                </div>
              </div>
            </div>
          </div>

          <div className="home-stats">
            {STATS.map((stat) => (
              <div key={stat.label} className="home-stat">
                <span className="home-stat-value">{stat.value}</span>
                <span className="home-stat-label">{stat.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ---------------- progress timeline ---------------- */}
        <section className="home-timeline-section" id="how-it-works" aria-label="How it works">
          <span className="home-section-eyebrow home-section-eyebrow--center">
            Progress tracking
          </span>
          <h2 className="home-section-title home-section-title--center">
            You'll know exactly <span className="home-heading-accent">what's happening.</span>
          </h2>
          <p className="home-section-lead">
            Real-time updates from submission to resolution — no more reports disappearing into a
            black box.
          </p>

          <ol className="home-timeline">
            {TIMELINE.map((step) => {
              const Icon = step.icon;
              return (
                <li key={step.title} className="home-timeline-step">
                  <span className="home-timeline-icon">
                    <Icon />
                  </span>
                  <span className="home-timeline-time">{step.time}</span>
                  <strong>{step.title}</strong>
                  <p>{step.body}</p>
                </li>
              );
            })}
          </ol>
        </section>

        {/* ---------------- agency routing ---------------- */}
        <section className="home-routing-section" aria-label="Agency routing">
          <div className="home-routing-content">
            <span className="home-section-eyebrow">Agency routing</span>
            <h2 className="home-section-title">
              The right team. <span className="home-heading-accent">The first time.</span>
            </h2>
            <p className="home-section-lead home-section-lead--left">
              We've mapped jurisdictional boundaries so every report reaches the department that can
              actually fix it. Cross-agency handoffs happen automatically — and stay visible to you.
            </p>
            <Link to="/viewreports" className="home-link-arrow">
              See reports by agency <IconArrow className="home-btn-icon" />
            </Link>
          </div>

          <div className="home-routing-grid">
            {AGENCIES.map((agency) => (
              <div key={agency} className="home-routing-card">
                <span className="home-routing-icon">
                  <IconBuilding />
                </span>
                <strong>{agency}</strong>
                <span className="home-status home-status--ok">Connected</span>
              </div>
            ))}
          </div>
        </section>

        {/* ---------------- final cta ---------------- */}
        <section className="home-cta">
          <h2 className="home-cta-title">Ready to help your neighbourhood?</h2>
          <p className="home-cta-lead">
            Every report helps agencies respond faster. Browse what others have flagged or submit
            your own.
          </p>
          <div className="home-actions home-actions--center">
            <Link to="/submit" className="home-btn home-btn--primary">
              <IconCamera className="home-btn-icon" />
              Start a report
            </Link>
            <Link to="/viewreports" className="home-btn home-btn--secondary">
              View Community Reports
              <IconArrow className="home-btn-icon" />
            </Link>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default HomePage;
