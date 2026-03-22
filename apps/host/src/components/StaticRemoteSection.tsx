import { Suspense, lazy } from "react";

const StaticCartPanel = lazy(() => import("checkout/CartPanel"));

export function StaticRemoteSection() {
  return (
    <div className="registry-stack">
      <p className="meta-copy">
        Configured remote entry: <code>http://localhost:8080/remotes/checkout/remoteEntry.js</code>
      </p>
      <Suspense fallback={<p className="loading-copy">Loading static remote import...</p>}>
        <StaticCartPanel />
      </Suspense>
    </div>
  );
}
