import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet } from "../services/api.js";

export default function DashboardPage({ user }) {
  const [products, setProducts] = useState([]);
  const [productsStatus, setProductsStatus] = useState("loading");

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    try {
      const data = await apiGet("/products");
      setProducts(Array.isArray(data) ? data : []);
      setProductsStatus("ready");
    } catch {
      setProducts([]);
      setProductsStatus("error");
    }
  }

  return (
    <>
      <section className="section-card">
        <p className="section-kicker">Products</p>
        <h2>Live Catalog</h2>
        {products.length ? (
          <div className="products">
            {products.map((product) => (
              <article key={product.id} className="product">
                <h3>{product.name}</h3>
                <p>{product.description || "Fresh dairy item."}</p>
                <p className="price">INR {product.price} / {product.unit}</p>
              </article>
            ))}
          </div>
        ) : (
          <p className="empty-state">
            {productsStatus === "ready"
              ? "No products yet. Add products in Admin."
              : "Unable to load products. Start the API."}
          </p>
        )}
      </section>

      <section className="section-card action-panel">
        <p className="section-kicker">Start</p>
        <h2>Ready to begin a subscription?</h2>
        <p className="lead compact">
          Create a new plan by choosing product, dates, address, and payment in
          the guided flow.
        </p>
        <Link className="primary" to="/app/start">
          Start Subscription
        </Link>
      </section>
    </>
  );
}
