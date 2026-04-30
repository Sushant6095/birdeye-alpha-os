import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
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
          color: "#0a1410",
          fontSize: 130,
          fontWeight: 900,
          fontFamily: "Inter, sans-serif",
          letterSpacing: -4,
        }}
      >
        α
      </div>
    ),
    { ...size },
  );
}
