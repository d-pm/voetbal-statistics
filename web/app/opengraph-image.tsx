import { ImageResponse } from "next/og";

// De afbeelding die verschijnt als je een link naar de site deelt, bv. in WhatsApp.

export const alt = "Voetbal Scout: vind de speler die je club zoekt";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Deelafbeelding() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          color: "#fff",
          background: "radial-gradient(circle at 85% 15%, #2a9d4a 0%, #0d4a22 55%, #06240f 100%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <div
            style={{
              width: 112,
              height: 112,
              borderRadius: 26,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(180deg, #3ddc6c, #1a7f37)",
              boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
            }}
          >
            <svg width="112" height="112" viewBox="0 0 64 64">
              <g fill="none" stroke="#fff" strokeLinecap="round">
                <circle cx="27.5" cy="27.5" r="14" strokeWidth="4.5" />
                <path d="M27.5 15.5v24" strokeWidth="2.25" strokeOpacity="0.85" />
                <circle cx="27.5" cy="27.5" r="4.75" strokeWidth="2.25" strokeOpacity="0.85" />
                <path d="m38.5 38.5 9 9" strokeWidth="6.5" />
              </g>
            </svg>
          </div>
          <div style={{ fontSize: 52, fontWeight: 700, letterSpacing: -1.5 }}>Voetbal Scout</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 84, fontWeight: 700, lineHeight: 1.02, letterSpacing: -3, maxWidth: 900 }}>
            Vind de speler die je club zoekt.
          </div>
          <div style={{ fontSize: 34, color: "rgba(255,255,255,0.75)" }}>
            Een eigen opdracht per speeldag · echte Premier League-cijfers
          </div>
        </div>
      </div>
    ),
    size,
  );
}
