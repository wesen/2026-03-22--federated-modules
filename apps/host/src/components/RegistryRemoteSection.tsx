import { useState } from "react";
import type { ComponentType } from "react";
import { loadRemoteModule } from "../runtime/federation";

type RemoteCartModule = {
  CartPanel?: ComponentType;
  default?: ComponentType;
};

type RemotePriceModule = {
  formatPrice: (value: number) => string;
};

export function RegistryRemoteSection() {
  const [RemoteComponent, setRemoteComponent] = useState<ComponentType | null>(null);
  const [pricePreview, setPricePreview] = useState<string | null>(null);
  const [status, setStatus] = useState("Idle");
  const [error, setError] = useState<string | null>(null);

  async function handleLoad() {
    setStatus("Loading registry entry and remote module...");
    setError(null);

    try {
      const cartModule = await loadRemoteModule<RemoteCartModule>("checkout", "checkout/CartPanel");
      const priceModule = await loadRemoteModule<RemotePriceModule>("checkout", "checkout/formatPrice");
      const component = cartModule.default ?? cartModule.CartPanel;

      if (!component) {
        throw new Error("Remote cart module did not expose a React component");
      }

      setRemoteComponent(() => component);
      setPricePreview(priceModule.formatPrice(219.5));
      setStatus("Remote modules loaded from registry");
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : String(loadError);
      setError(message);
      setStatus("Registry-backed remote load failed");
    }
  }

  return (
    <div className="registry-stack">
      <p className="meta-copy">
        Registry source: <code>/registry/remotes.json</code>
      </p>
      <button className="action-button" type="button" onClick={handleLoad}>
        Load remote from registry
      </button>
      <p className="meta-copy">{status}</p>
      <p className="meta-copy">
        Runtime request IDs: <code>checkout/CartPanel</code> and <code>checkout/formatPrice</code>
      </p>
      {pricePreview ? <p className="meta-copy">Remote utility preview: {pricePreview}</p> : null}
      {error ? <p className="error-copy">{error}</p> : null}
      {RemoteComponent ? <RemoteComponent /> : null}
    </div>
  );
}
