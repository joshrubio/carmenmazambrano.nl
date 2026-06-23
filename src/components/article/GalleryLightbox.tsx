"use client";

import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import type { GalleryImage } from "@/lib/articles";

interface Props {
  images: GalleryImage[];
  caption?: string;
}

export function GalleryLightbox({ images, caption }: Props) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  const prev = useCallback(() => setIndex((i) => (i - 1 + images.length) % images.length), [images.length]);
  const next = useCallback(() => setIndex((i) => (i + 1) % images.length), [images.length]);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, prev, next, close]);

  return (
    <>
      <figure className="my-8">
        <div
          className={`grid gap-2 ${
            images.length === 2
              ? "grid-cols-2"
              : images.length >= 3
              ? "grid-cols-2 md:grid-cols-3"
              : "grid-cols-1"
          }`}
        >
          {images.map((img, j) => (
            <button
              key={j}
              onClick={() => { setIndex(j); setOpen(true); }}
              className="relative aspect-[4/3] overflow-hidden cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              aria-label={img.alt}
            >
              <Image
                src={img.src}
                alt={img.alt}
                fill
                className="object-cover hover:scale-105 transition-transform duration-500"
              />
            </button>
          ))}
        </div>
        {caption && (
          <figcaption className="label text-dim font-normal normal-case tracking-wide mt-2 italic text-center">
            {caption}
          </figcaption>
        )}
      </figure>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={close}
        >
          {/* Image container */}
          <div
            className="relative max-w-5xl max-h-[90vh] w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full h-[80vh]">
              <Image
                src={images[index].src}
                alt={images[index].alt}
                fill
                className="object-contain"
                sizes="(max-width: 1280px) 100vw, 1280px"
              />
            </div>
            {images[index].caption && (
              <p className="text-center text-white/70 text-sm mt-2 font-body italic">
                {images[index].caption}
              </p>
            )}
          </div>

          {/* Close */}
          <button
            onClick={close}
            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors text-3xl leading-none"
            aria-label="Close"
          >
            ×
          </button>

          {/* Prev / Next */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prev(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors text-4xl leading-none px-2"
                aria-label="Previous"
              >
                ‹
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); next(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors text-4xl leading-none px-2"
                aria-label="Next"
              >
                ›
              </button>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                {images.map((_, j) => (
                  <button
                    key={j}
                    onClick={(e) => { e.stopPropagation(); setIndex(j); }}
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${j === index ? "bg-white" : "bg-white/40"}`}
                    aria-label={`Go to image ${j + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
