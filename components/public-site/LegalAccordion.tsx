"use client";

import { useState } from "react";

export interface LegalSection {
  id: string;
  title: string;
  body: React.ReactNode;
}

/**
 * Single-level collapsible section list for /privacy and /terms.
 * Deliberately mirrors the existing FAQ accordion's interaction/visual
 * pattern (app/(public)/faq/FaqAccordion.tsx + faq.css: bordered white
 * item, chevron that rotates open, one section expanded at a time isn't
 * enforced there either) rather than inventing a new one - see
 * legal.css, which reuses the same --pp-* tokens as faq.css.
 */
function LegalSectionRow({ section, index }: { section: LegalSection; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`legal-section${open ? " pp-open" : ""}`}>
      <button type="button" className="legal-section-header" onClick={() => setOpen((v) => !v)}>
        <span className="legal-section-title">
          {index + 1}. {section.title}
        </span>
        <span className="legal-section-chevron">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
            <path d="M6 9l6 6 6-6" stroke="#1B7BFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>
      {open && <div className="legal-section-body">{section.body}</div>}
    </div>
  );
}

export default function LegalAccordion({ sections }: { sections: LegalSection[] }) {
  return (
    <div className="legal-sections">
      {sections.map((section, i) => (
        <LegalSectionRow key={section.id} section={section} index={i} />
      ))}
    </div>
  );
}
