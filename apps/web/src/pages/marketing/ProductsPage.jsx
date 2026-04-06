


import React, { useEffect, useState } from "react";
import { apiGet } from "../../services/api.js";
import { useCart } from "../../contexts/CartContext.jsx";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const { addItem, items, updateQuantity } = useCart();

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

  function getCartItem(productId) {
    return items.find(
      (item) =>
        item._id === productId ||
        item.productId === productId ||
        item.id === productId
    );
  }

  return (
    <section className="section-card">
      <p className="section-kicker">Products</p>
      <h2>Full catalog</h2>

      <div className="products">
        {products.map((product) => {
          const cartItem = getCartItem(product._id);
          const quantity = cartItem?.quantity || 0;

          return (
            <article key={product._id} className="product">
              <h3>{product.name}</h3>
              <p>{product.description || "Farm-fresh dairy item."}</p>
              <p className="price">
                INR {product.price} / {product.unit}
              </p>

              {quantity > 0 ? (
                <div className="qty-stepper">
                  <button
                    type="button"
                    className="ghost"
                    onClick={() => updateQuantity(product._id, quantity - 1)}
                  >
                    -
                  </button>

                  <span>{quantity}</span>

                  <button
                    type="button"
                    className="ghost"
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

      {!products.length && (
        <p className="empty-state">No products yet. Add from Admin.</p>
      )}
    </section>
  );
}