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
import { faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";
import TopBar from "../../Components/TopBar/TopBar";
import Sidebar from "../../Components/SideBar/SideBar";
import { AuthContext } from "../../context/AuthContext";
import { useParams } from "react-router-dom";

function SubCategories() {
  const {org_id} = useParams();
  const { accessToken } = useContext(AuthContext);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [subCategories, setSubCategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [newSubCategory, setNewSubCategory] = useState({
    title: "",
    category: "",
  });

  // Fetch all sub-categories
  const getAllSubCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get("https://neil-backend-1.onrender.com/sub-categories/all", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setSubCategories(res.data.subCategories || []);
    } catch (err) {
      console.error("Error fetching sub-categories:", err);
      setError(
        err.response?.data?.message ||
          "An unexpected error occurred while fetching sub-categories."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) {
      getAllSubCategories();
    }
  }, [accessToken]);

  // Add new sub-category
  const addSubCategory = async () => {
    const { title, category } = newSubCategory;

    if (!title.trim() || !category.trim()) {
      alert("Please enter both sub-category title and category.");
      return;
    }

    try {
      await axios.post(
        "https://neil-backend-1.onrender.com/sub-categories/new",
        { title, category, org_id },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      await getAllSubCategories();
      setShowModal(false);
      setNewSubCategory({ title: "", category: "" });
    } catch (err) {
      console.error("Error adding sub-category:", err);
      alert(err.response?.data?.message || "Failed to add sub-category.");
    }
  };

  // Delete sub-category
  const deleteSubCategory = async (id) => {
    if (!window.confirm("Are you sure you want to delete this sub-category?"))
      return;

    try {
      await axios.delete(`https://neil-backend-1.onrender.com/subcategories/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setSubCategories((prev) => prev.filter((sc) => sc.id !== id));
    } catch (err) {
      console.error("Error deleting sub-category:", err);
      alert(err.response?.data?.message || "Failed to delete sub-category.");
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
          <div className="form-box">
            <Card className="groups-card shadow-sm border-0">
              <Card.Body>
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div>
                    <h4 className="fw-semibold mb-0 text-dark">
                      Sub-Categories Management
                    </h4>
                    <small className="text-muted">
                      View, create, and manage sub-categories.
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

                {loading && (
                  <div className="text-center py-4">
                    <Spinner animation="border" variant="primary" />
                  </div>
                )}

                {error && (
                  <Alert variant="danger" className="mt-3">
                    {error}
                  </Alert>
                )}

                {!loading && !error && (
                  <div className="table-responsive mt-3">
                    <Table hover className="align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>#</th>
                          <th>Sub-Category Title</th>
                          <th>Category</th>
                          <th>Created At</th>
                          <th className="text-end">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subCategories.length > 0 ? (
                          subCategories.map((sub, index) => (
                            <tr key={sub.id}>
                              <td>{index + 1}</td>
                              <td className="fw-medium text-dark">{sub.title}</td>
                              <td>{sub.category}</td>
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
                          ))
                        ) : (
                          <tr>
                            <td colSpan="5" className="text-center py-3">
                              <Alert variant="info" className="mb-0">
                                No sub-categories found. Click “Add Sub-Category” to create one.
                              </Alert>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </Table>
                  </div>
                )}
              </Card.Body>
            </Card>
          </div>
        </Col>
      </Row>

      {/* Add Sub-Category Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
  <Modal.Header closeButton>
    <Modal.Title>Add New Sub-Category</Modal.Title>
  </Modal.Header>
  <Modal.Body>
    <Form>
      {/* Sub-Category Title */}
      <Form.Group className="mb-3" controlId="subCategoryTitle">
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

      {/* Parent Category (ENUM) */}
      <Form.Group controlId="subCategoryCategory">
        <Form.Label>Parent Category</Form.Label>
        <Form.Select
          value={newSubCategory.category}
          onChange={(e) =>
            setNewSubCategory({ ...newSubCategory, category: e.target.value })
          }
        >
          <option value="">Select Category</option>
          <option value="Tshirts">Tshirts</option>
          <option value="Mugs">Mugs</option>
          <option value="Pens">Pens</option>
          <option value="Bottles">Bottles</option>
          <option value="Books">Books</option>
          <option value="Hoodies">Hoodies</option>
        </Form.Select>
      </Form.Group>
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
