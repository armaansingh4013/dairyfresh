


import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet } from "../services/api.js";
import { useCart } from "../contexts/CartContext.jsx";

export default function DashboardPage({ user }) {
  const [products, setProducts] = useState([]);
  const [productsStatus, setProductsStatus] = useState("loading");
  const { addItem, items, updateQuantity } = useCart();

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

  function getCartItem(productId) {
    return items.find(
      (item) =>
        item._id === productId ||
        item.productId === productId ||
        item.id === productId
    );
  }

  return (
    <>
      <section className="section-card">
        <p className="section-kicker">Products</p>
        <h2>Live Catalog</h2>

        {products.length ? (
          <div className="products">
            {products.map((product) => {
              const cartItem = getCartItem(product._id);
              const quantity = cartItem?.quantity || 0;

              return (
                <article key={product._id} className="product">
                  <h3>{product.name}</h3>
                  <p>{product.description || "Fresh dairy item."}</p>
                  <p className="price">
                    INR {product.price} / {product.unit}
                  </p>

                  {quantity > 0 ? (
                    <div className="qty-stepper">
                      <button
                        className="ghost"
                        type="button"
                        onClick={() => updateQuantity(product._id, quantity - 1)}
                      >
                        -
                      </button>

                      <span>{quantity}</span>

                      <button
                        className="ghost"
                        type="button"
                        onClick={() => updateQuantity(product._id, quantity + 1)}
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <button
                      className="primary wide"
                      type="button"
                      onClick={() => addItem(product, 1)}
                    >
                      Add to Cart
                    </button>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <p className="empty-state">
            {productsStatus === "loading"
              ? "Loading products..."
              : productsStatus === "ready"
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
