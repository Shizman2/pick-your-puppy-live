export type ContentPage = "homepage" | "contact" | "faq" | "puppies" | "footer" | "puppy_finder" | "settings";
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

export interface FaqCategoryRow {
  id: string;
  title: string;
  icon: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface FaqItemRow {
  id: string;
  category_id: string;
  question: string;
  answer: string;
  display_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface FaqCategoryWithItems extends FaqCategoryRow {
  items: FaqItemRow[];
}

/** Small fixed set of icon keys the FAQ category editor can choose from. */
export const FAQ_ICON_OPTIONS: { key: string; label: string }[] = [
  { key: "paw", label: "Paw" },
  { key: "tag", label: "Price Tag" },
  { key: "shield-check", label: "Shield Check" },
  { key: "truck", label: "Truck" },
  { key: "help", label: "Question Mark" },
];

export interface WebsitePageInfo {
  key: ContentPage;
  label: string;
  description: string;
  icon: string;
}

export const WEBSITE_PAGES: WebsitePageInfo[] = [
  { key: "homepage", label: "Homepage", description: "Edit hero, featured puppies, and homepage sections", icon: "home" },
  { key: "puppies", label: "Puppies Page", description: "Edit the website content surrounding your puppy listings - not the puppies themselves.", icon: "paw" },
  { key: "contact", label: "Contact Us", description: "Contact info, hours, location, and form text", icon: "phone" },
  { key: "faq", label: "FAQ", description: "Manage questions and answers", icon: "help" },
  { key: "puppy_finder", label: "Puppy Finder", description: "Edit the concierge page's hero photo and other content", icon: "search" },
  { key: "footer", label: "Footer", description: "Footer text, links, social media", icon: "link" },
];
