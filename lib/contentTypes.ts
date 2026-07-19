export type ContentPage = "homepage" | "about" | "contact" | "faq";
export type ContentType = "text" | "image";

export interface ContentBlockRow {
  id: string;
  page: ContentPage;
  section_key: string;
  label: string;
  content_type: ContentType;
  text_value: string | null;
  image_url: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface FaqItemRow {
  id: string;
  question: string;
  answer: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export const CONTENT_PAGES: { key: ContentPage; label: string }[] = [
  { key: "homepage", label: "Homepage" },
  { key: "about", label: "About" },
  { key: "contact", label: "Contact" },
];
