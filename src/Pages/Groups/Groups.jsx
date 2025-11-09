import React, { useEffect, useState, useContext, useCallback } from "react";
import {
  Row,
  Col,
  Table,
  Spinner,
  Alert,
  Button,
  Modal,
  Form,
  Card,
  Container,
} from "react-bootstrap";
import TopBar from "../../Components/TopBar/TopBar";
import Sidebar from "../../Components/SideBar/SideBar";
import { AuthContext } from "../../context/AuthContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faSearch, faRedo } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";

function Groups() {
  const { accessToken, user } = useContext(AuthContext);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [showAddGroupModal, setShowAddGroupModal] = useState(false);
  const [newGroupTitle, setNewGroupTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [filterSearch, setFilterSearch] = useState("");
  const [filterOrgId, setFilterOrgId] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [triggerFetch, setTriggerFetch] = useState(0);

  const [orgs, setOrgs] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState("");

  // === Fetch Groups ===
  const fetchGroups = useCallback(async () => {
    let endpoint = "https://neil-backend-1.onrender.com/groups/all?";
    const queryParams = [];

    if (filterSearch) queryParams.push(`search=${encodeURIComponent(filterSearch)}`);
    if (filterOrgId && user?.role === "Super Admin")
      queryParams.push(`org_id=${filterOrgId}`);
    if (filterStartDate) queryParams.push(`start_date=${filterStartDate}`);
    if (filterEndDate) queryParams.push(`end_date=${filterEndDate}`);

    endpoint += queryParams.join("&");

    try {
      setLoading(true);
      const res = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setGroups(res.data.groups || []);
      if (alert && alert.type === "success") setAlert(null);
    } catch (error) {
      setAlert({
        type: "danger",
        message: error.response?.data?.message || "Failed to fetch groups.",
      });
    } finally {
      setLoading(false);
    }
  }, [accessToken, alert, filterSearch, filterOrgId, filterStartDate, filterEndDate, user?.role]);

  // === Fetch Organizations (for Super Admins) ===
  const fetchOrganizations = useCallback(async () => {
    try {
      const res = await axios.get(
        "https://neil-backend-1.onrender.com/organization/all-organizations",
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (res.data.success && res.data.organizations) {
        setOrgs(res.data.organizations);
      } else {
        setOrgs([]);
      }
    } catch (err) {
      console.error("Error fetching organizations:", err);
      setOrgs([]);
    }
  }, [accessToken]);

  // === On Mount ===
  useEffect(() => {
    if (accessToken) {
      fetchGroups();
      if (user?.role === "Super Admin") fetchOrganizations();
    }
  }, [accessToken, fetchGroups, fetchOrganizations, user?.role, triggerFetch]);

  // === Reset Filters ===
  const handleResetFilters = () => {
    setFilterSearch("");
    setFilterOrgId("");
    setFilterStartDate("");
    setFilterEndDate("");
    setTriggerFetch((prev) => prev + 1);
  };

  // === Modal Handlers ===
  const handleShowModal = async () => {
    setShowAddGroupModal(true);
    setNewGroupTitle("");
    setSelectedOrgId("");
    setAlert(null);
    if (user?.role === "Super Admin" && orgs.length === 0) await fetchOrganizations();
  };

  const handleCloseModal = () => {
    setShowAddGroupModal(false);
    setAlert(null);
  };

  // === Create Group ===
  const handleCreateGroup = async (e) => {
    e.preventDefault();
    const title = newGroupTitle.trim();
    if (!title) {
      setAlert({ type: "warning", message: "Group title cannot be empty." });
      return;
    }

    const orgId = user.role === "Super Admin" ? selectedOrgId : user.org_id;
    if (!orgId) {
      setAlert({ type: "warning", message: "Please select an organization." });
      return;
    }

    setSubmitting(true);
    setAlert(null);

    try {
      const payload = { title, org_id: orgId };
      await axios.post("https://neil-backend-1.onrender.com/groups/new", payload, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      handleCloseModal();
      setAlert({ type: "success", message: `Group "${title}" created successfully!` });
      await fetchGroups();
    } catch (error) {
      console.error("Error creating group:", error);
      setAlert({
        type: "warning",
        message:
          error.response?.data?.message || "An unexpected error occurred during creation.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <TopBar />
      <Row className="gx-0">
        <Col xs={2} md={2} className="bg-light min-vh-100 border-end">
          <Sidebar />
        </Col>

        <Col xs={10} md={10} className="p-4">
          <Container fluid className="form-box">
            <Card className="shadow-sm border-0 mb-4 rounded-4">
              <Card.Body>
                {/* Header */}
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h4 className="fw-bold mb-0 text-primary">Groups List</h4>
                  {["Super Admin", "Admin", "Manager"].includes(user?.role) && (
                    <Button variant="primary" onClick={handleShowModal}>
                      <FontAwesomeIcon icon={faPlus} className="me-2" />
                      Add Group
                    </Button>
                  )}
                </div>

                {/* Filters */}
                <Card className="border-0 bg-light p-3 mb-4 shadow-sm rounded-3">
                  <h6 className="fw-semibold mb-3 text-secondary">
                    <FontAwesomeIcon icon={faSearch} className="me-2 text-muted" />
                    Filter Groups
                  </h6>
                  <Row className="g-3 align-items-end">
                    <Col md={3}>
                      <Form.Group controlId="filterSearch">
                        <Form.Label className="small fw-semibold text-muted">
                          Search Title
                        </Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="Group name..."
                          value={filterSearch}
                          onChange={(e) => setFilterSearch(e.target.value)}
                        />
                      </Form.Group>
                    </Col>

                    {user?.role === "Super Admin" && (
                      <Col md={3}>
                        <Form.Group controlId="filterOrg">
                          <Form.Label className="small fw-semibold text-muted">
                            Organization
                          </Form.Label>
                          <Form.Select
                            value={filterOrgId}
                            onChange={(e) => setFilterOrgId(e.target.value)}
                          >
                            <option value="">All Organizations</option>
                            {orgs.map((org) => (
                              <option key={org.id} value={org.id}>
                                {org.title}
                              </option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    )}

                    <Col md={2}>
                      <Form.Group controlId="filterStartDate">
                        <Form.Label className="small fw-semibold text-muted">
                          Created After
                        </Form.Label>
                        <Form.Control
                          type="date"
                          value={filterStartDate}
                          onChange={(e) => setFilterStartDate(e.target.value)}
                        />
                      </Form.Group>
                    </Col>

                    <Col md={2}>
                      <Form.Group controlId="filterEndDate">
                        <Form.Label className="small fw-semibold text-muted">
                          Created Before
                        </Form.Label>
                        <Form.Control
                          type="date"
                          value={filterEndDate}
                          onChange={(e) => setFilterEndDate(e.target.value)}
                        />
                      </Form.Group>
                    </Col>

                    <Col md={2} className="d-flex gap-2">
                      <Button
                        variant="success"
                        title="Apply Filters"
                        onClick={() => setTriggerFetch((prev) => prev + 1)}
                      >
                        <FontAwesomeIcon icon={faSearch} />
                      </Button>
                      <Button
                        variant="secondary"
                        title="Reset Filters"
                        onClick={handleResetFilters}
                      >
                        <FontAwesomeIcon icon={faRedo} />
                      </Button>
                    </Col>
                  </Row>
                </Card>

                {/* Alert */}
                {alert && alert.type !== "warning" && (
                  <Alert
                    variant={alert.type}
                    onClose={() => setAlert(null)}
                    dismissible
                    className="mb-3"
                  >
                    {alert.message}
                  </Alert>
                )}

                {/* Table or Loader */}
                {loading ? (
                  <div className="text-center py-5">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-3 text-muted">Loading groups...</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <Table hover bordered className="align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>#</th>
                          <th>Title</th>
                          <th>Organization</th>
                          <th>Created At</th>
                        </tr>
                      </thead>
                      <tbody>
                        {groups.length > 0 ? (
                          groups.map((g, i) => (
                            <tr key={g.id}>
                              <td>{i + 1}</td>
                              <td className="fw-semibold">{g.title}</td>
                              <td>{g.organization}</td>
                              <td>{new Date(g.created_at).toLocaleString()}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="4" className="text-center py-4 text-muted">
                              No groups found.
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

      {/* === Add Group Modal === */}
      <Modal show={showAddGroupModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Add New Group</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateGroup}>
          <Modal.Body>
            {alert && alert.type === "warning" && (
              <Alert
                variant="warning"
                onClose={() => setAlert(null)}
                dismissible
                className="mb-3"
              >
                {alert.message}
              </Alert>
            )}

            {user.role === "Super Admin" && (
              <Form.Group className="mb-3" controlId="formGroupOrg">
                <Form.Label>Select Organization</Form.Label>
                <Form.Select
                  value={selectedOrgId}
                  onChange={(e) => setSelectedOrgId(e.target.value)}
                  disabled={submitting}
                  required
                >
                  <option value="">-- Select Organization --</option>
                  {orgs.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.title}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            )}

            <Form.Group className="mb-3" controlId="formGroupTitle">
              <Form.Label>Group Title</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter group name (e.g., Sales Team)"
                value={newGroupTitle}
                onChange={(e) => setNewGroupTitle(e.target.value)}
                disabled={submitting}
                required
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={submitting || !newGroupTitle.trim()}>
              {submitting ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Creating...
                </>
              ) : (
                "Create Group"
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
}

export default Groups;
