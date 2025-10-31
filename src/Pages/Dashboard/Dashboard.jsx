import React, { useContext, useEffect, useState, useCallback } from "react";
import TopBar from "../../Components/TopBar/TopBar";
import Sidebar from "../../Components/SideBar/SideBar";
import { AuthContext } from "../../context/AuthContext";
import { Modal, Button, Spinner, Alert, Row, Col, Card } from "react-bootstrap";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faBoxOpen,
  faStamp,
  faCartShopping,
  faRotateRight,
} from "@fortawesome/free-solid-svg-icons";
import { Line, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

function Dashboard() {
  const { user, accessToken } = useContext(AuthContext);

  const [showPopup, setShowPopup] = useState(false);
  const [totals, setTotals] = useState({ users: 0, products: 0, logos: 0, orders: 0 });
  const [orderTrends, setOrderTrends] = useState([]);
  const [orderStatusSummary, setOrderStatusSummary] = useState([]); // 🆕 Added state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ org: "", timeframe: "month" });
  const [orgList, setOrgList] = useState([]);

  // 🟢 Show welcome popup once per session
  useEffect(() => {
    if (user?.role) {
      const popupShown = sessionStorage.getItem("dashboardPopupShown");
      if (!popupShown) {
        setShowPopup(true);
        sessionStorage.setItem("dashboardPopupShown", "true");
      }
    }
  }, [user]);

  const handleClose = () => setShowPopup(false);

  // 🟢 Fetch organizations (for Super Admin)
  const fetchOrganizations = useCallback(async () => {
    if (user?.role === "Super Admin" && accessToken) {
      try {
        const res = await axios.get("https://neil-backend-1.onrender.com/organization/organizations-list", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setOrgList(res.data.data || []);
      } catch (err) {
        console.error("❌ Error fetching organizations:", err);
      }
    }
  }, [user, accessToken]);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  // 🟢 Fetch dashboard summary
  const fetchDashboardData = useCallback(async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      setError(null);

      const headers = { Authorization: `Bearer ${accessToken}` };
      const params = {};
      if (user?.role === "Super Admin" && filters.org) params.org_id = filters.org;
      if (filters.timeframe) params.timeframe = filters.timeframe;
      const query = new URLSearchParams(params).toString();

      const [userRes, productRes, logoRes, orderRes] = await Promise.all([
        axios.get(`https://neil-backend-1.onrender.com/users/users-summary?${query}`, { headers }),
        axios.get(`https://neil-backend-1.onrender.com/products/products-summary?${query}`, { headers }),
        axios.get(`https://neil-backend-1.onrender.com/logos/logo-summary?${query}`, { headers }),
        axios.get(`https://neil-backend-1.onrender.com/checkout/order-summary?${query}`, { headers }),
      ]);

      setTotals({
        users: userRes.data?.data?.total_users || 0,
        products: productRes.data?.data?.total_products || 0,
        logos: logoRes.data?.data?.total_logos || 0,
        orders: orderRes.data?.data?.total_orders || 0,
      });
    } catch (err) {
      console.error("❌ Dashboard fetch error:", err);
      setError(err.response?.data?.message || "Failed to load dashboard summary.");
    } finally {
      setLoading(false);
    }
  }, [accessToken, user, filters]);

  // 🟢 Fetch order trends (for line chart)
  const fetchOrderTrends = useCallback(async () => {
    if (!accessToken) return;
    try {
      const headers = { Authorization: `Bearer ${accessToken}` };
      const params = {};
      if (user?.role === "Super Admin" && filters.org) params.org_id = filters.org;
      if (filters.timeframe) params.timeframe = filters.timeframe;
      const query = new URLSearchParams(params).toString();

      const res = await axios.get(`https://neil-backend-1.onrender.com/checkout/order-trends?${query}`, { headers });
      setOrderTrends(res.data.data || []);
    } catch (err) {
      console.error("❌ Error fetching order trends:", err);
    }
  }, [accessToken, user, filters]);

  // 🟢 Fetch order status summary (for doughnut chart)
  const fetchOrderStatusSummary = useCallback(async () => {
    if (!accessToken) return;
    try {
      const headers = { Authorization: `Bearer ${accessToken}` };
      const params = {};
      if (user?.role === "Super Admin" && filters.org) params.org_id = filters.org;
      if (filters.timeframe) params.timeframe = filters.timeframe;
      const query = new URLSearchParams(params).toString();

      const res = await axios.get(`https://neil-backend-1.onrender.com/checkout/order-status-summary?${query}`, {
        headers,
      });
      setOrderStatusSummary(res.data.data || []);
    } catch (err) {
      console.error("❌ Error fetching order status summary:", err);
    }
  }, [accessToken, user, filters]);

  // 🔁 Auto refresh on filter change
  useEffect(() => {
    if (user && accessToken) {
      fetchDashboardData();
      fetchOrderTrends();
      fetchOrderStatusSummary(); // 🆕 Added
    }
  }, [fetchDashboardData, fetchOrderTrends, fetchOrderStatusSummary]);

  // 🧮 Chart data
  const chartData = {
    labels: orderTrends.map((item) => item.period),
    datasets: [
      {
        label: "Orders",
        data: orderTrends.map((item) => item.total_orders),
        borderColor: "rgba(75,192,192,1)",
        backgroundColor: "rgba(75,192,192,0.2)",
        tension: 0.3,
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: "Orders Over Time" },
    },
    scales: {
      x: { title: { display: true, text: "Period" } },
      y: { title: { display: true, text: "Orders" }, beginAtZero: true,
     ticks: {
        stepSize: 1, 
        precision: 0, 
      }, },
    },
  };

  // 🧮 Doughnut chart data
  const statusChartData = {
    labels: orderStatusSummary.map((item) => item.status),
    datasets: [
      {
        data: orderStatusSummary.map((item) => item.count),
        backgroundColor: ["#f6c23e", "#1cc88a", "#e74a3b", "#36b9cc"],
        borderWidth: 1,
      },
    ],
  };

  const cardData = [
    { label: "Total Users", value: totals.users, icon: <FontAwesomeIcon icon={faUser} /> },
    { label: "Total Products", value: totals.products, icon: <FontAwesomeIcon icon={faBoxOpen} /> },
    { label: "Total Logos", value: totals.logos, icon: <FontAwesomeIcon icon={faStamp} /> },
    { label: "Total Orders", value: totals.orders, icon: <FontAwesomeIcon icon={faCartShopping} /> },
  ];

  return (
    <>
      <TopBar />
      <Row>
        <Col xs={2} md={2}>
          <Sidebar />
        </Col>
        <Col xs={10} md={10}>
          <div className="p-4" style={{ marginTop: "60px" }}>
            <h2 className="mb-4">Dashboard Overview</h2>

            {/* --- Filters --- */}
            <div className="d-flex gap-3 mb-5 p-3 bg-white rounded shadow-sm align-items-center">
              {user?.role === "Super Admin" && (
                <div className="d-flex align-items-center me-3">
                  <label className="me-2 text-muted fw-bold">Organization:</label>
                  <select
                    className="form-select"
                    value={filters.org}
                    onChange={(e) => setFilters((f) => ({ ...f, org: e.target.value }))}
                    style={{ width: "250px" }}
                  >
                    <option value="">All Organizations</option>
                    {orgList.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="d-flex align-items-center">
                <label className="me-2 text-muted fw-bold">Timeframe:</label>
                <select
                  className="form-select"
                  value={filters.timeframe}
                  onChange={(e) => setFilters((f) => ({ ...f, timeframe: e.target.value }))}
                  style={{ width: "200px" }}
                >
                  <option value="day">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="year">This Year</option>
                </select>
              </div>

              <Button
                variant="outline-secondary"
                onClick={() => {
                  fetchDashboardData();
                  fetchOrderTrends();
                  fetchOrderStatusSummary(); // 🆕 Added
                }}
              >
                <FontAwesomeIcon icon={faRotateRight} /> Refresh
              </Button>
            </div>

            {/* --- Summary Cards --- */}
            {loading ? (
              <div className="text-center p-5">
                <Spinner animation="border" variant="primary" role="status" />
                <p className="mt-2 text-primary">Loading dashboard data...</p>
              </div>
            ) : error ? (
              <Alert variant="danger" className="mt-4">
                {error}
              </Alert>
            ) : (
              <Row className="g-4">
                {cardData.map((item, idx) => (
                  <Col md={6} lg={3} key={idx}>
                    <Card className="shadow-sm border-0 h-100 transition-hover">
                      <Card.Body>
                        <div className="d-flex align-items-center mb-2">
                          {item.icon}
                          <Card.Title as="h6" className="text-uppercase text-muted mb-0 ms-2">
                            {item.label}
                          </Card.Title>
                        </div>
                        <Card.Text as="h1" className="display-6 fw-bold mb-0">
                          {item.value.toLocaleString()}
                        </Card.Text>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            )}

            {/* --- Charts Section --- */}
            <div className="mt-5">
              <h3 className="mb-3">Quick Analytics</h3>
              <Row>
                <Col lg={6} className="mb-4">
                  <Card className="shadow-sm border-0" style={{ height: "350px" }}>
                    <Card.Body>
                      <Card.Title>Order Trends</Card.Title>
                      {orderTrends.length === 0 ? (
                        <p className="text-muted">No order data available for this period.</p>
                      ) : (
                        <Line data={chartData} options={chartOptions} />
                      )}
                    </Card.Body>
                  </Card>
                </Col>

                {/* 🆕 Doughnut Chart for Order Status */}
                <Col lg={6} className="mb-4">
                  <Card className="shadow-sm border-0" style={{ height: "350px" }}>
                    <Card.Body>
                      <Card.Title>Order Status Distribution</Card.Title>
                      {orderStatusSummary.length === 0 ? (
                        <p className="text-muted">No status data available.</p>
                      ) : (
                        <div
  style={{
    position: "relative",
    height: "260px",
    width: "260px",
    margin: "0 auto",
  }}
>
  <Doughnut
    data={statusChartData}
    options={{
      plugins: {
        legend: { position: "bottom" },
      },
      maintainAspectRatio: false,
      responsive: true,
    }}
  />
</div>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </div>
          </div>
        </Col>
      </Row>

      {/* --- Welcome Modal --- */}
      <Modal show={showPopup} onHide={handleClose} centered>
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>Welcome, {user?.username || "Admin"}! 👋</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            You are logged in as <strong>{user?.role || "User"}</strong>. Use the filters above to view data for
            different timeframes and organizations.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={handleClose}>
            Close
          </Button>
          <Button variant="primary" onClick={handleClose}>
            Get Started
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default Dashboard;
