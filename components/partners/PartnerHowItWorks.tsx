function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 20h9" strokeLinecap="round" />
      <path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4L16.5 3.5z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="18" cy="5" r="2.5" />
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="19" r="2.5" />
      <path d="M8.3 10.7l7.4-4.2M8.3 13.3l7.4 4.2" strokeLinecap="round" />
    </svg>
  );
}
function DollarIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 2v20M17 7a4 4 0 00-4-3h-2a3 3 0 000 6h2a3 3 0 010 6h-2a4 4 0 01-4-3" strokeLinecap="round" />
    </svg>
  );
}

const STEPS = [
  { num: 1, title: "Apply", desc: "Tell us a little about yourself.", bg: "#dbeafe", fg: "#2563eb", icon: <EditIcon /> },
  { num: 2, title: "Get Approved", desc: "We'll review your application (usually 1-2 days).", bg: "#dcfce7", fg: "#16a34a", icon: <CheckIcon /> },
  { num: 3, title: "Share Your Links", desc: "Promote puppies on your platform.", bg: "#fce7f3", fg: "#db2777", icon: <ShareIcon /> },
  { num: 4, title: "Earn On Completed Puppy Sales", desc: "Get paid when families complete their purchase.", bg: "#fef3c7", fg: "#b45309", icon: <DollarIcon /> },
];

export default function PartnerHowItWorks() {
  return (
    <section className="partner-section">
      <h2 className="partner-section-title">How It Works</h2>
      <p className="partner-section-sub">Get started in four simple steps.</p>

      <div className="partner-steps-grid">
        {STEPS.map((step) => (
          <div key={step.num} className="partner-step-card">
            <div className="partner-step-icon" style={{ background: step.bg, color: step.fg }}>
              {step.icon}
            </div>
            <div className="partner-step-title">
              {step.num}. {step.title}
            </div>
            <div className="partner-step-desc">{step.desc}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
