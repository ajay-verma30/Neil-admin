import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { Container, Row, Col, Card, Button, Spinner, Alert } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

function ProductList() {
    const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { user, accessToken } = useContext(AuthContext);

  useEffect(() => {
    const getProducts = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await axios.get("http://localhost:3000/products/all-products", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setProducts(res.data.products || []);
      } catch (err) {
        console.error("Error fetching products:", err);
        if (err.response) {
          setError(err.response.data.message || "Failed to fetch products.");
        } else if (err.request) {
          setError("No response from server. Please check your connection.");
        } else {
          setError("Something went wrong while fetching products.");
        }
      } finally {
        setLoading(false);
      }
    };
    getProducts();
  }, [user, accessToken]);

  // ✅ Loading state
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
        <Spinner animation="border" variant="primary" role="status" />
        <span className="ms-2 text-muted">Loading products...</span>
      </div>
    );
  }

  // ✅ Error state
  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger" className="text-center">
          <Alert.Heading>Error</Alert.Heading>
          <p>{error}</p>
        </Alert>
      </Container>
    );
  }

  // ✅ Empty state
  if (products.length === 0) {
    return (
      <Container className="py-5 text-center">
        <h5 className="text-muted">No products available.</h5>
      </Container>
    );
  }

  const productNav = (id)=>{
    navigate(`/products/${id}`)
  }

  return (
    <Container fluid className="py-4 bg-light min-vh-100">
      <Container>
        <div className="mb-4">
          <h3 className="fw-bold">Products</h3>
          <p className="text-muted mb-0">
            Manage your product catalog ({products.length} items)
          </p>
        </div>

        <Row className="g-4">
          {products.map((product) => {
            const imageUrl =
              product?.variants?.[0]?.images?.[0]?.url ||
              "https://via.placeholder.com/300x200.png?text=No+Image";
            return (
              <Col key={product.id} xs={12} sm={6} md={4} lg={3}>
                <Card className="h-100 shadow-sm border-0">
                  <div className="position-relative">
                    <Card.Img
                      variant="top"
                      src={imageUrl}
                      alt={product.title}
                      style={{ height: "200px", objectFit: "contain" }}
                    />
                    <span
                      className={`badge position-absolute top-0 end-0 m-2 ${
                        product.isActive ? "bg-success" : "bg-danger"
                      }`}
                    >
                      {product.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <Card.Body>
                    <Card.Title className="fw-semibold mb-2">
                      {product.title}
                    </Card.Title>

                    <div className="mb-2">
                      {product.category && (
                        <span className="badge bg-primary-subtle text-primary me-1">
                          {product.category}
                        </span>
                      )}
                      {product.sub_cat && (
                        <span className="badge bg-info-subtle text-info">
                          {product.sub_cat}
                        </span>
                      )}
                    </div>

                    <Card.Text className="text-muted small mb-2">
                      <strong>SKU:</strong> {product.sku || "N/A"}
                    </Card.Text>

                    <Card.Text className="text-secondary small mb-3">
  {(product.description && product.description.length > 80)
    ? product.description.slice(0, 80) + "..."
    : product.description || "No description available."}
</Card.Text>
                  </Card.Body>

                  <Card.Footer className="bg-white border-0 d-flex justify-content-between align-items-center">
                    <h6 className="fw-bold mb-0">
                      ${product.price || "0.00"}
                    </h6>
                    <Button
  variant="outline-primary"
  size="sm"
  onClick={() => productNav(product.id)} 
>
  View Details
</Button>
                  </Card.Footer>
                </Card>
              </Col>
            );
          })}
        </Row>
      </Container>
    </Container>
  );
}

export default ProductList;
