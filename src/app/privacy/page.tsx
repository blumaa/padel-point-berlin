import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "PadelPoint Berlin privacy policy — how we handle match data, GDPR compliance, and your rights.",
  alternates: {
    canonical: "/privacy",
  },
};

export default function PrivacyPage() {
  return (
    <div className="klimt-bg">
      <div className="klimt-privacy">
        <Link href="/" className="klimt-privacy-back">← Back</Link>

        <h1 className="klimt-privacy-title">Privacy Policy</h1>
        <p className="klimt-privacy-date">Last updated: March 2026</p>

        <section className="klimt-privacy-section">
          <h2 className="klimt-privacy-heading">1. Who we are</h2>
          <p className="klimt-privacy-text">
            PadelPoint Berlin is an independent community tool for finding open padel matches in Berlin.
            It is not affiliated with WhatsApp, Playtomic, or any padel venue or club.
          </p>
          <p className="klimt-privacy-text">
            Data controller: <strong>Desmond Blume</strong>,{" "}
            <a href="mailto:desmond.blume@gmail.com">desmond.blume@gmail.com</a>
          </p>
        </section>

        <section className="klimt-privacy-section">
          <h2 className="klimt-privacy-heading">2. What data we collect</h2>
          <p className="klimt-privacy-text">
            We fetch matches from the Playtomic API. From each match we store:
          </p>
          <ul className="klimt-privacy-list">
            <li>Match date, time, venue, and duration</li>
            <li>Skill level range and match category</li>
            <li>Number of confirmed and open player slots</li>
            <li>A link to the match on Playtomic</li>
          </ul>
          <p className="klimt-privacy-text">
            <strong>Player names are never displayed.</strong>{" "}
            Participants are shown only as an anonymous icon with their skill level.
            No contact details or personal identifiers are stored.
          </p>
        </section>

        <section className="klimt-privacy-section">
          <h2 className="klimt-privacy-heading">3. How we use it</h2>
          <p className="klimt-privacy-text">
            Data is used solely to display upcoming matches on this website. We do not sell, share, or use
            the data for advertising, profiling, or any purpose other than showing match information.
          </p>
        </section>

        <section className="klimt-privacy-section">
          <h2 className="klimt-privacy-heading">4. Data retention</h2>
          <p className="klimt-privacy-text">
            When a match expires or is no longer available, it is archived rather than deleted.
            Archived match data is used only for aggregate statistics (e.g. venue popularity, match
            trends). No personal data is included in analytics — only anonymous counts and averages.
          </p>
          <p className="klimt-privacy-text">
            Raw message data used for processing is deleted within 2 days of receipt.
          </p>
        </section>

        <section className="klimt-privacy-section">
          <h2 className="klimt-privacy-heading">5. Legal basis (GDPR)</h2>
          <p className="klimt-privacy-text">
            Processing is based on our legitimate interest (Art. 6(1)(f) GDPR) in providing a
            community sports information service. Match announcements are shared voluntarily in group
            chats for the purpose of finding players, and we display this information in anonymised form.
          </p>
        </section>

        <section className="klimt-privacy-section">
          <h2 className="klimt-privacy-heading">6. Your rights</h2>
          <p className="klimt-privacy-text">
            Under GDPR you have the right to access, correct, or request deletion of any personal data
            we hold about you. Given our 2-day retention period, data is typically deleted automatically
            before a request is necessary. To make a request, contact us at the address above.
          </p>
        </section>

        <section className="klimt-privacy-section">
          <h2 className="klimt-privacy-heading">7. Cookies &amp; analytics</h2>
          <p className="klimt-privacy-text">
            This site does not use cookies, tracking pixels, or any third-party analytics.
          </p>
        </section>

        <section className="klimt-privacy-section">
          <h2 className="klimt-privacy-heading">8. Contact &amp; complaints</h2>
          <p className="klimt-privacy-text">
            For privacy questions contact us at the address in section 1. You also have the right to lodge
            a complaint with the Berlin data protection authority (Berliner Beauftragte für Datenschutz und
            Informationsfreiheit,{" "}
            <a href="https://www.datenschutz-berlin.de" target="_blank" rel="noopener noreferrer">
              datenschutz-berlin.de
            </a>).
          </p>
        </section>

        <p className="klimt-privacy-note">
          This privacy policy was last reviewed in March 2026. We recommend consulting a legal professional
          to verify compliance with applicable law before publishing.
        </p>
      </div>
    </div>
  );
}
