/* eslint-disable @typescript-eslint/no-require-imports -- Node's CommonJS preload hook. */
/* Preloaded in every isolated Node process, including Next.js child workers.
 * Defense in depth for this local QA harness, not a production security boundary.
 */
const net = require("node:net");
const dns = require("node:dns");
const dgram = require("node:dgram");
const fs = require("node:fs");

const marker = Symbol.for("spe.recruitment.networkGuard");
if (!globalThis[marker]) {
  globalThis[marker] = true;
  const local = new Set(["localhost", "127.0.0.1", "::1", "::ffff:127.0.0.1"]);
  function block() {
    if (process.env.RECRUITMENT_GUARD_LOG) fs.appendFileSync(process.env.RECRUITMENT_GUARD_LOG, "blocked\n");
    const error = new Error("External network blocked by recruitment mock guard");
    error.code = "RECRUITMENT_NETWORK_BLOCKED";
    throw error;
  }
  const connect = net.Socket.prototype.connect;
  net.Socket.prototype.connect = function (...args) {
    const options = Array.isArray(args[0]) ? args[0][0] : net._normalizeArgs(args)[0];
    if (options.path) {
      // Permit local Node IPC, never a remote named pipe.
      if (/^\\\\/.test(options.path) && !/^\\\\\.\\pipe\\/.test(options.path)) block();
    } else if (!local.has(String(options.host || "localhost").toLowerCase())) block();
    return connect.apply(this, args);
  };
  for (const name of ["lookup", "lookupService", "resolve", "resolve4", "resolve6", "resolveAny", "resolveCaa", "resolveCname", "resolveMx", "resolveNaptr", "resolveNs", "resolvePtr", "resolveSoa", "resolveSrv", "resolveTxt", "reverse"]) {
    if (typeof dns[name] === "function") {
      const original = dns[name];
      dns[name] = function (host, ...args) {
        if (!local.has(String(host).toLowerCase())) block();
        return original.call(this, host, ...args);
      };
    }
    if (typeof dns.promises[name] === "function") {
      const original = dns.promises[name];
      dns.promises[name] = async function (host, ...args) {
        if (!local.has(String(host).toLowerCase())) block();
        return original.call(this, host, ...args);
      };
    }
  }
  dgram.Socket.prototype.send = block;
  dgram.Socket.prototype.connect = block;
  const nativeFetch = globalThis.fetch;
  globalThis.fetch = async function (input, init) {
    const url = new URL(typeof input === "string" || input instanceof URL ? input : input.url);
    if (!local.has(url.hostname.replace(/^\[|\]$/g, "").toLowerCase())) block();
    return nativeFetch.call(this, input, init);
  };
  for (const protocol of ["node:http", "node:https"]) {
    const client = require(protocol);
    for (const method of ["request", "get"]) {
      const original = client[method];
      client[method] = function (input, ...args) {
        const host = typeof input === "string" || input instanceof URL
          ? new URL(input).hostname.replace(/^\[|\]$/g, "")
          : input?.hostname || input?.host || "localhost";
        if (!local.has(String(host).toLowerCase())) block();
        return original.call(this, input, ...args);
      };
    }
  }
  fs.appendFileSync(process.env.RECRUITMENT_GUARD_LOG, "guard-loaded\n");
}
