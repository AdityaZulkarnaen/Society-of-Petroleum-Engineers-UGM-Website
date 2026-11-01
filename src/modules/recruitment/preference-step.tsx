"use client";

import { assignmentView, resolvePreference } from "./assignment";
import { inputStyle } from "./components";
import { Field, FileField } from "./form-fields";
import { preferenceFields, type PreferenceRank, type RecruitmentPeriod } from "./recruitment-types";
import type { ApplicationFiles, ApplicationValues, Errors } from "./validation";

export function PreferenceStep({ rank, period, values, files, errors, onDivision, onSubDivision, onMotivation, onFile }: {
  rank: PreferenceRank;
  period: RecruitmentPeriod;
  values: ApplicationValues;
  files: ApplicationFiles;
  errors: Errors;
  onDivision: (value: string) => void;
  onSubDivision: (value: string) => void;
  onMotivation: (value: string) => void;
  onFile: (file?: File) => void;
}) {
  const fields = preferenceFields[rank];
  const { division, subDivision } = resolvePreference(period, values[fields.division], values[fields.subDivision]);
  const assignment = assignmentView(subDivision?.assignment, files[fields.assignment]);
  const divisionId = `recruit-${fields.division}`;
  const subDivisionId = `recruit-${fields.subDivision}`;
  const motivationId = `recruit-${fields.motivation}`;

  return (
    <div className="space-y-6">
      <Field id={divisionId} label={`Divisi utama pilihan ${fields.label}`} error={errors[fields.division]} hint="Pilih divisi utama untuk melihat sub-divisinya. Mengubah pilihan akan menghapus pilihan sub-divisi dan file assignment terkait.">
        <select id={divisionId} value={values[fields.division]} onChange={(event) => onDivision(event.target.value)} required aria-invalid={Boolean(errors[fields.division])} aria-describedby={`${divisionId}-hint${errors[fields.division] ? ` ${divisionId}-error` : ""}`} className={inputStyle}>
          <option value="">Pilih divisi utama</option>
          {period.divisions.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select>
      </Field>
      <Field id={subDivisionId} label={`Sub-divisi pilihan ${fields.label}`} error={errors[fields.subDivision]} hint="File assignment dikosongkan saat sub-divisi berubah. Periksa kembali alasanmu setelah mengubah pilihan.">
        <select id={subDivisionId} value={values[fields.subDivision]} onChange={(event) => onSubDivision(event.target.value)} disabled={!division} required aria-invalid={Boolean(errors[fields.subDivision])} aria-describedby={`${subDivisionId}-hint${errors[fields.subDivision] ? ` ${subDivisionId}-error` : ""}`} className={`${inputStyle} disabled:cursor-not-allowed disabled:bg-ground`}>
          <option value="">{division ? "Pilih sub-divisi" : "Pilih divisi utama terlebih dahulu"}</option>
          {division?.subDivisions.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select>
      </Field>
      <Field id={motivationId} label={`Alasan memilih sub-divisi ${fields.label}`} error={errors[fields.motivation]} hint={`${values[fields.motivation].length.toLocaleString("id-ID")} / 3.000 karakter (batas simulasi).`}>
        <textarea id={motivationId} value={values[fields.motivation]} onChange={(event) => onMotivation(event.target.value)} required maxLength={3000} rows={6} placeholder="Ceritakan alasanmu menggunakan teks contoh…" aria-invalid={Boolean(errors[fields.motivation])} aria-describedby={`${motivationId}-hint${errors[fields.motivation] ? ` ${motivationId}-error` : ""}`} className={`${inputStyle} resize-y`} />
      </Field>
      <div role="status" aria-live="polite" className="border-t border-[#e4e5ef] pt-5 text-sm leading-6">
        <p className="font-semibold text-ink-deep">Assignment pilihan {fields.label}: {assignment.label}</p>
        <p className="mt-2 text-ink-soft">{assignment.message}</p>
      </div>
      {assignment.upload && (
        <FileField
          key={`${period.id}-${division?.id}-${subDivision?.id}`}
          slot={{ key: fields.assignment, label: `Assignment pilihan ${fields.label}` }}
          upload={assignment.upload}
          required={assignment.required}
          file={files[fields.assignment]}
          error={errors[fields.assignment]}
          onChange={onFile}
        />
      )}
    </div>
  );
}
