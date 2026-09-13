"use client";

import { useState } from "react";
import { generateAffiliateUrl } from "../../lib/affiliateLinks";
import { formatPriceFromCents, STATUS_DISPLAY_LABEL } from "../../lib/puppyTypes";
import type { HomepagePuppy } from "../../lib/public-data/homepage";

function puppyCaption(puppy: HomepagePuppy, link: string): string {
  const gender = puppy.gender === "female" ? "female" : "male";
  return `Meet ${puppy.name}, a ${gender} ${puppy.breed} now available at The Puppy Plugs.\n\nSee photos, details, pricing, and availability here:\n\n${link}`;
}

function puppyFinderCaption(link: string): string {
  return `Can't find the puppy you want on the website?\n\nThe Puppy Plugs can help find options based on what you're looking for.\n\nGet started here:\n${link}`;
}

/**
 * V1 Marketing Center: Current Puppies + a Puppy Finder promo card only.
 * Deliberately built as two independent sections (this component just
 * renders them one after another) so a future creative library
 * (images, videos, testimonials, seasonal campaigns - see the ticket)
 * can be added as additional sections later without restructuring
 * what's already here.
 */
export default function MarketingCenterClient({ referralCode, puppies }: { referralCode: string; puppies: HomepagePuppy[] }) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  function copy(key: string, text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 2000);
    });
  }

  const finderLink = generateAffiliateUrl("/puppy-finder", referralCode);

  return (
    <div>
      <div className="profile-card">
        <h2 className="admin-card__title">Current Puppies</h2>
        {puppies.length === 0 ? (
          <p className="admin-hint">No puppies are currently available to promote.</p>
        ) : (
          <div className="partners-puppy-grid">
            {puppies.map((puppy) => {
              const link = generateAffiliateUrl(`/puppies/${puppy.slug}`, referralCode);
              const linkKey = `${puppy.id}-link`;
              const captionKey = `${puppy.id}-caption`;
              return (
                <div key={puppy.id} className="partners-puppy-card">
                  {puppy.photoUrl ? (
                    <img src={puppy.photoUrl} alt={puppy.name} className="partners-puppy-photo" />
                  ) : (
                    <div className="partners-puppy-photo partners-puppy-photo--empty">No photo</div>
                  )}
                  <div className="partners-puppy-info">
                    <div className="partners-puppy-name">{puppy.name}</div>
                    <div className="admin-hint">
                      {puppy.breed} · {puppy.gender === "female" ? "Female" : "Male"}
                    </div>
                    <div className="admin-hint">
                      {formatPriceFromCents(puppy.salePriceCents ?? puppy.priceCents)} · {STATUS_DISPLAY_LABEL[puppy.status]}
                    </div>
                  </div>
                  <div className="partners-puppy-actions">
                    <button type="button" className="admin-btn" onClick={() => copy(linkKey, link)}>
                      {copiedKey === linkKey ? "Copied!" : "Copy Referral Link"}
                    </button>
                    <button type="button" className="admin-btn" onClick={() => copy(captionKey, puppyCaption(puppy, link))}>
                      {copiedKey === captionKey ? "Copied!" : "Copy Caption"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="profile-card">
        <h2 className="admin-card__title">Can&apos;t find the puppy you&apos;re looking for?</h2>
        <p className="admin-hint" style={{ marginBottom: 12 }}>
          Promote our Puppy Finder service.
        </p>
        <div className="partners-puppy-actions">
          <button type="button" className="admin-btn" onClick={() => copy("finder-link", finderLink)}>
            {copiedKey === "finder-link" ? "Copied!" : "Copy Puppy Finder Link"}
          </button>
          <button type="button" className="admin-btn" onClick={() => copy("finder-caption", puppyFinderCaption(finderLink))}>
            {copiedKey === "finder-caption" ? "Copied!" : "Copy Caption"}
          </button>
        </div>
      </div>
    </div>
  );
}
