import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet } from "../../services/api.js";

export default function HomePage() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    try {
      const data = await apiGet("/products");
      setProducts(Array.isArray(data) ? data.slice(0, 4) : []);
    } catch {
      setProducts([]);
    }
  }

  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Dairy Delivery</p>
          <h1>Pure milk, same-day delivery, every morning.</h1>
          <p className="lead">
            Fresh dairy subscriptions with flexible plans. Pause anytime, change
            quantities, and get farm-fresh products delivered daily.
          </p>
          <div className="cta-row">
            <Link className="primary" to="/products">
              Browse Products
            </Link>
            <Link className="ghost" to="/signup">
              Start Subscription
            </Link>
          </div>
        </div>
        <aside className="summary-card">
          <h3>Why customers love us</h3>
          <ul className="feature-list">
            <li>Pure milk, tested daily</li>
            <li>Same-day delivery guarantee</li>
            <li>Easy subscription management</li>
          </ul>
        </aside>
      </section>

      <section className="section-card">
        <p className="section-kicker">Highlights</p>
        <h2>Popular products</h2>
        <div className="products">
          {products.map((product) => (
            <article key={product.id} className="product">
              <h3>{product.name}</h3>
              <p>{product.description || "Farm-fresh dairy item."}</p>
              <p className="price">INR {product.price} / {product.unit}</p>
            </article>
          ))}
        </div>
        {!products.length && (
          <p className="empty-state">Add products in Admin to showcase here.</p>
        )}
      </section>
    </>
  );
}
