import { Suspense, lazy } from "react";

const StaticCartPanel = lazy(() => import("checkout/CartPanel"));

export function StaticRemoteSection() {
  return (
    <Suspense fallback={<p className="loading-copy">Loading static remote import...</p>}>
      <StaticCartPanel />
    </Suspense>
  );
}
