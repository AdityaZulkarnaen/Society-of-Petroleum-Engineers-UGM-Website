// The organisation's divisions, shared by the seed scripts. Keep names in
// sync with supabase/migrations/20260919040000_division_overview.sql.
//
// tags are the focus areas listed on the division card.

export const DIVISIONS = [
  {
    slug: "medcre",
    name: "Media Creative",
    tags: ["Desain Grafis", "Videografi", "Social Media", "Dokumentasi"],
  },
  {
    slug: "hrd",
    name: "Human Resource Development",
    tags: ["Internal Bonding", "Kaderisasi", "Evaluasi Kinerja", "Apresiasi"],
  },
  {
    slug: "rne",
    name: "Research & Education",
    tags: ["Riset", "Paper & Publikasi", "Studi Kasus", "Pelatihan"],
  },
  {
    slug: "ea",
    name: "External Affairs",
    tags: ["Relasi Industri", "Sponsorship", "Kemitraan", "Company Visit"],
  },
  {
    slug: "compdev",
    name: "Competency Development",
    tags: ["Kompetisi", "Soft Skills", "Technical Skills", "Mentoring"],
  },
  {
    slug: "finance",
    name: "Finance",
    tags: ["Anggaran", "Pembukuan", "Fundraising", "Laporan Keuangan"],
  },
  {
    slug: "executive",
    name: "Executive",
    tags: ["Koordinasi", "Kesekretariatan", "Perencanaan Strategis"],
  },
];
