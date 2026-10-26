"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { FALLBACK_PHOTO } from "@/lib/photos";

/** next/image with a graceful fallback when a photo fails to load. Parent must be position:relative. */
export default function SmartImage({ src, alt, sizes = "(max-width: 768px) 100vw, 400px", priority = false, className }) {
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [src]);
  return (
    <Image
      src={broken || !src ? FALLBACK_PHOTO : src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className={className}
      unoptimized={broken || !src}
      style={{ objectFit: "cover" }}
      onError={() => setBroken(true)}
    />
  );
}
