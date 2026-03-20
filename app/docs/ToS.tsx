"use client";

import { useState, useEffect, useRef } from "react";

const sections = [
  {
    id: "acceptance",
    num: "01",
    title: "Acceptance of Terms",
    content: (
      <>
        <p>
          These Terms of Service ("Terms") constitute a legally binding
          agreement between you ("User", "you") and EnLive ("we", "us", "our"),
          governing your access to and use of the EnLive platform, including all
          associated websites, QR-code rating flows, leaderboards, dashboards,
          and any related services (collectively, the "Platform").
        </p>
        <p>
          By using the Platform in any way — including submitting a rating via
          QR code, viewing a leaderboard, or creating a venue or artist account
          — you confirm that you have read, understood, and agree to these Terms
          in full.
        </p>
        <p>
          If you are using the Platform on behalf of a venue, artist, or other
          organisation, you represent that you have authority to bind that
          entity to these Terms.
        </p>
      </>
    ),
  },
  {
    id: "about",
    num: "02",
    title: "About EnLive",
    content: (
      <>
        <p>
          EnLive is a location-based rating platform for live music events. It
          enables audience members to submit real-time ratings of venues and
          artists via QR codes, which are aggregated into publicly visible
          leaderboards and provided to registered venues and artists via a
          dashboard.
        </p>
        <p>
          EnLive does not sell tickets, manage bookings, or represent any artist
          or venue commercially. We are a data aggregation and discovery
          platform only.
        </p>
        <p>The Platform is intended for use by:</p>
        <ul>
          <li>
            Members of the public attending live music events (anonymous rating
            users)
          </li>
          <li>
            Registered venues and artists who access performance data through an
            account dashboard
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "use",
    num: "03",
    title: "Use of the Platform",
    content: (
      <>
        <h3>Permitted Use</h3>
        <p>
          You may use the Platform for its intended purpose: submitting genuine
          ratings of live music events you have personally attended, and
          accessing publicly available leaderboard data.
        </p>
        <h3>Prohibited Conduct</h3>
        <p>You must not use the Platform to:</p>
        <ul>
          <li>Submit false, fraudulent, or manipulated ratings</li>
          <li>Submit ratings for events you did not personally attend</li>
          <li>
            Use automated scripts, bots, or tools to generate or submit ratings
          </li>
          <li>
            Coordinate with others to artificially inflate or deflate any
            venue's or artist's score
          </li>
          <li>
            Attempt to reverse-engineer, scrape, or extract data from the
            Platform in bulk
          </li>
          <li>
            Interfere with or disrupt the integrity or performance of the
            Platform
          </li>
          <li>
            Use the Platform for any unlawful purpose or in violation of any
            applicable law
          </li>
          <li>
            Reproduce, sell, or commercially exploit any portion of the Platform
            without express written permission
          </li>
        </ul>
        <div className="tos-callout">
          <span className="tos-callout-icon">⚠</span>
          <p>
            Rating integrity is the foundation of EnLive. Manipulation of
            ratings — in any form — may result in immediate removal of affected
            data, account suspension, and where appropriate, legal action.
          </p>
        </div>
        <h3>Age Requirement</h3>
        <p>
          You must be at least 13 years of age to use the Platform. By using
          EnLive, you confirm you meet this requirement.
        </p>
      </>
    ),
  },
  {
    id: "rating",
    num: "04",
    title: "Rating & Content Policy",
    content: (
      <>
        <p>
          Ratings submitted via the Platform are anonymous and become the
          property of EnLive upon submission. By submitting a rating, you grant
          EnLive a perpetual, irrevocable, royalty-free, worldwide licence to
          store, aggregate, display, and use that data within the Platform and
          related services.
        </p>
        <p>
          Ratings must reflect your honest personal experience of the relevant
          live event. Ratings that we determine — in our sole discretion — to be
          fraudulent, spam, coordinated, or submitted in bad faith may be
          removed without notice.
        </p>
        <p>
          We do not store any personally identifiable information in connection
          with anonymous ratings submitted via QR code. See our Privacy Policy
          for details on what data is collected and how it is used.
        </p>
      </>
    ),
  },
  {
    id: "accounts",
    num: "05",
    title: "Venue & Artist Accounts",
    content: (
      <>
        <p>
          Venues and artists may register for an account to access a private
          dashboard displaying aggregated rating data relevant to their profile.
        </p>
        <h3>Account Responsibilities</h3>
        <ul>
          <li>
            You are responsible for maintaining the confidentiality of your
            account credentials
          </li>
          <li>
            You must provide accurate and truthful information when registering
          </li>
          <li>
            You must notify us promptly if you suspect unauthorised access to
            your account
          </li>
          <li>
            Each account must correspond to a single venue or artist entity
          </li>
        </ul>
        <h3>Account Data</h3>
        <p>
          Account holders provide business or professional information (such as
          venue name, location, contact details, and artist name). This
          information is processed in accordance with our Privacy Policy and
          applicable data protection law, including the UK GDPR.
        </p>
        <h3>Termination of Accounts</h3>
        <p>
          We reserve the right to suspend or terminate any venue or artist
          account at our discretion, including where we have reason to believe
          the account holder has violated these Terms or has engaged in conduct
          detrimental to the integrity of the Platform.
        </p>
      </>
    ),
  },
  {
    id: "ip",
    num: "06",
    title: "Intellectual Property",
    content: (
      <>
        <p>
          All intellectual property rights in the Platform — including its
          design, software, branding, leaderboard data, aggregated rating
          scores, and all content generated by EnLive — are owned by or licensed
          to EnLive.
        </p>
        <p>
          You are granted a limited, non-exclusive, non-transferable licence to
          access and use the Platform for its intended purpose. This licence
          does not permit you to reproduce, modify, distribute, sublicense, or
          create derivative works from any part of the Platform without our
          prior written consent.
        </p>
        <p>
          The "EnLive" name, logo, and associated marks are proprietary to
          EnLive. Nothing in these Terms grants you any right to use them.
        </p>
      </>
    ),
  },
  {
    id: "liability",
    num: "07",
    title: "Disclaimers & Limitation of Liability",
    content: (
      <>
        <h3>No Warranty</h3>
        <p>
          The Platform is provided on an "as is" and "as available" basis. To
          the fullest extent permitted by applicable law, EnLive makes no
          representations or warranties of any kind — express, implied, or
          statutory — including but not limited to warranties of
          merchantability, fitness for a particular purpose, accuracy, or
          non-infringement.
        </p>
        <p>
          We do not warrant that ratings or leaderboard data are free from
          error, that they accurately reflect the views of a representative
          audience, or that they will not be subject to manipulation despite our
          reasonable efforts to prevent it.
        </p>
        <h3>Limitation of Liability</h3>
        <p>
          To the maximum extent permitted by law, EnLive shall not be liable for
          any indirect, incidental, consequential, special, or punitive damages
          arising from your use of — or inability to use — the Platform,
          including but not limited to loss of revenue, loss of reputation, or
          loss of data.
        </p>
        <p>
          Our aggregate liability to you for any claim arising under or in
          connection with these Terms shall not exceed the greater of (a) the
          amount paid by you to EnLive in the twelve months preceding the claim,
          or (b) £100.
        </p>
        <h3>Third-Party Content</h3>
        <p>
          Ratings and scores displayed on the Platform are submitted by members
          of the public and do not represent the views or opinions of EnLive. We
          are not responsible for the accuracy, completeness, or legality of
          user-submitted content.
        </p>
      </>
    ),
  },
  {
    id: "changes",
    num: "08",
    title: "Availability & Changes",
    content: (
      <>
        <p>
          We do not guarantee uninterrupted or error-free access to the
          Platform. We reserve the right to modify, suspend, or discontinue the
          Platform — or any feature thereof — at any time, with or without
          notice.
        </p>
        <p>
          We may update these Terms from time to time. Where changes are
          material, we will provide reasonable notice (for example, by
          displaying a notice on the Platform or emailing registered account
          holders). Continued use of the Platform after updated Terms take
          effect constitutes your acceptance of those changes.
        </p>
        <p>
          We recommend that you review these Terms periodically. The date at the
          top of this page indicates when they were last updated.
        </p>
      </>
    ),
  },
  {
    id: "law",
    num: "09",
    title: "Governing Law",
    content: (
      <>
        <p>
          These Terms are governed by and construed in accordance with the laws
          of England and Wales. Any dispute arising under or in connection with
          these Terms shall be subject to the exclusive jurisdiction of the
          courts of England and Wales, unless mandatory applicable law in your
          country of residence requires otherwise.
        </p>
        <p>
          If you are accessing the Platform from outside the United Kingdom, you
          do so at your own initiative and are responsible for compliance with
          local laws to the extent applicable.
        </p>
        <p>
          Nothing in these Terms affects your statutory rights as a consumer
          under the law of your country of residence, where those rights cannot
          be excluded or limited by contract.
        </p>
      </>
    ),
  },
  {
    id: "contact",
    num: "10",
    title: "Contact Us",
    content: (
      <>
        <p>
          If you have any questions about these Terms, wish to report a
          violation, or need to contact us regarding your data, please reach
          out:
        </p>
        <div className="tos-contact-card">
          <p className="tos-contact-name">EnLive</p>
          <p>
            Email:{" "}
            <a href="mailto:contact@enlive.app" className="tos-link">
              contact@enlive.app
            </a>
          </p>
          <p>
            Website:{" "}
            <a href="https://enlive.app" className="tos-link">
              enlive.app
            </a>
          </p>
          <p>Governing jurisdiction: England &amp; Wales, United Kingdom</p>
        </div>
        <p className="tos-note">
          We aim to respond to all legal enquiries within 10 business days.
        </p>
      </>
    ),
  },
];

export default function TermsOfService({
  inModal = false,
  scrollContainerRef,
}: {
  inModal?: boolean;
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>;
}) {
  const [activeId, setActiveId] = useState<string>("acceptance");
  const [scrollProgress, setScrollProgress] = useState(0);
  const [indicatorStyle, setIndicatorStyle] = useState({
    top: 0,
    height: 0,
    opacity: 0,
  });
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const navRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const sidebarRef = useRef<HTMLDivElement | null>(null);

  // Move the indicator to match the active nav item
  const updateIndicator = (id: string) => {
    const btn = navRefs.current[id];
    const sidebar = sidebarRef.current;
    if (!btn || !sidebar) return;
    const btnRect = btn.getBoundingClientRect();
    const sidebarRect = sidebar.getBoundingClientRect();
    setIndicatorStyle({
      top: btnRect.top - sidebarRect.top + sidebar.scrollTop,
      height: btnRect.height,
      opacity: 1,
    });
  };

  useEffect(() => {
    const container = scrollContainerRef?.current ?? null;
    const scrollTarget: EventTarget = container ?? window;

    const onScroll = () => {
      if (container) {
        const progress =
          container.scrollTop /
          (container.scrollHeight - container.clientHeight);
        setScrollProgress(Math.min(1, Math.max(0, progress)));

        const containerTop = container.getBoundingClientRect().top;
        let newActive = sections[0].id;
        for (const s of sections) {
          const el = sectionRefs.current[s.id];
          if (el && el.getBoundingClientRect().top - containerTop <= 48) {
            newActive = s.id;
          }
        }
        if (newActive !== activeId) {
          setActiveId(newActive);
          updateIndicator(newActive);
        }
      } else {
        const el = document.documentElement;
        const progress = el.scrollTop / (el.scrollHeight - el.clientHeight);
        setScrollProgress(Math.min(1, Math.max(0, progress)));

        let newActive = sections[0].id;
        for (const s of sections) {
          const el = sectionRefs.current[s.id];
          if (el && el.getBoundingClientRect().top <= 140) {
            newActive = s.id;
          }
        }
        if (newActive !== activeId) {
          setActiveId(newActive);
          updateIndicator(newActive);
        }
      }
    };

    scrollTarget.addEventListener("scroll", onScroll, { passive: true });
    return () => scrollTarget.removeEventListener("scroll", onScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, scrollContainerRef]);

  // Init indicator on mount after layout
  useEffect(() => {
    const timer = setTimeout(() => updateIndicator("acceptance"), 80);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scrollTo = (id: string) => {
    const container = scrollContainerRef?.current ?? null;
    if (container) {
      const el = sectionRefs.current[id];
      if (el) {
        const elTop = el.getBoundingClientRect().top;
        const containerTop = container.getBoundingClientRect().top;
        container.scrollBy({
          top: elTop - containerTop - 32,
          behavior: "smooth",
        });
      }
    } else {
      sectionRefs.current[id]?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
    setActiveId(id);
    updateIndicator(id);
  };

  return (
    <>
      <style>{`
        .tos-progress {
          position: fixed;
          top: 0; left: 0;
          height: 2px;
          background: var(--primary);
          z-index: 100;
          transition: width 0.1s linear;
        }

        .tos-page {
          min-height: 100vh;
          padding: 0 0 80px;
        }

        .tos-header {
          padding: 56px 24px 40px;
          max-width: 760px;
          margin: 0 auto;
          border-bottom: 1px solid var(--border);
          margin-bottom: 0;
        }

        .tos-brand {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 32px;
          text-decoration: none;
        }

        .tos-brand-mark {
          width: 34px; height: 34px;
          background: var(--primary);
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          color: var(--button-text);
          font-size: 16px;
        }

        .tos-brand-name {
          font-size: 18px;
          font-weight: 600;
          letter-spacing: -0.02em;
          color: var(--foreground);
        }

        .tos-title {
          font-size: clamp(32px, 5vw, 48px);
          font-weight: 700;
          letter-spacing: -0.03em;
          line-height: 1.1;
          color: var(--foreground);
          margin-bottom: 16px;
        }

        .tos-title span {
          color: var(--primary);
        }

        .tos-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
          font-size: 12.5px;
          color: var(--text-muted);
          opacity: 0.7;
        }

        .tos-meta-item {
          display: flex; align-items: center; gap: 6px;
        }

        .tos-meta-dot {
          width: 4px; height: 4px;
          border-radius: 50%;
          background: var(--primary);
          opacity: 0.6;
        }

        /* Layout */
        .tos-layout {
          display: grid;
          grid-template-columns: 220px 1fr;
          gap: 0;
          max-width: 980px;
          margin: 0 auto;
          padding: 0 24px;
          align-items: start;
        }

        @media (max-width: 700px) {
          .tos-layout { grid-template-columns: 1fr; }
          .tos-sidebar { display: none; }
        }

        /* Sidebar */
        .tos-sidebar {
          position: sticky;
          top: 32px;
          padding: 40px 24px 40px 0;
          border-right: 1px solid var(--border);
        }

        .tos-sidebar-inner {
          position: relative;
        }

        /* Sliding highlight pill */
        .tos-nav-indicator {
          position: absolute;
          left: 0;
          right: 0;
          background: var(--surface-muted);
          border-radius: 8px;
          pointer-events: none;
          transition: top 0.25s cubic-bezier(0.4, 0, 0.2, 1),
                      height 0.25s cubic-bezier(0.4, 0, 0.2, 1),
                      opacity 0.2s ease;
          z-index: 0;
        }

        .tos-sidebar-label {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--text-muted);
          opacity: 0.5;
          margin-bottom: 14px;
          padding-left: 4px;
        }

        .tos-nav-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 7px 10px 7px 4px;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.15s;
          margin-bottom: 2px;
          border: none;
          background: transparent;
          width: 100%;
          text-align: left;
          position: relative;
          z-index: 1;
        }

        .tos-nav-item:hover {
          background: transparent;
        }

        .tos-nav-item.active {
          background: transparent;
        }

        .tos-nav-num {
          font-size: 10px;
          font-weight: 600;
          color: var(--primary);
          opacity: 0.5;
          width: 20px;
          flex-shrink: 0;
          transition: opacity 0.2s;
        }

        .tos-nav-item.active .tos-nav-num {
          opacity: 1;
        }

        .tos-nav-text {
          font-size: 13px;
          color: var(--foreground);
          opacity: 0.45;
          line-height: 1.3;
          transition: opacity 0.2s, color 0.2s;
        }

        .tos-nav-item.active .tos-nav-text {
          opacity: 1;
          color: var(--primary);
        }

        .tos-nav-item:hover .tos-nav-text {
          opacity: 0.75;
        }

        .tos-nav-bar {
          width: 2px;
          height: 14px;
          border-radius: 2px;
          background: transparent;
          margin-left: auto;
          flex-shrink: 0;
          transition: background 0.2s;
        }

        .tos-nav-item.active .tos-nav-bar {
          background: var(--primary);
        }

        /* Main content */
        .tos-main {
          padding: 40px 0 40px 48px;
        }

        @media (max-width: 700px) {
          .tos-main { padding: 32px 0; }
        }

        .tos-intro-callout {
          background: var(--surface-muted);
          border: 1px solid var(--border);
          border-left: 3px solid var(--primary);
          border-radius: 0 10px 10px 0;
          padding: 16px 20px;
          margin-bottom: 48px;
          font-size: 14px;
          color: var(--foreground);
          opacity: 0.85;
          line-height: 1.65;
        }

        /* Section */
        .tos-section {
          margin-bottom: 56px;
          padding-bottom: 56px;
          border-bottom: 1px solid var(--border);
          scroll-margin-top: 32px;
        }

        .tos-section:last-of-type {
          border-bottom: none;
          margin-bottom: 0;
        }

        .tos-section-header {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 22px;
        }

        .tos-section-num {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.1em;
          color: var(--primary);
          background: var(--surface-muted);
          border: 1px solid var(--border-strong);
          padding: 3px 10px;
          border-radius: 100px;
          white-space: nowrap;
        }

        .tos-section-title {
          font-size: clamp(20px, 3vw, 26px);
          font-weight: 700;
          letter-spacing: -0.02em;
          color: var(--foreground);
          line-height: 1.2;
        }

        /* Content typography */
        .tos-section p {
          font-size: 14.5px;
          line-height: 1.78;
          color: var(--foreground);
          opacity: 0.8;
          margin-bottom: 14px;
        }

        .tos-section p:last-child { margin-bottom: 0; }

        .tos-section h3 {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--secondary);
          margin: 26px 0 10px;
        }

        .tos-section ul {
          list-style: none;
          padding: 0;
          margin: 0 0 14px;
        }

        .tos-section ul li {
          display: flex;
          gap: 10px;
          padding: 5px 0;
          font-size: 14px;
          line-height: 1.65;
          color: var(--foreground);
          opacity: 0.78;
        }

        .tos-section ul li::before {
          content: '–';
          color: var(--primary);
          flex-shrink: 0;
          margin-top: 1px;
        }

        .tos-callout {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          background: var(--surface-muted);
          border: 1px solid var(--border-strong);
          border-radius: 10px;
          padding: 14px 18px;
          margin: 20px 0;
        }

        .tos-callout-icon {
          color: var(--primary);
          font-size: 15px;
          flex-shrink: 0;
          margin-top: 1px;
        }

        .tos-callout p {
          margin: 0 !important;
          font-size: 13.5px !important;
          opacity: 0.85 !important;
        }

        .tos-contact-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 22px 26px;
          margin: 18px 0;
        }

        .tos-contact-card p {
          margin: 4px 0 !important;
          font-size: 14px !important;
        }

        .tos-contact-name {
          font-weight: 700 !important;
          font-size: 15px !important;
          opacity: 1 !important;
          margin-bottom: 10px !important;
        }

        .tos-link {
          color: var(--primary);
          text-decoration: none;
          border-bottom: 1px solid transparent;
          transition: border-color 0.15s;
        }

        .tos-link:hover {
          border-color: var(--primary);
        }

        .tos-note {
          font-size: 13px !important;
          opacity: 0.5 !important;
          margin-top: 14px;
        }

        /* Footer */
        .tos-footer {
          text-align: center;
          padding: 48px 24px 0;
          border-top: 1px solid var(--border);
          max-width: 980px;
          margin: 0 auto;
        }

        .tos-footer p {
          font-size: 12.5px;
          color: var(--foreground);
          opacity: 0.35;
          line-height: 1.7;
          margin-bottom: 6px;
        }

        /* Fade-in animation */
        @keyframes tosFadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .tos-section {
          animation: tosFadeUp 0.4s ease both;
        }

        ${sections.map((s, i) => `.tos-section:nth-child(${i + 1}) { animation-delay: ${0.05 + i * 0.04}s; }`).join("\n")}
      `}</style>

      {!inModal && (
        <div
          className="tos-progress"
          style={{ width: `${scrollProgress * 100}%` }}
          aria-hidden="true"
        />
      )}

      <div className="tos-page">
        {!inModal && (
          <header className="tos-header">
            <a className="tos-brand" href="/">
              <div className="tos-brand-mark">♪</div>
              <span className="tos-brand-name">EnLive</span>
            </a>
            <h1 className="tos-title">
              Terms of <span>Service</span>
            </h1>
            <div className="tos-meta">
              <span className="tos-meta-item">
                <span className="tos-meta-dot" />
                Effective: 1 January 2025
              </span>
              <span className="tos-meta-item">
                <span className="tos-meta-dot" />
                Last updated: January 2025
              </span>
              <span className="tos-meta-item">
                <span className="tos-meta-dot" />
                Governing law: England &amp; Wales
              </span>
            </div>
          </header>
        )}

        {/* Body */}
        <div className="tos-layout">
          {/* Sidebar nav */}
          <aside className="tos-sidebar" aria-label="Section navigation">
            <div className="tos-sidebar-label">Contents</div>
            <div className="tos-sidebar-inner" ref={sidebarRef}>
              {/* Sliding highlight */}
              <div
                className="tos-nav-indicator"
                aria-hidden="true"
                style={{
                  top: indicatorStyle.top,
                  height: indicatorStyle.height,
                  opacity: indicatorStyle.opacity,
                }}
              />
              {sections.map((s) => (
                <button
                  key={s.id}
                  ref={(el) => {
                    navRefs.current[s.id] = el;
                  }}
                  className={`tos-nav-item${activeId === s.id ? " active" : ""}`}
                  onClick={() => scrollTo(s.id)}
                  aria-current={activeId === s.id ? "true" : undefined}
                >
                  <span className="tos-nav-num">{s.num}</span>
                  <span className="tos-nav-text">{s.title}</span>
                  <span className="tos-nav-bar" />
                </button>
              ))}
            </div>
          </aside>

          {/* Main */}
          <main className="tos-main">
            <p className="tos-intro-callout">
              Please read these Terms carefully before using EnLive. By
              accessing or using the platform — including scanning a QR code to
              submit a rating — you agree to be bound by these Terms. If you do
              not agree, please do not use the platform.
            </p>

            {sections.map((s) => (
              <section
                key={s.id}
                id={s.id}
                className="tos-section"
                ref={(el) => {
                  sectionRefs.current[s.id] = el;
                }}
              >
                <div className="tos-section-header">
                  <span className="tos-section-num">{s.num}</span>
                  <h2 className="tos-section-title">{s.title}</h2>
                </div>
                {s.content}
              </section>
            ))}
          </main>
        </div>
      </div>
    </>
  );
}
