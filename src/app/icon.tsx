import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 7,
          background: "#0F0F10",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            color: "#F5B400",
            fontSize: 21,
            fontWeight: 900,
            lineHeight: 1,
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
