export interface BreedRow {
  id: string;
  name: string;
  expected_adult_size: string | null;
  description: string | null;
  // Breed Profile fields (supabase/025_breed_profiles.sql). expected_adult_size
  // is reused as "Typical Adult Weight" and description as "What [Breed] Life
  // Is Like" above - no separate columns for those two concepts.
  short_name: string | null;
  personality: string | null;
  energy_level: string | null;
  grooming_level: string | null;
  living_space_fit: string | null;
  companion_style: string | null;
  good_to_know: string | null;
  profile_image_url: string | null;
  show_profile: boolean;
  created_at: string;
  updated_at: string;
}
