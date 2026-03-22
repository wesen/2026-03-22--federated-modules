export function LocalStatusCard() {
  return (
    <section className="panel panel-accent">
      <p className="eyebrow">Host App</p>
      <h2>Local status</h2>
      <p className="body-copy">
        This panel is rendered directly by the host. It exists to contrast normal local
        rendering with the remote modules that are loaded later.
      </p>
      <dl className="status-grid">
        <div>
          <dt>Public host path</dt>
          <dd>/host/</dd>
        </div>
        <div>
          <dt>Remote asset path</dt>
          <dd>/remotes/checkout/</dd>
        </div>
        <div>
          <dt>Registry path</dt>
          <dd>/registry/remotes.json</dd>
        </div>
      </dl>
    </section>
  );
}
