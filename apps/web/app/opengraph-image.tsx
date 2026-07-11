import { ImageResponse } from "next/og";
export const alt = "Worthlane — Build a money routine that moves you forward";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function OpenGraphImage() {
  return new ImageResponse(<div style={{ width:"100%", height:"100%", display:"flex", flexDirection:"column", justifyContent:"space-between", padding:"68px", color:"#f7f4eb", background:"linear-gradient(135deg,#07172c,#123c58)" }}><div style={{ display:"flex", alignItems:"center", gap:16, fontSize:31, fontWeight:700 }}><span style={{ color:"#70e9c8", fontSize:46 }}>?</span>Worthlane</div><div style={{ display:"flex", flexDirection:"column", maxWidth:780 }}><span style={{ color:"#91f0d2", fontSize:20, letterSpacing:3, textTransform:"uppercase" }}>Launching soon on iPhone</span><span style={{ marginTop:22, fontSize:73, fontWeight:750, lineHeight:1 }}>Build a money routine that moves you forward.</span></div><span style={{ color:"#c5d3d8", fontSize:25 }}>Clearer budgets · Goals · Daily momentum</span></div>, size);
}
