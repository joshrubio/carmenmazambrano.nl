"use client";

import Image from "next/image";
import { useState } from "react";

interface Props {
  src: string;
  alt: string;
  grayscale?: boolean;
}

export function PhotoSlot({ src, alt, grayscale = false }: Props) {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-surface gap-3">
        <svg
          viewBox="0 0 120 160"
          className="w-24 opacity-30"
          fill="#1A1A1A"
          xmlns="http://www.w3.org/2000/svg"
        >
          <ellipse cx="60" cy="52" rx="32" ry="36" />
          <path d="M4 160 C4 110 116 110 116 160 Z" />
        </svg>
        <p className="label text-ink/40 font-normal normal-case tracking-wide">
          Photo coming soon
        </p>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      priority
      className={`object-cover object-top transition-all duration-300 ${grayscale ? "grayscale" : ""}`}
      onError={() => setError(true)}
    />
  );
}
