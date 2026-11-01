/** Launch only this staging slice without loading legacy environment files. */
import { existsSync, readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
const root = fileURLToPath(new URL("../../", import.meta.url));
for (const name of [".env", ".env.local", ".env.development", ".env.development.local"]) {
  if (existsSync(path.join(root,name))) throw new Error("Legacy environment file present; refusing to load it. Use a separate clean staging worktree.");
}
const file = path.join(root,".env.staging.private/recruitment-backend.env");
if (!existsSync(file)) throw new Error("Protected staging API configuration has not been provisioned. See recruitment-backend-integration.md.");
const values = parseEnv(readFileSync(file,"utf8"));
const allowed = new Set(["RECRUITMENT_STAGING_ENABLED","RECRUITMENT_SINGLE_INSTANCE","RECRUITMENT_ORIGIN","RECRUITMENT_SESSION_SECRET","RECRUITMENT_STAGING_SECRET_KEY","RECRUITMENT_PERIOD_ID"]);
if (Object.keys(values).some(k => !allowed.has(k))) throw new Error("Unexpected staging environment variable; refusing to launch.");
if (values.RECRUITMENT_ORIGIN !== "http://127.0.0.1:3000") throw new Error("This launcher requires the explicit loopback origin http://127.0.0.1:3000.");
const env={};
for (const [key,value] of Object.entries(process.env)) if (["SYSTEMROOT","WINDIR","TEMP","TMP","COMSPEC","PATH","PATHEXT","USERPROFILE","LOCALAPPDATA","APPDATA","NUMBER_OF_PROCESSORS","PROCESSOR_ARCHITECTURE"].includes(key.toUpperCase())) env[key]=value;
Object.assign(env,values,{NEXT_TELEMETRY_DISABLED:"1"});
const child=spawn(process.execPath,[path.join(root,"node_modules/next/dist/bin/next"),"dev","--hostname","127.0.0.1","--port","3000"],{cwd:root,env,stdio:"inherit",windowsHide:true});
child.on("exit",code=>{process.exitCode=code??1;});
