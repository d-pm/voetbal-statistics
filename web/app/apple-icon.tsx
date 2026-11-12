import { ImageResponse } from "next/og";

// Het icoon dat je ziet als je de site op een iPhone "Op beginscherm" zet.
// iOS rondt de hoeken zelf af, daarom is het vlak hier vierkant.

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcoon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(180deg, #3ddc6c, #1a7f37)",
        }}
      >
        <svg width="180" height="180" viewBox="0 0 64 64">
          <g fill="none" stroke="#fff" strokeLinecap="round">
            <circle cx="27.5" cy="27.5" r="14" strokeWidth="4.5" />
            <path d="M27.5 15.5v24" strokeWidth="2.25" strokeOpacity="0.85" />
            <circle cx="27.5" cy="27.5" r="4.75" strokeWidth="2.25" strokeOpacity="0.85" />
            <path d="m38.5 38.5 9 9" strokeWidth="6.5" />
          </g>
        </svg>
      </div>
    ),
    size,
  );
}
