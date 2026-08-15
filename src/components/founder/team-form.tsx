"use client";

import { useActionState, useState } from "react";
import {
  FormStateAlert,
  IDLE_STATE,
  invalidProps,
  SubmitButton,
} from "@/components/founder/form-support";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/input";
import type { FounderFormState } from "@/lib/actions/founder-company";

export type TeamInitial = {
  creator: { name: string; title: string | null; bio: string | null } | null;
  members: { name: string; role: "founder" | "team"; title: string | null; bio: string | null }[];
};

type Row = {
  key: number;
  name: string;
  role: "founder" | "team";
  title: string;
  bio: string;
};

type TeamFormProps = {
  action: (prev: FounderFormState, formData: FormData) => Promise<FounderFormState>;
  initial: TeamInitial;
  submitLabel: string;
  disabled?: boolean;
};

export function TeamForm({ action, initial, submitLabel, disabled }: TeamFormProps) {
  const [state, formAction, pending] = useActionState(action, IDLE_STATE);
  const errors = state.fieldErrors ?? {};

  const [nextKey, setNextKey] = useState(initial.members.length);
  const [rows, setRows] = useState<Row[]>(
    initial.members.map((m, i) => ({
      key: i,
      name: m.name,
      role: m.role,
      title: m.title ?? "",
      bio: m.bio ?? "",
    })),
  );

  function addRow() {
    setRows((r) => [...r, { key: nextKey, name: "", role: "team", title: "", bio: "" }]);
    setNextKey((k) => k + 1);
  }

  function removeRow(key: number) {
    setRows((r) => r.filter((row) => row.key !== key));
  }

  function patchRow(key: number, patch: Partial<Row>) {
    setRows((r) => r.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }

  return (
    <form action={formAction} noValidate>
      <fieldset disabled={disabled} className="space-y-5">
        <FormStateAlert state={state} />

        {/* Creator's protected founder row */}
        <div className="rounded-lg border border-line bg-paper p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-ink-900">{initial.creator?.name ?? "You"}</p>
            <Badge tone="ink">Founder — you</Badge>
          </div>
          <p className="mt-1 text-xs text-muted">
            This is your own listing. It cannot be removed, but you can edit your title and bio.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Title" htmlFor="creatorTitle" error={errors.creatorTitle}>
              <Input
                id="creatorTitle"
                name="creatorTitle"
                defaultValue={initial.creator?.title ?? ""}
                placeholder="e.g. Co-founder & CEO"
                {...invalidProps("creatorTitle", errors.creatorTitle)}
              />
            </Field>
          </div>
          <div className="mt-4">
            <Field label="Bio" htmlFor="creatorBio" error={errors.creatorBio}>
              <Textarea
                id="creatorBio"
                name="creatorBio"
                rows={3}
                defaultValue={initial.creator?.bio ?? ""}
                {...invalidProps("creatorBio", errors.creatorBio)}
              />
            </Field>
          </div>
        </div>

        {/* Additional members */}
        {rows.map((row, i) => {
          const nameId = `member-${row.key}-name`;
          const roleId = `member-${row.key}-role`;
          const titleId = `member-${row.key}-title`;
          const bioId = `member-${row.key}-bio`;
          return (
            <div key={row.key} className="rounded-lg border border-line bg-paper p-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Name" htmlFor={nameId} required error={errors[`members.${i}.name`]}>
                  <Input
                    id={nameId}
                    name={`member_${i}_name`}
                    value={row.name}
                    onChange={(e) => patchRow(row.key, { name: e.target.value })}
                    {...invalidProps(nameId, errors[`members.${i}.name`])}
                  />
                </Field>
                <Field label="Role" htmlFor={roleId} error={errors[`members.${i}.role`]}>
                  <Select
                    id={roleId}
                    name={`member_${i}_role`}
                    value={row.role}
                    onChange={(e) =>
                      patchRow(row.key, { role: e.target.value as "founder" | "team" })
                    }
                    {...invalidProps(roleId, errors[`members.${i}.role`])}
                  >
                    <option value="founder">Founder</option>
                    <option value="team">Team</option>
                  </Select>
                </Field>
                <Field label="Title" htmlFor={titleId} error={errors[`members.${i}.title`]}>
                  <Input
                    id={titleId}
                    name={`member_${i}_title`}
                    value={row.title}
                    onChange={(e) => patchRow(row.key, { title: e.target.value })}
                    placeholder="e.g. CTO"
                    {...invalidProps(titleId, errors[`members.${i}.title`])}
                  />
                </Field>
              </div>
              <div className="mt-4">
                <Field label="Bio" htmlFor={bioId} error={errors[`members.${i}.bio`]}>
                  <Textarea
                    id={bioId}
                    name={`member_${i}_bio`}
                    rows={3}
                    value={row.bio}
                    onChange={(e) => patchRow(row.key, { bio: e.target.value })}
                    {...invalidProps(bioId, errors[`members.${i}.bio`])}
                  />
                </Field>
              </div>
              {!disabled ? (
                <div className="mt-3 flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-negative-700"
                    onClick={() => removeRow(row.key)}
                  >
                    Remove
                  </Button>
                </div>
              ) : null}
            </div>
          );
        })}

        {!disabled ? (
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={addRow}>
              Add team member
            </Button>
            <SubmitButton pending={pending}>{submitLabel}</SubmitButton>
          </div>
        ) : null}
      </fieldset>
    </form>
  );
}
