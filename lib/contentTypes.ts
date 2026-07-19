export type ContentPage = "homepage" | "about" | "contact" | "faq" | "puppies" | "footer";
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

export interface WebsitePageInfo {
  key: ContentPage;
  label: string;
  description: string;
  icon: string;
}

export const WEBSITE_PAGES: WebsitePageInfo[] = [
  { key: "homepage", label: "Homepage", description: "Edit hero, featured puppies, and homepage sections", icon: "home" },
  { key: "about", label: "About Us", description: "Your story, location, guarantees, and policies", icon: "info" },
  { key: "puppies", label: "Puppies Page", description: "Edit the website content surrounding your puppy listings - not the puppies themselves.", icon: "paw" },
  { key: "contact", label: "Contact Us", description: "Contact info, hours, location, and form text", icon: "phone" },
  { key: "faq", label: "FAQ", description: "Manage questions and answers", icon: "help" },
  { key: "footer", label: "Footer", description: "Footer text, links, social media", icon: "link" },
];
