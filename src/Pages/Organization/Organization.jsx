import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPencil, faPlus, faBan } from "@fortawesome/free-solid-svg-icons";
import { AuthContext } from "../../context/AuthContext";
import TopBar from "../../Components/TopBar/TopBar";
import Sidebar from "../../Components/SideBar/SideBar";
import { Row, Col, Card, Button, Alert, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

const AccessDeniedMessage = () => (
  <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "70vh" }}>
    <Card className="text-center p-5 shadow-sm" style={{ maxWidth: "500px" }}>
      <FontAwesomeIcon icon={faBan} size="3x" className="text-danger mb-3" />
      <h3 className="text-danger fw-bold">Access Denied</h3>
      <p className="text-muted mb-0">
        You do not have <strong>Super Admin</strong> permissions to view this page.
      </p>
    </Card>
  </div>
);

const OverlayCard = ({ children }) => (
  <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "60vh" }}>
    <Card className="shadow-sm text-center p-5" style={{ minWidth: "400px" }}>
      {children}
    </Card>
  </div>
);

const OrganizationsTable = ({ organizations }) => {
  const navigate = useNavigate();

  const handleEdit = (orgId) => {
    navigate(`/admin/organization/${orgId}`);
  };

  if (organizations.length === 0) {
    return (
      <OverlayCard>
        <div className="text-muted">No organizations have been created yet.</div>
      </OverlayCard>
    );
  }

  return (
    <div className="table-responsive">
      <table className="table table-hover bordered striped align-middle shadow-sm">
        <thead className="table-light">
          <tr>
            <th>#</th>
            <th>Title</th>
            <th>Created At</th>
            <th className="text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {organizations.map((org, index) => (
            <tr key={org.id}>
              <td>{index + 1}</td>
              <td className="fw-semibold">{org.title}</td>
              <td>{new Date(org.created_at).toLocaleDateString()}</td>
              <td className="text-center">
                <button
                  className="btn btn-outline-primary btn-sm border-0"
                  title="Edit Organization"
                  onClick={() => handleEdit(org.id)}
                >
                  <FontAwesomeIcon icon={faPencil} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

function Organization() {
  const { user, accessToken } = useContext(AuthContext);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrganizations = async () => {
      if (!user || user.role !== "Super Admin") {
        setLoading(false);
        return;
      }

      setLoading(true);
      setErrorMsg("");

      try {
        const response = await axios.get(
          "https://neil-backend-1.onrender.com/organization/all-organizations",
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
        setOrganizations(response.data.organizations);
      } catch (err) {
        console.error("Failed to fetch organizations:", err);

        if (err.response) {
          if (err.response.status === 404) {
            setErrorMsg(err.response.data.message || "No organizations found yet.");
          } else if (err.response.status === 401) {
            setErrorMsg("Unauthorized. Please log in again.");
          } else {
            setErrorMsg(
              `Server Error: ${err.response.data.message || "Something went wrong."}`
            );
          }
        } else if (err.request) {
          setErrorMsg(
            "No response from server. Check your internet connection or backend server."
          );
        } else {
          setErrorMsg("Unexpected error occurred.");
        }

        setOrganizations([]);
      } finally {
        setLoading(false);
      }
    };

    if (user && accessToken) {
      fetchOrganizations();
    } else {
      setLoading(false);
    }
  }, [accessToken, user]);

  const createOrganization = (e) => {
    e.preventDefault();
    navigate("/admin/new-organization");
  };

  if (!user || user.role !== "Super Admin") {
    return (
      <>
        <TopBar />
        <Sidebar />
        <AccessDeniedMessage />
      </>
    );
  }

  return (
    <>
      <TopBar />
      <Row>
        <Col xs={2} md={2}>
          <Sidebar />
        </Col>
        <Col md={10}>
          <div className="container-fluid form-box py-3">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h2 className="fw-light text-secondary">Organization Management</h2>
              <Button
                variant="primary"
                className="d-flex align-items-center shadow-sm"
                title="Add New Organization"
                onClick={createOrganization}
              >
                <FontAwesomeIcon icon={faPlus} className="me-2" />
                Add Organization
              </Button>
            </div>

            <p className="text-muted">Create and manage organizations</p>

            {loading ? (
              <OverlayCard>
                <div>
                  <Spinner animation="border" variant="primary" />
                  <div className="mt-3 text-muted">Loading organizations...</div>
                </div>
              </OverlayCard>
            ) : errorMsg ? (
              <OverlayCard>
                <Alert variant="danger" className="mb-3">
                  {errorMsg}
                </Alert>
                <Button variant="outline-danger" onClick={() => window.location.reload()}>
                  Retry
                </Button>
              </OverlayCard>
            ) : (
              <OrganizationsTable organizations={organizations} />
            )}
          </div>
        </Col>
      </Row>
    </>
  );
}

export default Organization;
