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
import { useNavigate } from "react-router-dom";
import './Groups.css';
import { faPlus, faSearch, faRedo, faPencil, faTrash } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";

const BASE_URL = "https://neil-backend-1.onrender.com";

function Groups() {
  const { accessToken, user } = useContext(AuthContext);
  const navigate = useNavigate();
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
    let endpoint = `${BASE_URL}/groups/all?`;
    const queryParams = [];

    if (filterSearch) queryParams.push(`search=${encodeURIComponent(filterSearch)}`);
    if (filterOrgId && user?.role === "Super Admin") queryParams.push(`org_id=${filterOrgId}`);
    if (filterStartDate) queryParams.push(`start_date=${filterStartDate}`);
    if (filterEndDate) queryParams.push(`end_date=${filterEndDate}`);

    endpoint += queryParams.join("&");

    try {
      setLoading(true);
      const res = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setGroups(res.data.groups || []);
    } catch (error) {
      setAlert({
        type: "danger",
        message: error.response?.data?.message || "Failed to fetch groups.",
      });
    } finally {
      setLoading(false);
    }
  }, [accessToken, filterSearch, filterOrgId, filterStartDate, filterEndDate, user?.role]);

  // === Fetch Organizations (for Super Admins) ===
  const fetchOrganizations = useCallback(async () => {
    try {
      const res = await axios.get(`${BASE_URL}/organization/all-organizations`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.data.success) setOrgs(res.data.organizations);
    } catch (err) {
      console.error("Error fetching organizations:", err);
    }
  }, [accessToken]);

  useEffect(() => {
    if (accessToken) {
      fetchGroups();
      if (user?.role === "Super Admin") fetchOrganizations();
    }
  }, [accessToken, fetchGroups, fetchOrganizations, user?.role, triggerFetch]);

  const handleResetFilters = () => {
    setFilterSearch("");
    setFilterOrgId("");
    setFilterStartDate("");
    setFilterEndDate("");
    setTriggerFetch((prev) => prev + 1);
  };

  const handleShowModal = async () => {
    setShowAddGroupModal(true);
    setNewGroupTitle("");
    setSelectedOrgId("");
    if (user?.role === "Super Admin" && orgs.length === 0) await fetchOrganizations();
  };

  const handleCloseModal = () => setShowAddGroupModal(false);

  // === Create Group ===
  const handleCreateGroup = async (e) => {
    e.preventDefault();
    const orgId = user.role === "Super Admin" ? selectedOrgId : user.org_id;

    setSubmitting(true);
    try {
      await axios.post(`${BASE_URL}/groups/new`, 
        { title: newGroupTitle.trim(), org_id: orgId },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      handleCloseModal();
      setAlert({ type: "success", message: "Group created successfully!" });
      fetchGroups();
    } catch (error) {
      setAlert({ type: "danger", message: error.response?.data?.message || "Creation failed." });
    } finally {
      setSubmitting(false);
    }
  };

  // === View Group Details (Members) ===
  const handleViewGroup = (groupId, orgId) => {
    if (user?.role === "Super Admin") {
      navigate(`/admin/groups/${groupId}`);
    } else {
      const organizationId = orgId || user?.org_id;
      navigate(`/${organizationId}/groups/${groupId}`);
    }
  };

  // === Delete Group ===
  const handleDeleteGroup = async (groupId) => {
    if (window.confirm("Are you sure? This will remove all members from this group too.")) {
      try {
        const res = await axios.delete(`${BASE_URL}/groups/${groupId}`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (res.status === 200) {
          setAlert({ type: "success", message: "Group deleted successfully!" });
          fetchGroups();
        }
      } catch (err) {
        setAlert({ type: "danger", message: err.response?.data?.message || "Delete failed" });
      }
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
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h4 className="fw-bold mb-0 text-primary">Groups List</h4>
                  {["Super Admin", "Admin", "Manager"].includes(user?.role) && (
                    <Button variant="primary" onClick={handleShowModal}>
                      <FontAwesomeIcon icon={faPlus} className="me-2" /> Add Group
                    </Button>
                  )}
                </div>

                {/* Filters Section */}
                <Card className="border-0 bg-light p-3 mb-4 shadow-sm rounded-3">
                  <Row className="g-3 align-items-end">
                    <Col md={3}>
                      <Form.Label className="small fw-semibold text-muted">Search Title</Form.Label>
                      <Form.Control type="text" placeholder="Group name..." value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)} />
                    </Col>
                    {user?.role === "Super Admin" && (
                      <Col md={3}>
                        <Form.Label className="small fw-semibold text-muted">Organization</Form.Label>
                        <Form.Select value={filterOrgId} onChange={(e) => setFilterOrgId(e.target.value)}>
                          <option value="">All Organizations</option>
                          {orgs.map((org) => <option key={org.id} value={org.id}>{org.title}</option>)}
                        </Form.Select>
                      </Col>
                    )}
                    <Col md={2}>
                      <Form.Label className="small fw-semibold text-muted">Created After</Form.Label>
                      <Form.Control type="date" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} />
                    </Col>
                    <Col md={2}>
                      <Form.Label className="small fw-semibold text-muted">Created Before</Form.Label>
                      <Form.Control type="date" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} />
                    </Col>
                    <Col md={2} className="d-flex gap-2">
                      <Button variant="success" onClick={() => setTriggerFetch(p => p + 1)}><FontAwesomeIcon icon={faSearch} /></Button>
                      <Button variant="secondary" onClick={handleResetFilters}><FontAwesomeIcon icon={faRedo} /></Button>
                    </Col>
                  </Row>
                </Card>

                {alert && <Alert variant={alert.type} dismissible onClose={() => setAlert(null)}>{alert.message}</Alert>}

                {loading ? (
                  <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
                ) : (
                  <div className="table-responsive">
                    <Table hover bordered className="align-middle">
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
                        {groups.length > 0 ? (
                          groups.map((g, i) => (
                            <tr key={g.id}>
                              <td>{i + 1}</td>
                              <td className="fw-semibold">{g.title}</td>
                              <td>{g.organization}</td>
                              <td>{new Date(g.created_at).toLocaleString()}</td>
                              <td>
                                <FontAwesomeIcon 
                                  icon={faPencil} 
                                  className="me-3 text-primary pointer" 
                                  onClick={() => handleViewGroup(g.id, g.org_id)} 
                                /> 
                                <FontAwesomeIcon 
                                  icon={faTrash} 
                                  className="text-danger pointer" 
                                  onClick={() => handleDeleteGroup(g.id)} 
                                />
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr><td colSpan="5" className="text-center py-4">No groups found.</td></tr>
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

      {/* Add Group Modal */}
      <Modal show={showAddGroupModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton><Modal.Title>Add New Group</Modal.Title></Modal.Header>
        <Form onSubmit={handleCreateGroup}>
          <Modal.Body>
            {user.role === "Super Admin" && (
              <Form.Group className="mb-3">
                <Form.Label>Select Organization</Form.Label>
                <Form.Select value={selectedOrgId} onChange={(e) => setSelectedOrgId(e.target.value)} required>
                  <option value="">-- Select Organization --</option>
                  {orgs.map((org) => <option key={org.id} value={org.id}>{org.title}</option>)}
                </Form.Select>
              </Form.Group>
            )}
            <Form.Group className="mb-3">
              <Form.Label>Group Title</Form.Label>
              <Form.Control type="text" placeholder="Enter group name" value={newGroupTitle} onChange={(e) => setNewGroupTitle(e.target.value)} required />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? "Creating..." : "Create Group"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
}

export default Groups;