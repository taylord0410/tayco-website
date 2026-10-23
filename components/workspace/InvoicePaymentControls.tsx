"use client";

import type { ReactNode } from "react";
import type { Entry } from "@/lib/erp";
import type { WorkspaceForm } from "./ProjectOverview";
import { isValidUsdAmount } from "@/lib/financial-values";
import { financialPeriods, isFinancialDate } from "@/lib/financial-periods";

const usd = (amount: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
type Payment = { id?: unknown; occurredOn?: unknown; amountUsd?: unknown; reference?: unknown; recordedAt?: unknown; voidedAt?: unknown; voidReason?: unknown };
const stamp = (raw: unknown) => typeof raw === "string" && Number.isFinite(Date.parse(raw)) ? new Date(raw).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }) + " UTC" : "Record timestamp unavailable";

export default function InvoicePaymentControls({ entry, admin, renderForm }: { entry: Entry; admin: boolean; renderForm: (props: WorkspaceForm) => ReactNode }) {
  const raw = entry.data.payments;
  const payments = Array.isArray(raw) ? raw.filter(item => item && typeof item === "object" && !Array.isArray(item)) as Payment[] : [];
  const malformed = raw !== undefined && (!Array.isArray(raw) || payments.length !== raw.length);
  const active = payments.filter(payment => !payment.voidedAt);
  let validActive: { amountCents: number }[] = []; let reportingInvalid = false;
  try { const report = financialPeriods([entry], { year: null, month: null, asOf: entry.updatedAt }); validActive = report.payments; reportingInvalid = report.warnings.some(warning => warning.code === "invalid_payment" || warning.code === "duplicate_payment_id"); } catch { reportingInvalid = true; }
  const recordedCents = validActive.reduce((sum, payment) => sum + payment.amountCents, 0);
  const amountValid = isValidUsdAmount(entry.data.amountUsd);
  const coverageValid = !malformed && !reportingInvalid && active.length === validActive.length && Number.isSafeInteger(recordedCents);
  const remainingCents = amountValid && coverageValid ? Math.max(0, Math.round(Number(entry.data.amountUsd) * 100) - recordedCents) : null;
  const legacyPaid = entry.data.status === "paid" && !validActive.length;
  return <section className="mt-4 space-y-4 border-t border-slate-700 pt-4" aria-label="Invoice payment history" data-testid={"invoice-payments-" + entry.id}>
    <div><h5 className="text-sm font-semibold text-amber-100">Recorded payment history</h5><p className="mt-2 text-xs leading-relaxed text-slate-400">These are bookkeeping entries, not payment transfers or bank confirmations. Their effective dates determine the monthly financial chart.</p></div>
    {legacyPaid && <p role="status" className="rounded-lg border border-amber-200/30 p-3 text-xs text-amber-100">This invoice was marked paid without usable dated payment entries. Historical payment timing is unknown; no payment is inferred from its last update.</p>}
    {!coverageValid && <p role="alert" className="rounded-lg border border-amber-200/30 p-3 text-xs text-amber-100">Some payment metadata needs review. An outstanding balance cannot be calculated reliably.</p>}
    <ul className="space-y-3">{payments.map((payment, index) => <li key={String(payment.id || index)} className="rounded-lg border border-slate-700 bg-[#0f2040] p-3"><div className="flex flex-wrap justify-between gap-2"><div className="min-w-0"><p className="break-words text-sm font-semibold text-slate-100">{typeof payment.reference === "string" ? payment.reference : "Payment record needs review"}</p><p className="mt-1 text-xs text-slate-400">Effective date: {isFinancialDate(payment.occurredOn) ? payment.occurredOn : "Unknown / invalid"}</p><p className="mt-1 text-xs text-slate-400">Entered {stamp(payment.recordedAt)}</p></div><p className="text-sm text-amber-100">{isValidUsdAmount(payment.amountUsd) ? usd(payment.amountUsd) : "Amount needs review"}</p></div>{payment.voidedAt ? <p className="mt-3 break-words text-xs text-slate-400">Voided {stamp(payment.voidedAt)} · {typeof payment.voidReason === "string" ? payment.voidReason : "Reason not recorded"}. Excluded from monthly payment totals.</p> : admin && typeof payment.id === "string" && renderForm({ title: "Void this payment record", action: "void_invoice_payment", fixed: { invoiceId: entry.id, version: entry.version, paymentId: payment.id }, submit: "Void recorded payment", fields: [{ name: "reason", label: "Reason for voiding this payment record", type: "textarea" }] })}</li>)}</ul>
    {!payments.length && <p className="text-xs text-slate-400">No dated payment records have been entered.</p>}
    {coverageValid && <p className="text-xs text-slate-300">Active payment entries: {usd(recordedCents / 100)}.{remainingCents !== null && !legacyPaid ? " Remaining invoice amount based on these entries: " + usd(remainingCents / 100) + "." : ""}</p>}
    {admin && !["approved", "paid"].includes(String(entry.data.status)) && <p className="text-xs text-slate-400">Approve this invoice before recording dated payment entries.</p>}
    {admin && ["approved", "paid"].includes(String(entry.data.status)) && remainingCents !== null && remainingCents > 0 && coverageValid && renderForm({ title: "Record a dated payment", action: "record_invoice_payment", fixed: { invoiceId: entry.id, version: entry.version }, submit: "Save payment record", fields: [{ name: "amountUsd", label: "Recorded payment amount (USD)", type: "number", min: 0.01, max: remainingCents / 100, step: 0.01 }, { name: "occurredOn", label: "Payment effective date (UTC)", type: "date" }, { name: "reference", label: "Payment record reference" }] })}
  </section>;
}
