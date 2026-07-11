import type { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap { const updated = new Date(); return ["", "/privacy", "/terms", "/support"].map((path) => ({ url: `https://worthlane.app${path}`, lastModified: updated, changeFrequency: "monthly", priority: path ? 0.6 : 1 })); }
