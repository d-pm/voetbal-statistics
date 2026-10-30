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
