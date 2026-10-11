-- Optional Mom / Dad photos for a puppy listing ("Meet the Parents").
--
-- One fixed slot per parent, stored as a single public URL each - kept
-- entirely separate from puppies.photo_urls so a parent photo can never
-- become the puppy's cover, card image, gallery image or favorites
-- thumbnail. Files live in the existing puppy-photos bucket under
-- puppies/{puppyId}/parents/. NULL = no photo for that parent.
--
-- Additive only: nullable columns, no defaults, existing rows untouched.

alter table puppies add column if not exists mother_photo_url text;
alter table puppies add column if not exists father_photo_url text;
