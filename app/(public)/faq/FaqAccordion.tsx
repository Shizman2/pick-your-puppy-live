"use client";

import { useState } from "react";

export interface FaqEntry {
  id: string;
  q: string;
  a: string;
}

export default function FaqAccordion({ faqs }: { faqs: FaqEntry[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="faq-list">
      {faqs.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div
            key={item.id}
            className={`faq-item${isOpen ? " pp-open" : ""}`}
            onClick={() => setOpenIndex(isOpen ? null : i)}
          >
            <div className="faq-q">
              <span>{item.q}</span>
              <span className="faq-icon">+</span>
            </div>
            {isOpen && <div className="faq-a">{item.a}</div>}
          </div>
        );
      })}
    </div>
  );
}
