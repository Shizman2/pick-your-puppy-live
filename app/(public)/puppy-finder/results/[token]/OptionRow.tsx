"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { chooseOption } from "./actions";
import { formatOptionPrice } from "../../../../../lib/puppyFinderTypes";
import { transformPhotoUrl } from "../../../../../lib/puppyFinderImage";
import type { ProposalStatus, PuppyFinderOptionRow } from "../../../../../lib/puppyFinderTypes";

// The main photo displays at ~320-340 CSS px wide (see .pfr-option-photo-wrap
// in results.css) - requesting ~2x that width gives a sharp image on
// high-density phone screens without shipping the full ~1600px original.
const MAIN_PHOTO_TRANSFORM = { width: 640, height: 800, resize: "cover" as const };
// Thumbnails render at 64 CSS px - a small transform is plenty even at 2-3x density.
const THUMB_PHOTO_TRANSFORM = { width: 160, height: 160, resize: "cover" as const };

export default function OptionRow({
  token,
  option,
  proposalStatus,
  isFirst,
}: {
  token: string;
  option: PuppyFinderOptionRow;
  proposalStatus: ProposalStatus;
  isFirst: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState(0);

  const photos = option.photo_urls && option.photo_urls.length > 0 ? option.photo_urls : [""];
  const isWithdrawn = option.status === "withdrawn";
  const alreadyChoseAnother = proposalStatus !== "proposed" && !option.is_selected;
  const canChoose = proposalStatus === "proposed" && !isWithdrawn;

  function handleChoose() {
    setError(null);
    startTransition(async () => {
      const result = await chooseOption(token, option.id);
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  const hasQuickInfo = option.breed || option.gender || option.age_text || option.color || option.size_text;

  const statusChip = isWithdrawn
    ? { label: "No Longer Available", variant: "withdrawn" }
    : option.is_selected
      ? { label: "Your Selection", variant: "selected" }
      : alreadyChoseAnother
        ? { label: "Not Selected", variant: "not-selected" }
        : { label: "Available", variant: "available" };

  return (
    <div className={`pfr-option${isWithdrawn ? " pfr-option--withdrawn" : ""}`}>
      <div className="pfr-option-gallery">
        <div className="pfr-option-photo-wrap">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={transformPhotoUrl(photos[active], MAIN_PHOTO_TRANSFORM)}
            alt={option.name || option.breed || "Puppy"}
            className="pfr-option-photo"
            loading={isFirst ? "eager" : "lazy"}
          />
        </div>

        {photos.length > 1 && (
          <div className="pfr-thumb-row">
            {photos.map((src, i) => (
              <div
                key={src + i}
                className={`pfr-thumb${i === active ? " pfr-thumb-active" : ""}`}
                onClick={() => setActive(i)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={transformPhotoUrl(src, THUMB_PHOTO_TRANSFORM)} alt="" loading="lazy" />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="pfr-option-info">
        <div className="pfr-option-name-row">
          {option.name && <h2 className="pfr-option-name">{option.name}</h2>}
          <span className={`pfr-status-chip pfr-status-chip--${statusChip.variant}`}>{statusChip.label}</span>
        </div>

        {hasQuickInfo && (
          <div className="pfr-quick-info-grid">
            {option.breed && (
              <div className="pfr-qi-box">
                <div className="pfr-qi-label">Breed</div>
                <div className="pfr-qi-val">{option.breed}</div>
              </div>
            )}
            {option.gender && (
              <div className="pfr-qi-box">
                <div className="pfr-qi-label">Gender</div>
                <div className="pfr-qi-val">
                  {option.gender === "male" ? "♂ Male" : option.gender === "female" ? "♀ Female" : option.gender}
                </div>
              </div>
            )}
            {option.age_text && (
              <div className="pfr-qi-box">
                <div className="pfr-qi-label">Age</div>
                <div className="pfr-qi-val">{option.age_text}</div>
              </div>
            )}
            {option.color && (
              <div className="pfr-qi-box">
                <div className="pfr-qi-label">Color</div>
                <div className="pfr-qi-val">{option.color}</div>
              </div>
            )}
            {option.size_text && (
              <div className="pfr-qi-box">
                <div className="pfr-qi-label">Size</div>
                <div className="pfr-qi-val">{option.size_text}</div>
              </div>
            )}
          </div>
        )}

        {option.price_cents !== null && (
          <>
            <div className="pfr-option-price">{formatOptionPrice(option.price_cents)}</div>
            <div className="pfr-option-price-note">✓ Puppy Finder service included</div>
          </>
        )}

        {option.description && (
          <div className="pfr-option-section">
            <div className="pfr-option-section-title">About This Puppy</div>
            <p className="pfr-option-desc">{option.description}</p>
          </div>
        )}

        {option.health_notes && (
          <div className="pfr-option-section">
            <div className="pfr-option-section-title">Health &amp; Vaccine Info</div>
            <p className="pfr-option-desc">{option.health_notes}</p>
          </div>
        )}

        {error && <div className="pfr-option-error">{error}</div>}

        {isWithdrawn ? (
          <button className="pp-btn-outline" disabled style={{ opacity: 0.6, cursor: "default" }}>
            No Longer Available
          </button>
        ) : option.is_selected ? (
          <button className="pp-btn-primary" disabled style={{ opacity: 0.85, cursor: "default" }}>
            ✓ You Selected This Puppy
          </button>
        ) : alreadyChoseAnother ? (
          <button className="pp-btn-outline" disabled style={{ opacity: 0.6, cursor: "default" }}>
            Not Selected
          </button>
        ) : (
          <button className="pp-btn-primary" onClick={handleChoose} disabled={isPending || !canChoose}>
            {isPending ? "Saving..." : "Choose This Puppy"}
          </button>
        )}
      </div>
    </div>
  );
}
