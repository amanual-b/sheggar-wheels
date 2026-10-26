"use client";
import { useEffect, useState } from "react";
import SmartImage from "@/components/SmartImage";

export default function CarGallery({ photos, title }) {
  const [index, setIndex] = useState(0);
  const list = photos && photos.length ? photos : [null];
  useEffect(() => setIndex(0), [photos]);
  const go = (n) => setIndex((n + list.length) % list.length);
  return (
    <section aria-label={`${title} photos`} aria-roledescription="carousel">
      <div className="gallery-main">
        <SmartImage src={list[index]} alt={`${title} - photo ${index + 1} of ${list.length}`} priority sizes="(max-width: 1080px) 100vw, 760px" />
        {list.length > 1 ? (
          <>
            <button type="button" className="gallery-nav prev" onClick={() => go(index - 1)} aria-label="Previous photo">‹</button>
            <button type="button" className="gallery-nav next" onClick={() => go(index + 1)} aria-label="Next photo">›</button>
          </>
        ) : null}
      </div>
      {list.length > 1 ? (
        <div className="thumbs">
          {list.map((p, i) => (
            <button key={p || i} type="button" className="thumb-btn" aria-current={i === index ? "true" : undefined} aria-label={`Show photo ${i + 1}`} onClick={() => setIndex(i)}>
              <SmartImage src={p} alt="" sizes="92px" />
            </button>
          ))}
        </div>
      ) : null}
      <p className="sr-only" aria-live="polite">Showing photo {index + 1} of {list.length}</p>
    </section>
  );
}
