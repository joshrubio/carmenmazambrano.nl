import { ImageResponse } from "next/og";
import { site } from "@/lib/site";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `${site.name} — News, culture & community from Rotterdam`;

const headline = {
  fontFamily: "serif",
  fontSize: "120px",
  fontWeight: 900,
  lineHeight: 0.95,
  color: "#1A1A1A",
  letterSpacing: "-0.02em",
} as const;

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#FAF7F0",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: "60px",
          borderTop: "12px solid #8B1A1A",
        }}
      >
        {/* Label row */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
          <div style={{ width: "40px", height: "4px", background: "#8B1A1A", display: "flex" }} />
          <span
            style={{
              fontFamily: "serif",
              fontSize: "16px",
              fontWeight: 600,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "#8B1A1A",
            }}
          >
            News, culture &amp; community
          </span>
        </div>

        {/* Nameplate */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0px" }}>
          <span style={headline}>The New</span>
          <span style={headline}>Paper</span>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: "40px",
            paddingTop: "20px",
            borderTop: "1px solid #CCCCCC",
          }}
        >
          <span style={{ fontFamily: "sans-serif", fontSize: "18px", color: "#555555" }}>
            Rotterdam, Netherlands
          </span>
          <span style={{ fontFamily: "sans-serif", fontSize: "18px", color: "#555555" }}>
            {site.domain}
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
