import React, { useContext, useState, useEffect } from "react";
import { Row, Col, Card, Alert, Button, Spinner } from "react-bootstrap";
import { useParams } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";
import TopBar from "../../Components/TopBar/TopBar";
import Sidebar from "../../Components/SideBar/SideBar";
import { useNavigate } from "react-router-dom";
const IconMap = {
  BriefcaseFill: (props) => <i className="bi bi-briefcase-fill" {...props} />,
  CalendarFill: (props) => <i className="bi bi-calendar-fill" {...props} />,
  KeyFill: (props) => <i className="bi bi-key-fill" {...props} />,
  PersonFill: (props) => <i className="bi bi-person-fill" {...props} />,
  EnvelopeFill: (props) => <i className="bi bi-envelope-fill" {...props} />,
  PhoneFill: (props) => <i className="bi bi-phone-fill" {...props} />,
};

const API_BASE_URL = process.env.REACT_APP_API_URL || "https://neil-backend-1.onrender.com";


const DetailRow = ({ Icon, label, value, color = "text-secondary" }) => {
  const IconComponent = IconMap[Icon.name] || (() => <i className="bi bi-info-circle-fill text-muted me-2" />);
  return (
    <div className="d-flex align-items-center mb-2">
      <IconComponent className={`${color} me-2`} />
      <div>
        <small className="text-muted d-block">{label}</small>
        <span className="fw-semibold">{value || "—"}</span>
      </div>
    </div>
  );
};

const CustomModal = ({ show, title, message, onConfirm, onCancel, confirmText, cancelText }) => {
  if (!show) return null;

  return (
    <div 
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
        backgroundColor: 'rgba(0, 0, 0, 0.5)', 
        display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1050
      }}
    >
      <Card className="shadow-2xl rounded-lg" style={{ width: '90%', maxWidth: '400px' }}>
        <Card.Header className="bg-primary text-white">
          <Card.Title className="mb-0">{title}</Card.Title>
        </Card.Header>
        <Card.Body>
          <p>{message}</p>
          <div className="d-flex justify-content-end gap-2">
            <Button variant="secondary" onClick={onCancel}>
              {cancelText || "Cancel"}
            </Button>
            <Button variant="danger" onClick={onConfirm}>
              {confirmText || "Confirm"}
            </Button>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};


function SpecificOrganization() {
  const { id, org_id } = useParams();
  const effectiveId = id || org_id;
  const navigate = useNavigate();
  const { accessToken, user } = useContext(AuthContext); 


  const [org, setOrg] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState({ show: false, message: '', variant: 'danger' });

  const showAlert = (message, variant = 'danger') => {
    setAlertMessage({ show: true, message, variant });
    setTimeout(() => setAlertMessage({ show: false, message: '', variant: 'danger' }), 5000);
  };


  useEffect(() => {
    const fetchOrganization = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE_URL}/organization/${effectiveId}`, {
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
    setShowStatusModal(false); 

    try {
      setUpdatingStatus(true);
      const res = await axios.patch(
        `${API_BASE_URL}/organization/${orgId}/status`,
        { status: !org.status }, 
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      setOrg((prev) => ({ ...prev, status: res.data.status }));
      showAlert(`Organization successfully ${res.data.status ? 'activated' : 'marked inactive'}.`, 'success');
    } catch (err) {
      showAlert(err.response?.data?.message || "Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDeleteOrganization = async (orgId) => {
    setShowDeleteModal(false); 
    try {
      await axios.delete(`${API_BASE_URL}/organization/${orgId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });    
      showAlert("Organization deleted successfully. Redirecting...", 'success');
      setTimeout(() => {
        window.location.href = "/admin/organizations";
      }, 1500);

    } catch (err) {
      showAlert(err.response?.data?.message || "Failed to delete organization");
    }
  };

  const customizeLink = ()=>{
    navigate(`/admin/organization/${id}/customize`)
  }

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
      <CustomModal
        show={showStatusModal}
        title="Confirm Status Change"
        message={`Are you sure you want to ${org.status ? 'mark INACTIVE' : 'ACTIVATE'} this organization?`}
        onConfirm={() => handleMarkInactive(org.id)}
        onCancel={() => setShowStatusModal(false)}
        confirmText={org.status ? 'Mark Inactive' : 'Activate'}
      />
      <CustomModal
        show={showDeleteModal}
        title="Confirm Deletion"
        message="Are you absolutely sure you want to delete this organization? This action cannot be undone and will delete ALL related data."
        onConfirm={() => handleDeleteOrganization(org.id)}
        onCancel={() => setShowDeleteModal(false)}
        confirmText="Yes, Delete"
        cancelText="Cancel"
      />
      {alertMessage.show && (
        <Alert 
          variant={alertMessage.variant} 
          style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 1060 }}
        >
          {alertMessage.message}
        </Alert>
      )}
      <TopBar/>
      <Row className="g-0">
        <Col xs={2} md={2}>
          <Sidebar/>
        </Col>
        <Col xs={10} md={10}>
          <div className="p-4 form-box" style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
            <Card className="shadow-lg border-0 rounded-4">
              <Card.Body className="p-5">
                <div className="d-flex align-items-center justify-content-between mb-4 border-bottom pb-3">
                  <div className="d-flex align-items-center">
                    <IconMap.BriefcaseFill className="text-primary fs-2 me-3" />
                    <Card.Title className="fw-bold text-primary display-6 mb-0">
                      {org.title}
                    </Card.Title>
                  </div>
                  <div className="d-flex gap-2">
                    {user?.role === "Super Admin" && (
                      <>
                          <Button className="btn btn-info" onClick={customizeLink}>Customize</Button>
                        <Button
                          variant={org.status ? "warning" : "success"}
                          onClick={() => setShowStatusModal(true)} 
                          disabled={updatingStatus}
                        >
                          {updatingStatus ? (
                            <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                          ) : org.status ? "Mark Inactive" : "Activate"}
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() => setShowDeleteModal(true)}
                        >
                          Delete
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                <h4 className="fw-semibold mt-4 mb-3 text-secondary">General Details</h4>
                <DetailRow Icon={IconMap.KeyFill} label="Organization ID" value={org.id} />
                <DetailRow
                  Icon={IconMap.CalendarFill}
                  label="Created On"
                  value={new Date(org.created_at).toLocaleString()}
                />
                <hr className="my-5" />
                <div className="d-flex align-items-center mb-4">
                  <IconMap.PersonFill className="text-info fs-3 me-3" />
                  <h4 className="fw-bold text-info mb-0">Default Admin</h4>
                </div>
                {admin && admin.f_name ? (
                  <div className="row g-3">
                    <div className="col-md-6">
                      <DetailRow
                        Icon={IconMap.PersonFill}
                        label="Name"
                        value={`${admin.f_name} ${admin.l_name}`}
                        color="text-info"
                      />
                    </div>
                    <div className="col-md-6">
                      <DetailRow Icon={IconMap.EnvelopeFill} label="Email" value={admin.email} color="text-info" />
                    </div>
                    <div className="col-md-6">
                      <DetailRow Icon={IconMap.PhoneFill} label="Contact" value={admin.contact} color="text-info" />
                    </div>
                    <div className="col-md-6">
                      <DetailRow Icon={IconMap.KeyFill} label="Role" value={admin.role} color="text-info" />
                    </div>
                    <div className="col-md-6">
                      <DetailRow
                        Icon={IconMap.CalendarFill}
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