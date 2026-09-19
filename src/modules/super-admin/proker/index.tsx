import { requireSuperAdmin } from "@/modules/admin/auth/session";

import { getAllProker, getDivisions, getPengurusOptions } from "./data";
import { ProkerManager } from "./proker-manager";

export async function ProkerPage() {
  const me = await requireSuperAdmin();
  const [proker, divisions, pengurus] = await Promise.all([
    getAllProker(),
    getDivisions(),
    getPengurusOptions(),
  ]);

  return (
    <ProkerManager
      proker={proker}
      divisions={divisions}
      pengurus={pengurus}
      myDivision={me.division ? { id: me.division.id, name: me.division.name } : null}
    />
  );
}
