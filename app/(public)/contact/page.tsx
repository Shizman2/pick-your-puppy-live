import "./contact.css";
import { getContentBlocksForPage } from "../../../lib/content";

export const metadata = {
  title: "Contact – ThePuppyPlugs.com",
};

const FALLBACK: Record<string, string> = {
  phone: "(555) 123-4567",
  email: "hello@thepuppyplugs.com",
  instagram: "@thepuppyplugs",
  hours_weekday: "9am – 7pm EST",
  hours_saturday: "10am – 5pm EST",
  hours_sunday: "Limited availability",
};

export default async function ContactPage() {
  const text: Record<string, string> = { ...FALLBACK };
  try {
    const blocks = await getContentBlocksForPage("contact");
    for (const block of blocks) {
      if (block.content_type === "text" && block.text_value) {
        text[block.section_key] = block.text_value;
      }
    }
  } catch {
    // Keep fallback content if Supabase is unreachable.
  }

  return (
    <>
      <div className="contact-hero">
        <div className="icon">💬</div>
        <h1>Get In Touch</h1>
        <p>We typically respond within a few hours. We would love to help you find the perfect puppy!</p>
      </div>

      <div className="contact-info-section">
        <h2>Contact Information</h2>
        <p className="contact-info-business">The Puppy Plugs</p>
        <p className="contact-info-operator">Operated by Sean Williams, Sole Proprietor</p>
        <p className="contact-info-line">
          Phone: <a href="tel:2677743553">267-774-3553</a>
        </p>
        <p className="contact-info-line">
          Email: <a href="mailto:thepuppyplugsonline@gmail.com">thepuppyplugsonline@gmail.com</a>
        </p>
      </div>

      <div className="hours-section">
        <h2>Response Hours</h2>
        <div className="hours-row">
          <span className="hours-day">Monday – Friday</span>
          <span className="hours-time open">{text.hours_weekday}</span>
        </div>
        <div className="hours-row">
          <span className="hours-day">Saturday</span>
          <span className="hours-time open">{text.hours_saturday}</span>
        </div>
        <div className="hours-row">
          <span className="hours-day">Sunday</span>
          <span className="hours-time">{text.hours_sunday}</span>
        </div>
      </div>
    </>
  );
}
