import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Conduit AI — Software, built with intent. Custom software, AI integrations and automation.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "56px 70px", background: "#f1f1e9", color: "#202823" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 25 }}><span>conduit ai</span><span style={{ fontSize: 17 }}>Custom software / AI / Automation</span></div>
      <div style={{ display: "flex", flexDirection: "column", fontSize: 106, lineHeight: 1, letterSpacing: -7 }}><span>Software,</span><span>built with intent.</span></div>
      <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #cbd0c6", paddingTop: 24, fontSize: 19 }}><span>Custom software · AI integrations · Automation</span><span>conduitai.io</span></div>
    </div>, size,
  );
}
