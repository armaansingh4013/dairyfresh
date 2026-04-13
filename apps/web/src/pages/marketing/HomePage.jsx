import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet } from "../../services/api.js";
import { useCart } from "../../contexts/CartContext.jsx";

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const { addItem, items, updateQuantity } = useCart();

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    setLoadingProducts(true);
    try {
      const data = await apiGet("/products");
      setProducts(Array.isArray(data) ? data.slice(0, 4) : []);
    } catch {
      setProducts([]);
    } finally {
      setLoadingProducts(false);
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
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Mazara Dairy</p>
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
        {loadingProducts ? (
          <p className="inline-loader">
            <span className="button-spinner" aria-hidden="true" />
            Loading products...
          </p>
        ) : null}

        <div className="products">
          {products.map((product) => {
            const productId = product._id || product.id;
            const cartItem = getCartItem(productId);
            const quantity = cartItem?.quantity || 0;

            return (
              <article key={productId} className="product">
                <h3>{product.name}</h3>
                <p>{product.description || "Farm-fresh dairy item."}</p>
                <p className="price">
                  INR {product.price} / {product.unit}
                </p>

                {quantity > 0 ? (
                  <div className="qty-stepper">
                    <button
                      className="ghost"
                      type="button"
                      onClick={() => updateQuantity(productId, quantity - 1)}
                    >
                      -
                    </button>

                    <span>{quantity}</span>

                    <button
                      className="ghost"
                      type="button"
                      onClick={() => updateQuantity(productId, quantity + 1)}
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

        {!products.length && (
          <p className="empty-state">
            {loadingProducts ? "Loading products..." : "Add products in Admin to showcase here."}
          </p>
        )}
      </section>
    </>
  );
}
