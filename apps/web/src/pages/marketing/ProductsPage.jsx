import React, { useEffect, useState } from "react";
import { apiGet } from "../../services/api.js";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    try {
      const data = await apiGet("/products");
      setProducts(Array.isArray(data) ? data : []);
    } catch {
      setProducts([]);
    }
  }

  return (
    <section className="section-card">
      <p className="section-kicker">Products</p>
      <h2>Full catalog</h2>
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
        <p className="empty-state">No products yet. Add from Admin.</p>
      )}
    </section>
  );
}
