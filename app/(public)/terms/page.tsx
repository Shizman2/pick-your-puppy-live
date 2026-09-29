import "../../../components/public-site/legal.css";
import LegalAccordion, { type LegalSection } from "../../../components/public-site/LegalAccordion";

export const metadata = {
  title: "Terms & Conditions – ThePuppyPlugs.com",
};

// Locked legal copy - transcribed verbatim, not rewritten/summarized.
const SECTIONS: LegalSection[] = [
  {
    id: "website-use",
    title: "Website Use",
    body: (
      <>
        <p>
          ThePuppyPlugs.com provides information about available puppies and related services, including tools that
          allow visitors to inquire about puppies and request assistance finding a puppy.
        </p>
        <p>
          You agree to use the website only for lawful purposes and not to interfere with its operation, attempt
          unauthorized access, submit fraudulent information, or misuse its features or content.
        </p>
      </>
    ),
  },
  {
    id: "puppy-listings-availability",
    title: "Puppy Listings & Availability",
    body: (
      <>
        <p>Puppy listings are provided for informational purposes and may change as availability changes.</p>
        <p>
          Submitting an &ldquo;I&rsquo;m Interested&rdquo; form, sending a message, calling us, or otherwise
          contacting The Puppy Plugs about a puppy does not reserve, hold, or guarantee the availability of that
          puppy and does not by itself complete a purchase.
        </p>
        <p>Availability should be confirmed directly with The Puppy Plugs.</p>
      </>
    ),
  },
  {
    id: "pricing-information",
    title: "Pricing & Information",
    body: (
      <>
        <p>
          We make reasonable efforts to keep puppy information, pricing, photographs, descriptions, and other
          website information accurate and current.
        </p>
        <p>
          However, information may change, and errors or omissions may occasionally occur. Current pricing and
          availability should be confirmed before completing a transaction.
        </p>
      </>
    ),
  },
  {
    id: "puppy-finder",
    title: "Puppy Finder",
    body: (
      <>
        <p>
          The Puppy Finder service allows customers to request assistance locating a puppy that matches their
          preferences.
        </p>
        <p>
          Submitting a Puppy Finder request does not guarantee that a particular breed, puppy, price, or timeframe
          will be available.
        </p>
        <p>
          Any specific Puppy Finder fees, purchasing arrangements, or other terms presented to you as part of that
          service will apply to your request.
        </p>
      </>
    ),
  },
  {
    id: "communications",
    title: "Communications",
    body: (
      <>
        <p>
          When you contact The Puppy Plugs, you authorize us to respond using the contact methods you provide,
          subject to your communication preferences and applicable consent requirements.
        </p>
        <p>Providing a telephone number does not by itself constitute consent to receive marketing text messages.</p>
        <p>SMS consent is handled separately as described below.</p>
      </>
    ),
  },
  {
    id: "sms-terms",
    title: "SMS Terms",
    body: (
      <>
        <p>The Puppy Plugs offers optional SMS communications.</p>
        <p>You may choose to consent to one or both of the following types of text messages:</p>

        <h4>Puppy Inquiry Texts</h4>
        <p>
          If you opt in to Puppy Inquiry Texts, you consent to receive non-marketing text messages from The Puppy
          Plugs concerning your puppy inquiry, including responses and related service updates.
        </p>

        <h4>Offers &amp; Puppy Updates</h4>
        <p>
          If you separately opt in to Offers &amp; Puppy Updates, you consent to receive marketing text messages
          from The Puppy Plugs concerning available puppies, special offers, and service updates.
        </p>

        <p>For SMS communications:</p>
        <ul>
          <li>Message frequency may vary.</li>
          <li>Message and data rates may apply.</li>
          <li>Consent to receive text messages is not a condition of purchase.</li>
          <li>SMS consent is optional and separate from submitting a puppy inquiry.</li>
          <li>You may reply STOP at any time to opt out of text messages.</li>
          <li>You may reply HELP for assistance.</li>
          <li>Carriers are not liable for delayed or undelivered messages.</li>
        </ul>

        <p>
          Opting out of marketing text messages does not prevent you from submitting puppy inquiries or using the
          website.
        </p>
        <p>
          For information about how mobile information and SMS consent information are handled, see our Privacy
          Policy at <a href="/privacy">/privacy</a>.
        </p>
      </>
    ),
  },
  {
    id: "intellectual-property",
    title: "Intellectual Property",
    body: (
      <p>
        The content, branding, graphics, design, text, and other materials appearing on ThePuppyPlugs.com are owned
        by or used with permission by The Puppy Plugs and may not be copied, reproduced, distributed, or used
        commercially without permission, except as permitted by law.
      </p>
    ),
  },
  {
    id: "third-party-services",
    title: "Third-Party Services",
    body: (
      <>
        <p>
          The website may use or link to third-party services that help us provide website functionality,
          communications, payments, delivery-related services, or other features.
        </p>
        <p>Third-party services may be governed by their own terms and privacy policies.</p>
      </>
    ),
  },
  {
    id: "disclaimer",
    title: "Disclaimer",
    body: (
      <p>
        We make reasonable efforts to provide useful and accurate information through the website. Website content
        is provided for general informational purposes and should not be interpreted as a guarantee regarding the
        availability or characteristics of any particular puppy unless specifically agreed to as part of a
        transaction.
      </p>
    ),
  },
  {
    id: "limitation-of-liability",
    title: "Limitation of Liability",
    body: (
      <>
        <p>
          To the extent permitted by applicable law, The Puppy Plugs will not be liable for indirect, incidental,
          special, consequential, or punitive damages arising from your use of, or inability to use, the website.
        </p>
        <p>Nothing in these Terms is intended to limit rights or remedies that cannot legally be limited.</p>
      </>
    ),
  },
  {
    id: "changes-to-these-terms",
    title: "Changes to These Terms",
    body: (
      <p>
        We may update these Terms &amp; Conditions from time to time. Updated Terms will be posted on this page with
        a revised &ldquo;Last Updated&rdquo; date.
      </p>
    ),
  },
  {
    id: "contact-us",
    title: "Contact Us",
    body: (
      <>
        <p>Questions about these Terms &amp; Conditions can be directed to:</p>
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

export default function TermsPage() {
  return (
    <div className="legal-page">
      <div className="legal-hero">
        <h1>Terms &amp; Conditions</h1>
        <p className="legal-updated">Last updated: September 28, 2026</p>
        <p className="legal-intro">
          Welcome to ThePuppyPlugs.com. These Terms &amp; Conditions govern your use of The Puppy Plugs website and
          services. By using this website, you agree to these Terms &amp; Conditions.
        </p>
      </div>

      <LegalAccordion sections={SECTIONS} />
    </div>
  );
}
