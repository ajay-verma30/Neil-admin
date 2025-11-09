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

  // Fetch categories
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        "https://neil-backend-1.onrender.com/categories/all",
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (res.data.success) {
        setCategories(res.data.categories);
      } else {
        setCategories([]);
        setError("No categories found.");
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to fetch categories");
    } finally {
      setLoading(false);
    }
  };

  // Fetch organizations (for modal dropdown)
  const fetchOrganizations = async () => {
    try {
      const res = await axios.get(
        "https://neil-backend-1.onrender.com/organization/all-organizations",
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (res.data.success) {
        setOrganizations(res.data.organizations);
      }
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

  // Delete category
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
      setError(err.response?.data?.message || "Something went wrong");
    }
  };

  // Handle modal input change
  const handleChange = (e) => {
    setNewCategory({ ...newCategory, [e.target.name]: e.target.value });
  };

  // Submit new category
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newCategory.title || !newCategory.org_id) {
      return setError("Please fill in all fields.");
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
        fetchCategories();
        setShowModal(false);
        setNewCategory({ title: "", org_id: "" });
      } else {
        setError(res.data.message || "Failed to add category.");
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Something went wrong");
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
          <div className="p-3">
            <div className="mb-4 d-flex justify-content-between align-items-center border-bottom pb-2 form-box">
              <h2 className="fw-light text-secondary mb-0">
                Category Management
              </h2>
              <Button
                variant="primary"
                className="d-flex align-items-center shadow-sm"
                onClick={() => setShowModal(true)}
              >
                <FontAwesomeIcon icon={faPlus} className="me-2" />
                Add Category
              </Button>
            </div>

            {error && (
              <Alert variant="danger" onClose={() => setError("")} dismissible>
                {error}
              </Alert>
            )}
            {success && (
              <Alert variant="success" onClose={() => setSuccess("")} dismissible>
                {success}
              </Alert>
            )}

            {loading ? (
              <Spinner animation="border" />
            ) : (
              <Table striped bordered hover responsive>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Title</th>
                    <th>Organization</th>
                    <th>Created At</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((cat, index) => (
                    <tr key={cat.id}>
                      <td>{index + 1}</td>
                      <td>{cat.title}</td>
                      <td><strong>{cat.organization || "-"}</strong></td>
                      <td>{new Date(cat.created_at).toLocaleString()}</td>
                      <td>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDelete(cat.id)}
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {categories.length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center">
                        No categories found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            )}

            {/* Add Category Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} style={{marginTop:"50px"}}>
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
          </div>
        </Col>
      </Row>
    </>
  );
}

export default Categories;
