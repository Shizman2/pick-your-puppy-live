"use client";

import { useState } from "react";
import PhoneInput from "../../../components/PhoneInput";

type RadioGroupName = "gender" | "altBreed" | "delivery";

export default function FinderForm() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [breed, setBreed] = useState("");
  const [gender, setGender] = useState("");
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [budget, setBudget] = useState("");
  const [timeframe, setTimeframe] = useState("");
  const [altBreed, setAltBreed] = useState("");
  const [delivery, setDelivery] = useState("");
  const [notes, setNotes] = useState("");
  const [readyToSearch, setReadyToSearch] = useState(false);
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState(""); // honeypot

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  function RadioGroup({
    name,
    value,
    onChange,
    options,
  }: {
    name: RadioGroupName;
    value: string;
    onChange: (v: string) => void;
    options: { value: string; label: string }[];
  }) {
    return (
      <div className="radio-group">
        {options.map((opt) => (
          <div
            key={opt.value}
            className={`radio-pill${value === opt.value ? " pp-selected" : ""}`}
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </div>
        ))}
      </div>
    );
  }

  async function handleSubmit() {
    setError("");
    if (!firstName.trim() || (!phone.trim() && !email.trim())) {
      setError("Please enter your first name and at least a phone number or email.");
      return;
    }
    if (!readyToSearch) {
      setError("Please confirm you're ready to start your Puppy Finder search before submitting.");
      return;
    }
    if (!consent) {
      setError("Please check the box consenting to be contacted before submitting.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/inquire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inquiryType: "puppy_finder",
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          city: city.trim(),
          state: state.trim(),
          breed: breed.trim(),
          genderPreference: gender,
          size,
          color: color.trim(),
          budgetRange: budget,
          timeframe,
          considerAnotherBreed: altBreed,
          deliveryNeeded: delivery,
          notes: notes.trim(),
          readyToStartSearch: readyToSearch,
          consentToContact: consent,
          website,
          sourceUrl: typeof window !== "undefined" ? window.location.href : "/puppy-finder",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
      } else {
        setError(data.error || "Something went wrong. Please try again.");
        setSubmitting(false);
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="form-card">
        <div className="success-msg">
          <h2>You&rsquo;re All Set! ✓</h2>
          <p>We&rsquo;ve received your puppy search request and will be in touch soon with options.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="form-card" id="finderForm">
      <div className="form-title">Let&rsquo;s Find Your Perfect Puppy</div>
      <div className="form-sub">Fill out the form below and we&rsquo;ll get started!</div>

      {error && <div className="error-msg">{error}</div>}

      <input
        type="text"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        style={{ position: "absolute", left: "-9999px" }}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />

      <div className="form-section-label">Your Information</div>
      <div className="form-row">
        <div className="form-field">
          <label>First Name</label>
          <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        </div>
        <div className="form-field">
          <label>Last Name</label>
          <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </div>
      </div>
      <div className="form-row">
        <div className="form-field">
          <label>Email Address</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="form-field">
          <label>Phone Number</label>
          <PhoneInput value={phone} onChange={setPhone} />
        </div>
      </div>
      <div className="form-row">
        <div className="form-field">
          <label>City</label>
          <input type="text" value={city} onChange={(e) => setCity(e.target.value)} />
        </div>
        <div className="form-field">
          <label>State</label>
          <input type="text" value={state} onChange={(e) => setState(e.target.value)} />
        </div>
      </div>

      <div className="form-section-label">Puppy Preferences</div>
      <div className="form-field">
        <label>Breed (or type)</label>
        <input type="text" placeholder="e.g. Yorkie, Maltipoo, or Not Sure" value={breed} onChange={(e) => setBreed(e.target.value)} />
      </div>
      <div className="form-field">
        <label>Gender</label>
        <RadioGroup
          name="gender"
          value={gender}
          onChange={setGender}
          options={[
            { value: "male", label: "Male" },
            { value: "female", label: "Female" },
            { value: "either", label: "Either" },
          ]}
        />
      </div>
      <div className="form-field">
        <label>Preferred Size</label>
        <select value={size} onChange={(e) => setSize(e.target.value)}>
          <option value="">Select...</option>
          <option value="toy">Toy</option>
          <option value="small">Small</option>
          <option value="medium">Medium</option>
          <option value="no_preference">No Preference</option>
        </select>
      </div>
      <div className="form-field">
        <label>Preferred Color</label>
        <input type="text" placeholder="e.g. Apricot, Black & White" value={color} onChange={(e) => setColor(e.target.value)} />
      </div>
      <div className="form-field">
        <label>Maximum Budget</label>
        <select value={budget} onChange={(e) => setBudget(e.target.value)}>
          <option value="">Select...</option>
          <option value="1250-1500">$1,250 - $1,500</option>
          <option value="1500-2000">$1,500 - $2,000</option>
          <option value="2000+">$2,000+</option>
          <option value="flexible">Flexible</option>
        </select>
      </div>
      <div className="form-field">
        <label>When Are You Looking?</label>
        <select value={timeframe} onChange={(e) => setTimeframe(e.target.value)}>
          <option value="">Select...</option>
          <option value="asap">ASAP</option>
          <option value="30_days">Within 30 Days</option>
          <option value="1_3_months">1-3 Months</option>
          <option value="just_researching">Just Researching</option>
        </select>
      </div>
      <div className="form-field">
        <label>Would You Consider Another Breed?</label>
        <RadioGroup
          name="altBreed"
          value={altBreed}
          onChange={setAltBreed}
          options={[
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" },
            { value: "maybe", label: "Maybe" },
          ]}
        />
      </div>
      <div className="form-field">
        <label>Do You Need Delivery?</label>
        <RadioGroup
          name="delivery"
          value={delivery}
          onChange={setDelivery}
          options={[
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" },
            { value: "not_sure", label: "Not Sure Yet" },
          ]}
        />
      </div>
      <div className="form-field">
        <label>Additional Details</label>
        <textarea
          rows={4}
          placeholder="Tell us anything that would help us find your perfect puppy."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <div className="form-field" style={{ marginTop: 16 }}>
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={readyToSearch}
            onChange={(e) => setReadyToSearch(e.target.checked)}
            required
          />
          <span>
            <span className="checkbox-row-main">Yes, I&rsquo;m ready to start my Puppy Finder search.</span>
            <span className="checkbox-row-sub">
              I understand The Puppy Plugs will personally search for 3&ndash;4 puppy options based on what
              I&rsquo;m looking for.
            </span>
          </span>
        </label>
      </div>
      <div className="form-field">
        <label className="checkbox-row">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} required />
          I agree to be contacted by phone, text, or email about my Puppy Finder request.
        </label>
      </div>

      <button className="pp-btn-primary" onClick={handleSubmit} disabled={submitting}>
        {submitting ? "Submitting..." : "START MY PUPPY SEARCH →"}
      </button>
      <div style={{ textAlign: "center", fontSize: 11, color: "var(--pp-muted)", fontWeight: 600, marginTop: 10 }}>
        🔒 Your information is safe and secure.
      </div>
    </div>
  );
}
