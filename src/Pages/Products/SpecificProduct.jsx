import React, { useEffect, useState, useContext } from "react";

import TopBar from "../../Components/TopBar/TopBar";
import {
  Col,
  Row,
  Spinner,
  Alert,
  Card,
  Button,
  Form,
  Container,
  Accordion,
} from "react-bootstrap";
import Sidebar from "../../Components/SideBar/SideBar";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";

function SpecProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { accessToken } = useContext(AuthContext);

  const [product, setProduct] = useState(null);
  const [groups, setGroups] = useState([]);
  const [groupVisibility, setGroupVisibility] = useState([]); // holds visibility states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);

  // 🔹 Fetch product + visibility + groups
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError("");

        const [productRes, groupsRes] = await Promise.all([
          axios.get(`http://localhost:3000/products/${id}`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
          axios.get("http://localhost:3000/groups/all", {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
        ]);

        const productData = productRes.data.product;
        const allGroups = groupsRes.data.groups || [];
        const visibility = productData.group_visibility || [];

        // Merge group list + visibility state
        const mergedVisibility = allGroups.map((g) => {
          const match = visibility.find((v) => v.group_id === g.id);
          return { group_id: g.id, title: g.title, is_visible: !!match?.is_visible };
        });

        setProduct(productData);
        setGroups(allGroups);
        setGroupVisibility(mergedVisibility);
      } catch (err) {
        console.error("Error fetching product:", err);
        setError("Failed to fetch product details.");
      } finally {
        setLoading(false);
      }
    };

    if (accessToken && id) fetchProduct();
  }, [accessToken, id]);

  // 🔹 Toggle group visibility state
  const toggleGroupVisibility = (groupId) => {
    setGroupVisibility((prev) =>
      prev.map((gv) =>
        gv.group_id === groupId ? { ...gv, is_visible: !gv.is_visible } : gv
      )
    );
  };

  // 🔹 Save updated visibility
  const updateVisibility = async () => {
    try {
      const payload = groupVisibility.map(({ group_id, is_visible }) => ({
        group_id,
        is_visible,
      }));
      await axios.put(
        `http://localhost:3000/products/${id}`,
        { group_visibility: payload },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      alert("Group visibility updated successfully!");
    } catch (err) {
      console.error("Error updating visibility:", err);
      alert("Failed to update visibility");
    }
  };

  if (loading)
    return (
      <>
        <TopBar />
        <Row>
          <Col xs={2}>
            <Sidebar />
          </Col>
          <Col
            xs={10}
            className="d-flex justify-content-center align-items-center"
            style={{ height: "100vh" }}
          >
            <Spinner animation="border" variant="primary" />
          </Col>
        </Row>
      </>
    );

  if (error)
    return (
      <>
        <TopBar />
        <Row>
          <Col xs={2}>
            <Sidebar />
          </Col>
          <Col xs={10} className="p-4">
            <Alert variant="danger">{error}</Alert>
            <Button variant="secondary" onClick={() => navigate(-1)}>
              Go Back
            </Button>
          </Col>
        </Row>
      </>
    );

  if (!product) return null;

  return (
    <>
      <TopBar />
      <Row className="g-0">
        <Col xs={2}>
          <Sidebar />
        </Col>
        <Col xs={10} className="main-content px-4 py-3">
          <Container fluid className="form-box">
            <Card className="shadow-sm border-0">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h4 className="fw-semibold text-dark mb-0">Product Details</h4>
                  <div>
                    <Button
                      variant="secondary"
                      className="me-2"
                      onClick={() => navigate(-1)}
                    >
                      Back
                    </Button>
                    <Button variant="danger" onClick={async (e) => {
                      e.preventDefault();
                      if (window.confirm("Delete this product?")) {
                        await axios.delete(`http://localhost:3000/products/${id}`, {
                          headers: { Authorization: `Bearer ${accessToken}` },
                        });
                        navigate(-1);
                      }
                    }}>
                      Delete
                    </Button>
                  </div>
                </div>

                {/* 🔹 Group Visibility Section */}
                <div className="group-visibility mt-4 mb-4">
                  <h5>Group Visibility</h5>
                  <div className="d-flex flex-wrap gap-3 mt-2">
                    {groupVisibility.map((gv) => (
                      <Form.Check
                        key={gv.group_id}
                        type="checkbox"
                        label={gv.title}
                        checked={gv.is_visible}
                        onChange={() => toggleGroupVisibility(gv.group_id)}
                        className="d-flex align-items-center"
                      />
                    ))}
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    className="mt-3"
                    onClick={updateVisibility}
                  >
                    Save Visibility
                  </Button>
                </div>

                {/* Product Info */}
                <Form>
                  <Row>
                    <Col xs={12} md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Product Title</Form.Label>
                        <Form.Control
                          type="text"
                          value={product.title || ""}
                          readOnly
                        />
                      </Form.Group>
                    </Col>
                    <Col xs={12} md={3}>
                      <Form.Group className="mb-3">
                        <Form.Label>Category</Form.Label>
                        <Form.Control
                          type="text"
                          value={product.category || "-"}
                          readOnly
                        />
                      </Form.Group>
                    </Col>
                    <Col xs={12} md={3}>
                      <Form.Group className="mb-3">
                        <Form.Label>Sub Category</Form.Label>
                        <Form.Control
                          type="text"
                          value={product.sub_cat || "-"}
                          readOnly
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-3">
                    <Form.Label>Description</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={product.description || "-"}
                      readOnly
                    />
                  </Form.Group>

                  <Row>
                    <Col xs={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>SKU</Form.Label>
                        <Form.Control
                          type="text"
                          value={product.sku || "-"}
                          readOnly
                        />
                      </Form.Group>
                    </Col>
                    <Col xs={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Status</Form.Label>
                        <Form.Control
                          type="text"
                          value={
                            Number(product.isActive) === 1
                              ? "Active"
                              : "Inactive"
                          }
                          readOnly
                        />
                      </Form.Group>
                    </Col>
                    <Col xs={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Created At</Form.Label>
                        <Form.Control
                          type="text"
                          value={
                            new Date(product.created_at).toLocaleString() || "-"
                          }
                          readOnly
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  {/* Variants Accordion */}
                  {product.variants?.length > 0 && (
                    <div className="mt-4">
                      <h5>Variants</h5>
                      <Accordion defaultActiveKey="0">
                        {product.variants.map((v, idx) => (
                          <Accordion.Item eventKey={String(idx)} key={v.id}>
                            <Accordion.Header>
                              {v.color || "Variant"} — {v.size || "-"} ({v.sku})
                            </Accordion.Header>
                            <Accordion.Body>
                              <Row>
                                <Col md={4}>
                                  <p><strong>Color:</strong> {v.color || "-"}</p>
                                  <p><strong>Size:</strong> {v.size || "-"}</p>
                                  <p><strong>SKU:</strong> {v.sku || "-"}</p>
                                </Col>
                                <Col md={8}>
                                  {v.images?.length > 0 ? (
                                    <div className="d-flex flex-wrap gap-2">
                                      {v.images.map((img) => (
                                        <div key={img.id}>
                                          <img
                                            src={img.url}
                                            alt={img.type}
                                            height="120"
                                            style={{
                                              borderRadius: "6px",
                                              border: "1px solid #ccc",
                                              cursor: "pointer",
                                            }}
                                            onClick={() =>
                                              setSelectedImage(img.url)
                                            }
                                          />
                                          <div
                                            style={{
                                              fontSize: "0.8rem",
                                              textAlign: "center",
                                              marginTop: "4px",
                                            }}
                                          >
                                            {img.type}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-muted">
                                      No images for this variant
                                    </p>
                                  )}
                                </Col>
                              </Row>
                            </Accordion.Body>
                          </Accordion.Item>
                        ))}
                      </Accordion>
                    </div>
                  )}
                </Form>
              </Card.Body>
            </Card>
          </Container>
        </Col>
      </Row>
    </>
  );
}

export default SpecProduct;
