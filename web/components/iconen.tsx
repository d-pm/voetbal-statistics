// Kleine icoontjes als SVG. Ze nemen de tekstkleur over (currentColor),
// dus met een class zoals text-accent kleur je ze.

import type { ReactNode } from "react";

type IcoonProps = { className?: string };

function Icoon({ className = "size-4", children }: IcoonProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      {children}
    </svg>
  );
}

export function Vergrootglas(props: IcoonProps) {
  return (
    <Icoon {...props}>
      <circle cx="7" cy="7" r="4.75" />
      <path d="m10.5 10.5 3.5 3.5" />
    </Icoon>
  );
}

export function PijlRechts(props: IcoonProps) {
  return (
    <Icoon {...props}>
      <path d="m6 3.5 4.5 4.5L6 12.5" />
    </Icoon>
  );
}

export function PijlOmlaag(props: IcoonProps) {
  return (
    <Icoon {...props}>
      <path d="m4 6 4 4 4-4" />
    </Icoon>
  );
}

export function PijlenOpNeer(props: IcoonProps) {
  return (
    <Icoon {...props}>
      <path d="m5 6 3-3 3 3M5 10l3 3 3-3" />
    </Icoon>
  );
}

export function Volgorde(props: IcoonProps) {
  return (
    <Icoon {...props}>
      <path d="M8 2.5v11m-4-4 4 4 4-4" />
    </Icoon>
  );
}

export function Waarschuwing(props: IcoonProps) {
  return (
    <Icoon {...props}>
      <path d="M7.13 2.5a1 1 0 0 1 1.74 0l5.6 9.75a1 1 0 0 1-.87 1.5H2.4a1 1 0 0 1-.87-1.5Z" />
      <path d="M8 6.25v2.75M8 11.25v.01" />
    </Icoon>
  );
}

export function Kruis(props: IcoonProps) {
  return (
    <Icoon {...props}>
      <path d="m4.5 4.5 7 7m0-7-7 7" />
    </Icoon>
  );
}

export function PijlLinks(props: IcoonProps) {
  return (
    <Icoon {...props}>
      <path d="M10 3.5 5.5 8l4.5 4.5" />
    </Icoon>
  );
}

export function Kruisje(props: IcoonProps) {
  return (
    <Icoon {...props}>
      <circle cx="8" cy="8" r="6.25" />
      <path d="m5.75 5.75 4.5 4.5m0-4.5-4.5 4.5" />
    </Icoon>
  );
}

// ---- Iets grotere iconen voor de navigatie ----

function GrootIcoon({ className = "size-6", children }: IcoonProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      {children}
    </svg>
  );
}

export function Huis(props: IcoonProps) {
  return (
    <GrootIcoon {...props}>
      <path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1Z" />
    </GrootIcoon>
  );
}

export function Persoon(props: IcoonProps) {
  return (
    <GrootIcoon {...props}>
      <circle cx="12" cy="8" r="3.75" />
      <path d="M4.75 20c.7-3.7 3.6-5.5 7.25-5.5s6.55 1.8 7.25 5.5" />
    </GrootIcoon>
  );
}

export function Kalender(props: IcoonProps) {
  return (
    <GrootIcoon {...props}>
      <rect x="4" y="5.5" width="16" height="14.5" rx="2.5" />
      <path d="M4 10.25h16M8.5 3.5v4M15.5 3.5v4" />
    </GrootIcoon>
  );
}

export function Schuifjes(props: IcoonProps) {
  return (
    <Icoon {...props}>
      <path d="M2.5 4.5h6m3 0h2M2.5 11.5h2m3 0h6" />
      <circle cx="10" cy="4.5" r="1.5" />
      <circle cx="6" cy="11.5" r="1.5" />
    </Icoon>
  );
}

export function Delen(props: IcoonProps) {
  return (
    <Icoon {...props}>
      <path d="M8 1.75v8.5M5 4.5l3-2.75 3 2.75" />
      <path d="M5.5 7H4.25a1 1 0 0 0-1 1v5.25a1 1 0 0 0 1 1h7.5a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1H10.5" />
    </Icoon>
  );
}

export function Vinkje(props: IcoonProps) {
  return (
    <Icoon {...props}>
      <path d="m3.5 8.5 3 3 6-7" />
    </Icoon>
  );
}
