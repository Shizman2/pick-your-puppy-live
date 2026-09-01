"use client";

import { useEffect, useRef } from "react";
import { formatPhoneAsYouType } from "../lib/phone";

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  id?: string;
  required?: boolean;
  autoComplete?: string;
}

/**
 * Drop-in replacement for <input type="tel">, used by every phone
 * field across the public lead-capture forms and the admin Add
 * Contact/Settings forms - one shared place for "format as you type"
 * instead of duplicating it per form.
 *
 * Reformats to 609-440-6809 as digits accumulate (see
 * formatPhoneAsYouType in lib/phone.ts). A naive reformat-on-every-
 * keystroke approach snaps a controlled input's cursor to the end
 * after each key, which makes correcting a number in the middle of the
 * string unusable - this tracks how many digits preceded the cursor
 * before reformatting, then restores the cursor after the same digit
 * in the reformatted value. Paste and typing with or without
 * punctuation both flow through the same path.
 */
export default function PhoneInput({
  value,
  onChange,
  className,
  placeholder,
  id,
  required,
  autoComplete,
}: PhoneInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingCursorRef = useRef<number | null>(null);

  useEffect(() => {
    if (pendingCursorRef.current !== null && inputRef.current) {
      inputRef.current.setSelectionRange(pendingCursorRef.current, pendingCursorRef.current);
      pendingCursorRef.current = null;
    }
  }, [value]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const rawValue = e.target.value;
    const cursorPos = e.target.selectionStart ?? rawValue.length;
    const digitsBeforeCursor = rawValue.slice(0, cursorPos).replace(/\D/g, "").length;

    const formatted = formatPhoneAsYouType(rawValue);

    let newPos = formatted.length;
    if (digitsBeforeCursor === 0) {
      newPos = 0;
    } else {
      let seen = 0;
      for (let i = 0; i < formatted.length; i++) {
        if (/\d/.test(formatted[i])) seen++;
        if (seen === digitsBeforeCursor) {
          newPos = i + 1;
          break;
        }
      }
    }

    pendingCursorRef.current = newPos;
    onChange(formatted);
  }

  return (
    <input
      ref={inputRef}
      type="tel"
      inputMode="tel"
      className={className}
      placeholder={placeholder}
      value={value}
      onChange={handleChange}
      id={id}
      required={required}
      autoComplete={autoComplete}
    />
  );
}
