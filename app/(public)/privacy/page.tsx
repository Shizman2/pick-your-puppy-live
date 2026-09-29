import "../../../components/public-site/legal.css";
import LegalAccordion, { type LegalSection } from "../../../components/public-site/LegalAccordion";

export const metadata = {
  title: "Privacy Policy – ThePuppyPlugs.com",
};

// Locked legal copy - transcribed verbatim, not rewritten/summarized.
const SECTIONS: LegalSection[] = [
  {
    id: "information-we-collect",
    title: "Information We Collect",
    body: (
      <>
        <p>
          We may collect information that you provide directly to us, including your name, email address, phone
          number, messages, puppy inquiries, Puppy Finder requests, and other information you choose to provide.
        </p>
        <p>
          We may also collect limited information about how visitors use our website, such as pages viewed, puppy
          listings viewed, referral source, device type, and interactions with certain website features.
        </p>
      </>
    ),
  },
  {
    id: "how-we-use-your-information",
    title: "How We Use Your Information",
    body: (
      <>
        <p>We may use the information we collect to:</p>
        <ul>
          <li>Respond to puppy inquiries and questions.</li>
          <li>Provide information about available puppies and our services.</li>
          <li>Process Puppy Finder requests.</li>
          <li>Communicate with you about an inquiry or service you requested.</li>
          <li>Send marketing communications when you have separately consented to receive them.</li>
          <li>Operate, maintain, improve, and understand the use of our website.</li>
          <li>Protect our website and services from misuse or fraudulent activity.</li>
        </ul>
      </>
    ),
  },
  {
    id: "sms-mobile-information",
    title: "SMS & Mobile Information",
    body: (
      <>
        <p>
          If you provide your mobile number and separately consent to receive text messages, The Puppy Plugs may
          send you text messages consistent with the type of messages you selected.
        </p>
        <p>
          <strong>Puppy Inquiry Texts:</strong> These may include responses to your puppy inquiry and related
          service updates.
        </p>
        <p>
          <strong>Offers &amp; Puppy Updates:</strong> If you separately opt in to marketing messages, these may
          include information about available puppies, special offers, and service updates.
        </p>
        <p>Message frequency may vary. Message and data rates may apply.</p>
        <p>You may opt out of text messages at any time by replying STOP. For assistance, reply HELP.</p>
        <p>Your consent to receive text messages is not a condition of purchase.</p>
        <p>
          We do not sell, rent, or share your mobile number or SMS opt-in/consent information with third parties or
          affiliates for their marketing or promotional purposes. Information may be shared with service providers
          that help us deliver communications and operate our services, but those providers may use the information
          only to provide services on our behalf.
        </p>
        <p>
          The above mobile-information restriction applies notwithstanding anything else in this Privacy Policy
          concerning the sharing of information.
        </p>
      </>
    ),
  },
  {
    id: "cookies-website-analytics",
    title: "Cookies & Website Analytics",
    body: (
      <>
        <p>
          ThePuppyPlugs.com may use cookies, browser storage, and similar technologies to operate website features,
          remember preferences, understand website traffic, measure page and puppy-listing activity, and improve the
          website.
        </p>
        <p>
          You may be able to control certain cookies or browser storage through your browser settings. Disabling
          these technologies may affect some website features.
        </p>
      </>
    ),
  },
  {
    id: "how-we-share-information",
    title: "How We Share Information",
    body: (
      <>
        <p>
          We may share information with service providers that assist us in operating our website, communications,
          technology, analytics, or other services necessary to operate The Puppy Plugs.
        </p>
        <p>
          We may also disclose information when reasonably necessary to comply with applicable law, respond to
          lawful requests, protect our rights or users, or prevent fraud or misuse.
        </p>
        <p>
          We do not sell your SMS opt-in or consent information, and mobile information will not be shared with
          third parties or affiliates for their marketing or promotional purposes.
        </p>
      </>
    ),
  },
  {
    id: "data-security",
    title: "Data Security",
    body: (
      <p>
        We use reasonable administrative and technical measures designed to protect the information we collect.
        However, no internet transmission, electronic storage system, or online service can be guaranteed to be
        completely secure.
      </p>
    ),
  },
  {
    id: "data-retention",
    title: "Data Retention",
    body: (
      <p>
        We may retain information for as long as reasonably necessary to provide our services, maintain business
        records, resolve disputes, enforce agreements, and satisfy applicable legal or operational requirements.
      </p>
    ),
  },
  {
    id: "your-choices",
    title: "Your Choices",
    body: (
      <>
        <p>
          You may choose not to provide certain information, although doing so may limit our ability to respond to
          an inquiry or provide certain services.
        </p>
        <p>SMS consent is optional. You may submit a puppy inquiry without agreeing to receive text messages.</p>
        <p>
          If you have opted in to SMS messages, you may reply STOP at any time to opt out. You may reply HELP for
          assistance.
        </p>
      </>
    ),
  },
  {
    id: "childrens-privacy",
    title: "Children's Privacy",
    body: (
      <p>
        The Puppy Plugs website and services are not directed to children under 13, and we do not knowingly collect
        personal information from children under 13.
      </p>
    ),
  },
  {
    id: "changes-to-this-privacy-policy",
    title: "Changes to This Privacy Policy",
    body: (
      <p>
        We may update this Privacy Policy from time to time. When changes are made, the updated policy will be
        posted on this page with a revised &ldquo;Last Updated&rdquo; date.
      </p>
    ),
  },
  {
    id: "contact-us",
    title: "Contact Us",
    body: (
      <>
        <p>If you have questions about this Privacy Policy or how your information is handled, contact:</p>
        <p>
          The Puppy Plugs
          <br />
          Website: <a href="https://thepuppyplugs.com">ThePuppyPlugs.com</a>
          <br />
          Email: <a href="mailto:thepuppyplugsonline@gmail.com">thepuppyplugsonline@gmail.com</a>
        </p>
      </>
    ),
  },
];

export default function PrivacyPolicyPage() {
  return (
    <div className="legal-page">
      <div className="legal-hero">
        <h1>Privacy Policy</h1>
        <p className="legal-updated">Last updated: September 28, 2026</p>
        <p className="legal-intro">
          The Puppy Plugs respects your privacy. This Privacy Policy explains how we collect, use, and protect
          information when you visit ThePuppyPlugs.com, contact us about a puppy, use our Puppy Finder service, or
          otherwise interact with our website and services.
        </p>
      </div>

      <LegalAccordion sections={SECTIONS} />
    </div>
  );
}
