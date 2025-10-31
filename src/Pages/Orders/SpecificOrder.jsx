import React, { useContext, useEffect, useState } from "react";
import TopBar from "../../Components/TopBar/TopBar";
import { Row, Col, Spinner, Alert, Form, Button, Card } from "react-bootstrap";
import Sidebar from "../../Components/SideBar/SideBar";
import { AuthContext } from "../../context/AuthContext";
import axios from "axios";
import { useParams } from "react-router-dom";

function SpecificOrder() {
  const { user, accessToken } = useContext(AuthContext);
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // 🧾 Fetch order details
  useEffect(() => {
    const getOrder = async () => {
      setLoading(true);
      setErrMsg("");
      try {
        const res = await axios.get(`https://neil-backend-1.onrender.com/checkout/${id}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setOrder(res.data.order || res.data);
      } catch (err) {
        console.error("❌ Error fetching order:", err);
        setErrMsg(
          err.response?.data?.message ||
            "Failed to load order details. Please try again later."
        );
      } finally {
        setLoading(false);
      }
    };

    if (accessToken && id) getOrder();
  }, [id, accessToken]);

  // 📝 Unified Order Update (status + note)
  const handleOrderUpdate = async (e) => {
    e.preventDefault();
    if (!order?.status) return;

    setSaving(true);
    setErrMsg("");
    setSuccessMsg("");

    try {
      const res = await axios.patch(
        `https://neil-backend-1.onrender.com/checkout/${id}`,
        { status: order.status, note },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      setSuccessMsg(res.data.message || "Order updated successfully!");
      setNote("");
    } catch (err) {
      console.error("❌ Error updating order:", err);
      setErrMsg(err.response?.data?.message || "Failed to update order.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <TopBar />
      <Row>
        <Col xs={2}>
          <Sidebar />
        </Col>

        <Col xs={10}>
          <div className="p-3">
            <h4 className="mb-4">Order Details</h4>

            {loading && (
              <div className="text-center py-5">
                <Spinner animation="border" /> Loading...
              </div>
            )}

            {errMsg && <Alert variant="danger">{errMsg}</Alert>}
            {successMsg && <Alert variant="success">{successMsg}</Alert>}

            {!loading && order && (
              <>
                {/* 🧾 Order Info */}
                <Form className="border rounded p-4 bg-light mb-4" onSubmit={handleOrderUpdate}>
                  <Row className="mb-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Order ID</Form.Label>
                        <Form.Control value={order.order_id || id} readOnly />
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group>
                        <Form.Label><strong>Status</strong></Form.Label>
                        {user.role === "Super Admin" ? (
                          <Form.Select
                            value={order.status}
                            onChange={(e) =>
                              setOrder({ ...order, status: e.target.value })
                            }
                          >
                            <option value="Pending">Pending</option>
                            <option value="Shipped">Shipped</option>
                            <option value="Cancelled">Cancelled</option>
                            <option value="Returned">Returned</option>
                            <option value="Delivered">Delivered</option>
                          </Form.Select>
                        ) : (
                          <Form.Control value={order.status} readOnly />
                        )}
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row className="mb-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Total Amount</Form.Label>
                        <Form.Control
                          value={`$${order.total_amount}`}
                          readOnly
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Order Date</Form.Label>
                        <Form.Control
                          value={
                            order.order_date
                              ? new Date(order.order_date).toLocaleString("en-GB")
                              : "N/A"
                          }
                          readOnly
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  {/* 📝 Note Field */}
                  {user.role === "Super Admin" && (
                    <>
                      <Form.Group>
                        <Form.Label>Note (optional)</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={4}
                          placeholder="Add a note for the customer..."
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                        />
                      </Form.Group>
                      <br />
                      <Button type="submit" disabled={saving}>
                        {saving ? "Updating..." : "Update Order"}
                      </Button>
                    </>
                  )}
                </Form>

                {/* 👤 Customer Info */}
                <Card className="p-4 mb-4 shadow-sm">
                  <h5 className="mb-3">Customer Information</h5>
                  <Row>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Customer Name</Form.Label>
                        <Form.Control
                          value={order.customer_name || "N/A"}
                          readOnly
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Email</Form.Label>
                        <Form.Control value={order.email || "N/A"} readOnly />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row className="mt-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Contact</Form.Label>
                        <Form.Control value={order.contact || "N/A"} readOnly />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Organization</Form.Label>
                        <Form.Control
                          value={order.organization_name || "N/A"}
                          readOnly
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </Card>

                {/* 🛍️ Product Info */}
                <Card className="p-4 shadow-sm">
                  <h5 className="mb-3">Product Information</h5>
                  <Row>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Product</Form.Label>
                        <Form.Control
                          value={order.product_title || "N/A"}
                          readOnly
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Category</Form.Label>
                        <Form.Control
                          value={order.product_category || "N/A"}
                          readOnly
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row className="mt-3">
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label>Variant</Form.Label>
                        <Form.Control
                          value={`${order.variant_color || ""} / ${order.variant_size || ""}`}
                          readOnly
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label>Placement</Form.Label>
                        <Form.Control
                          value={
                            order.placement_name
                              ? `${order.placement_name} (${order.placement_view})`
                              : "N/A"
                          }
                          readOnly
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label>Logo Title</Form.Label>
                        <Form.Control
                          value={order.logo_title || "N/A"}
                          readOnly
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row className="mt-4 text-center">
                    <Col md={6}>
                      <p className="fw-bold mb-1">Logo</p>
                      <img
                        src={order.logo_url}
                        alt={order.logo_title || "Logo"}
                        className="border rounded"
                        style={{
                          width: "100px",
                          height: "100px",
                          objectFit: "contain",
                          backgroundColor: "#f8f9fa",
                        }}
                      />
                    </Col>
                    <Col md={6}>
                      <p className="fw-bold mb-1">Product Preview</p>
                      <img
                        src={
                          order.preview_image_url?.startsWith("http")
                            ? order.preview_image_url
                            : `https://neil-backend-1.onrender.com${order.preview_image_url}`
                        }
                        alt="Preview"
                        className="border rounded"
                        style={{
                          width: "140px",
                          height: "140px",
                          objectFit: "cover",
                          backgroundColor: "#f8f9fa",
                        }}
                      />
                    </Col>
                  </Row>
                </Card>
              </>
            )}

            {!loading && !errMsg && !order && (
              <Alert variant="info">No order details found.</Alert>
            )}
          </div>
        </Col>
      </Row>
    </>
  );
}

export default SpecificOrder;
