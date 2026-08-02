import "./contact.css";
import ContactForm from "./ContactForm";

export const metadata = {
  title: "Contact – ThePuppyPlugs.com",
};

export default function ContactPage() {
  return (
    <>
      <div className="contact-hero">
        <div className="icon">💬</div>
        <h1>Get In Touch</h1>
        <p>We typically respond within a few hours. We would love to help you find the perfect puppy!</p>
      </div>

      <div className="contact-methods">
        <h2>Reach Us Directly</h2>
        <a className="method-card" href="tel:+15551234567">
          <div className="method-icon">📞</div>
          <div>
            <div className="method-label">Phone / Text</div>
            <div className="method-value">(555) 123-4567</div>
          </div>
        </a>
        <a className="method-card" href="mailto:hello@thepuppyplugs.com">
          <div className="method-icon">✉️</div>
          <div>
            <div className="method-label">Email</div>
            <div className="method-value">hello@thepuppyplugs.com</div>
          </div>
        </a>
        <div className="method-card">
          <div className="method-icon">📸</div>
          <div>
            <div className="method-label">Instagram</div>
            <div className="method-value">@thepuppyplugs</div>
          </div>
        </div>
      </div>

      <ContactForm />

      <div className="hours-section">
        <h2>Response Hours</h2>
        <div className="hours-row">
          <span className="hours-day">Monday – Friday</span>
          <span className="hours-time open">9am – 7pm EST</span>
        </div>
        <div className="hours-row">
          <span className="hours-day">Saturday</span>
          <span className="hours-time open">10am – 5pm EST</span>
        </div>
        <div className="hours-row">
          <span className="hours-day">Sunday</span>
          <span className="hours-time">Limited availability</span>
        </div>
      </div>
    </>
  );
}
