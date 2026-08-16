"use client";

import { useState } from "react";

export interface FaqEntry {
  id: string;
  q: string;
  a: string;
}

export interface FaqCategoryEntry {
  id: string;
  title: string;
  icon: string | null;
  items: FaqEntry[];
}

function CategoryIcon({ icon }: { icon: string | null }) {
  const paths: Record<string, string> = {
    paw: "M12 21c4-3 7-6 7-10a5 5 0 00-9.5-2A5 5 0 005 11c0 4 3 7 7 10z",
    tag: "M20.59 13.41L11 3.83A2 2 0 009.59 3.2L4 3a1 1 0 00-1 1l.2 5.59a2 2 0 00.59 1.41l9.6 9.6a2 2 0 002.82 0l4.38-4.38a2 2 0 000-2.82zM7 8a1 1 0 110-2 1 1 0 010 2z",
    "shield-check": "M12 3l7 3v6c0 5-3.5 8.5-7 9.5C8.5 20.5 5 17 5 12V6l7-3zM8.5 12l2.3 2.3L15.7 9.5",
    truck: "M3 11l1-4h9v9H3zM13 10h4l3 4v3h-7v-7zM6 20a2 2 0 100-4 2 2 0 000 4zM18 20a2 2 0 100-4 2 2 0 000 4z",
    help: "M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01M12 21a9 9 0 100-18 9 9 0 000 18z",
  };
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
      <path
        d={paths[icon || "help"] || paths.help}
        stroke="#fff"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FaqCategorySection({ category }: { category: FaqCategoryEntry }) {
  const [expanded, setExpanded] = useState(true);
  const [openItemIndex, setOpenItemIndex] = useState<number | null>(null);

  return (
    <div className="faq-category">
      <button type="button" className="faq-category-header" onClick={() => setExpanded((v) => !v)}>
        <span className="faq-category-icon">
          <CategoryIcon icon={category.icon} />
        </span>
        <span className="faq-category-title">{category.title}</span>
        <span className={`faq-category-chevron${expanded ? " pp-open" : ""}`}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
            <path d="M6 9l6 6 6-6" stroke="#1B7BFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>

      {expanded && (
        <div className="faq-list">
          {category.items.map((item, i) => {
            const isOpen = openItemIndex === i;
            return (
              <div
                key={item.id}
                className={`faq-item${isOpen ? " pp-open" : ""}`}
                onClick={() => setOpenItemIndex(isOpen ? null : i)}
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
      )}
    </div>
  );
}

export default function FaqAccordion({ categories }: { categories: FaqCategoryEntry[] }) {
  return (
    <div className="faq-categories">
      {categories.map((category) => (
        <FaqCategorySection key={category.id} category={category} />
      ))}
    </div>
  );
}
