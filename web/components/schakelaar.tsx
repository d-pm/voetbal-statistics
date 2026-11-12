"use client";

/** Een aan/uit-schakelaar zoals in de Instellingen van een iPhone. */
export function Schakelaar({ aan, onWissel }: { aan: boolean; onWissel: (aan: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={aan}
      onClick={() => onWissel(!aan)}
      className={`relative h-[28px] w-[46px] shrink-0 rounded-full outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-kaart ${
        aan ? "bg-accent" : "bg-vulling"
      }`}
    >
      <span
        aria-hidden
        className={`absolute left-[2px] top-[2px] size-6 rounded-full bg-white shadow-[0_2px_5px_rgb(0_0_0/0.2)] transition-transform duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] motion-reduce:transition-none ${
          aan ? "translate-x-[18px]" : ""
        }`}
      />
    </button>
  );
}
