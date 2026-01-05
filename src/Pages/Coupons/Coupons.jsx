import React, { useContext, useState, useCallback, useEffect } from "react";
import TopBar from "../../Components/TopBar/TopBar";
import {
  Row,
  Col,
  Button,
  Modal,
  Card,
  Form,
  Spinner,
  Table,
  Badge,
} from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faPencilAlt } from "@fortawesome/free-solid-svg-icons";
import Sidebar from "../../Components/SideBar/SideBar";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = "http://localhost:3000";
const BACKEND_URL = "https://neil-backend-1.onrender.com";

function Coupons() {
  const { accessToken, user } = useContext(AuthContext);
  const navigate = useNavigate();

  // --- States ---
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [orgs, setOrgs] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [couponAmount, setCouponAmount] = useState("");
  const [totalCoupons, setTotalCoupons] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [couponsList, setCouponsList] = useState([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);

  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [loadingGroups, setLoadingGroups] = useState(false);

  const totalAmount = (Number(couponAmount) || 0) * (Number(totalCoupons) || 0);


  const fetchCoupons = useCallback(async () => {
    try {
      setLoadingCoupons(true);
      const res = await axios.get(`${API_BASE_URL}/coupon/coupon-batch`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.data.success) {
        setCouponsList(res.data.coupons);
      }
    } catch (err) {
      console.error("Error fetching coupons:", err);
    } finally {
      setLoadingCoupons(false);
    }
  }, [accessToken]);

  const fetchOrganizations = useCallback(async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/organization/all-organizations`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.data.success) {
        setOrgs(res.data.organizations);
      }
    } catch (err) {
      console.error("Error fetching organizations:", err);
    }
  }, [accessToken]);

  const fetchGroups = useCallback(async () => {

    const targetOrgId = user?.role === "Super Admin" ? selectedOrgId : user?.org_id;

    if (!targetOrgId) return;

    try {
      setLoadingGroups(true);
      const res = await axios.get(`${BACKEND_URL}/groups/all?org_id=${targetOrgId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setGroups(res.data.groups || []);
    } catch (err) {
      console.error("Error fetching groups:", err);
      setGroups([]);
    } finally {
      setLoadingGroups(false);
    }
  }, [accessToken, user, selectedOrgId]);


  useEffect(() => {
    if (accessToken) {
      fetchCoupons();
      if (user?.role === "Super Admin") fetchOrganizations();
    }
  }, [accessToken, fetchOrganizations, fetchCoupons, user?.role]);

  useEffect(() => {
    if (accessToken && showModal) {
      fetchGroups();
    }
  }, [accessToken, selectedOrgId, showModal, fetchGroups]);


  const handleShowModal = () => {
    setShowModal(true);
    if (user?.role !== "Super Admin") {
      setSelectedOrgId(user?.org_id);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  const resetForm = () => {
    setTitle("");
    setSelectedOrgId("");
    setSelectedGroupId("");
    setCouponAmount("");
    setTotalCoupons("");
    setGroups([]);
  };

  const createButton = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const payload = {
        admin_id: user.id,
        organizations: selectedOrgId,
        group_id: selectedGroupId ? selectedGroupId : "",
        title,
        coupon_amount: Number(couponAmount),
        number_of_coupons: Number(totalCoupons),
        total_amount: Number(totalAmount),
        payment_status: "PENDING",
      };

      const resBatch = await axios.post(
        `${API_BASE_URL}/coupon/new/batch`,
        payload,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (resBatch.data.success) {
        const batchId = resBatch.data.batch_id;
        const pi = await axios.post(`${BACKEND_URL}/create-payment-intent`, {
          amount: Math.round(totalAmount * 100),
        });

        navigate("/payment", {
          state: {
            clientSecret: pi.data.clientSecret,
            totalAmount,
            batchId: batchId,
            paymentType: "coupon",
          },
        });
      }
    } catch (err) {
      console.error("Error:", err.response?.data || err.message);
      alert("Batch creation failed!");
    } finally {
      setSubmitting(false);
    }
  };

  const OpenCouponBatch = (batchId, orgId) => {
    const finalOrgId = orgId || user.org_id;
    const path = user.role === "Super Admin" 
      ? `/admin/coupons/${batchId}` 
      : `/${finalOrgId}/coupons/${batchId}`;
    navigate(path);
  };

  return (
    <>
      <TopBar />
      <Row className="gx-0">
        <Col xs={2} md={2} className="min-vh-100 border-end">
          <Sidebar />
        </Col>
        <Col xs={10} md={10} className="bg-light">
          <div className="p-4 form-box">
            <Card className="shadow-sm border-0 rounded-4">
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <div>
                    <h4 className="fw-bold mb-1 text-dark">Coupon Batches</h4>
                    <small className="text-muted">Manage your organization's coupon inventory</small>
                  </div>
                  {["Super Admin", "Admin", "Manager"].includes(user?.role) && (
                    <Button variant="primary" className="rounded-pill px-4" onClick={handleShowModal}>
                      <FontAwesomeIcon icon={faPlus} className="me-2" /> Create New Batch
                    </Button>
                  )}
                </div>

                {loadingCoupons ? (
                  <div className="text-center py-5">
                    <Spinner animation="border" variant="primary" />
                  </div>
                ) : (
                  <div className="table-responsive">
                    <Table hover borderless className="align-middle">
                      <thead className="table-light">
                        <tr className="text-muted small fw-bold">
                          <th>TITLE</th>
                          <th>ORG</th>
                          <th>QTY</th>
                          <th>AMOUNT</th>
                          <th>STATUS</th>
                          <th>DATE</th>
                          <th className="text-center">ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {couponsList.map((cp) => (
                          <tr key={cp.id} className="border-bottom">
                            <td className="fw-semibold">{cp.title}</td>
                            <td>{cp.organization_name}</td>
                            <td>{cp.number_of_coupons}</td>
                            <td className="fw-bold text-primary">${Number(cp.coupon_amount).toFixed(2)}</td>
                            <td>
                              <Badge bg={cp.payment_status === "SUCCESS" ? "success" : "warning"} className="rounded-pill px-3">
                                {cp.payment_status}
                              </Badge>
                            </td>
                            <td className="small text-muted">{new Date(cp.created_at).toLocaleDateString()}</td>
                            <td className="text-center">
                              <Button variant="link" className="text-primary p-0" onClick={() => OpenCouponBatch(cp.id, cp.organizations || cp.org_id)}>
                                <FontAwesomeIcon icon={faPencilAlt} />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
              </Card.Body>
            </Card>
          </div>
        </Col>
      </Row>

      {/* --- CREATE MODAL --- */}
      <Modal show={showModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton className="border-0 p-4 pb-0">
          <Modal.Title className="fw-bold">Create Coupon Batch</Modal.Title>
        </Modal.Header>
        <Form onSubmit={createButton}>
          <Modal.Body className="p-4">
            
            {user?.role === "Super Admin" ? (
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">Select Organization</Form.Label>
                <Form.Select
                  value={selectedOrgId}
                  onChange={(e) => {
                    setSelectedOrgId(e.target.value);
                    setSelectedGroupId(""); 
                  }}
                  required
                >
                  <option value="">-- Select Organization --</option>
                  {orgs.map((org) => (
                    <option key={org.id} value={org.id}>{org.title}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            ) : (
              <div className="mb-3 p-2 bg-light rounded border">
                <small className="text-muted d-block">Organization</small>
                <strong>{user?.organization_name || "Your Organization"}</strong>
              </div>
            )}

            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">
                Target User Group
                {user?.role === "Super Admin" && !selectedOrgId && (
                  <small className="text-danger ms-2" style={{ fontSize: '10px' }}>(Select Org First)</small>
                )}
              </Form.Label>
              <Form.Select
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                disabled={user?.role === "Super Admin" && !selectedOrgId}
              >
                <option value="">-- All Users in Organization --</option>
                {loadingGroups ? (
                  <option disabled>Loading groups...</option>
                ) : (
                  groups.map((grp) => (
                    <option key={grp.id} value={grp.id}>{grp.title}</option>
                  ))
                )}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Batch Title</Form.Label>
              <Form.Control
                placeholder="e.g. Christmas Special 2025"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Amount per Coupon</Form.Label>
                  <Form.Control
                    type="number"
                    value={couponAmount}
                    onChange={(e) => setCouponAmount(e.target.value)}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Quantity</Form.Label>
                  <Form.Control
                    type="number"
                    value={totalCoupons}
                    onChange={(e) => setTotalCoupons(e.target.value)}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <div className="mt-3 p-3 bg-primary bg-opacity-10 rounded text-primary text-center">
              <h5 className="mb-0 fw-bold">Total Payment: ${totalAmount.toFixed(2)}</h5>
            </div>
          </Modal.Body>
          <Modal.Footer className="border-0 p-4 pt-0">
            <Button variant="light" onClick={handleCloseModal} className="rounded-pill px-4">Cancel</Button>
            <Button variant="primary" type="submit" className="rounded-pill px-4" disabled={submitting}>
              {submitting ? <Spinner size="sm" /> : "Proceed to Payment"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
}

export default Coupons;