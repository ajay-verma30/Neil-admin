import React, { useEffect, useState, useContext, useCallback } from "react";
import TopBar from "../../Components/TopBar/TopBar";
import {
  Col,
  Row,
  Card,
  Table,
  Spinner,
  Badge,
  Container,
  Button,
  Modal,
  Form,
} from "react-bootstrap";
import Sidebar from "../../Components/SideBar/SideBar";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faUsers,
  faPlus,
  faUserPlus,
  faCheck,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import "./Groups.css";

const API_BASE_URL = "http://localhost:3000";

function SpecGroup() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { accessToken } = useContext(AuthContext);

  const [show, setShow] = useState(false);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [allUsers, setAllUsers] = useState([]);
  const [fetchingUsers, setFetchingUsers] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleClose = () => {
    setShow(false);
    setSelectedUserId("");
  };
  const fetchGroupMembers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${API_BASE_URL}/groups/group-members/${id}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      if (res.data.success) {
        setMembers(res.data.members);
      }
    } catch (err) {
      setError("Failed to load group members.");
    } finally {
      setLoading(false);
    }
  }, [id, accessToken]);

  const fetchAllUsers = async () => {
    setFetchingUsers(true);
    try {
      const res = await axios.get(
        `${API_BASE_URL}/users/all-users?isActive=true`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      if (res.data.success) {
        const currentMemberIds = members.map((m) => m.user_id);
        const availableUsers = res.data.users.filter(
          (u) => !currentMemberIds.includes(u.id)
        );
        setAllUsers(availableUsers);
      }
    } catch (err) {
      console.error("Error fetching all users:", err);
    } finally {
      setFetchingUsers(false);
    }
  };

  const handleShow = () => {
    setShow(true);
    fetchAllUsers();
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUserId) return;

    setSubmitting(true);
    try {
      const res = await axios.patch(
        `${API_BASE_URL}/users/user/${selectedUserId}`,
        {
          group_ids: [id],
          remove_group_ids: [],
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (res.data.success) {
        handleClose();
        fetchGroupMembers();
      }
    } catch (err) {
      console.error("Error adding user:", err);
      alert(err.response?.data?.message || "Error adding user to group");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (accessToken && id) {
      fetchGroupMembers();
    }
  }, [accessToken, id, fetchGroupMembers]);

  const handleRemove = async (userIdToRemove) => {
    if (
      !window.confirm(
        "Are you sure you want to remove this user from the group?"
      )
    )
      return;

    try {
      const res = await axios.patch(
        `${API_BASE_URL}/users/user/rm_grp/${userIdToRemove}`,
        {
          group_id: id,
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (res.data.success) {
        fetchGroupMembers();
      }
    } catch (err) {
      console.error("❌ Error removing user:", err);
      alert(err.response?.data?.message || "Failed to remove user");
    }
  };

  return (
    <>
      <TopBar />
      <Row className="gx-0">
        <Col xs={2} md={2} className="border-end bg-light min-vh-100">
          <Sidebar />
        </Col>
        <Col xs={10} md={10} className="p-4 bg-light">
          <Container className="form-box">
            <Card className="shadow-sm border-0 rounded-4 overflow-hidden">
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
                  <div className="d-flex align-items-center">
                    <Button
                      variant="light"
                      className="me-3 rounded-circle shadow-sm"
                      onClick={() => navigate(-1)}
                      style={{ width: "40px", height: "40px" }}
                    >
                      <FontAwesomeIcon icon={faArrowLeft} />
                    </Button>
                    <div>
                      <h4 className="fw-bold mb-0 text-dark">
                        <FontAwesomeIcon
                          icon={faUsers}
                          className="me-2 text-primary"
                        />
                        {members.length > 0
                          ? members[0].group_name
                          : "Group Members"}
                      </h4>
                      <small className="text-muted">
                        Manage users within this specific group
                      </small>
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-3">
                    <Badge
                      bg="primary"
                      className="px-3 py-2 rounded-pill fw-normal"
                    >
                      {members.length} Members
                    </Badge>
                    <Button
                      variant="primary"
                      className="rounded-pill px-4 shadow-sm"
                      onClick={handleShow}
                    >
                      <FontAwesomeIcon icon={faPlus} className="me-2" /> Add
                      User
                    </Button>
                  </div>
                </div>

                {loading ? (
                  <div className="text-center py-5">
                    <Spinner animation="border" variant="primary" />
                  </div>
                ) : (
                  <div className="table-responsive">
                    <Table hover borderless className="align-middle">
                      <thead className="table-light">
                        <tr className="text-uppercase small fw-bold text-muted">
                          <th className="py-3 px-4">Name</th>
                          <th className="py-3">Email Address</th>
                          <th className="py-3">Role</th>
                          <th className="py-3">Added Date</th>
                          <th className="py-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {members.length > 0 ? (
                          members.map((member) => (
                            <tr key={member.user_id} className="border-bottom">
                              <td className="py-3 px-4 fw-semibold">
                                {member.full_name}
                              </td>
                              <td className="py-3 text-muted">
                                {member.email}
                              </td>
                              <td className="py-3">
                                <Badge
                                  bg="soft-primary"
                                  className="text-primary border"
                                >
                                  {member.role}
                                </Badge>
                              </td>
                              <td className="py-3 text-muted small">
                                {new Date(member.added_on).toLocaleDateString(
                                  "en-GB"
                                )}
                              </td>
                              <td className="py-3">
                                <FontAwesomeIcon
                                  icon={faTrash}
                                  className="trash-icon text-danger cursor-pointer"
                                  style={{ cursor: "pointer" }}
                                  onClick={() => handleRemove(member.user_id)}
                                />
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan="4"
                              className="text-center py-4 text-muted"
                            >
                              No members found in this group.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </Table>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Container>
        </Col>
      </Row>

      <Modal show={show} onHide={handleClose} centered size="md">
        <Modal.Header closeButton className="border-0 p-4 pb-0">
          <Modal.Title className="fw-bold">
            <FontAwesomeIcon icon={faUserPlus} className="me-2 text-primary" />{" "}
            Add New Member
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleAddSubmit}>
          <Modal.Body className="p-4">
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">
                Select User from Organization
              </Form.Label>
              {fetchingUsers ? (
                <div className="py-2 text-center">
                  <Spinner animation="border" size="sm" />
                </div>
              ) : (
                <Form.Select
                  className="py-2"
                  required
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                >
                  <option value="">Choose a user...</option>
                  {allUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.f_name} {user.l_name} ({user.email})
                    </option>
                  ))}
                </Form.Select>
              )}
              <Form.Text className="text-muted">
                Only active users not already in this group are shown.
              </Form.Text>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-0 px-4 pb-4">
            <Button
              variant="light"
              className="px-4 rounded-pill"
              onClick={handleClose}
            >
              Discard
            </Button>
            <Button
              variant="primary"
              type="submit"
              className="px-4 rounded-pill shadow-sm"
              disabled={submitting || !selectedUserId}
            >
              {submitting ? (
                <Spinner size="sm" />
              ) : (
                <>
                  <FontAwesomeIcon icon={faCheck} className="me-2" /> Confirm
                  Add
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
}

export default SpecGroup;
