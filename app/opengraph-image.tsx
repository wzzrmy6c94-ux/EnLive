import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "EnLive live music leaderboards";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background:
            "linear-gradient(135deg, #100914 0%, #24102d 45%, #5b1749 100%)",
          color: "#fff7fb",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          justifyContent: "center",
          padding: "72px",
          width: "100%",
        }}
      >
        <div
          style={{
            color: "#ff66b3",
            fontSize: 98,
            fontWeight: 900,
            letterSpacing: 0,
            lineHeight: 1,
            marginBottom: 28,
          }}
        >
          EnLive
        </div>
        <div
          style={{
            fontSize: 42,
            fontWeight: 700,
            lineHeight: 1.2,
            maxWidth: 880,
            textAlign: "center",
          }}
        >
          Fan-powered live music ratings, venue rankings, and artist leaderboards
        </div>
        <div
          style={{
            color: "#f6bddc",
            fontSize: 26,
            marginTop: 34,
          }}
        >
          Discover the live music scene by city
        </div>
      </div>
    ),
    size,
  );
}
