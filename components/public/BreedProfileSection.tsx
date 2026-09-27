import type { BreedRow } from "../../lib/breedTypes";

/**
 * Extracted directly from the approved reference (public/breed-icons/),
 * not redrawn - see the crop coordinates recorded when they were cut
 * out of the original icon sheet. One shared set across every future
 * Breed Profile, not Yorkie-specific.
 */
const ICON_SRC = {
  weight: "/breed-icons/weight.png",
  heart: "/breed-icons/heart.png",
  energy: "/breed-icons/energy.png",
  grooming: "/breed-icons/grooming.png",
  livingSpace: "/breed-icons/living-space.png",
  companion: "/breed-icons/companion.png",
  paw: "/breed-icons/paw.png",
  lightbulb: "/breed-icons/lightbulb.png",
} as const;

interface SnapshotItem {
  key: string;
  label: string;
  value: string;
  iconSrc: string;
}

/**
 * "Is a [Breed] Right for You?" - a reusable section on the public puppy
 * detail page (see app/(public)/puppies/[slug]/page.tsx) showing the
 * BREED's general profile, resolved from the centralized `breeds` table
 * (see lib/breeds.ts's getBreedForPuppyBreedString). Entirely data-driven
 * - no breed name is ever hardcoded here, so the same component renders
 * every future breed's profile without changes.
 *
 * Returns null (renders nothing) when there's no profile to show:
 * no matching breed row, show_profile is off, or - defensively, even
 * with show_profile on - literally nothing to display. Missing
 * individual fields (e.g. no image yet) are each skipped individually
 * rather than shown as empty/placeholder content, per the approved spec.
 */
export default function BreedProfileSection({ breed }: { breed: BreedRow | null }) {
  if (!breed || !breed.show_profile) return null;

  const displayName = breed.short_name?.trim() || breed.name;

  const candidateItems: (SnapshotItem | null)[] = [
    breed.expected_adult_size
      ? { key: "weight", label: "Typical Adult Weight", value: breed.expected_adult_size, iconSrc: ICON_SRC.weight }
      : null,
    breed.personality
      ? { key: "personality", label: "Personality", value: breed.personality, iconSrc: ICON_SRC.heart }
      : null,
    breed.energy_level
      ? { key: "energy", label: "Energy Level", value: breed.energy_level, iconSrc: ICON_SRC.energy }
      : null,
    breed.grooming_level
      ? { key: "grooming", label: "Grooming", value: breed.grooming_level, iconSrc: ICON_SRC.grooming }
      : null,
    breed.living_space_fit
      ? { key: "living", label: "Living-Space Fit", value: breed.living_space_fit, iconSrc: ICON_SRC.livingSpace }
      : null,
    breed.companion_style
      ? { key: "companion", label: "Companion Style", value: breed.companion_style, iconSrc: ICON_SRC.companion }
      : null,
  ];
  const snapshotItems: SnapshotItem[] = candidateItems.filter((item): item is SnapshotItem => item !== null);

  const hasLifestyle = Boolean(breed.description?.trim());
  const hasGoodToKnow = Boolean(breed.good_to_know?.trim());

  // Defensive only - not a completeness gate. show_profile is the real
  // publication control; this just avoids rendering an empty shell in
  // the edge case where it's on but nothing has been filled in yet.
  if (snapshotItems.length === 0 && !hasLifestyle && !hasGoodToKnow) return null;

  return (
    <div className="breed-profile-section">
      <div className="breed-profile-header">
        <div className="breed-profile-heading">Is a {displayName} Right for You?</div>
        {breed.profile_image_url && (
          <div className="breed-profile-header-img-wrap">
            <span className="breed-profile-header-decor-tick breed-profile-header-decor-tick--1" aria-hidden="true" />
            <span className="breed-profile-header-decor-tick breed-profile-header-decor-tick--2" aria-hidden="true" />
            <span className="breed-profile-header-decor-tick breed-profile-header-decor-tick--3" aria-hidden="true" />
            <img src={breed.profile_image_url} alt={breed.name} className="breed-profile-header-img" />
          </div>
        )}
      </div>

      {snapshotItems.length > 0 && (
        <>
          <div className="breed-profile-subheading">Breed Snapshot</div>
          <div className="breed-profile-grid">
            {snapshotItems.map((item) => (
              <div key={item.key} className="breed-profile-card">
                <span className="breed-profile-card-icon">
                  <img src={item.iconSrc} alt="" />
                </span>
                <div className="breed-profile-card-label">{item.label}</div>
                <div className="breed-profile-card-value">{item.value}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {hasLifestyle && (
        <div className="breed-profile-life">
          <div className="breed-profile-life-title">
            <span className="breed-profile-life-icon">
              <img src={ICON_SRC.paw} alt="" />
            </span>
            What {displayName} Life Is Like
          </div>
          <p className="breed-profile-life-text">{breed.description}</p>
        </div>
      )}

      {hasGoodToKnow && (
        <div className="breed-profile-know">
          <div className="breed-profile-know-title">
            <span className="breed-profile-know-icon">
              <img src={ICON_SRC.lightbulb} alt="" />
            </span>
            Good to Know
          </div>
          <p className="breed-profile-know-text">{breed.good_to_know}</p>
        </div>
      )}
    </div>
  );
}
