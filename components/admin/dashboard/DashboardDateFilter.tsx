"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { CalendarIcon, ChevronDownIcon } from "../analytics/icons";
import type { DashboardPeriodKey } from "../../../lib/businessScorecard";

const OPTIONS: { key: DashboardPeriodKey; label: string }[] = [
  { key: "goal", label: "Active Goal Period" },
  { key: "7d", label: "Last 7 Days" },
  { key: "30d", label: "Last 30 Days" },
  { key: "90d", label: "Last 90 Days" },
];

/**
 * Same dropdown pattern/markup as AnalyticsDateFilter.tsx - this controls
 * the top 5 metric cards and the Marketing Performance card only. The Q4
 * Business Goal card always stays anchored to the goal's own start/end
 * dates regardless of this selector, the same way the live dashboard
 * already keeps "Revenue Today" and the Goal widget on independent
 * periods side by side.
 */
export default function DashboardDateFilter({ current, periodLabel }: { current: DashboardPeriodKey; periodLabel: string }) {
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

  return (
    <div className="analytics-date-filter" ref={wrapRef}>
      <button type="button" className="analytics-date-btn" onClick={() => setOpen((v) => !v)}>
        <CalendarIcon />
        {periodLabel}
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
                router.push(`${pathname}?period=${o.key}`);
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
