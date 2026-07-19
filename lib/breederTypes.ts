export interface BreederRow {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  location: string | null;
  breeds: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
}
