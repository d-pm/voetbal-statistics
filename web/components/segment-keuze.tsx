"use client";

import type { ReactNode } from "react";

type Optie<T> = { waarde: T; label: ReactNode; uitleg?: string };

/**
 * Keuzeknop met vakjes naast elkaar, zoals de "segmented control" op een iPhone.
 * Het witte blokje (de "duim") schuift naar de optie die je kiest.
 */
export function SegmentKeuze<T extends string | boolean>({
  label,
  opties,
  gekozen,
  onKies,
  className = "",
}: {
  label: string;
  opties: Optie<T>[];
  gekozen: T;
  onKies: (waarde: T) => void;
  className?: string;
}) {
  const index = opties.findIndex((optie) => optie.waarde === gekozen);

  return (
    <div
      role="group"
      aria-label={label}
      className={`relative grid rounded-[9px] bg-vulling p-0.5 ${className}`}
      style={{ gridTemplateColumns: `repeat(${opties.length}, minmax(0, 1fr))` }}
    >
      <span
        aria-hidden
        className="absolute inset-y-0.5 left-0.5 rounded-[7px] bg-duim shadow-[0_3px_8px_rgb(0_0_0/0.12),0_3px_1px_rgb(0_0_0/0.04)] transition-transform duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] motion-reduce:transition-none"
        style={{
          width: `calc((100% - 4px) / ${opties.length})`,
          transform: `translateX(${index * 100}%)`,
        }}
      />
      {opties.map((optie) => {
        const actief = optie.waarde === gekozen;
        return (
          <button
            key={String(optie.waarde)}
            type="button"
            onClick={() => onKies(optie.waarde)}
            aria-pressed={actief}
            aria-label={optie.uitleg}
            className={`relative h-8 truncate rounded-[7px] px-2 text-[13px] outline-none transition-opacity focus-visible:ring-2 focus-visible:ring-accent/50 ${
              actief ? "font-semibold" : "font-medium active:opacity-50"
            }`}
          >
            {optie.label}
          </button>
        );
      })}
    </div>
  );
}
