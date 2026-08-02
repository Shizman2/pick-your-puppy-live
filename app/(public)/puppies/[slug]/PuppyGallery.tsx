"use client";

import { useState } from "react";

export default function PuppyGallery({ photos, alt }: { photos: string[]; alt: string }) {
  const [active, setActive] = useState(0);
  const shown = photos.length > 0 ? photos : [""];

  return (
    <div className="gallery">
      <div className="main-photo">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={shown[active]} alt={alt} />
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
