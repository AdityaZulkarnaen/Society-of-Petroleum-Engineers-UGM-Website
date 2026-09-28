/*
 * The public origin of the site, used for canonical URLs, the sitemap and
 * social previews. Set NEXT_PUBLIC_SITE_URL once the domain is decided; until
 * then Vercel's production URL is used, and localhost in development.
 */
function resolveSiteUrl() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/+$/, "");

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;

  return "http://localhost:3000";
}

export const siteUrl = resolveSiteUrl();

/* Only production deployments should be indexed, never Vercel previews. */
export const isIndexable =
  process.env.VERCEL_ENV === undefined || process.env.VERCEL_ENV === "production";

export const site = {
  name: "SPE UGM Student Chapter",
  shortName: "SPE UGM SC",
  tagline: "Engineering the future of energy",
  description:
    "The SPE UGM Student Chapter is a community of engineering students from all disciplines at Universitas Gadjah Mada, advancing Indonesia's energy industry through research, training, and global collaboration.",
  email: "speugmscboards@gmail.com",
  socials: [
    "https://www.instagram.com/speugmsc/",
    "https://www.linkedin.com/company/speugmsc/",
    "https://www.tiktok.com/@spe.ugm.sc",
  ],
} as const;
