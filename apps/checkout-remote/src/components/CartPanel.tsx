import { formatPrice } from "../utils/formatPrice";

const cartItems = [
  { id: "keyboard", name: "Split keyboard", price: 149, quantity: 1 },
  { id: "switches", name: "Silent switches", price: 42, quantity: 2 },
  { id: "cable", name: "Braided cable", price: 28, quantity: 1 }
];

function getTotal() {
  return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function CartPanel() {
  return (
    <section className="cart-panel">
      <header className="cart-header">
        <div>
          <p className="eyebrow">Exposed Module</p>
          <h2>CartPanel</h2>
        </div>
        <p className="pill">scope: checkout</p>
      </header>

      <ul className="cart-list">
        {cartItems.map((item) => (
          <li key={item.id} className="cart-item">
            <div>
              <h3>{item.name}</h3>
              <p>Quantity: {item.quantity}</p>
            </div>
            <strong>{formatPrice(item.price * item.quantity)}</strong>
          </li>
        ))}
      </ul>

      <footer className="cart-footer">
        <span>Total</span>
        <strong>{formatPrice(getTotal())}</strong>
      </footer>
    </section>
  );
}
