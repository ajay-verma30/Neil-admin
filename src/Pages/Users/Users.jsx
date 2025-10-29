import React, { useContext, useEffect, useState } from "react";
import "./Common.css";
import TopBar from "../../Components/TopBar/TopBar";
import {
  Row,
  Col,
  Table,
  Badge,
  Button,
  Modal,
  Form,
  Spinner,
  Alert,
} from "react-bootstrap";
import Sidebar from "../../Components/SideBar/SideBar";
import { AuthContext } from "../../context/AuthContext";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPencil,
  faPlus,
  faFileUpload,
} from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";

function Users() {
  const { user, accessToken } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkFile, setBulkFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [alert, setAlert] = useState(null);
  const navigate = useNavigate();

  // Add User form state
  const [formData, setFormData] = useState({
    f_name: "",
    l_name: "",
    email: "",
    contact: "",
    role: "user",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const getUsersList = async () => {
      try {
        setLoading(true);
        const result = await axios.get(
          "http://localhost:3000/users/all-users",
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        setUsers(result.data.users);
      } catch (error) {
        console.error("Error fetching users:", error);
        setAlert({ type: "danger", message: "Failed to load users list" });
      } finally {
        setLoading(false);
      }
    };

    if (accessToken) getUsersList();
  }, [accessToken, user]);


  const handleAddUserChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const handleBulkFileChange = (e) => {
  const file = e.target.files[0];
  if (
    file &&
    (file.type ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      file.type === "application/vnd.ms-excel" ||
      file.name.endsWith(".xlsx") ||
      file.name.endsWith(".xls"))
  ) {
    setBulkFile(file);
    setAlert(null);
  } else {
    setAlert({ type: "warning", message: "Please select a valid Excel file (.xlsx or .xls)" });
    setBulkFile(null);
  }
};

const addNewUser = () => {
  if (user.role === "Super Admin") {
    navigate("/admin/users/new");
  } else {
    navigate(`/${user.org_id}/users/new`);
  }
};

  const handleEdit = (userId, orgId) => {
    if (user.role === "Super Admin") {
    navigate(`/admin/users/${userId}`);
  } 
  else {
     navigate(`/${orgId}/users/${userId}`);
  }
  };


  const handleBulkUpload = async (e) => {
    e.preventDefault();
    if (!bulkFile) {
      setAlert({ type: "warning", message: "Please select a file to upload" });
      return;
    }

    setUploading(true);
    const formDataUpload = new FormData();
    formDataUpload.append("file", bulkFile);

    try {
      await axios.post(
        "http://localhost:3000/users/bulk-upload",
        formDataUpload,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setAlert({ type: "success", message: "Users uploaded successfully!" });
      setShowBulkModal(false);
      setBulkFile(null);
      // Refresh users list
      const result = await axios.get("http://localhost:3000/users/all-users", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      setUsers(result.data.users);
    } catch (error) {
      console.error("Error uploading bulk users:", error);
      setAlert({
        type: "danger",
        message: error.response?.data?.message || "Failed to upload users",
      });
    } finally {
      setUploading(false);
    }
  };

   const userNav = () => {
  navigate("/products");
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
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h4 className="mb-0">Users List</h4>
              <div className="d-flex gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => addNewUser(user.org_id)}
                >
                  <FontAwesomeIcon icon={faPlus} className="me-2" />
                  Add User
                </Button>
                <Button
                  variant="success"
                  size="sm"
                  onClick={() => setShowBulkModal(true)}
                >
                  <FontAwesomeIcon icon={faFileUpload} className="me-2" />
                  Upload Bulk Users
                </Button>
              </div>
            </div>

            {alert && (
              <Alert
                variant={alert.type}
                onClose={() => setAlert(null)}
                dismissible
                className="mb-3"
              >
                {alert.message}
              </Alert>
            )}

            {loading ? (
              <div className="text-center p-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3">Loading users...</p>
              </div>
            ) : (
              <Table striped bordered hover responsive>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Full Name</th>
                    <th>Email</th>
                    <th>Contact</th>
                    <th>Groups</th>
                    <th>Role</th>
                    <th>Active</th>
                    <th>Created At</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length > 0 ? (
                    users.map((u, index) => (
                      <tr key={u.id}>
                        <td>{index + 1}</td>
                        <td>{`${u.f_name} ${u.l_name}`}</td>
                        <td>{u.email}</td>
                        <td>{u.contact}</td>
                        <td>{u.user_groups || "-"}</td>
                        <td>{u.role}</td>
                        <td>
                          {u.isActive ? (
                            <Badge bg="success">Active</Badge>
                          ) : (
                            <Badge bg="danger">Inactive</Badge>
                          )}
                        </td>
                        <td>{u.created_at}</td>
                        <td>
                          <button
                            className="btn btn-outline-primary btn-sm me-2 border-0"
                            title="Edit User"
                            onClick={() => handleEdit(u.id, u.org_id)}
                          >
                            <FontAwesomeIcon icon={faPencil} />
                          </button>
                          <Button className="btn-primary shop-as-user" onClick={userNav}>
  Shop As User
</Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="9" className="text-center">
                        No users found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            )}
          </div>
        </Col>
      </Row>

      {/* Bulk Upload Modal */}
      <Modal
        show={showBulkModal}
        onHide={() => setShowBulkModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Upload Bulk Users</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleBulkUpload}>
            <Alert variant="info">
              <strong>CSV Format:</strong> Your CSV file should contain columns:
              f_name, l_name, email, contact, org_id, groups
            </Alert>

            <Form.Group className="mb-3">
              <Form.Label>Select excel File</Form.Label>
              <Form.Control
                type="file"
                accept=".xlsx"
                onChange={handleBulkFileChange}
                required
              />
              {bulkFile && (
                <small className="text-success">
                  ✓ File selected: {bulkFile.name}
                </small>
              )}
            </Form.Group>

            <div className="d-flex gap-2">
              <Button
                variant="secondary"
                onClick={() => setShowBulkModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="success"
                type="submit"
                disabled={uploading || !bulkFile}
              >
                {uploading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Uploading...
                  </>
                ) : (
                  "Upload"
                )}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </>
  );
}

export default Users;
