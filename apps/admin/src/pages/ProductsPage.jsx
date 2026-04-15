import React, { useEffect, useState } from "react";
import { apiGet, apiPatch, apiPost } from "../services/api.js";
import { useNotifications } from "../contexts/NotificationContext.jsx";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    unit: "L",
    price: "",
    imageUrl: ""
  });
  const [editingProductId, setEditingProductId] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    unit: "L",
    price: "",
    imageUrl: "",
    isActive: true
  });
  const [status, setStatus] = useState("");
  const { notify } = useNotifications();

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    try {
      const data = await apiGet("/products?includeInactive=true");
      setProducts(Array.isArray(data) ? data : []);
    } catch {
      setProducts([]);
    }
  }

  async function submitProduct(event) {
    event.preventDefault();
    setStatus("");

    const price = Number(productForm.price);
    if (!productForm.name.trim()) {
      const message = "Product name is required.";
      setStatus(message);
      notify({ type: "error", message });
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      const message = "Enter a valid price.";
      setStatus(message);
      notify({ type: "error", message });
      return;
    }

    try {
      await apiPost("/products", {
        name: productForm.name.trim(),
        description: productForm.description.trim(),
        unit: productForm.unit.trim() || "L",
        price,
        imageUrl: productForm.imageUrl.trim() || undefined
      });
      setStatus("Product saved.");
      notify({ type: "success", message: "Product saved." });
      setProductForm({ name: "", description: "", unit: "L", price: "", imageUrl: "" });
      loadProducts();
    } catch (error) {
      const message = error.message || "Unable to save product.";
      setStatus(message);
      notify({ type: "error", message });
    }
  }

  function startEdit(product) {
    setEditingProductId(product._id);
    setEditForm({
      name: product.name || "",
      description: product.description || "",
      unit: product.unit || "L",
      price: String(product.price || ""),
      imageUrl: product.imageUrl || "",
      isActive: Boolean(product.isActive)
    });
  }

  async function saveEdit(productId) {
    const price = Number(editForm.price);
    if (!editForm.name.trim()) {
      const message = "Product name is required.";
      setStatus(message);
      notify({ type: "error", message });
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      const message = "Enter a valid price.";
      setStatus(message);
      notify({ type: "error", message });
      return;
    }

    try {
      await apiPatch(`/products/${productId}`, {
        name: editForm.name.trim(),
        description: editForm.description.trim(),
        unit: editForm.unit.trim() || "L",
        price,
        imageUrl: editForm.imageUrl.trim() || undefined,
        isActive: editForm.isActive
      });
      setStatus("Product updated.");
      notify({ type: "success", message: "Product updated." });
      setEditingProductId(null);
      loadProducts();
    } catch (error) {
      const message = error.message || "Unable to update product.";
      setStatus(message);
      notify({ type: "error", message });
    }
  }

  return (
    <>
      <header className="topbar">
        <div>
          <h1>Products</h1>
          <p>Manage pricing, units, and availability.</p>
        </div>
      </header>

      <section className="sheet">
        <h2>Add Product</h2>
        <form className="product-form" onSubmit={submitProduct}>
          <label>
            <span>Name</span>
            <input
              type="text"
              value={productForm.name}
              onChange={(event) =>
                setProductForm((current) => ({ ...current, name: event.target.value }))
              }
            />
          </label>
          <label>
            <span>Description</span>
            <input
              type="text"
              value={productForm.description}
              onChange={(event) =>
                setProductForm((current) => ({ ...current, description: event.target.value }))
              }
            />
          </label>
          <label>
            <span>Unit</span>
            <input
              type="text"
              value={productForm.unit}
              onChange={(event) =>
                setProductForm((current) => ({ ...current, unit: event.target.value }))
              }
            />
          </label>
          <label>
            <span>Price</span>
            <input
              type="number"
              min="1"
              step="0.5"
              value={productForm.price}
              onChange={(event) =>
                setProductForm((current) => ({ ...current, price: event.target.value }))
              }
            />
          </label>
          <label>
            <span>Image URL</span>
            <input
              type="text"
              value={productForm.imageUrl}
              onChange={(event) =>
                setProductForm((current) => ({ ...current, imageUrl: event.target.value }))
              }
            />
          </label>
          <button type="submit">Add Product</button>
        </form>
        {status && <p className="empty">{status}</p>}
      </section>

      <section className="sheet">
        <h2>Product List</h2>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Unit</th>
              <th>Price</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <React.Fragment key={product._id}>
                <tr>
                  <td>{product.name}</td>
                  <td>{product.description || "-"}</td>
                  <td>{product.unit}</td>
                  <td>INR {product.price}</td>
                  <td>{product.isActive ? "Active" : "Inactive"}</td>
                  <td>
                    <button type="button" onClick={() => startEdit(product)}>
                      {editingProductId === product._id ? "Editing" : "Edit"}
                    </button>
                  </td>
                </tr>
                {editingProductId === product._id && (
                  <tr className="edit-row">
                    <td colSpan="6">
                      <div className="inline-editor">
                        <label>
                          <span>Name</span>
                          <input
                            type="text"
                            value={editForm.name}
                            onChange={(event) =>
                              setEditForm((current) => ({
                                ...current,
                                name: event.target.value
                              }))
                            }
                          />
                        </label>
                        <label>
                          <span>Description</span>
                          <input
                            type="text"
                            value={editForm.description}
                            onChange={(event) =>
                              setEditForm((current) => ({
                                ...current,
                                description: event.target.value
                              }))
                            }
                          />
                        </label>
                        <label>
                          <span>Unit</span>
                          <input
                            type="text"
                            value={editForm.unit}
                            onChange={(event) =>
                              setEditForm((current) => ({
                                ...current,
                                unit: event.target.value
                              }))
                            }
                          />
                        </label>
                        <label>
                          <span>Price</span>
                          <input
                            type="number"
                            min="1"
                            step="0.5"
                            value={editForm.price}
                            onChange={(event) =>
                              setEditForm((current) => ({
                                ...current,
                                price: event.target.value
                              }))
                            }
                          />
                        </label>
                        <label>
                          <span>Image URL</span>
                          <input
                            type="text"
                            value={editForm.imageUrl}
                            onChange={(event) =>
                              setEditForm((current) => ({
                                ...current,
                                imageUrl: event.target.value
                              }))
                            }
                          />
                        </label>
                        <label className="checkbox-field">
                          <span>Active</span>
                          <input
                            type="checkbox"
                            checked={editForm.isActive}
                            onChange={(event) =>
                              setEditForm((current) => ({
                                ...current,
                                isActive: event.target.checked
                              }))
                            }
                          />
                        </label>
                        <div className="inline-actions">
                          <button type="button" onClick={() => saveEdit(product._id)}>
                            Save
                          </button>
                          <button type="button" onClick={() => setEditingProductId(null)}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
        {!products.length && <p className="empty">No products yet.</p>}
      </section>
    </>
  );
}
