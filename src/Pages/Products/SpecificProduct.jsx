import React, { useEffect, useState, useContext } from "react";
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
  Table,
} from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import TopBar from "../../Components/TopBar/TopBar";
import Sidebar from "../../Components/SideBar/SideBar";
import { AuthContext } from "../../context/AuthContext";

function SpecProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { accessToken } = useContext(AuthContext);

  const [product, setProduct] = useState(null);
  const [groups, setGroups] = useState([]);
  const [groupVisibility, setGroupVisibility] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Format price as currency
  const formatPrice = (price) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [productRes, groupsRes] = await Promise.all([
          axios.get(`https://neil-backend-1.onrender.com/products/${id}`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
          axios.get("https://neil-backend-1.onrender.com/groups/all", {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
        ]);

        const productData = productRes.data.product;
        const allGroups = groupsRes.data.groups || [];
        const visibilities = productData.group_visibility || [];

        const merged = allGroups.map((g) => {
          const match = visibilities.find((v) => v.group_id === g.id);
          return { group_id: g.id, title: g.title, is_visible: !!match?.is_visible };
        });

        setProduct(productData);
        setGroups(allGroups);
        setGroupVisibility(merged);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch product details.");
      } finally {
        setLoading(false);
      }
    };

    if (accessToken && id) fetchData();
  }, [accessToken, id]);

  const toggleGroupVisibility = (groupId) => {
    setGroupVisibility((prev) =>
      prev.map((g) =>
        g.group_id === groupId ? { ...g, is_visible: !g.is_visible } : g
      )
    );
  };

  const updateVisibility = async () => {
    try {
      const payload = groupVisibility.map(({ group_id, is_visible }) => ({
        group_id,
        is_visible,
      }));

      await axios.put(
        `https://neil-backend-1.onrender.com/products/${id}`,
        { group_visibility: payload },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      alert("Group visibility updated successfully!");
    } catch {
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
                {/* Header */}
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
                    <Button
                      variant="danger"
                      onClick={async () => {
                        if (window.confirm("Delete this product?")) {
                          await axios.delete(
                            `https://neil-backend-1.onrender.com/products/${id}`,
                            {
                              headers: { Authorization: `Bearer ${accessToken}` },
                            }
                          );
                          navigate(-1);
                        }
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>

                {/* Group Visibility */}
                <div className="mb-4">
                  <h5>Group Visibility</h5>
                  <div className="d-flex flex-wrap gap-3 mt-2">
                    {groupVisibility.map((g) => (
                      <Form.Check
                        key={g.group_id}
                        type="checkbox"
                        label={g.title}
                        checked={g.is_visible}
                        onChange={() => toggleGroupVisibility(g.group_id)}
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
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Title</Form.Label>
                        <Form.Control value={product.title} readOnly />
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group className="mb-3">
                        <Form.Label>Category</Form.Label>
                        <Form.Control value={product.category} readOnly />
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group className="mb-3">
                        <Form.Label>Sub Category</Form.Label>
                        <Form.Control value={product.sub_cat} readOnly />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-3">
                    <Form.Label>Description</Form.Label>
                    <Form.Control as="textarea" rows={3} value={product.description} readOnly />
                  </Form.Group>

                  <Row>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>SKU</Form.Label>
                        <Form.Control value={product.sku} readOnly />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Status</Form.Label>
                        <Form.Control
                          value={product.isActive ? "Active" : "Inactive"}
                          readOnly
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Base Price</Form.Label>
                        <Form.Control value={formatPrice(product.price)} readOnly />
                      </Form.Group>
                    </Col>
                  </Row>

                  {/* Product Images */}
                  <div className="mt-4">
                    <h5>Product Images</h5>
                    {product.images?.length > 0 ? (
                      <div className="d-flex flex-wrap gap-3 mt-2">
                        {product.images.map((img) => (
                          <img
                            key={img.id}
                            src={img.url}
                            alt="Product"
                            height="120"
                            className="rounded border"
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted">No images available</p>
                    )}
                  </div>

                  {/* Variants */}
                  {product.variants?.length > 0 && (
                    <div className="mt-5">
                      <h5>Variants</h5>
                      <Accordion defaultActiveKey="0">
                        {product.variants.map((v, idx) => (
                          <Accordion.Item eventKey={String(idx)} key={v.id}>
                            <Accordion.Header>
                              {v.color || "Variant"} — {v.sku}
                            </Accordion.Header>
                            <Accordion.Body>
                              <p><strong>Color:</strong> {v.color}</p>
                              <p><strong>Variant SKU:</strong> {v.sku}</p>

                              {/* Attributes Table */}
                              <h6 className="mt-3">Size & Pricing</h6>
                              {v.attributes?.length > 0 ? (
                                <Table striped bordered size="sm">
                                  <thead>
                                    <tr>
                                      <th>Size</th>
                                      <th>Price Adjustment</th>
                                      <th>Final Price</th>
                                      <th>Stock</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {v.attributes.map((a, i) => (
                                      <tr key={i}>
                                        <td>{a.name}</td>
                                        <td>{formatPrice(a.adjustment)}</td>
                                        <td>{formatPrice(a.final_price)}</td>
                                        <td>{a.stock}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </Table>
                              ) : (
                                <Alert variant="info">No size attributes defined</Alert>
                              )}

                              {/* Variant Images */}
                              <h6 className="mt-4">Variant Images</h6>
                              {v.images?.length > 0 ? (
                                <div className="d-flex flex-wrap gap-3">
                                  {v.images.map((img) => (
                                    <div key={img.id} style={{ textAlign: "center" }}>
                                      <img
                                        src={img.url}
                                        alt={img.type}
                                        height="120"
                                        className="rounded border"
                                      />
                                      <div style={{ fontSize: "0.8rem" }}>{img.type}</div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-muted">No images for this variant</p>
                              )}
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
