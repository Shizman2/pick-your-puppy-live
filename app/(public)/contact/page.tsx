import "./contact.css";
import ContactForm from "./ContactForm";
import { getContentBlocksForPage } from "../../../lib/content";
import { getAllVisiblePuppiesForCards } from "../../../lib/public-data/puppies";

const FIXED_BREED_OPTIONS = ["Not sure yet", "Just have a question"];

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

  const phoneDigits = text.phone.replace(/[^\d+]/g, "");

  let breedOptions = [...FIXED_BREED_OPTIONS];
  try {
    const puppies = await getAllVisiblePuppiesForCards();
    const uniqueBreeds = Array.from(new Set(puppies.map((p) => p.breed?.trim()).filter(Boolean))).sort((a, b) =>
      a.localeCompare(b)
    );
    breedOptions = [...uniqueBreeds, ...FIXED_BREED_OPTIONS];
  } catch {
    // Keep the fixed-only fallback if Supabase is unreachable.
  }

  return (
    <>
      <div className="contact-hero">
        <div className="icon">💬</div>
        <h1>Get In Touch</h1>
        <p>We typically respond within a few hours. We would love to help you find the perfect puppy!</p>
      </div>

      <div className="contact-methods">
        <h2>Reach Us Directly</h2>
        <a className="method-card" href={`tel:${phoneDigits}`}>
          <div className="method-icon">📞</div>
          <div>
            <div className="method-label">Phone / Text</div>
            <div className="method-value">{text.phone}</div>
          </div>
        </a>
        <a className="method-card" href={`mailto:${text.email}`}>
          <div className="method-icon">✉️</div>
          <div>
            <div className="method-label">Email</div>
            <div className="method-value">{text.email}</div>
          </div>
        </a>
        <div className="method-card">
          <div className="method-icon">📸</div>
          <div>
            <div className="method-label">Instagram</div>
            <div className="method-value">{text.instagram}</div>
          </div>
        </div>
      </div>

      <ContactForm breedOptions={breedOptions} />

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
