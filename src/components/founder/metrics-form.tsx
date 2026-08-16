"use client";

import { useActionState, useState } from "react";
import {
  FormStateAlert,
  IDLE_STATE,
  invalidProps,
  SubmitButton,
} from "@/components/founder/form-support";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, Select } from "@/components/ui/input";
import type { FounderFormState } from "@/lib/actions/founder-company";
import { formatMetricValue } from "@/lib/format";
import {
  METRIC_LABELS,
  METRIC_TYPES,
  MONETARY_METRICS,
  type MetricType,
} from "@/lib/constants";

const COMMON_CURRENCIES = ["USD", "EUR", "GBP", "SGD"] as const;
const OTHER = "__other__";

export type MetricInitialRow = {
  metricType: MetricType;
  value: string;
  currency: string | null;
  asOf: string;
};

type Row = {
  key: number;
  metricType: MetricType;
  value: string;
  currency: string;
  asOf: string;
};

type MetricsFormProps = {
  action: (prev: FounderFormState, formData: FormData) => Promise<FounderFormState>;
  initial: MetricInitialRow[];
  submitLabel: string;
  disabled?: boolean;
};

/**
 * Stored numerics arrive as fixed-scale strings ("900000.0000"). Trim the
 * trailing zeros for editing — the numeric value submitted is unchanged.
 */
function trimDecimalZeros(value: string): string {
  if (!/^-?\d+\.\d+$/.test(value)) return value;
  return value.replace(/\.?0+$/, "");
}

/** Quiet "this is how it will read" preview under the value input. */
function displayPreview(row: Row, monetary: boolean): string | undefined {
  if (row.value.trim() === "") return undefined;
  const n = Number(row.value);
  if (!Number.isFinite(n)) return undefined;
  try {
    return `Displays as ${formatMetricValue(
      row.metricType,
      n,
      monetary && /^[A-Za-z]{3}$/.test(row.currency) ? row.currency : null,
    )}`;
  } catch {
    return undefined;
  }
}

export function MetricsForm({ action, initial, submitLabel, disabled }: MetricsFormProps) {
  const [state, formAction, pending] = useActionState(action, IDLE_STATE);
  const errors = state.fieldErrors ?? {};

  const [nextKey, setNextKey] = useState(initial.length);
  const [rows, setRows] = useState<Row[]>(
    initial.map((m, i) => ({
      key: i,
      metricType: m.metricType,
      value: trimDecimalZeros(m.value),
      currency: m.currency ?? "USD",
      asOf: m.asOf,
    })),
  );

  function addRow() {
    setRows((r) => [
      ...r,
      { key: nextKey, metricType: "arr", value: "", currency: "USD", asOf: "" },
    ]);
    setNextKey((k) => k + 1);
  }

  function removeRow(key: number) {
    setRows((r) => r.filter((row) => row.key !== key));
  }

  function patchRow(key: number, patch: Partial<Row>) {
    setRows((r) => r.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={formAction} noValidate>
      <fieldset disabled={disabled} className="space-y-5">
        <FormStateAlert state={state} />

        {rows.length === 0 ? (
          <div className="rounded-lg border border-dashed border-line bg-paper px-5 py-8 text-center">
            <p className="text-sm font-medium text-ink-900">No metrics yet — and that&apos;s okay.</p>
            <p className="mx-auto mt-1.5 max-w-md text-xs leading-relaxed text-muted">
              Pre-revenue or early? You can continue without metrics and add them any time. Even a
              team headcount helps investors understand where you are.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {rows.map((row, i) => {
              const monetary = MONETARY_METRICS.has(row.metricType);
              const currencyIsCommon = (COMMON_CURRENCIES as readonly string[]).includes(
                row.currency,
              );
              const selectValue = currencyIsCommon ? row.currency : OTHER;
              const typeId = `metric-${row.key}-type`;
              const valueId = `metric-${row.key}-value`;
              const currencyId = `metric-${row.key}-currency`;
              const asOfId = `metric-${row.key}-asOf`;
              return (
                <li key={row.key} className="rounded-lg border border-line bg-paper p-4">
                  <div className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_minmax(0,0.9fr)_minmax(0,1fr)_2.5rem]">
                    <Field label="Metric" htmlFor={typeId} error={errors[`metrics.${i}.metricType`]}>
                      <Select
                        id={typeId}
                        name={`metric_${i}_type`}
                        value={row.metricType}
                        onChange={(e) =>
                          patchRow(row.key, { metricType: e.target.value as MetricType })
                        }
                        {...invalidProps(typeId, errors[`metrics.${i}.metricType`])}
                      >
                        {METRIC_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {METRIC_LABELS[t]}
                          </option>
                        ))}
                      </Select>
                    </Field>

                    <Field
                      label="Value"
                      htmlFor={valueId}
                      hint={displayPreview(row, monetary)}
                      error={errors[`metrics.${i}.value`]}
                    >
                      <Input
                        id={valueId}
                        name={`metric_${i}_value`}
                        type="number"
                        step="any"
                        inputMode="decimal"
                        value={row.value}
                        onChange={(e) => patchRow(row.key, { value: e.target.value })}
                        className="tabular-nums"
                        {...invalidProps(valueId, errors[`metrics.${i}.value`])}
                      />
                    </Field>

                    {monetary ? (
                      <Field
                        label="Currency"
                        htmlFor={currencyId}
                        error={errors[`metrics.${i}.currency`]}
                      >
                        <div className="flex gap-2">
                          <Select
                            id={currencyId}
                            name={currencyIsCommon ? `metric_${i}_currency` : undefined}
                            value={selectValue}
                            onChange={(e) =>
                              patchRow(row.key, {
                                currency: e.target.value === OTHER ? "" : e.target.value,
                              })
                            }
                            {...invalidProps(currencyId, errors[`metrics.${i}.currency`])}
                          >
                            {COMMON_CURRENCIES.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                            <option value={OTHER}>Other…</option>
                          </Select>
                          {!currencyIsCommon ? (
                            <Input
                              aria-label="ISO currency code"
                              name={`metric_${i}_currency`}
                              value={row.currency}
                              onChange={(e) =>
                                patchRow(row.key, { currency: e.target.value.toUpperCase() })
                              }
                              placeholder="e.g. CHF"
                              maxLength={3}
                              className="w-24 uppercase"
                              {...invalidProps(currencyId, errors[`metrics.${i}.currency`])}
                            />
                          ) : null}
                        </div>
                      </Field>
                    ) : (
                      /* Keeps the grid columns aligned across mixed row types. */
                      <div aria-hidden="true" className="hidden lg:block" />
                    )}

                    <Field label="As of" htmlFor={asOfId} error={errors[`metrics.${i}.asOf`]}>
                      <Input
                        id={asOfId}
                        name={`metric_${i}_asOf`}
                        type="date"
                        max={today}
                        value={row.asOf}
                        onChange={(e) => patchRow(row.key, { asOf: e.target.value })}
                        {...invalidProps(asOfId, errors[`metrics.${i}.asOf`])}
                      />
                    </Field>

                    {!disabled ? (
                      <div className="flex justify-end sm:col-span-2 lg:col-span-1 lg:justify-center lg:pt-7">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-10 w-10 px-0 text-muted hover:text-negative-700"
                          aria-label={`Remove ${METRIC_LABELS[row.metricType]} entry`}
                          title="Remove"
                          onClick={() => removeRow(row.key)}
                        >
                          <span aria-hidden="true" className="text-base leading-none">
                            &times;
                          </span>
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {!disabled ? (
          <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
            <SubmitButton pending={pending}>{submitLabel}</SubmitButton>
            <Button type="button" variant="secondary" onClick={addRow}>
              Add metric
            </Button>
          </div>
        ) : null}
      </fieldset>
    </form>
  );
}
