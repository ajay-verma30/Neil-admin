import React, { useEffect, useState, useContext } from "react";
import { Container, Table, Badge, Spinner, Alert, Button } from "react-bootstrap";
import { AuthContext } from "../context/AuthContext";
import TopBar from "../Components/TopBar/TopBar";
import axios from "axios";

function Orders() {
  const { user, accessToken } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await axios.get("https://neil-backend-1.onrender.com/checkout/all", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setOrders(res.data.orders || []);
    } catch (err) {
      setError("Failed to load orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchOrders();
  }, [user]);

  const getStatusVariant = (status) => {
    switch (status) {
      case "Pending":
        return "warning";
      case "Shipped":
        return "success";
      case "Cancelled":
        return "danger";
      case "Returned":
        return "secondary";
      default:
        return "info";
    }
  };

  return (
    <>
      <TopBar />
      <Container className="py-4 form-box">
        <h3 className="mb-4">📦 My Orders</h3>

        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" />
          </div>
        ) : error ? (
          <Alert variant="danger">{error}</Alert>
        ) : orders.length === 0 ? (
          <div className="text-center py-5">
            <img
              src="/images/empty-cart.svg"
              alt="No Orders"
              style={{ width: "180px", opacity: 0.8, marginBottom: "20px" }}
            />
            <h5 className="text-muted">You haven't ordered anything yet.</h5>
            <p className="text-secondary">Browse products and start shopping!</p>
          </div>
        ) : (
          <Table responsive bordered hover className="align-middle shadow-sm">
            <thead className="bg-light">
              <tr>
                <th>#</th>
                <th>Preview</th>
                <th>Title</th>
                <th>Total Amount</th>
                <th>Status</th>
                <th>Ordered On</th>
                {user?.role === "Super Admin" && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {orders.map((order, index) => (
                <tr key={order.id}>
                  <td>{index + 1}</td>
                  <td>
                    {order.preview_image_url ? (
                      <img
                        src={`https://neil-backend-1.onrender.com${order.preview_image_url}`}
                        alt="Preview"
                        style={{
                          width: "70px",
                          height: "70px",
                          objectFit: "cover",
                          borderRadius: "8px",
                        }}
                      />
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>{order.product_title || "Custom Product"}</td>
                  <td><strong>{order.total_amount}</strong></td>
                  <td>
                    <Badge bg={getStatusVariant(order.status)}>
                      {order.status}
                    </Badge>
                  </td>
                  <td>
                    {order.order_date}
                  </td>
                  {user?.role === "Super Admin" && (
                    <td>
                      <Button
                        size="sm"
                        variant="outline-success"
                        onClick={async () => {
                          const newStatus =
                            order.status === "Pending" ? "Shipped" : "Pending";
                          try {
                            await axios.patch(
                              `https://neil-backend-1.onrender.com/checkout/${order.id}/status`,
                              { status: newStatus },
                              {
                                headers: { Authorization: `Bearer ${accessToken}` },
                              }
                            );
                            fetchOrders();
                          } catch (err) {
                            alert("❌ Failed to update status");
                          }
                        }}
                      >
                        {order.status === "Pending"
                          ? "Mark Shipped"
                          : "Set Pending"}
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Container>
    </>
  );
}

export default Orders;
