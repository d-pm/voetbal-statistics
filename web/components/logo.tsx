// Het logo van Voetbal Scout: een vergrootglas met de middencirkel van een voetbalveld erin.
// Scouten = goed kijken naar voetbal. Hetzelfde merkteken staat in app/icon.svg.

/** Het merkteken in een groen app-icoon. */
export function Logo({ className = "size-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden className={className}>
      <defs>
        <linearGradient id="logo-groen" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3ddc6c" />
          <stop offset="1" stopColor="#1a7f37" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14.5" fill="url(#logo-groen)" />
      {/* Een dun licht randje bovenaan, alsof er licht op valt */}
      <rect x="0.5" y="0.5" width="63" height="63" rx="14" fill="none" stroke="#fff" strokeOpacity="0.18" />
      <Merkteken />
    </svg>
  );
}

/** Alleen het witte merkteken, zonder het groene vlak. */
export function Merkteken() {
  return (
    <g fill="none" stroke="#fff" strokeLinecap="round">
      {/* het glas */}
      <circle cx="27.5" cy="27.5" r="14" strokeWidth="4.5" />
      {/* de middenlijn en de middencirkel van het veld, in het glas */}
      <path d="M27.5 15.5v24" strokeWidth="2.25" strokeOpacity="0.85" />
      <circle cx="27.5" cy="27.5" r="4.75" strokeWidth="2.25" strokeOpacity="0.85" />
      {/* het handvat */}
      <path d="m38.5 38.5 9 9" strokeWidth="6.5" />
    </g>
  );
}
