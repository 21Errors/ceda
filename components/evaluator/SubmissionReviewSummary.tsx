import { Download } from "lucide-react";
import {
  formatFileSize,
  getAttachmentDownloadPath,
  getAttachmentTypeLabel,
} from "@/lib/attachments";

export type ReviewSubmissionField = {
  key: string;
  label: string;
  helpText: string | null;
  sectionKey: string;
  position: number;
};

export type ReviewSubmissionAttachment = {
  id: string;
  fileName: string;
  mimeType: string | null;
  fileSize: number | null;
};

const SECTION_LABELS: Record<string, string> = {
  general_information: "General information",
  solution_status: "Solution status",
  solution_overview: "Solution overview",
  type_of_innovation: "Type of innovation",
  additional_information: "Additional information",
  solution_documents: "Solution documents",
  terms_and_conditions: "Terms and conditions",
};

function AnswerValue({ value }: { value: unknown }) {
  const values = Array.isArray(value) ? value : [value];
  return (
    <>
      {values.map((item, index) => {
        const text =
          typeof item === "boolean" ? (item ? "Yes" : "No") : String(item ?? "—");
        let url: URL | null = null;
        try {
          const parsed = new URL(text);
          if (parsed.protocol === "https:" || parsed.protocol === "http:") url = parsed;
        } catch {
          /* Display as text. */
        }
        return (
          <span key={`${index}-${text}`} className="block">
            {url ? (
              <a
                href={url.href}
                target="_blank"
                rel="noreferrer"
                className="break-all font-semibold text-ceda-burgundy underline underline-offset-2"
              >
                {text}
              </a>
            ) : (
              text
            )}
          </span>
        );
      })}
    </>
  );
}

interface SubmissionReviewSummaryProps {
  referenceNo: string;
  stageName: string;
  title: string;
  summary: string;
  categoryName: string | null;
  versionNo: number;
  answers: Record<string, unknown>;
  submissionFields: ReviewSubmissionField[];
  submissionAttachments: ReviewSubmissionAttachment[];
}

export function SubmissionReviewSummary({
  referenceNo,
  stageName,
  title,
  summary,
  categoryName,
  versionNo,
  answers,
  submissionFields,
  submissionAttachments,
}: SubmissionReviewSummaryProps) {
  const sectionKeys = [
    ...new Set([
      ...submissionFields.map(({ sectionKey }) => sectionKey),
      "general_information",
    ]),
  ];

  return (
    <section className="rounded-2xl border border-ceda-line bg-white p-6 sm:p-8">
      <p className="text-xs font-bold uppercase tracking-wide text-ceda-burgundy">
        {referenceNo} | {stageName} | Version {versionNo}
      </p>
      <h2 className="mt-2 text-2xl font-bold text-ceda-ink">{title}</h2>
      {categoryName ? (
        <p className="mt-1 text-sm font-semibold text-ceda-muted">{categoryName}</p>
      ) : null}
      <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-ceda-body">
        {summary}
      </p>

      {Object.keys(answers).length > 0 ? (
        <div className="mt-6 space-y-5">
          {sectionKeys.map((sectionKey) => {
            const fields = submissionFields.filter(
              (field) => field.sectionKey === sectionKey,
            );
            const rows = fields
              .filter(({ key }) => Object.hasOwn(answers, key))
              .map(({ key, label, helpText }) => ({
                key,
                label,
                helpText,
                value: answers[key],
              }));
            const builtinKeys =
              sectionKey === "solution_status"
                ? ["solution_status"]
                : sectionKey === "type_of_innovation"
                  ? ["innovation_types"]
                  : [];
            for (const key of builtinKeys) {
              if (Object.hasOwn(answers, key) && !rows.some((row) => row.key === key)) {
                rows.push({
                  key,
                  label:
                    key === "solution_status"
                      ? "Current solution status"
                      : "Innovation type(s)",
                  helpText: null,
                  value: answers[key],
                });
              }
            }
            for (const [key, value] of Object.entries(answers)) {
              if (
                !submissionFields.some((field) => field.key === key) &&
                !["solution_status", "innovation_types"].includes(key) &&
                sectionKey === "general_information"
              ) {
                rows.push({
                  key,
                  label: key.replaceAll("_", " "),
                  helpText: null,
                  value,
                });
              }
            }
            if (!rows.length) return null;
            const heading = SECTION_LABELS[sectionKey] ?? sectionKey.replaceAll("_", " ");
            return (
              <section key={sectionKey} aria-label={heading}>
                <h3 className="border-b border-ceda-line pb-2 text-sm font-bold uppercase tracking-wide text-ceda-burgundy">
                  {heading}
                </h3>
                <dl className="divide-y divide-ceda-line">
                  {rows.map((row) => (
                    <div
                      key={row.key}
                      className="grid gap-1 py-3 sm:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] sm:gap-5"
                    >
                      <dt className="text-sm font-semibold text-ceda-ink">
                        {row.label}
                        {row.helpText ? (
                          <span className="mt-1 block text-xs font-normal leading-5 text-ceda-muted">
                            {row.helpText}
                          </span>
                        ) : null}
                      </dt>
                      <dd className="break-words text-sm leading-6 text-ceda-body">
                        <AnswerValue value={row.value} />
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            );
          })}
        </div>
      ) : null}

      {submissionAttachments.length > 0 ? (
        <section className="mt-6" aria-labelledby="submission-files-heading">
          <h3 id="submission-files-heading" className="text-sm font-bold text-ceda-ink">
            Supporting files
          </h3>
          <ul className="mt-2 space-y-2">
            {submissionAttachments.map((file) => (
              <li
                key={file.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-ceda-line bg-[#FFFDFC] px-3.5 py-2.5"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-ceda-ink">
                    {file.fileName}
                  </span>
                  <span className="block text-xs text-ceda-muted">
                    {getAttachmentTypeLabel(file.mimeType, file.fileName)} ·{" "}
                    {formatFileSize(file.fileSize)}
                  </span>
                </span>
                <a
                  href={getAttachmentDownloadPath(file.id)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-ceda-line bg-white px-3.5 text-xs font-semibold text-ceda-burgundy hover:bg-[#FFF9F4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-burgundy"
                >
                  <Download aria-hidden="true" className="h-3.5 w-3.5" />
                  Download
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </section>
  );
}
