import { EMIResult } from "../lib/types";
import { formatINR } from "../lib/utils";

export function EmiCalculator({ emi }: { emi: EMIResult }) {
  if (!emi) return null;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[
        { label: "Loan amount", value: formatINR(emi.loan_amount) },
        { label: "Monthly EMI", value: formatINR(emi.monthly_emi), highlight: true },
        { label: "Total interest", value: formatINR(emi.total_interest) },
        { label: "Total repayment", value: formatINR(emi.total_payment) },
      ].map((item) => (
        <div
          key={item.label}
          className={`rounded-xl border p-4 ${item.highlight ? "border-saffron bg-saffronsoft" : "border-slate-200 bg-white"}`}
        >
          <div className="text-xs text-slate-500">{item.label}</div>
          <div className={`text-lg font-bold mt-1 ${item.highlight ? "text-saffron" : "text-slate-800"}`}>
            {item.value}
          </div>
        </div>
      ))}
      <div className="sm:col-span-4 text-xs text-slate-400">
        {emi.repayment_months} repayment months · {emi.moratorium_months}-month moratorium
        ({emi.moratorium_policy}: interest accrues and is capitalized; repayment deferred, not
        forgiven) · rate {(emi.annual_interest_rate * 100).toFixed(1)}% p.a. · deterministic
        mathematics, never LLM-computed.
      </div>
    </div>
  );
}