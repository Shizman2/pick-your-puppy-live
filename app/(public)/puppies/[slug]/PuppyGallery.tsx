"use client";

import { useState } from "react";

export default function PuppyGallery({
  photos,
  alt,
  location,
}: {
  photos: string[];
  alt: string;
  location?: string | null;
}) {
  const [active, setActive] = useState(0);
  const shown = photos.length > 0 ? photos : [""];

  return (
    <div className="gallery">
      <div className="main-photo">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={shown[active]} alt={alt} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="main-photo-watermark" src="/watermark-logo.png" alt="" />
        {location && (
          <span className="main-photo-location">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none">
              <path d="M12 2a7 7 0 00-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 00-7-7z" fill="#1B7BFF" />
              <circle cx="12" cy="9" r="2.4" fill="#fff" />
            </svg>
            {location}
          </span>
        )}
      </div>
      {shown.length > 1 && (
        <div className="thumb-row">
          {shown.map((src, i) => (
            <div
              key={src + i}
              className={`thumb${i === active ? " pp-thumb-active" : ""}`}
              onClick={() => setActive(i)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`${alt} ${i + 1}`} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
