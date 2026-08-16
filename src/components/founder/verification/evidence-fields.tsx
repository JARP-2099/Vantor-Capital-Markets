"use client";

import { invalidProps } from "@/components/founder/form-support";
import { Field } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/input";
import { EVIDENCE_KIND_LABELS, type EvidenceKind } from "@/lib/verification/constants";

/**
 * Evidence kinds a founder may attach directly. provider_integration is
 * reserved for future external-provider connections and is never offered in
 * founder forms — the server action enforces the same restriction.
 */
const FOUNDER_EVIDENCE_KINDS = [
  "document_reference",
  "external_url",
  "attestation",
] as const satisfies readonly Exclude<EvidenceKind, "provider_integration">[];

type EvidenceFieldsProps = {
  /** Unique prefix for input ids so multiple forms can coexist on a page. */
  idPrefix: string;
  /** When true the whole block may be left empty (initial submission). */
  optional?: boolean;
  kindError?: string;
  descriptionError?: string;
  referenceError?: string;
};

/**
 * Shared evidence inputs (kind, description, reference) used by both the
 * initial submission form and the add-evidence form. Field names match what
 * the server actions read: evidenceKind / evidenceDescription /
 * evidenceReference.
 */
export function EvidenceFields({
  idPrefix,
  optional,
  kindError,
  descriptionError,
  referenceError,
}: EvidenceFieldsProps) {
  const kindId = `${idPrefix}-kind`;
  const descriptionId = `${idPrefix}-description`;
  const referenceId = `${idPrefix}-reference`;

  return (
    <>
      <Field label="Evidence type" htmlFor={kindId} required={!optional} error={kindError}>
        <Select
          id={kindId}
          name="evidenceKind"
          defaultValue=""
          {...invalidProps(kindId, kindError)}
        >
          <option value="" disabled={!optional}>
            {optional ? "No evidence yet" : "Select evidence type"}
          </option>
          {FOUNDER_EVIDENCE_KINDS.map((kind) => (
            <option key={kind} value={kind}>
              {EVIDENCE_KIND_LABELS[kind]}
            </option>
          ))}
        </Select>
      </Field>

      <Field
        label="What is this evidence?"
        htmlFor={descriptionId}
        required={!optional}
        hint='Describe the document or source, e.g. "FY2025 P&L prepared by our accountant".'
        error={descriptionError}
      >
        <Textarea
          id={descriptionId}
          name="evidenceDescription"
          rows={3}
          maxLength={1000}
          className="min-h-20"
          {...invalidProps(descriptionId, descriptionError)}
        />
      </Field>

      <Field
        label="Reference"
        htmlFor={referenceId}
        hint="Link to a document location or provider. Do not paste file contents."
        error={referenceError}
      >
        <Input
          id={referenceId}
          name="evidenceReference"
          type="text"
          maxLength={500}
          {...invalidProps(referenceId, referenceError)}
        />
      </Field>
    </>
  );
}
