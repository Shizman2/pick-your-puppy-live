"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { CalendarIcon, ChevronDownIcon } from "./icons";
import type { DateRangeKey } from "../../../lib/analytics/queries";

const OPTIONS: { key: DateRangeKey; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "7d", label: "Last 7 Days" },
  { key: "30d", label: "Last 30 Days" },
];

export default function AnalyticsDateFilter({ current }: { current: DateRangeKey }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  const currentLabel = OPTIONS.find((o) => o.key === current)?.label || "Last 7 Days";

  return (
    <div className="analytics-date-filter" ref={wrapRef}>
      <button type="button" className="analytics-date-btn" onClick={() => setOpen((v) => !v)}>
        <CalendarIcon />
        {currentLabel}
        <ChevronDownIcon />
      </button>
      {open && (
        <div className="analytics-date-menu">
          {OPTIONS.map((o) => (
            <button
              key={o.key}
              type="button"
              className={`analytics-date-option${o.key === current ? " active" : ""}`}
              onClick={() => {
                setOpen(false);
                router.push(`${pathname}?range=${o.key}`);
              }}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
