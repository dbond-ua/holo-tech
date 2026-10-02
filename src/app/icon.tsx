import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/** Favicon: the wordmark's charge-level mark — three ink bars, one signal. */
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
          gap: 2,
          background: "#151515",
          borderRadius: 4,
        }}
      >
        <div style={{ width: 4, height: 14, background: "#f4f3ef" }} />
        <div style={{ width: 4, height: 14, background: "#f4f3ef" }} />
        <div style={{ width: 4, height: 14, background: "#f4f3ef" }} />
        <div style={{ width: 4, height: 14, background: "#ff5a1f" }} />
      </div>
    ),
    { ...size }
  );
}
