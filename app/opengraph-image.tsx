import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

import { site } from "@/lib/site";

export const alt = `${site.name} — ${site.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const logo = await readFile(
    join(process.cwd(), "public/footer/logo-spe.png"),
    "base64",
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          gap: 64,
          padding: "0 80px",
          background: "linear-gradient(135deg, #1c2433 0%, #2a2f6b 100%)",
          color: "#f2f8fe",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`data:image/png;base64,${logo}`}
          width={400}
          height={307}
          alt=""
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 24,
            flex: 1,
            minWidth: 0,
          }}
        >
          <div style={{ fontSize: 60, fontWeight: 700, lineHeight: 1.1 }}>
            {site.tagline}
          </div>
          <div style={{ fontSize: 28, color: "#b8c2d6", lineHeight: 1.4 }}>
            Society of Petroleum Engineers · Universitas Gadjah Mada
          </div>
        </div>
      </div>
    ),
    size,
  );
}
