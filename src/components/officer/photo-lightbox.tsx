"use client";

import { useEffect, useState } from "react";
import { X, ZoomIn } from "lucide-react";

export function PhotoLightbox({ src, index, count }: { src: string; index: number; count: number }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group relative block overflow-hidden rounded-lg border bg-muted"
      >
        <img
          src={src}
          alt={`evidence ${index}`}
          className="aspect-video w-full object-contain transition group-hover:scale-[1.01]"
        />
        <span className="absolute bottom-1.5 right-1.5 inline-flex items-center gap-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
          <ZoomIn className="h-3 w-3" /> {index}/{count}
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setOpen(false)}
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="max-h-[92vh] max-w-[94vw]" onClick={(e) => e.stopPropagation()}>
            <img src={src} alt={`evidence ${index}`} className="max-h-[92vh] max-w-[94vw] rounded-lg object-contain shadow-2xl" />
            <p className="mt-2 text-center text-xs text-white/70">
              {index} / {count}
            </p>
          </div>
        </div>
      )}
    </>
  );
}