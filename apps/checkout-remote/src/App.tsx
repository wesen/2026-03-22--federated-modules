import { CartPanel } from "./components/CartPanel";

export function App() {
  return (
    <main className="page-shell">
      <section className="hero-card">
        <p className="eyebrow">Remote App</p>
        <h1>Checkout Remote</h1>
        <p className="lede">
          This standalone page renders the same federated component the host will later
          request at runtime.
        </p>
      </section>
      <CartPanel />
    </main>
  );
}
