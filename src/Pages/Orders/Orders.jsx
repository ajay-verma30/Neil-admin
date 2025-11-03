import React, { useContext, useEffect, useState } from "react";
import TopBar from "../../Components/TopBar/TopBar";
import Sidebar from "../../Components/SideBar/SideBar";
import {
  Col,
  Row,
  Table,
  Spinner,
  Alert,
  Form,
  InputGroup,
  Container,
  Badge,
} from "react-bootstrap";
import { AuthContext } from "../../context/AuthContext";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";

function Orders() {
  const { accessToken, user } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const getOrders = async () => {
      setLoading(true);
      setErrMsg("");

      try {
        const res = await axios.get(
          "https://neil-backend-1.onrender.com/checkout/all-orders",
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        const fetchedOrders = res.data.orders || [];
        setOrders(fetchedOrders);
        setFilteredOrders(fetchedOrders);
      } catch (err) {
        console.error("Error fetching orders:", err);
        setErrMsg(
          err.response?.data?.message ||
            "Failed to load orders. Please try again later."
        );
      } finally {
        setLoading(false);
      }
    };

    if (accessToken) getOrders();
  }, [accessToken]);

  // 🔍 Search filter
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredOrders(orders);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = orders.filter(
      (order) =>
        order.f_name?.toLowerCase().includes(term) ||
        order.l_name?.toLowerCase().includes(term) ||
        order.email?.toLowerCase().includes(term) ||
        order.id?.toLowerCase().includes(term)
    );
    setFilteredOrders(filtered);
  }, [searchTerm, orders]);

  const handleViewOrder = (orderId) => {
    if(user.role === "Super Admin"){
navigate(`/admin/orders/${orderId}`);
    }else{
      navigate(`/${user.org_id}/orders/${orderId}`);
    }
    
  };

  return (
    <>
      <TopBar />
      <Row className="g-0">
        <Col md={2}>
          <Sidebar />
        </Col>
        <Col md={10} className="p-4">
          <Container fluid>
            <h3 className="mb-4 fw-bold">All Orders</h3>

            {/* Search bar */}
            <InputGroup className="mb-3" style={{ maxWidth: "400px" }}>
              <InputGroup.Text>
                <FontAwesomeIcon icon={faSearch} />
              </InputGroup.Text>
              <Form.Control
                type="text"
                placeholder="Search by name, email, or order ID"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>

            {/* Loader */}
            {loading && (
              <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
              </div>
            )}

            {/* Error Message */}
            {errMsg && !loading && (
              <Alert variant="danger" className="mt-3">
                {errMsg}
              </Alert>
            )}

            {/* Orders Table */}
            {!loading && !errMsg && filteredOrders.length > 0 && (
              <Table striped bordered hover responsive className="mt-3">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Order ID</th>
                    <th>Batch ID</th>
                    <th>Customer</th>
                    <th>Email</th>
                    <th>Total Amount</th>
                    <th>Status</th>
                    <th>Payment</th>
                    <th>Shipping Address</th>
                    <th>Billing Address</th>
                    <th>Created At</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order, index) => (
                    <tr key={order.id}>
                      <td>{index + 1}</td>
                      <td>
                        <strong>{order.id}</strong>
                      </td>
                      <td>{order.order_batch_id}</td>
                      <td>
                        {order.f_name} {order.l_name}
                      </td>
                      <td>{order.email}</td>
                      <td>
                        <strong>
                          ${parseFloat(order.total_amount).toFixed(2)}
                        </strong>
                      </td>

                      {/* ✅ Status Badge */}
                      <td>
                        <Badge
                          bg={
                            order.status === "Delivered"
                              ? "success"
                              : order.status === "Shipping"
                              ? "primary"
                              : "danger"
                          }
                          className="px-3 py-2 text-capitalize"
                        >
                          {order.status}
                        </Badge>
                      </td>

                      {/* ✅ Payment Badge */}
                      <td>
                        <Badge
                          bg={
                            order.payment_status === "Unpaid"
                              ? "warning"
                              : "success"
                          }
                          text={
                            order.payment_status === "Unpaid" ? "dark" : "light"
                          }
                          className="px-3 py-2 text-capitalize"
                        >
                          {order.payment_status}
                        </Badge>
                      </td>

                      <td style={{ maxWidth: "200px" }}>
                        {order.shipping_address}
                      </td>
                      <td style={{ maxWidth: "200px" }}>
                        {order.billing_address}
                      </td>
                      <td>
                        {new Date(order.created_at).toLocaleString("en-GB", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </td>

                      {/* 👇 Only clicking this opens the order */}
                      <td>
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => handleViewOrder(order.id)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}

            {!loading && !errMsg && filteredOrders.length === 0 && (
              <div className="text-center text-muted py-5">
                No orders found.
              </div>
            )}
          </Container>
        </Col>
      </Row>
    </>
  );
}

export default Orders;
