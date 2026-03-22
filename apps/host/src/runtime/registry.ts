type RemoteRegistry = Record<string, string>;

export async function fetchRemoteRegistry(): Promise<RemoteRegistry> {
  const response = await fetch("/registry/remotes.json");

  if (!response.ok) {
    throw new Error(`Failed to load registry: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<RemoteRegistry>;
}

export async function resolveRemoteEntry(remoteName: string): Promise<string> {
  const registry = await fetchRemoteRegistry();
  const entry = registry[remoteName];

  if (!entry) {
    throw new Error(`Remote '${remoteName}' was not found in the registry`);
  }

  return new URL(entry, window.location.origin).toString();
}
