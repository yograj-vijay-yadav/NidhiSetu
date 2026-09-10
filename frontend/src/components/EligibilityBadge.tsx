import { EligibilityStatus } from "../lib/types";
import { eligibilityBadgeClass, eligibilityLabel } from "../lib/utils";

export function EligibilityBadge({
  status,
  score,
}: {
  status: EligibilityStatus;
  score?: number;
}) {
  return (
    <span className={`nidhi-badge ${eligibilityBadgeClass(status)}`}>
      {eligibilityLabel(status)}
      {typeof score === "number" && score > 0 ? ` · ${score}/100` : null}
    </span>
  );
}