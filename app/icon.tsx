import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(circle, #00ff88 0%, #007a40 60%, #00120a 100%)",
          borderRadius: 14,
          color: "#0a1410",
          fontSize: 44,
          fontWeight: 900,
          fontFamily: "Inter, sans-serif",
          letterSpacing: -2,
        }}
      >
        α
      </div>
    ),
    { ...size },
  );
}
