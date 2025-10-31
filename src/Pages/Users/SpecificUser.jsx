import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import TopBar from "../../Components/TopBar/TopBar";
import {
  Col,
  Row,
  Card,
  Badge,
  Spinner,
  Alert,
  Button,
  Modal,
  Form,
  Container,
} from "react-bootstrap";
import Sidebar from "../../Components/SideBar/SideBar";
import { AuthContext } from "../../context/AuthContext";
import axios from "axios";
import moment from "moment";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrash,
  faPlus,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";

const API_BASE_URL = "https://neil-backend-1.onrender.com/users";
const GROUPS_API_URL = "https://neil-backend-1.onrender.com/groups";

function SpecificUser() {
  const { org_id, id: userId } = useParams();
  const { accessToken } = useContext(AuthContext);
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [groups, setGroups] = useState([]);
  const [userGroups, setUserGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [addingGroup, setAddingGroup] = useState(false);

  // Fetch user data
  const fetchUser = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/${userId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (res.data.user) {
        setUser(res.data.user);
        if (res.data.user.assigned_groups) {
          setUserGroups(res.data.user.assigned_groups.map((g) => g.title));
        }
      } else {
        setError("User not found.");
        setUser(null);
      }
    } catch (err) {
      if (err.response?.status === 404)
        setError("The requested user could not be found.");
      else if (err.response?.status === 403)
        setError("Access Denied: You are not authorized to view this user.");
      else setError("Failed to connect to the server or fetch user data.");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken && userId) {
      fetchUser();
    } else {
      setLoading(false);
      setError("Authentication token or User ID is missing.");
    }
  }, [accessToken, userId]);

  // Fetch groups
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await axios.get(`${GROUPS_API_URL}/all`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (res.data.groups) setGroups(res.data.groups);
      } catch (err) {
      }
    };
    if (accessToken) fetchGroups();
  }, [accessToken]);

  // Add new group
  const handleAddGroup = async () => {
    if (!selectedGroup) return;

    setAddingGroup(true);
    try {
      await axios.patch(
        `${API_BASE_URL}/user/${userId}`,
        { group_ids: [selectedGroup] },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      setSuccessMessage("Group added successfully!");
      setSelectedGroup("");
      await fetchUser();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError("Failed to add group to user.");
    } finally {
      setAddingGroup(false);
    }
  };

  // Remove group
  const handleRemoveGroup = async (groupTitle) => {
    try {
      // Find the group object by its title
      const groupToRemove = groups.find((g) => g.title === groupTitle);
      if (!groupToRemove) return;

      // Call the remove group API
      await axios.patch(
        `${API_BASE_URL}/user/rm_grp/${userId}`,
        { group_id: groupToRemove.id },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      setSuccessMessage("Group removed successfully!");
      await fetchUser(); // Refresh user data
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError("Failed to remove group from user.");
    }
  };

  // Delete user (unchanged)
  const handleDeleteClick = () => setShowDeleteModal(true);

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    try {
      await axios.delete(`${API_BASE_URL}/${userId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setShowDeleteModal(false);
      if (user.role === "Super Admin") {
        navigate(`/admin/users`);
      } else if (org_id) {
        navigate(`/${org_id}/users`);
      } else {
        navigate(`/admin/users`);
      }
    } catch (err) {
      setError("Failed to delete the user. Please try again.");
      setShowDeleteModal(false);
    } finally {
      setDeleting(false);
    }
  };


  const handleToggleStatus = async () => {
  try {
    const newStatus = user.isActive ? 0 : 1; // toggle between 1 and 0
    const res = await axios.patch(
      `${API_BASE_URL}/user/${userId}/status`,
      { isActive: newStatus },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    setUser(res.data.user);
    setSuccessMessage(`User marked as ${newStatus ? "active" : "inactive"}.`);
    setTimeout(() => setSuccessMessage(null), 3000);
  } catch (err) {
    setError("Failed to update user status. Please try again.");
  }
};


  // Render states
  if (loading) {
    return (
      <>
        <TopBar />
        <Row className="vh-100">
          <Col xs={2} className="p-0">
            <Sidebar />
          </Col>
          <Col
            xs={10}
            md={10}
            className="bg-light d-flex justify-content-center align-items-center"
          >
            <div className="text-center">
              <Spinner
                animation="border"
                variant="primary"
                role="status"
                className="mb-3"
              />
              <h5 className="text-primary">Loading user profile...</h5>
            </div>
          </Col>
        </Row>
      </>
    );
  }

  if (error) {
    return (
      <>
        <TopBar />
        <Row className="vh-100">
          <Col xs={2} className="p-0">
            <Sidebar />
          </Col>
          <Col xs={10} md={10} className="bg-light pt-5 mt-3">
            <Container>
              <Alert variant="danger" className="shadow-sm">
                <Alert.Heading className="h4">
                  Error Retrieving Data
                </Alert.Heading>
                <p>{error}</p>
                <hr />
                <p className="mb-0">
                  Please try again or contact support if the issue persists.
                </p>
              </Alert>
            </Container>
          </Col>
        </Row>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <TopBar />
        <Row className="vh-100">
          <Col xs={2} className="p-0">
            <Sidebar />
          </Col>
          <Col xs={10} md={10} className="bg-light pt-5 mt-3">
            <Container>
              <Alert variant="info" className="shadow-sm">
                <Alert.Heading>No User Found</Alert.Heading>
                <p>The requested user could not be found.</p>
              </Alert>
            </Container>
          </Col>
        </Row>
      </>
    );
  }

  return (
    <>
      <TopBar />
      <Row className="vh-100">
        <Col xs={2} className="p-0">
          <Sidebar />
        </Col>
        <Col xs={10} md={10} className="bg-light pt-4 px-4">
          <Container fluid className="form-box">
            {successMessage && (
              <Alert
                variant="success"
                onClose={() => setSuccessMessage(null)}
                dismissible
                className="mb-4"
              >
                {successMessage}
              </Alert>
            )}

            {/* Header */}
            <div className="mb-4 d-flex justify-content-between align-items-center">
              <div>
                <h2 className="mb-1 text-dark fw-bold">{`${user.f_name} ${user.l_name}`}</h2>
                <p className="text-muted mb-0">User Profile & Management</p>
              </div>
              <div className="d-flex align-items-center gap-3">
  <Badge
    bg={user.isActive ? "success" : "danger"}
    className="fs-6 px-3 py-2"
  >
    {user.isActive ? "Active" : "Inactive"}
  </Badge>
  <Button
    variant={user.isActive ? "outline-danger" : "outline-success"}
    size="sm"
    onClick={handleToggleStatus}
  >
    {user.isActive ? "Deactivate" : "Activate"}
  </Button>
</div>

            </div>

            {/* User Info */}
            <Row className="mb-4">
              <Col md={6}>
                <Card className="shadow-sm border-0 h-100">
                  <Card.Header className="bg-white border-bottom py-3">
                    <h5 className="mb-0 text-dark fw-bold">
                      Personal Information
                    </h5>
                  </Card.Header>
                  <Card.Body className="p-4">
                    <p className="text-muted small mb-1">Email</p>
                    <p className="h6 text-dark mb-3">{user.email}</p>
                    <p className="text-muted small mb-1">Contact</p>
                    <p className="h6 text-dark mb-3">{user.contact || "N/A"}</p>
                    <p className="text-muted small mb-1">Member Since</p>
                    <p className="h6 text-dark mb-0">
                      {moment(user.created_at).format("MMMM Do YYYY")}
                    </p>
                  </Card.Body>
                </Card>
              </Col>

              <Col md={6}>
                <Card className="shadow-sm border-0 h-100">
                  <Card.Header className="bg-white border-bottom py-3">
                    <h5 className="mb-0 text-dark fw-bold">
                      Role & Organization
                    </h5>
                  </Card.Header>
                  <Card.Body className="p-4">
                    <p className="text-muted small mb-1">User Role</p>
                    <Badge bg="info" className="px-3 py-2">
                      {user.role}
                    </Badge>
                    <p className="text-muted small mb-1 mt-3">Organization</p>
                    <p className="h6 text-dark mb-0">
                      {user.org_name || "N/A"}
                    </p>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Groups */}
            <Row className="mb-4">
              <Col md={12}>
                <Card className="shadow-sm border-0">
                  <Card.Header className="bg-white border-bottom py-3">
                    <h5 className="mb-0 text-dark fw-bold">User Groups</h5>
                  </Card.Header>
                  <Card.Body className="p-4">
                    <p className="text-muted small mb-2">Current Groups</p>
                    <div className="d-flex flex-wrap gap-2">
                      {userGroups.length > 0 ? (
                        userGroups.map((group, index) => (
                          <Badge
                            key={index}
                            bg="light"
                            text="dark"
                            className="px-3 py-2 d-flex align-items-center gap-2"
                          >
                            {group}
                            <button
                              className="btn btn-sm p-0 text-danger"
                              onClick={() => handleRemoveGroup(group)}
                              title="Remove group"
                              style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                              }}
                            >
                              <FontAwesomeIcon icon={faTrash} size="xs" />
                            </button>
                          </Badge>
                        ))
                      ) : (
                        <p className="text-muted small">
                          No groups assigned yet.
                        </p>
                      )}
                    </div>

                    <hr className="my-4" />

                    <div>
                      <p className="text-muted small mb-3">Add New Group</p>
                      <Row className="align-items-end">
                        <Col md={8} className="mb-2 mb-md-0">
                          <Form.Select
                            value={selectedGroup}
                            onChange={(e) => setSelectedGroup(e.target.value)}
                            disabled={addingGroup}
                          >
                            <option value="">Select a group to add...</option>
                            {groups.map((group) => (
                              <option key={group.id} value={group.id}>
                                {group.title}
                              </option>
                            ))}
                          </Form.Select>
                        </Col>
                        <Col md={4}>
                          <Button
                            variant="primary"
                            className="w-100"
                            onClick={handleAddGroup}
                            disabled={!selectedGroup || addingGroup}
                          >
                            {addingGroup ? (
                              <>
                                <Spinner
                                  animation="border"
                                  size="sm"
                                  className="me-2"
                                />
                                Adding...
                              </>
                            ) : (
                              <>
                                <FontAwesomeIcon
                                  icon={faPlus}
                                  className="me-2"
                                />
                                Add Group
                              </>
                            )}
                          </Button>
                        </Col>
                      </Row>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Footer Buttons */}
            <Row className="mb-4">
              <Col md={12}>
                <div className="d-flex gap-3 justify-content-end">
                  <Button
                    variant="outline-secondary"
                    onClick={() =>
                      user.role === "Super Admin"
                        ? navigate(`/admin/users`)
                        : org_id
                        ? navigate(`/${org_id}/users`)
                        : navigate(`/admin/users`)
                    }
                  >
                    Back to Users
                  </Button>
                  <Button variant="danger" onClick={handleDeleteClick}>
                    Delete User
                  </Button>
                </div>
              </Col>
            </Row>
          </Container>
        </Col>
      </Row>

      {/* Delete Confirmation Modal */}
      <Modal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        centered
      >
        <Modal.Header closeButton className="border-bottom">
          <Modal.Title>Delete User</Modal.Title>
        </Modal.Header>
        <Modal.Body className="py-4">
          <p className="mb-2">
            Are you sure you want to delete{" "}
            <strong>
              {user?.f_name} {user?.l_name}
            </strong>
            ?
          </p>
          <Alert variant="danger" className="mb-0">
            <FontAwesomeIcon icon={faChevronRight} className="me-2" />
            This action cannot be undone.
          </Alert>
        </Modal.Body>
        <Modal.Footer className="border-top">
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDeleteConfirm}
            disabled={deleting}
          >
            {deleting ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Deleting...
              </>
            ) : (
              "Delete User"
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default SpecificUser;
