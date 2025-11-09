import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import {
  Button,
  Spinner,
  Alert,
  Modal,
  Form,
  Table,
  Row,
  Col,
  Card,
} from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faTrash, faSearch } from "@fortawesome/free-solid-svg-icons";
import TopBar from "../../Components/TopBar/TopBar";
import Sidebar from "../../Components/SideBar/SideBar";
import { AuthContext } from "../../context/AuthContext";

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

function SubCategories() {
  const { accessToken, user } = useContext(AuthContext);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [subCategories, setSubCategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [newSubCategory, setNewSubCategory] = useState({
    title: "",
    category_id: "",
    org_id: "",
  });

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterOrg, setFilterOrg] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  // Fetch all sub-categories
  const getAllSubCategories = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(
        "https://neil-backend-1.onrender.com/sub-categories/all",
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      setSubCategories(res.data.subCategories || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "An unexpected error occurred while fetching sub-categories."
      );
      setSubCategories([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories
  const getCategories = async () => {
    try {
      const res = await axios.get(
        "https://neil-backend-1.onrender.com/categories/all",
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      setCategories(res.data.categories || []);
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch organizations (Super Admin only)
  const getOrganizations = async () => {
    if (user.role !== "Super Admin") return;
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
      getAllSubCategories();
      getCategories();
      getOrganizations();
    }
  }, [accessToken]);

  // Add sub-category
  const addSubCategory = async () => {
    const { title, category_id, org_id } = newSubCategory;
    if (!title.trim() || !category_id) {
      alert("Please enter both sub-category title and parent category.");
      return;
    }

    try {
      await axios.post(
        "https://neil-backend-1.onrender.com/sub-categories/new",
        {
          title,
          category_id,
          org_id: user.role === "Super Admin" ? org_id || null : undefined,
        },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      await getAllSubCategories();
      setShowModal(false);
      setNewSubCategory({ title: "", category_id: "", org_id: "" });
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add sub-category.");
    }
  };

  // Delete sub-category
  const deleteSubCategory = async (id) => {
    if (!window.confirm("Are you sure you want to delete this sub-category?"))
      return;

    try {
      await axios.delete(
        `https://neil-backend-1.onrender.com/sub-categories/${id}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      setSubCategories((prev) => prev.filter((sc) => sc.id !== id));
    } catch (err) {
      alert(
        err.response?.data?.message ||
          "Failed to delete sub-category. You may not have permission."
      );
    }
  };

  // Apply filters
  const filteredSubCategories = subCategories.filter((sub) => {
    const matchesTitle = sub.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const matchesOrg =
      !filterOrg || sub.org_id?.toString() === filterOrg.toString();

    const matchesCategory =
      !filterCategory ||
      sub.category_id?.toString() === filterCategory.toString();

    const createdAt = new Date(sub.created_at);
    const from = filterDateFrom ? new Date(filterDateFrom) : null;
    const to = filterDateTo ? new Date(filterDateTo) : null;
    const matchesDate =
      (!from || createdAt >= from) && (!to || createdAt <= to);

    return matchesTitle && matchesOrg && matchesCategory && matchesDate;
  });

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
                    <h4 className="fw-semibold mb-0 text-dark">
                      Sub-Categories Management
                    </h4>
                    <small className="text-muted">
                      View, filter, and manage sub-categories.
                    </small>
                  </div>
                  <Button
                    variant="primary"
                    className="d-flex align-items-center gap-2"
                    onClick={() => setShowModal(true)}
                  >
                    <FontAwesomeIcon icon={faPlus} />
                    Add Sub-Category
                  </Button>
                </div>

                {/* Filters Section */}
                <Row className="g-2 mb-3 align-items-end">
  <Col md={3}>
    <Form.Control
      type="text"
      placeholder="Search by title..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
    />
  </Col>

  <Col md={2}>
    <Form.Select
      value={filterCategory}
      onChange={(e) => setFilterCategory(e.target.value)}
    >
      <option value="">Filter by Category</option>
      {categories.map((cat) => (
        <option key={cat.id} value={cat.id}>
          {cat.title}
        </option>
      ))}
    </Form.Select>
  </Col>

  {user.role === "Super Admin" && (
    <Col md={2}>
      <Form.Select
        value={filterOrg}
        onChange={(e) => setFilterOrg(e.target.value)}
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

  <Col md={3}>
    <div className="d-flex gap-2">
      <Form.Control
        type="date"
        value={filterDateFrom}
        onChange={(e) => setFilterDateFrom(e.target.value)}
      />
      <Form.Control
        type="date"
        value={filterDateTo}
        onChange={(e) => setFilterDateTo(e.target.value)}
      />
    </div>
  </Col>

  {/* Filter Button */}
  <Col md={2} className="d-grid">
    <Button
      variant="primary"
      onClick={() => {
        // Trigger filter re-render or API call if needed
        getAllSubCategories();
      }}
    >
      <FontAwesomeIcon icon={faSearch} className="me-1" />
      Filter
    </Button>
  </Col>
</Row>


                {loading ? (
                  <OverlayCard>
                    <Spinner animation="border" variant="primary" />
                    <div className="mt-3 text-muted">
                      Loading sub-categories...
                    </div>
                  </OverlayCard>
                ) : error ? (
                  <OverlayCard>
                    <Alert variant="danger">{error}</Alert>
                    <Button variant="outline-danger" onClick={getAllSubCategories}>
                      Retry
                    </Button>
                  </OverlayCard>
                ) : filteredSubCategories.length === 0 ? (
                  <OverlayCard>
                    <Alert variant="info" className="mb-0">
                      No sub-categories found matching filters.
                    </Alert>
                  </OverlayCard>
                ) : (
                  <div className="table-responsive mt-3">
                    <Table hover className="align-middle shadow-sm">
                      <thead className="table-light">
                        <tr>
                          <th>#</th>
                          <th>Sub-Category Title</th>
                          <th>Parent Category</th>
                          {user.role === "Super Admin" && <th>Organization</th>}
                          <th>Created At</th>
                          <th className="text-end">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSubCategories.map((sub, index) => (
                          <tr key={sub.id}>
                            <td>{index + 1}</td>
                            <td className="fw-medium text-dark">{sub.title}</td>
                            <td>{sub.category_title || "-"}</td>
                            {user.role === "Super Admin" && (
                              <td>{sub.org_title || "-"}</td>
                            )}
                            <td>{new Date(sub.created_at).toLocaleString()}</td>
                            <td className="text-end">
                              <Button
                                variant="link"
                                className="p-0 text-danger"
                                onClick={() => deleteSubCategory(sub.id)}
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
        </Col>
      </Row>

      {/* Add Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Add New Sub-Category</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Sub-Category Title</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter sub-category title"
                value={newSubCategory.title}
                onChange={(e) =>
                  setNewSubCategory({ ...newSubCategory, title: e.target.value })
                }
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Parent Category</Form.Label>
              <Form.Select
                value={newSubCategory.category_id}
                onChange={(e) =>
                  setNewSubCategory({
                    ...newSubCategory,
                    category_id: e.target.value,
                  })
                }
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.title}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            {user.role === "Super Admin" && (
              <Form.Group className="mb-3">
                <Form.Label>Organization</Form.Label>
                <Form.Select
                  value={newSubCategory.org_id}
                  onChange={(e) =>
                    setNewSubCategory({
                      ...newSubCategory,
                      org_id: e.target.value,
                    })
                  }
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
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={addSubCategory}>
            Save
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default SubCategories;
