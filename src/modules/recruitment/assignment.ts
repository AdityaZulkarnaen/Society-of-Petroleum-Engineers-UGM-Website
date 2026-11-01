import type { AssignmentRule, RecruitmentPeriod, UploadSpecification } from "./recruitment-types";

export const uploadFormats = {
  pdf: { label: "PDF", mime: "application/pdf", extension: ".pdf" },
  png: { label: "PNG", mime: "image/png", extension: ".png" },
  ppt: { label: "PowerPoint (.ppt)", mime: "application/vnd.ms-powerpoint", extension: ".ppt" },
  pptx: { label: "PowerPoint (.pptx)", mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation", extension: ".pptx" },
} as const;

export function resolvePreference(period: RecruitmentPeriod, divisionId: string, subDivisionId: string) {
  const division = period.divisions.find((item) => item.id === divisionId);
  const subDivision = division?.subDivisions.find((item) => item.id === subDivisionId);
  return { division, subDivision };
}

export function uploadHint(upload: UploadSpecification) {
  return `${upload.formats.map((format) => uploadFormats[format].label).join(" / ")} · maksimum ${upload.maxBytes / (1024 * 1024)} MiB untuk simulasi. Panduan nama: ${upload.filename}.`;
}

export function uploadAccept(upload: UploadSpecification) {
  return upload.formats.flatMap((format) => [uploadFormats[format].extension, uploadFormats[format].mime]).join(",");
}

export function validateUpload(file: File | undefined, upload: UploadSpecification, required: boolean): string | undefined {
  if (!file) return required ? "Pilih dokumen untuk melanjutkan." : undefined;
  if (file.size === 0) return "File kosong. Pilih file lain.";
  if (file.size > upload.maxBytes) return `File melebihi batas simulasi ${upload.maxBytes / (1024 * 1024)} MiB.`;
  if (!upload.formats.some((format) => file.name.toLowerCase().endsWith(uploadFormats[format].extension) && file.type === uploadFormats[format].mime)) {
    return `Gunakan file ${upload.formats.map((format) => uploadFormats[format].label).join(" / ")} dengan tipe yang sesuai.`;
  }
}

export function assignmentView(rule: AssignmentRule | undefined, file?: File) {
  if (!rule) return { upload: undefined, required: false, blocked: true, label: "Belum dipilih", message: "Pilih divisi utama dan sub-divisi untuk melihat ketentuan assignment.", summary: "Sub-divisi belum dipilih" };
  switch (rule.status) {
    case "required":
      return { upload: rule.upload, required: true, blocked: false, label: "Wajib", message: rule.instructions, summary: file ? `Wajib · ${file.name}` : "Belum dilampirkan (wajib)" };
    case "optional":
      return { upload: rule.upload, required: false, blocked: false, label: "Opsional", message: rule.instructions, summary: file ? `Opsional · ${file.name}` : "Tidak dilampirkan (opsional)" };
    case "none":
      return { upload: undefined, required: false, blocked: false, label: "Tidak diperlukan", message: rule.message, summary: "Assignment tidak diperlukan" };
    case "unconfirmed":
      return { upload: undefined, required: false, blocked: true, label: "Belum dikonfirmasi", message: rule.message, summary: "Belum dikonfirmasi — submit simulasi diblokir" };
  }
}

export function validateAssignment(rule: AssignmentRule | undefined, file: File | undefined, forSubmission: boolean) {
  const view = assignmentView(rule, file);
  if (view.blocked) return forSubmission ? view.message : undefined;
  return view.upload ? validateUpload(file, view.upload, view.required) : undefined;
}
