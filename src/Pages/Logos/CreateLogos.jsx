import React, { useState, useContext } from "react";
import { Container, Form, Button, Alert, Spinner, Row, Col, Card } from "react-bootstrap";
import TopBar from "../../Components/TopBar/TopBar";
import Sidebar from "../../Components/SideBar/SideBar";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { nanoid } from "nanoid";

function CreateLogos() {
  const { accessToken,user } = useContext(AuthContext);
  const navigate = useNavigate();
  const {id} = useParams();

  const [title, setTitle] = useState("");
  const [productType, setProductType] = useState("");
  const [selectedPlacements, setSelectedPlacements] = useState([]);
  const [variants, setVariants] = useState([{ color: "", file: null }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const PLACEMENT_OPTIONS = {
    tshirt: [
      "Front Chest",
      "Left Chest",
      "Right Chest",
      "Back",
      "Lower Front",
      "Lower Back",
      "Left Sleeve",
      "Right Sleeve"
    ],
    hoodie: [
      "Front Chest",
      "Left Chest",
      "Right Chest",
      "Back",
      "Lower Front",
      "Lower Back",
      "Left Sleeve",
      "Right Sleeve"
    ],
    bottle: ["Front"],
    stationery: ["Front"],
    cap: ["Front Top"]
  };

  const handlePlacementToggle = (placement) => {
    setSelectedPlacements((prev) =>
      prev.includes(placement)
        ? prev.filter((p) => p !== placement)
        : [...prev, placement]
    );
  };

  const handleVariantChange = (index, field, value) => {
    const updated = [...variants];
    updated[index][field] = value;
    setVariants(updated);
  };

  const addVariant = () => setVariants([...variants, { color: "", file: null }]);
  const removeVariant = (index) => {
    const updated = [...variants];
    updated.splice(index, 1);
    setVariants(updated);
  };

  const navigation = ()=>{
    if(user.role === "Super Admin"){
        navigate('/admin/logos')
    }
    else{
        navigate(`/${user.org_id}/logos`)
    }
  }
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!title.trim() || !productType) {
      setError("Please provide a title and select a product type.");
      return;
    }

    if (variants.some(v => !v.color.trim() || !v.file)) {
      setError("Each variant must have a color and an SVG file.");
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("title", title);
      formData.append("colors", JSON.stringify(variants.map(v => v.color)));
      formData.append("productType", productType);
      formData.append("placements", JSON.stringify(selectedPlacements));
      variants.forEach(v => formData.append("logos", v.file));

      const res = await axios.post("http://localhost:3000/logos/new-logo", formData, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.status === 201) {
        setSuccess("Logo, variants, and placements uploaded successfully!");
        setTitle("");
        setProductType("");
        setSelectedPlacements([]);
        setVariants([{ color: "", file: null }]);
        setTimeout(() => navigation(), 1500);
      }
    } catch (err) {
      console.error("Upload error:", err);
      setError(err.response?.data?.message || "Failed to upload logo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <TopBar />
      <Row className="g-0">
        <Col xs={2}><Sidebar /></Col>
        <Col xs={10} className="main-content px-4 py-4">
          <Container fluid className="form-box">
            <Card className="shadow-sm border-0 p-4">
              <h4 className="fw-semibold mb-3">Add New Logo with Variants & Placements</h4>

              {error && <Alert variant="danger">{error}</Alert>}
              {success && <Alert variant="success">{success}</Alert>}

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Logo Title</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter logo title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={loading}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Product Type</Form.Label>
                  <Form.Select
                    value={productType}
                    onChange={(e) => {
                      setProductType(e.target.value);
                      setSelectedPlacements([]);
                    }}
                    disabled={loading}
                  >
                    <option value="">Select product type</option>
                    <option value="tshirt">T-Shirt</option>
                    <option value="hoodie">Hoodie</option>
                    <option value="bottle">Bottle</option>
                    <option value="stationery">Stationery</option>
                    <option value="cap">Cap</option>
                  </Form.Select>
                </Form.Group>

                {productType && (
                  <Form.Group className="mb-3">
                    <Form.Label>Select Placements</Form.Label>
                    <div className="d-flex flex-wrap gap-3">
                      {PLACEMENT_OPTIONS[productType].map((placement) => (
                        <Form.Check
                          key={placement}
                          type="checkbox"
                          label={placement}
                          checked={selectedPlacements.includes(placement)}
                          onChange={() => handlePlacementToggle(placement)}
                          disabled={loading}
                        />
                      ))}
                    </div>
                  </Form.Group>
                )}

                {variants.map((v, idx) => (
                  <Row key={idx} className="mb-3 align-items-center">
                    <Col md={4}>
                      <Form.Control
                        type="text"
                        placeholder="Variant color (e.g., blue)"
                        value={v.color}
                        onChange={(e) => handleVariantChange(idx, "color", e.target.value)}
                        disabled={loading}
                      />
                    </Col>
                    <Col md={5}>
                      <Form.Control
                        type="file"
                        accept="image/svg+xml"
                        onChange={(e) => handleVariantChange(idx, "file", e.target.files[0])}
                        disabled={loading}
                      />
                    </Col>
                    <Col md={3}>
                      {variants.length > 1 && (
                        <Button
                          variant="danger"
                          onClick={() => removeVariant(idx)}
                          disabled={loading}
                        >
                          Remove
                        </Button>
                      )}
                    </Col>
                  </Row>
                ))}

                <Button variant="secondary" onClick={addVariant} disabled={loading}>
                  Add Another Variant
                </Button>

                <div className="mt-4">
                  <Button type="submit" variant="primary" disabled={loading}>
                    {loading && <Spinner animation="border" size="sm" className="me-2" />}
                    {loading ? "Uploading..." : "Upload Logo"}
                  </Button>
                </div>
              </Form>
            </Card>
          </Container>
        </Col>
      </Row>
    </>
  );
}

export default CreateLogos;
