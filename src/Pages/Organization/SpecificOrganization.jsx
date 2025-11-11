import React, { useContext, useState, useEffect } from "react";
import { AuthContext } from "../../context/AuthContext";
import TopBar from "../../Components/TopBar/TopBar";
import Sidebar from "../../Components/SideBar/SideBar";
import { Row, Col, Card, Alert, Button, Spinner } from "react-bootstrap";
import { useParams } from "react-router-dom";
import axios from "axios";
import {
  BriefcaseFill,
  CalendarFill,
  KeyFill,
  PersonFill,
  EnvelopeFill,
  PhoneFill,
} from "react-bootstrap-icons";

const DetailRow = ({ Icon, label, value, color = "text-secondary" }) => (
  <div className="d-flex align-items-center mb-2">
    <Icon className={`${color} me-2`} />
    <div>
      <small className="text-muted d-block">{label}</small>
      <span className="fw-semibold">{value || "—"}</span>
    </div>
  </div>
);

function SpecificOrganization() {
  const { id, org_id } = useParams();
  const effectiveId = id || org_id;
  const { accessToken, user } = useContext(AuthContext);
  const [org, setOrg] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
  const fetchOrganization = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`https://neil-backend-1.onrender.com/organization/${effectiveId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setOrg(res.data.organization);
    } catch (err) {
      const backendMessage = err.response?.data?.message;
      if (backendMessage) {
    setErrorMsg(backendMessage);
  } else if (err.response?.status === 403) {
    setErrorMsg("You are not authorized to access the details of this organization.");
  } else {
    setErrorMsg("Unable to load organization details. Please try again later.");
  }
  } finally {
      setLoading(false);
    }
  };

  if (effectiveId && accessToken) fetchOrganization();
}, [effectiveId, accessToken]);


const handleMarkInactive = async (orgId) => {
  if (!window.confirm("Are you sure you want to toggle this organization's status?")) return;

  try {
    setUpdatingStatus(true);
    const res = await axios.patch(
      `https://neil-backend-1.onrender.com/organization/${orgId}/status`,
      { status: !org.status }, // toggle
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    // Update local state
    setOrg((prev) => ({ ...prev, status: res.data.status }));
  } catch (err) {
    alert(err.response?.data?.message || "Failed to update status");
  } finally {
    setUpdatingStatus(false);
  }
};

  const handleDeleteOrganization = async (orgId) => {
  if (!window.confirm("Are you sure you want to delete this organization? This action cannot be undone.")) return;

  try {
    await axios.delete(`http://localhost:3000/organization/${orgId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    alert("Organization deleted successfully.");
    window.location.href = "/admin/organizations";
  } catch (err) {
    alert(err.response?.data?.message || "Failed to delete organization");
  }
};

  if (loading) {
    return (
      <div className="text-center mt-5">
        <div className="spinner-border text-primary" role="status" />
        <p className="mt-3 text-muted">Loading organization details...</p>
      </div>
    );
  }
  if (errorMsg)
  return (
    <div className="text-center mt-5">
      <Alert variant="danger">{errorMsg}</Alert>
    </div>
  );
  if (!org) return <div className="text-center mt-5 text-muted">No organization found.</div>;

  const admin = org.admin || {};

  return (
    <>
      <TopBar />
      <Row>
        <Col xs={2} md={2}>
          <Sidebar />
        </Col>
        <Col xs={10} md={10}>
          <div className="p-4 form-box" style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
            <Card className="shadow-lg border-0 rounded-4">
              <Card.Body className="p-5">
                <div className="d-flex align-items-center justify-content-between mb-4 border-bottom pb-3">
                  <div className="d-flex align-items-center">
                    <BriefcaseFill className="text-primary fs-2 me-3" />
                    <Card.Title className="fw-bold text-primary display-6 mb-0">
                      {org.title}
                    </Card.Title>
                  </div>
                  <div className="d-flex gap-2">
  {user?.role === "Super Admin" && (
    <>
      <Button
        variant={org.status ? "warning" : "success"}
        onClick={() => handleMarkInactive(org.id)}
        disabled={updatingStatus}
      >
        {updatingStatus ? (
          <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
        ) : org.status ? "Mark Inactive" : "Activate"}
      </Button>
      <Button
        variant="danger"
        onClick={() => handleDeleteOrganization(org.id)}
      >
        Delete
      </Button>
    </>
  )}
</div>
                </div>

                <h4 className="fw-semibold mt-4 mb-3 text-secondary">General Details</h4>
                <DetailRow Icon={KeyFill} label="Organization ID" value={org.id} />
                <DetailRow
                  Icon={CalendarFill}
                  label="Created On"
                  value={new Date(org.created_at).toLocaleString()}
                />
                <hr className="my-5" />
                <div className="d-flex align-items-center mb-4">
                  <PersonFill className="text-info fs-3 me-3" />
                  <h4 className="fw-bold text-info mb-0">Default Admin</h4>
                </div>
                {admin && admin.f_name ? (
                  <div className="row g-3">
                    <div className="col-md-6">
                      <DetailRow
                        Icon={PersonFill}
                        label="Name"
                        value={`${admin.f_name} ${admin.l_name}`}
                        color="text-info"
                      />
                    </div>
                    <div className="col-md-6">
                      <DetailRow Icon={EnvelopeFill} label="Email" value={admin.email} color="text-info" />
                    </div>
                    <div className="col-md-6">
                      <DetailRow Icon={PhoneFill} label="Contact" value={admin.contact} color="text-info" />
                    </div>
                    <div className="col-md-6">
                      <DetailRow Icon={KeyFill} label="Role" value={admin.role} color="text-info" />
                    </div>
                    <div className="col-md-6">
                      <DetailRow
                        Icon={CalendarFill}
                        label="Account Created"
                        value={new Date(admin.created_at).toLocaleString()}
                        color="text-info"
                      />
                    </div>
                  </div>
                ) : (
                  <Alert variant="secondary" className="mt-3">
                    No default admin has been assigned to this organization yet.
                  </Alert>
                )}
              </Card.Body>
            </Card>
          </div>
        </Col>
      </Row>
    </>
  );
}

export default SpecificOrganization;
