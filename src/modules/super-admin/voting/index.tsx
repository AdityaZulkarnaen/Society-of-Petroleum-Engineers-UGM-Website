import { requireSuperAdmin } from "@/modules/admin/auth/session";
import { CURRENT_PERIOD } from "@/modules/admin/constants";

import { getVotingAdmin } from "./data";
import { VotingManager } from "./voting-manager";

/** '2025/2026' → '2026/2027': the term a new election chooses for. */
function nextTerm(term: string) {
  const [from, to] = term.split("/").map(Number);
  return `${from + 1}/${to + 1}`;
}

export async function VotingAdminPage() {
  await requireSuperAdmin();
  const { election, started, results } = await getVotingAdmin();

  return (
    <VotingManager
      election={election}
      started={started}
      results={results}
      defaultTerm={nextTerm(CURRENT_PERIOD.label)}
    />
  );
}
