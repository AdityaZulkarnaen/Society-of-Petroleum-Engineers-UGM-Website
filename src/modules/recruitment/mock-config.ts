import type { RecruitmentPeriod, SubDivision } from "./recruitment-types";

// Synthetic rules for Phase A interaction testing. Never attach these rules
// to the organisation's named divisions or merge them into approved data.
const upload = {
  formats: ["pdf"] as const,
  maxBytes: 3 * 1024 * 1024,
  filename: "Name_Assignment_SubDivision.pdf",
};

function examples(prefix: string): readonly SubDivision[] {
  return [
    { id: `${prefix}-required`, label: "Contoh: assignment wajib", assignment: { status: "required", instructions: "Contoh UX saja: pilih PDF contoh untuk mencoba assignment wajib. Ini bukan tugas rekrutmen resmi.", upload } },
    { id: `${prefix}-optional`, label: "Contoh: assignment opsional", assignment: { status: "optional", instructions: "Contoh UX saja: PDF contoh boleh dilampirkan atau dilewati. Jika dilampirkan, file harus valid.", upload } },
    { id: `${prefix}-none`, label: "Contoh: tanpa assignment", assignment: { status: "none", message: "Tidak ada assignment untuk sub-divisi contoh ini. Tidak perlu memilih file." } },
    { id: `${prefix}-unconfirmed`, label: "Contoh: belum dikonfirmasi", assignment: { status: "unconfirmed", message: "Contoh UX: aturan belum dikonfigurasi. Submit simulasi diblokir sampai ketentuan tersedia atau pilihan diubah." } },
  ];
}

export const mockPeriod: RecruitmentPeriod = {
  id: "2026-2027-demo",
  label: "2026/2027",
  contentState: "demo",
  notice: "Data contoh UX. Semua nama dan aturan di katalog ini sintetis untuk mencoba empat perilaku assignment, bukan ketentuan organisasi.",
  batches: ["2025", "2026"],
  divisions: [
    { id: "example-a", label: "Divisi contoh A", subDivisions: examples("a") },
    { id: "example-b", label: "Divisi contoh B", subDivisions: examples("b") },
  ],
};
