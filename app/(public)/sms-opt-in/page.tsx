import "./sms-opt-in.css";
import SmsOptInForm from "./SmsOptInForm";

export const metadata = {
  title: "SMS Text Message Opt-In – ThePuppyPlugs.com",
};

/**
 * Permanent, publicly-accessible A2P 10DLC compliance/reviewer page.
 * The form and both consent disclosures render immediately on page
 * load - no expand/collapse gate, no modal, no accordion - so a
 * carrier or GHL reviewer can inspect the opt-in flow directly at this
 * URL without needing to interact with the site first.
 */
export default function SmsOptInPage() {
  return (
    <>
      <div className="optin-hero">
        <h1>Stay Connected With The Puppy Plugs</h1>
        <p>Choose which text messages you&rsquo;d like to receive from The Puppy Plugs.</p>
      </div>

      <SmsOptInForm />
    </>
  );
}
