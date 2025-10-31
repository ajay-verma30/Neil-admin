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

const OverlayCard = ({ children }) => (
  <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "60vh" }}>
    <Card className="shadow-sm text-center p-5" style={{ minWidth: "400px" }}>
      {children}
    </Card>
  </div>
);

function SubCategories() {
  const { org_id } = useParams();
  const { accessToken } = useContext(AuthContext);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [subCategories, setSubCategories] = useState([]);
  const [newSubCategory, setNewSubCategory] = useState({
    title: "",
    category: "",
  });

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
      alert(err.response?.data?.message || "Failed to add sub-category.");
    }
  };

  // Delete sub-category
  const deleteSubCategory = async (id) => {
    if (!window.confirm("Are you sure you want to delete this sub-category?")) return;

    try {
      await axios.delete(
        `https://neil-backend-1.onrender.com/subcategories/${id}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      setSubCategories((prev) => prev.filter((sc) => sc.id !== id));
    } catch (err) {
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
                <div className="d-flex align-items-center justify-content-between mb-4">
                  <div>
                    <h4 className="fw-semibold mb-0 text-dark">Sub-Categories Management</h4>
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

                {/* Loading */}
                {loading && (
                  <OverlayCard>
                    <Spinner animation="border" variant="primary" />
                    <div className="mt-3 text-muted">Loading sub-categories...</div>
                  </OverlayCard>
                )}

                {/* Error */}
                {error && !loading && (
                  <OverlayCard>
                    <Alert variant="danger" className="mb-3">
                      {error}
                    </Alert>
                    <Button
                      variant="outline-danger"
                      onClick={() => getAllSubCategories()}
                    >
                      Retry
                    </Button>
                  </OverlayCard>
                )}

                {/* Table */}
                {!loading && !error && (
                  <>
                    {subCategories.length === 0 ? (
                      <OverlayCard>
                        <Alert variant="info" className="mb-0">
                          No sub-categories found. Click “Add Sub-Category” to create one.
                        </Alert>
                      </OverlayCard>
                    ) : (
                      <div className="table-responsive mt-3">
                        <Table hover className="align-middle shadow-sm">
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
                            {subCategories.map((sub, index) => (
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
                            ))}
                          </tbody>
                        </Table>
                      </div>
                    )}
                  </>
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
