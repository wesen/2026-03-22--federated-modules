import { createInstance } from "@module-federation/enhanced/runtime";
import { resolveRemoteEntry } from "./registry";

const federationRuntime = createInstance({
  name: "host-runtime",
  remotes: []
});

const registeredEntries = new Map<string, string>();

async function ensureRemoteRegistered(remoteName: string) {
  const entry = await resolveRemoteEntry(remoteName);
  const current = registeredEntries.get(remoteName);

  if (current === entry) {
    return;
  }

  federationRuntime.registerRemotes(
    [
      {
        name: remoteName,
        entry
      }
    ],
    {
      force: true
    },
  );

  registeredEntries.set(remoteName, entry);
}

export async function loadRemoteModule<T>(remoteName: string, request: string): Promise<T> {
  await ensureRemoteRegistered(remoteName);
  return federationRuntime.loadRemote<T>(request);
}
