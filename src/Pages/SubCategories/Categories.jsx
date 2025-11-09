import React, { useEffect, useState, useContext } from "react";
import TopBar from "../../Components/TopBar/TopBar";
import Sidebar from "../../Components/SideBar/SideBar";
import {
  Col,
  Row,
  Table,
  Button,
  Spinner,
  Alert,
  Modal,
  Form,
  Card,
  Container,
} from "react-bootstrap";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faPlus } from "@fortawesome/free-solid-svg-icons";

function Categories() {
  const { accessToken, user } = useContext(AuthContext);
  const [categories, setCategories] = useState([]);
  const [organizations, setOrganizations] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [newCategory, setNewCategory] = useState({ title: "", org_id: "" });
  const [submitting, setSubmitting] = useState(false);

  // 🔹 Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrg, setSelectedOrg] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // 🔹 Fetch Categories with Filters
  const fetchCategories = async () => {
    if (!accessToken) return;
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append("title", searchTerm);
      if (selectedOrg) params.append("org_id", selectedOrg);
      if (startDate && endDate) {
        params.append("start_date", startDate);
        params.append("end_date", endDate);
      }

      const res = await axios.get(
        `https://neil-backend-1.onrender.com/categories/all?${params.toString()}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (res.data.success) {
        setCategories(res.data.categories);
      } else {
        setCategories([]);
        setError("No categories found.");
      }
    } catch (err) {
      console.error("❌ Fetch error:", err);
      setError(err.response?.data?.message || "Failed to fetch categories.");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Fetch Organizations (for dropdown)
  const fetchOrganizations = async () => {
    if (!accessToken) return;
    try {
      const res = await axios.get(
        "https://neil-backend-1.onrender.com/organization/all-organizations",
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (res.data.success) {
        setOrganizations(res.data.organizations);
      }
    } catch (err) {
      console.error("❌ Error fetching organizations:", err);
    }
  };

  useEffect(() => {
    if (accessToken) {
      fetchCategories();
      fetchOrganizations();
    }
  }, [accessToken]);

  // 🔹 Delete Category
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return;
    try {
      const res = await axios.delete(
        `https://neil-backend-1.onrender.com/categories/${id}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (res.data.success) {
        setSuccess("Category deleted successfully!");
        setCategories(categories.filter((c) => c.id !== id));
      } else {
        setError("Failed to delete category.");
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Something went wrong.");
    }
  };

  // 🔹 Handle Modal Input Change
  const handleChange = (e) => {
    setNewCategory({ ...newCategory, [e.target.name]: e.target.value });
  };

  // 🔹 Submit New Category
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newCategory.title || (!newCategory.org_id && user.role === "Super Admin")) {
      return setError("Please fill in all required fields.");
    }

    setSubmitting(true);
    try {
      const res = await axios.post(
        "https://neil-backend-1.onrender.com/categories/new",
        newCategory,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (res.status === 201) {
        setSuccess("Category added successfully!");
        setShowModal(false);
        setNewCategory({ title: "", org_id: "" });
        fetchCategories();
      } else {
        setError(res.data.message || "Failed to add category.");
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
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
              <h2 className="fw-light text-secondary mb-0">Category Management</h2>
              <Button
                variant="primary"
                className="d-flex align-items-center shadow-sm"
                onClick={() => setShowModal(true)}
              >
                <FontAwesomeIcon icon={faPlus} className="me-2" />
                Add Category
              </Button>
            </div>

            {/* 🔍 Filter Bar */}
            <Card className="p-3 mb-4 shadow-sm">
              <Row className="g-3 align-items-end">
                <Col md={3}>
                  <Form.Label className="fw-semibold small">Search by Title</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter category title"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </Col>

                {user.role === "Super Admin" && (
                  <Col md={3}>
                    <Form.Label className="fw-semibold small">Organization</Form.Label>
                    <Form.Select
                      value={selectedOrg}
                      onChange={(e) => setSelectedOrg(e.target.value)}
                    >
                      <option value="">All Organizations</option>
                      {organizations.map((org) => (
                        <option key={org.id} value={org.id}>
                          {org.title}
                        </option>
                      ))}
                    </Form.Select>
                  </Col>
                )}

                <Col md={2}>
                  <Form.Label className="fw-semibold small">Start Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </Col>

                <Col md={2}>
                  <Form.Label className="fw-semibold small">End Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </Col>

                <Col md={2} className="d-grid">
                  <Button variant="primary" onClick={fetchCategories}>
                    Filter
                  </Button>
                </Col>
              </Row>
            </Card>

            {/* Alerts */}
            {error && (
              <Alert variant="danger" dismissible onClose={() => setError("")}>
                {error}
              </Alert>
            )}
            {success && (
              <Alert variant="success" dismissible onClose={() => setSuccess("")}>
                {success}
              </Alert>
            )}

            {/* Table */}
            {loading ? (
              <div className="d-flex justify-content-center p-5">
                <Spinner animation="border" />
              </div>
            ) : (
              <Table striped bordered hover responsive className="shadow-sm">
                <thead className="table-light">
                  <tr>
                    <th>#</th>
                    <th>Title</th>
                    <th>Organization</th>
                    <th>Created At</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.length > 0 ? (
                    categories.map((cat, index) => (
                      <tr key={cat.id}>
                        <td>{index + 1}</td>
                        <td>{cat.title}</td>
                        <td>{cat.organization || "-"}</td>
                        <td>{new Date(cat.created_at).toLocaleString()}</td>
                        <td className="text-center">
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDelete(cat.id)}
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center text-muted">
                        No categories found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            )}

            {/* ➕ Add Category Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} style={{ marginTop: "50px" }}>
              <Modal.Header closeButton>
                <Modal.Title>Add New Category</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label>Category Title</Form.Label>
                    <Form.Control
                      type="text"
                      name="title"
                      value={newCategory.title}
                      onChange={handleChange}
                      placeholder="Enter category title"
                      required
                    />
                  </Form.Group>

                  {user.role === "Super Admin" && (
                    <Form.Group className="mb-3">
                      <Form.Label>Organization</Form.Label>
                      <Form.Select
                        name="org_id"
                        value={newCategory.org_id}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Select Organization</option>
                        {organizations.map((org) => (
                          <option key={org.id} value={org.id}>
                            {org.title}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  )}

                  <Button variant="primary" type="submit" disabled={submitting}>
                    {submitting ? "Saving..." : "Add Category"}
                  </Button>
                </Form>
              </Modal.Body>
            </Modal>
          </Col>
        </Row>
      </Container>
    </>
  );
}

export default Categories;
