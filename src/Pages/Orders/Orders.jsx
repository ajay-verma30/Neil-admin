import React, { useContext, useEffect, useState } from "react";
import TopBar from "../../Components/TopBar/TopBar";
import { Col, Row, Table, Spinner, Alert, Form, InputGroup } from "react-bootstrap";
import Sidebar from "../../Components/SideBar/SideBar";
import { AuthContext } from "../../context/AuthContext";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPencil, faSearch } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";

function Orders() {
  const { accessToken } = useContext(AuthContext);
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
        const res = await axios.get("https://neil-backend-1.onrender.com/checkout/all", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
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

  // 🔍 Filter orders
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredOrders(orders);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = orders.filter(
      (order) =>
        order.customer_name?.toLowerCase().includes(term) ||
        order.organization_name?.toLowerCase().includes(term) ||
        order.email?.toLowerCase().includes(term)
    );
    setFilteredOrders(filtered);
  }, [searchTerm, orders]);

  const handleViewOrder = (orderId) => {
    navigate(`/admin/orders/${orderId}`);
  };

  return (
    <>
      <TopBar />
      <Row>
        <Col xs={2} md={2}>
          <Sidebar />
        </Col>

        <Col xs={10} md={10}>
          <div className="form-box p-3">
            <h4 className="mb-4">Orders List</h4>

            {/* 🔎 Search Bar */}
            <InputGroup className="mb-3">
              <InputGroup.Text>
                <FontAwesomeIcon icon={faSearch} />
              </InputGroup.Text>
              <Form.Control
                type="text"
                placeholder="Search by customer, organization, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>

            {/* 🔄 Loading */}
            {loading && (
              <div className="text-center p-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3">Loading orders...</p>
              </div>
            )}

            {/* ❌ Error */}
            {!loading && errMsg && (
              <Alert variant="danger" className="mb-3">
                {errMsg}
              </Alert>
            )}

            {/* 📦 Orders Table */}
            {!loading && !errMsg && filteredOrders.length > 0 && (
              <Table striped bordered hover responsive>
  <thead>
    <tr>
      <th>#</th>
      <th>Preview</th>
      <th>Order ID</th>
      <th>Customer</th>
      <th>Email</th>
      <th>Organization</th>
      <th>Product</th>
      <th>Variant</th>
      <th>Logo</th>
      <th>Placement</th> {/* 🧩 Added */}
      <th>Total ($)</th>
      <th>Status</th>
      <th>Date</th>
      <th>Action</th>
    </tr>
  </thead>

  <tbody>
    {filteredOrders.map((order, index) => (
      <tr key={order.order_id}>
        <td>{index + 1}</td>
        <td>
          <img
            src={order.preview_image_url}
            alt="preview"
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "8px",
              objectFit: "cover",
            }}
          />
        </td>
        <td>{order.order_id}</td>
        <td>{order.customer_name}</td>
        <td>{order.email}</td>
        <td>{order.organization_name}</td>
        <td>{order.product_title}</td>
        <td>
          {order.variant_color} / {order.variant_size}
        </td>
        <td>
          <img
            src={order.logo_url}
            alt={order.logo_title}
            title={order.logo_title}
            style={{
              width: "40px",
              height: "40px",
              objectFit: "contain",
            }}
          />
        </td>

        {/* 🧩 Placement Column */}
        <td>
          {order.placement_name}{" "}
          <small className="text-muted">
            ({order.placement_view})
          </small>
        </td>

        <td><strong>${parseFloat(order.total_amount).toFixed(2)}</strong></td>
        <td>{order.status}</td>
        <td>
          {new Date(order.order_date).toLocaleString("en-GB", {
            year: "numeric",
            month: "short",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </td>
        <td>
          <button
            className="btn btn-outline-primary btn-sm border-0"
            title="View / Edit Order"
            onClick={() => handleViewOrder(order.order_id)}
          >
            <FontAwesomeIcon icon={faPencil} />
          </button>
        </td>
      </tr>
    ))}
  </tbody>
</Table>

            )}

            {/* ℹ️ No Orders */}
            {!loading && !errMsg && filteredOrders.length === 0 && (
              <Alert variant="info" className="text-center">
                No orders found.
              </Alert>
            )}
          </div>
        </Col>
      </Row>
    </>
  );
}

export default Orders;
