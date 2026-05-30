import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          borderRadius: 42,
          background: "linear-gradient(145deg, #1a1a1a 0%, #0F0F10 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "2px solid rgba(245,180,0,0.2)",
        }}
      >
        <span
          style={{
            color: "#F5B400",
            fontSize: 118,
            fontWeight: 900,
            lineHeight: 1,
            letterSpacing: "-5px",
            fontFamily: "sans-serif",
          }}
        >
          K
        </span>
      </div>
    ),
    { ...size }
  );
}
