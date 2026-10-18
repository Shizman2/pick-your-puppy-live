# Bently — Policy Decisions & Website FAQ Corrections (FOR APPROVAL)

## Policy questions: all resolved
| # | Topic | Approved decision |
|---|---|---|
| Q1 | Deposit amount | No standard deposit. Bently never quotes an amount; our team confirms each deposit individually. |
| Q2 | Transferring deposits | Possible case by case, at our team's discretion. Bently never guarantees or promises approval. |
| Q3 | Payment methods | Cash for puppy purchases (incl. payment in full at pickup); Cash App for required deposits; nothing else. |
| Q4 | Vet checks, vaccines, deworming | Standard for every puppy, including Puppy Finder puppies. Specific dates, findings and health details only from verified records. |
| Q5 | Health guarantee | Signed Health Guarantee is authoritative: vet exam within 10 days; 10-day illness coverage; 30-day congenital/hereditary; notice within 2 business days (certification within 5 days); its remedies, exclusions and buyer responsibilities. |
| Q6 | Delivery | Free pickup in Newark, DE; ground delivery to DE, MD, PA, NJ, NY, CT; flight nanny may be available elsewhere; our team confirms costs and arrangements. |
| Q7 | Seeing a puppy | Video calls available; our team confirms scheduling and availability. |
| Q8 | Bundle | Qualifying purchases; food listed as "puppy food" (no brand); our team confirms eligibility. |
| Q9 | Puppy Finder price | Generally $1,500 total, including the finding service. |
| Q10 | Local delivery | $50 for destinations less than one hour of travel time; no deposit; cash upon delivery; our team confirms arrangements and whether the address qualifies. Pickup stays free with no deposit; out-of-state delivery beyond the local area needs a deposit. |
| Q11 | Delaware delivery beyond one hour | our team confirms the delivery fee and whether a deposit is required. The out-of-state deposit rule does not apply automatically. |

No open policy questions remain.

---

## Website FAQ corrections (Admin → Website → FAQ) — not applied yet
Each correction uses only approved business information. Question wording is unchanged unless noted. The exact text that will be applied is in faq-corrections.json (same answers as below).

### 1. How do I reserve a puppy?
**Current problem:** tells customers to click "Reserve This Puppy" and fill out a form (that button no longer exists); says "a small deposit holds your puppy."
**Corrected answer:**
> Text or call our team using the Text or Call button on the puppy's page. our team will confirm availability and walk you through the next steps. No deposit is required if you're picking up an available puppy (pay in full with cash at pickup) or getting local delivery (pay in cash upon delivery). A deposit is only required for out-of-state delivery or Puppy Finder, and our team confirms the amount.

### 2. What breeds do you carry?
**Current problem:** says you specialize in Yorkies and Maltipoos; current listings are different breeds.
**Corrected answer:**
> Our available breeds change as new puppies are listed — see all current puppies on our Puppies page. If you don't see the breed you want, our Puppy Finder service can help you find one.

### 3. How much is the deposit?
**Current problem:** states a $200 deposit to hold any puppy.
**Corrected answer:**
> It depends on your situation. No deposit is required to pick up an available puppy — you can pay in full with cash at pickup. Local delivery (less than one hour away) also needs no deposit; you pay in cash upon delivery. A deposit is required for out-of-state delivery, and for Puppy Finder after you choose your puppy. our team confirms each deposit amount individually. Deposits are paid through Cash App.

### 4. What payment methods do you accept?
**Current problem:** lists Zelle, Venmo, CashApp and bank transfers.
**Corrected answer:**
> We accept cash for puppy purchases, including payment in full at pickup or upon local delivery. When a deposit is required, we accept Cash App. our team will confirm the amount and provide payment details.

### 5. What if I change my mind?
**Current problem:** broadly fine, but should match the signed Refund Policy and the transfer decision exactly.
**Corrected answer:**
> We understand life happens. Deposits are non-refundable if you change your mind. In some cases, our team may be able to transfer your deposit to a different puppy — this is decided case by case and isn't guaranteed.

### 6. Are the puppies vet checked?
**Current problem:** OK in substance; aligns with Q4 but should mention Puppy Finder puppies and records.
**Corrected answer:**
> Yes. Every puppy — including Puppy Finder puppies — receives a veterinary check, vaccinations, and deworming, and comes with health and shot records. Ask our team for any specific puppy's records.

### 7. Is there a health guarantee?
**Current problem:** describes only a 30-day hereditary guarantee with "replacement puppy or partial refund," which doesn't match the signed Health Guarantee.
**Corrected answer:**
> Yes. Every puppy comes with our written Health Guarantee. Have your puppy examined by a licensed veterinarian within 10 days of purchase. If within 10 days a vet determines in writing that your puppy is clinically ill, or within 30 days that it has a congenital or hereditary defect affecting its health, you may return the puppy for a full refund, return it for a replacement puppy of equal value, or keep it and be reimbursed for reasonable vet fees up to the purchase price. You must notify us within 2 business days of the vet's written certification. Full terms, conditions and exclusions are in the Health Guarantee you receive at purchase.

### 8. Do you offer delivery?
**Current problem:** promises delivery "anywhere in the United States" and fees "quoted when you reserve."
**Corrected answer:**
> Yes. Pickup in Newark, Delaware is free. Local delivery is $50 for destinations less than one hour away, with no deposit — you pay in cash upon delivery, and our team confirms whether your address qualifies. For out-of-state delivery beyond the local area, a deposit is required and our team confirms the amount. We offer ground delivery to Delaware, Maryland, Pennsylvania, New Jersey, New York, and Connecticut, and flight nanny arrangements may be available for other states.

### 9. Can I meet the puppy before buying?
**Current problem:** promises in-person meetings for locals; not part of approved policy.
**Corrected answer:**
> Yes — our team can arrange a video call so you can see your puppy before buying. Text or call him to schedule it. If you're picking up an available puppy, you'll meet your puppy at pickup in Newark, Delaware.

### 10. How are the puppies transported?
**Current problem:** claims licensed transport services, climate-controlled carriers, "never put in cargo," and photo updates — none of which are in approved policy.
**Recommended:** delete this entry (question 8 now covers delivery). If you'd rather keep it, use:
> We deliver by ground within Delaware, Maryland, Pennsylvania, New Jersey, New York, and Connecticut, and flight nanny arrangements may be available for other states. our team confirms the delivery arrangements and schedule with you directly.

### 11. "this is a test"
**Current problem:** test entry ("good stuff") is publicly visible.
**Recommended:** delete.

### Also in the code (separate item)
The FAQ page has a built-in backup copy of the old FAQ (`FALLBACK_CATEGORIES` in `app/(public)/faq/page.tsx`). It only shows if the database FAQ is ever empty, but it contains the same outdated answers (Yorkies/Maltipoos, $200 deposit, Zelle/Venmo, "anywhere in the US", 30-day-only guarantee). Recommend updating it to match the corrections above in the same change.

---

## Listing data gaps (separate — verify with our team before changing)
- MiMi's description says "Mindy" near the end.
- MiMi has no color set; the Shih Tzu listings have no location.
No listing information has been changed.
