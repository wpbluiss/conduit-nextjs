import { ImageResponse } from "next/og";
export const runtime = "edge";
export const alt = "Conduit AI — Software development and AI integrations. Luis Garcia.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function OgImage() {
  return new ImageResponse(
    <div style={{width:"100%",height:"100%",display:"flex",flexDirection:"column",justifyContent:"space-between",padding:"64px 72px",background:"#f5f5ef",color:"#202823"}}>
      <div style={{display:"flex",fontSize:28}}>conduit ai</div>
      <div style={{display:"flex",flexDirection:"column",fontSize:76,lineHeight:1.12,letterSpacing:-3}}><span>Software development</span><span>&amp; AI integrations.</span></div>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:22}}><span>Luis Garcia · South Florida</span><span>conduitai.io</span></div>
    </div>,size
  );
}
