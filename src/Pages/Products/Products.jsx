import React, { useEffect, useState, useContext } from "react";
import TopBar from "../../Components/TopBar/TopBar";
import Sidebar from "../../Components/SideBar/SideBar";
import {
  Row,
  Col,
  Container,
  Table,
  Spinner,
  Alert,
  Card,
  Button,
  Image,
  Badge,
} from "react-bootstrap";
import { AuthContext } from "../../context/AuthContext";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useNavigate } from "react-router-dom";
import { faPencil, faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";
import "./Product.css";

function Products() {
  const navigate = useNavigate();
  const { user, accessToken } = useContext(AuthContext);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (!accessToken) return;

    const fetchProducts = async () => {
      try {
        setLoading(true);
        setErr(null);

        const res = await axios.get(
          "https://neil-backend-1.onrender.com/products/all-products",
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
        console.log(res);

        setProducts(res.data.products || []);
      } catch (error) {
        setErr(
          error.response?.data?.message ||
            "Failed to fetch products. Please try again later."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [accessToken]);

  const createProduct = () => {
    if (user.role === "Super Admin") {
      navigate("/admin/products/new");
    } else {
      navigate(`/${user.org_id}/products/new`);
    }
  };

  const specProducts = (productId) => {
    if (user.role === "Super Admin") {
      navigate(`/admin/products/${productId}`);
    } else {
      navigate(`/${user.org_id}/products/${productId}`);
    }
  };

  const OverlayCard = ({ children }) => (
    <div
      className="d-flex justify-content-center align-items-center"
      style={{ minHeight: "60vh" }}
    >
      <Card className="shadow-sm text-center p-5" style={{ minWidth: "400px" }}>
        {children}
      </Card>
    </div>
  );

const deleteProduct = async (id, title) => {
  if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;

  try {
    const res = await fetch(`https://neil-backend-1.onrender.com/products/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await res.json();

    if (res.ok) {
      alert(data.message || "Product deleted successfully!");
      setProducts(products.filter((p) => p.id !== id)); // remove from UI
    } else {
      alert(data.message || "Failed to delete product");
    }
  } catch (err) {
    console.error("❌ Error deleting product:", err);
    alert("An error occurred while deleting the product.");
  }
};


  return (
    <>
      <TopBar />

      <Container fluid className="p-0">
        <Row className="g-0">
          {/* Sidebar */}
          <Col xs={12} md={2} className="bg-light min-vh-100 border-end">
            <Sidebar />
          </Col>

          {/* Main Content */}
          <Col xs={12} md={10} className="p-4">
            <div className="mb-4 d-flex justify-content-between align-items-center border-bottom pb-2 form-box">
              <h2 className="fw-light text-secondary mb-0">
                Product Management
              </h2>
              <Button
                variant="primary"
                className="d-flex align-items-center shadow-sm"
                title="Add New Product"
                onClick={createProduct}
              >
                <FontAwesomeIcon icon={faPlus} className="me-2" />
                Add Product
              </Button>
            </div>

            {/* Loader / Error / Empty */}
            {loading ? (
              <OverlayCard>
                <Spinner animation="border" variant="primary" />
                <div className="mt-3 text-muted">Loading products...</div>
              </OverlayCard>
            ) : err ? (
              <OverlayCard>
                <Alert variant="danger" className="mb-3">
                  {err}
                </Alert>
                <Button
                  variant="outline-danger"
                  onClick={() => window.location.reload()}
                >
                  Retry
                </Button>
              </OverlayCard>
            ) : products.length === 0 ? (
              <OverlayCard>
                <div className="text-muted">No products found.</div>
              </OverlayCard>
            ) : (
              <Table
                striped
                bordered
                hover
                responsive
                className="shadow-sm align-middle"
              >
                <thead className="table-light">
                  <tr>
                    <th>#</th>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Sub Category</th>
                    <th>Price</th>
                    <th>Variants</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p, index) => (
                    <tr key={p.id}>
                      <td>{index + 1}</td>
                      <td>
                        <div className="fw-semibold">{p.title}</div>
                        <div className="text-muted small">{p.sku}</div>
                        {/* {p.sub_cat && (
                          <Badge bg="secondary" className="mt-1">
                            {p.sub_cat}
                          </Badge>
                        )} */}
                      </td>
                      <td>
                        <span>{p.category}</span>
                      </td>
                      <td>
                        <span>{p.sub_category}</span>
                      </td>
                      <td>
                        <strong>${parseFloat(p.price).toFixed(2)}</strong>
                      </td>

                      {/* Variants column */}
                      <td>
                        {p.variants.length > 0 ? (
                          p.variants.map((v) => (
                            <div
                              key={v.id}
                              className="mb-2 border-bottom pb-1 small"
                            >
                              {/* Color + SKU */}
                              <div className="fw-semibold text-primary">
                                {v.color || "No Color"} ({v.sku})
                              </div>

                              {/* Thumbnail */}
                              {v.images?.[0] && (
                                <Image
                                  src={v.images[0].url}
                                  alt="variant"
                                  rounded
                                  style={{
                                    width: "40px",
                                    height: "40px",
                                    objectFit: "cover",
                                    marginRight: "5px",
                                  }}
                                />
                              )}

                              {/* Sizes */}
                              {v.attributes.length > 0 ? (
                                <div className="mt-1 text-muted">
                                  {v.attributes.map((attr) => (
                                    <div key={attr.name}>
                                      • {attr.name} (
                                      <span className="text-success">
                                        +${parseFloat(attr.adjustment).toFixed(
                                          2
                                        )}
                                      </span>
                                      ) | Stock: {attr.stock}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-muted">No sizes</div>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="text-muted">No variants</div>
                        )}
                      </td>

                      {/* Created At */}
                      <td>
                        {new Date(p.created_at).toLocaleDateString()}{" "}
                        <div className="text-muted small">
                          {new Date(p.created_at).toLocaleTimeString()}
                        </div>
                      </td>

                      <td>
                        <FontAwesomeIcon
                          icon={faPencil}
                          style={{
                            cursor: "pointer",
                            color: "#0d6efd",
                          }}
                          onClick={() => specProducts(p.id)}
                        />
                        <FontAwesomeIcon
                          icon={faTrash}
                          style={{
                            cursor: "pointer",
                            color: "#fd450dff",
                          }}
                          onClick={() => deleteProduct(p.id, p.title)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Col>
        </Row>
      </Container>
    </>
  );
}

export default Products;
