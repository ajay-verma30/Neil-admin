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
} from "react-bootstrap";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faPlus } from "@fortawesome/free-solid-svg-icons";

const OverlayCard = ({ children }) => (
  <div
    className="d-flex justify-content-center align-items-center"
    style={{ minHeight: "60vh" }}
  >
    <Card className="shadow-sm text-center p-5" style={{ minWidth: "400px" }}>
      {children}
    </Card>
  </div>
);

function Categories() {
  const { accessToken, user } = useContext(AuthContext);
  const [categories, setCategories] = useState([]);
  const [organizations, setOrganizations] = useState([]);

  const [loading, setLoading] = useState(true);
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

  // 🔹 Fetch Categories
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

      setCategories(res.data.categories || []);
      if (!res.data.categories.length) setError("No categories found.");
    } catch (err) {
      console.error("❌ Fetch error:", err);
      setError(err.response?.data?.message || "Failed to fetch categories.");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Fetch Organizations
  const fetchOrganizations = async () => {
    if (!accessToken) return;
    try {
      const res = await axios.get(
        "https://neil-backend-1.onrender.com/organization/all-organizations",
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      setOrganizations(res.data.organizations || []);
    } catch (err) {
      console.error(err);
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

  // 🔹 Modal Input Change
  const handleChange = (e) => {
    setNewCategory({ ...newCategory, [e.target.name]: e.target.value });
  };

  // 🔹 Add Category
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
      <Row>
        <Col xs={2} md={2}>
          <Sidebar />
        </Col>
        <Col xs={10} md={10}>
          <div className="form-box p-3">
            <Card className="shadow-sm border-0">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <div>
                    <h4 className="fw-semibold mb-0 text-dark">Categories Management</h4>
                    <small className="text-muted">View, filter, and manage categories.</small>
                  </div>
                  <Button
                    variant="primary"
                    className="d-flex align-items-center gap-2"
                    onClick={() => setShowModal(true)}
                  >
                    <FontAwesomeIcon icon={faPlus} />
                    Add Category
                  </Button>
                </div>

                {/* 🔹 Filters */}
                <Row className="g-2 mb-3">
                  <Col md={3}>
                    <Form.Control
                      type="text"
                      placeholder="Search by title..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </Col>

                  {user.role === "Super Admin" && (
                    <Col md={3}>
                      <Form.Select
                        value={selectedOrg}
                        onChange={(e) => setSelectedOrg(e.target.value)}
                      >
                        <option value="">Filter by Organization</option>
                        {organizations.map((org) => (
                          <option key={org.id} value={org.id}>
                            {org.title}
                          </option>
                        ))}
                      </Form.Select>
                    </Col>
                  )}

                  <Col md={2}>
                    <div className="d-flex gap-2">
                      <Form.Control
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                      <Form.Control
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                  </Col>

                  <Col md={2} className="d-grid">
                    <Button variant="primary" onClick={fetchCategories}>
                      Filter
                    </Button>
                  </Col>
                </Row>

                {/* 🔹 Alerts & Table */}
                {loading ? (
                  <OverlayCard>
                    <Spinner animation="border" variant="primary" />
                    <div className="mt-3 text-muted">Loading categories...</div>
                  </OverlayCard>
                ) : error ? (
                  <OverlayCard>
                    <Alert variant="danger">{error}</Alert>
                    <Button variant="outline-danger" onClick={fetchCategories}>
                      Retry
                    </Button>
                  </OverlayCard>
                ) : categories.length === 0 ? (
                  <OverlayCard>
                    <Alert variant="info" className="mb-0">
                      No categories found matching filters.
                    </Alert>
                  </OverlayCard>
                ) : (
                  <div className="table-responsive mt-3">
                    <Table hover className="align-middle shadow-sm">
                      <thead className="table-light">
                        <tr>
                          <th>#</th>
                          <th>Title</th>
                          {user.role === "Super Admin" && <th>Organization</th>}
                          <th>Created At</th>
                          <th className="text-end">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categories.map((cat, index) => (
                          <tr key={cat.id}>
                            <td>{index + 1}</td>
                            <td className="fw-medium text-dark">{cat.title}</td>
                            {user.role === "Super Admin" && (
                              <td>{cat.organization || "-"}</td>
                            )}
                            <td>{new Date(cat.created_at).toLocaleString()}</td>
                            <td className="text-end">
                              <Button
                                variant="link"
                                className="p-0 text-danger"
                                onClick={() => handleDelete(cat.id)}
                              >
                                <FontAwesomeIcon icon={faTrash} />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
              </Card.Body>
            </Card>
          </div>

          {/* ➕ Add Category Modal */}
          <Modal show={showModal} onHide={() => setShowModal(false)} centered>
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
    </>
  );
}

export default Categories;
