"use client";

import { useState } from "react";
import { optimizeAllExistingPuppyPhotos } from "../../../app/admin/puppies/actions";

export default function OptimizePhotosButton() {
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">("idle");
  const [summary, setSummary] = useState("");

  async function handleClick() {
    if (
      !confirm(
        "This resizes and re-compresses every existing puppy photo in storage to speed up the site. It can take a while for a large photo library and is safe to run again if it doesn't finish. Continue?"
      )
    ) {
      return;
    }

    setStatus("running");
    try {
      const result = await optimizeAllExistingPuppyPhotos();
      if (!result.success) {
        setStatus("error");
        setSummary(result.error);
        return;
      }
      setStatus("done");
      setSummary(
        `Processed ${result.processed} photo${result.processed === 1 ? "" : "s"}` +
          (result.skipped ? `, skipped ${result.skipped}` : "") +
          (result.errors.length ? `, ${result.errors.length} error(s)` : "")
      );
    } catch (err) {
      setStatus("error");
      setSummary(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
      <button
        type="button"
        className="admin-btn"
        onClick={handleClick}
        disabled={status === "running"}
        style={{ fontSize: 13 }}
      >
        {status === "running" ? "Optimizing photos..." : "Optimize Existing Photos"}
      </button>
      {summary && (
        <span style={{ fontSize: 11, color: status === "error" ? "#b91c1c" : "#6b7076" }}>{summary}</span>
      )}
    </div>
  );
}
