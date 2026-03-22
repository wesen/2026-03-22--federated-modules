import { LocalStatusCard } from "../components/LocalStatusCard";
import { RegistryRemoteSection } from "../components/RegistryRemoteSection";
import { RemoteBoundary } from "../components/RemoteBoundary";
import { StaticRemoteSection } from "../components/StaticRemoteSection";

export function HomePage() {
  return (
    <main className="host-shell">
      <section className="hero-banner">
        <p className="eyebrow">Host Shell</p>
        <h1>Runtime-loaded federated modules</h1>
        <p className="body-copy hero-copy">
          The host serves local UI from <code>/host/</code>, fetches remote assets from{" "}
          <code>/remotes/checkout/</code>, and resolves dynamic URLs from{" "}
          <code>/registry/remotes.json</code>.
        </p>
      </section>

      <LocalStatusCard />

      <RemoteBoundary
        title="Static remote import"
        description="This section uses the host build configuration to resolve the remote container."
      >
        <StaticRemoteSection />
      </RemoteBoundary>

      <RemoteBoundary
        title="Registry-backed remote import"
        description="This section fetches the remote entry path at runtime and loads the exposed modules programmatically."
      >
        <RegistryRemoteSection />
      </RemoteBoundary>
    </main>
  );
}
