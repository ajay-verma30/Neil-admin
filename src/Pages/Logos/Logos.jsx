import React, { useState, useContext, useEffect } from "react";
import TopBar from "../../Components/TopBar/TopBar";
import Sidebar from "../../Components/SideBar/SideBar";
import {
  Button,
  Container,
  Spinner,
  Alert,
  Table,
  Row,
  Col,
  Card,
  Image,
  Badge,
} from "react-bootstrap";
import { AuthContext } from "../../context/AuthContext";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faTrash, faImage } from "@fortawesome/free-solid-svg-icons";
import { useNavigate, useParams } from "react-router-dom";
import "./Logos.css"; // Custom styles

function Logos() {
  const { accessToken } = useContext(AuthContext);
  const [logos, setLogos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { org_id } = useParams();

  // Fetch logos
  useEffect(() => {
    const fetchLogos = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get("http://localhost:3000/logos/all-logos", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setLogos(res.data || []);
      } catch (err) {
        console.error("Error fetching logos:", err);
        setError(err.response?.data?.message || "Error fetching logos.");
      } finally {
        setLoading(false);
      }
    };

    if (accessToken) fetchLogos();
  }, [accessToken]);

  // Delete logo
  const deleteLogo = async (id) => {
    if (!window.confirm("Are you sure you want to delete this logo?")) return;

    try {
      await axios.delete(`http://localhost:3000/logos/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setLogos((prev) => prev.filter((logo) => logo.id !== id));
    } catch (err) {
      console.error("Error deleting logo:", err);
      alert(err.response?.data?.message || "Failed to delete logo.");
    }
  };

  // Delete variant
  const deleteVariant = async (variantId) => {
    if (!window.confirm("Delete this variant?")) return;

    try {
      await axios.delete(`http://localhost:3000/logos/variant/${variantId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setLogos((prev) =>
        prev.map((logo) => ({
          ...logo,
          variants: logo.variants.filter((v) => v.id !== variantId),
        }))
      );
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to delete variant.");
    }
  };

  // Navigate to Add Logo page
  const handleAddLogo = () => {
    navigate(`/admin/logos/new-logo`);
  };

  const filteredLogos = logos.filter((logo) => logo.variants && logo.variants.length > 0);
  const totalVariants = filteredLogos.reduce((sum, logo) => sum + logo.variants.length, 0);

  return (
    <>
      <TopBar />
      <Row className="g-0">
        <Col xs={2}>
          <Sidebar />
        </Col>

        <Col xs={10} className="main-content px-4 py-4">
          <Container fluid className="p-0 form-box">
            {/* Header Section */}
            <div className="logos-header mb-4">
              <div className="d-flex justify-content-between align-items-end">
                <div>
                  <h2 className="fw-bold text-dark mb-2">Logo Library</h2>
                  <p className="text-muted mb-0">
                    Manage and organize your brand logos with variants and placements
                  </p>
                </div>
                <Button
                  variant="primary"
                  className="d-flex align-items-center gap-2 px-4 py-2 btn-add-logo"
                  onClick={handleAddLogo}
                  style={{
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    border: "none",
                    fontWeight: "600",
                    fontSize: "0.95rem",
                  }}
                >
                  <FontAwesomeIcon icon={faPlus} />
                  Upload Logo
                </Button>
              </div>

            </div>

            {/* Loading State */}
            {loading && (
              <div className="text-center py-5">
                <Spinner animation="border" variant="primary" className="mb-3" />
                <p className="text-muted">Loading your logo library...</p>
              </div>
            )}

            {/* Error State */}
            {error && (
              <Alert variant="danger" className="border-0 alert-professional">
                <div className="d-flex align-items-center">
                  <div>
                    <strong>Error loading logos</strong>
                    <p className="mb-0 mt-1 small">{error}</p>
                  </div>
                </div>
              </Alert>
            )}

            {/* Content Section */}
            {!loading && !error && (
              <>
                {filteredLogos.length > 0 ? (
                  <Card className="border-0 shadow-sm professional-card">
                    <div className="table-responsive">
                      <Table hover className="align-middle mb-0 professional-table">
                        <thead>
                          <tr className="border-bottom">
                            <th className="fw-600 text-muted small" style={{ width: "5%" }}>
                              #
                            </th>
                            <th className="fw-600 text-muted small" style={{ width: "25%" }}>
                              Preview
                            </th>
                            <th className="fw-600 text-muted small" style={{ width: "15%" }}>
                              Color
                            </th>
                            <th className="fw-600 text-muted small" style={{ width: "35%" }}>
                              Placements
                            </th>
                            <th className="fw-600 text-muted small" style={{ width: "15%" }}>
                              Created
                            </th>
                            <th className="fw-600 text-muted small text-end" style={{ width: "5%" }}>
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredLogos.map((logo, index) => (
                            <React.Fragment key={logo.id}>
                              {/* Parent row */}
                              <tr className="logo-header-row bg-light border-bottom">
  <td className="fw-bold text-dark">{index + 1}</td>
  <td colSpan={4} className="fw-600 text-dark">
    <FontAwesomeIcon icon={faImage} className="me-2 text-muted" />
    {logo.title}
    <Badge bg="light" text="dark" className="ms-3">
      {logo.variants.length} variant{logo.variants.length !== 1 ? "s" : ""}
    </Badge>
  </td>
  <td className="text-end">
    <Button
      variant="link"
      className="p-0 text-danger btn-action"
      onClick={() => deleteLogo(logo.id)}
      title="Delete Logo"
    >
      <FontAwesomeIcon icon={faTrash} size="sm" />
    </Button>
  </td>
</tr>


                              {/* Variant rows */}
                              {logo.variants.map((v, variantIndex) => (
                                <tr key={v.id} className="variant-row">
                                  <td></td>
                                  <td>
                                    <div className="logo-preview-container">
                                      <Image
                                        src={v.url}
                                        height={50}
                                        alt={v.color}
                                        rounded
                                        className="logo-preview-img"
                                      />
                                    </div>
                                  </td>
                                  <td>
                                    <div className="color-badge-container">
                                      <div
                                        className="color-swatch"
                                        style={{ backgroundColor: v.color }}
                                        title={v.color}
                                      ></div>
                                      <span className="color-text">{v.color}</span>
                                    </div>
                                  </td>
                                  <td>
                                    <div className="placements-container">
                                      {v.placements && v.placements.length > 0 ? (
                                        <div className="d-flex flex-wrap gap-2">
                                          {v.placements.map((p) => (
                                            <Badge key={p.id} bg="primary" className="placement-badge">
                                              {p.name}
                                            </Badge>
                                          ))}
                                        </div>
                                      ) : (
                                        <span className="text-muted small">—</span>
                                      )}
                                    </div>
                                  </td>
                                  <td>
                                    <small className="text-muted">
                                      {new Date(v.created_at).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                      })}
                                    </small>
                                  </td>
                                  <td className="text-end">
                                    <Button
                                      variant="link"
                                      className="p-0 text-danger btn-action"
                                      onClick={() => deleteVariant(v.id)}
                                      title="Delete variant"
                                    >
                                      <FontAwesomeIcon icon={faTrash} size="sm" />
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </React.Fragment>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  </Card>
                ) : (
                  <Card className="border-0 shadow-sm text-center py-5 professional-card">
                    <div>
                      <FontAwesomeIcon icon={faImage} size="3x" className="text-muted mb-3" />
                      <h5 className="text-dark fw-600 mb-2">No Logos Yet</h5>
                      <p className="text-muted mb-4">
                        Get started by uploading your first logo variant
                      </p>
                      <Button
                        variant="primary"
                        onClick={handleAddLogo}
                        style={{
                          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                          border: "none",
                        }}
                      >
                        <FontAwesomeIcon icon={faPlus} className="me-2" />
                        Upload Your First Logo
                      </Button>
                    </div>
                  </Card>
                )}
              </>
            )}
          </Container>
        </Col>
      </Row>
    </>
  );
}

export default Logos;