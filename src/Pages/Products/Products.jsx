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
} from "react-bootstrap";
import { AuthContext } from "../../context/AuthContext";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useNavigate } from "react-router-dom";
import { faPencil, faPlus } from "@fortawesome/free-solid-svg-icons";
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

  // 🧩 Helper UI: Loader + Error overlay
  const OverlayCard = ({ children }) => (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "60vh" }}>
      <Card className="shadow-sm text-center p-5" style={{ minWidth: "400px" }}>
        {children}
      </Card>
    </div>
  );

  return (
    <>
      <TopBar />
      <Row>
        <Col xs={2} md={2}>
          <Sidebar />
        </Col>
        <Col xs={10} md={10}>
          <div className="form-box py-3">
            <Container fluid>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="fw-light text-secondary">Product Management</h2>
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

              {loading ? (
                <OverlayCard>
                  <div>
                    <Spinner animation="border" variant="primary" />
                    <div className="mt-3 text-muted">Loading products...</div>
                  </div>
                </OverlayCard>
              ) : err ? (
                <OverlayCard>
                  <Alert variant="danger" className="mb-3">
                    {err}
                  </Alert>
                  <Button variant="outline-danger" onClick={() => window.location.reload()}>
                    Retry
                  </Button>
                </OverlayCard>
              ) : products.length === 0 ? (
                <OverlayCard>
                  <div className="text-muted">No products found.</div>
                </OverlayCard>
              ) : (
                <Table striped bordered hover responsive className="shadow-sm">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Title</th>
                      <th>SKU</th>
                      <th>Variants</th>
                      <th>Created At</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p, index) => (
                      <tr key={p.id}>
                        <td>{index + 1}</td>
                        <td>{p.title}</td>
                        <td>{p.sku}</td>
                        <td>
                          {p.variants.map((v) => (
                            <div key={v.id}>
                              {v.color
                                ? `${v.color} / ${v.size} (${v.sku})`
                                : v.sku}
                            </div>
                          ))}
                        </td>
                        <td>{new Date(p.created_at).toLocaleString()}</td>
                        <td>
                          <FontAwesomeIcon
                            icon={faPencil}
                            style={{ cursor: "pointer" }}
                            onClick={() => specProducts(p.id)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Container>
          </div>
        </Col>
      </Row>
    </>
  );
}

export default Products;
