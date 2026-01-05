import React, { useEffect, useState, useContext, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Row, Col, Card, Table, Badge, Spinner, Button } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faTicketAlt,
  faCheckCircle,
  faClock,
} from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";
import TopBar from "../../Components/TopBar/TopBar";
import Sidebar from "../../Components/SideBar/SideBar";

const API_BASE_URL = "http://localhost:3000";

function SpecCoupon() {
  const { id } = useParams(); 
  const navigate = useNavigate();
  const { accessToken } = useContext(AuthContext);

  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [batchInfo, setBatchInfo] = useState(null);

  const fetchBatchDetails = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/coupon/all_coupons/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (res.data.success) {
        setCoupons(res.data.coupons);
        if (res.data.coupons.length > 0) {
          setBatchInfo({
            title: res.data.coupons[0].coupon_title,
            org: res.data.coupons[0].organization_name,
            count: res.data.count,
          });
        }
      }
    } catch (err) {
      console.error("Error fetching batch details:", err);
    } finally {
      setLoading(false);
    }
  }, [id, accessToken]);

  useEffect(() => {
    if (accessToken && id) {
      fetchBatchDetails();
    }
  }, [accessToken, id, fetchBatchDetails]);

  const redeemedCount = coupons.filter((c) => c.status === "REDEEMED").length;
  const pendingCount = coupons.length - redeemedCount;

  const maskCouponCode = (code) => {
    if (!code) return "";
    const firstPart = code.split("-")[0];
    return `${firstPart}-****`;
  };

  return (
    <>
      <TopBar />
      <Row className="gx-0">
        <Col xs={2} md={2} className="min-vh-100 border-end">
          <Sidebar />
        </Col>
        <Col xs={10} md={10} className="bg-light p-4">
          <div className="d-flex align-items-center mb-4 form-box">
            <Button
              variant="outline-secondary"
              className="rounded-circle me-3"
              onClick={() => navigate(-1)}
            >
              <FontAwesomeIcon icon={faArrowLeft} />
            </Button>
            <div>
              <h4 className="fw-bold mb-0">
                {batchInfo?.title || "Batch Details"}
              </h4>
              <small className="text-muted">{batchInfo?.org}</small>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              <Row className="mb-4">
                <Col md={4}>
                  <Card className="border-0 shadow-sm text-center p-3 rounded-4">
                    <FontAwesomeIcon
                      icon={faTicketAlt}
                      className="text-primary mb-2"
                      size="lg"
                    />
                    <h3 className="fw-bold mb-0">{coupons.length}</h3>
                    <small className="text-muted">Total Coupons</small>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card className="border-0 shadow-sm text-center p-3 rounded-4">
                    <FontAwesomeIcon
                      icon={faCheckCircle}
                      className="text-success mb-2"
                      size="lg"
                    />
                    <h3 className="fw-bold mb-0">{redeemedCount}</h3>
                    <small className="text-muted">Redeemed</small>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card className="border-0 shadow-sm text-center p-3 rounded-4">
                    <FontAwesomeIcon
                      icon={faClock}
                      className="text-warning mb-2"
                      size="lg"
                    />
                    <h3 className="fw-bold mb-0">{pendingCount}</h3>
                    <small className="text-muted">Available</small>
                  </Card>
                </Col>
              </Row>

              {/* Coupons Table */}
              <Card className="border-0 shadow-sm rounded-4">
                <Card.Body className="p-0">
                  <div className="table-responsive">
                    <Table hover className="align-middle mb-0">
                      <thead className="bg-light">
                        <tr className="small fw-bold text-muted">
                          <th className="ps-4">COUPON CODE</th>
                          <th>AMOUNT</th>
                          <th>STATUS</th>
                          <th>REDEEMED BY</th>
                          <th className="pe-4">DATE CREATED</th>
                        </tr>
                      </thead>
                      <tbody>
                        {coupons.map((c) => (
                          <tr key={c.id}>
                            <td className="fw-bold text-dark">
                              {maskCouponCode(c.code)}
                            </td>

                            <td>${Number(c.amount).toFixed(2)}</td>
                            <td>
                              <Badge
                                bg={
                                  c.status === "REDEEMED" ? "success" : "info"
                                }
                                className="rounded-pill px-3"
                              >
                                {c.status}
                              </Badge>
                            </td>
                            <td>
                              {c.redeemer_name || (
                                <span className="text-muted small">
                                  Not yet
                                </span>
                              )}
                            </td>
                            <td className="pe-4 text-muted small">
                              {new Date(c.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </Card.Body>
              </Card>
            </>
          )}
        </Col>
      </Row>
    </>
  );
}

export default SpecCoupon;
