import React, { useState, useContext, useEffect } from "react";
import { Container, Form, Button, Alert, Spinner, Row, Col, Card } from "react-bootstrap";
import TopBar from "../../Components/TopBar/TopBar";
import Sidebar from "../../Components/SideBar/SideBar";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
// nanoid is imported but not used in this file's logic, keeping the import for now

function CreateLogos() {
    const { accessToken, user } = useContext(AuthContext);
    const navigate = useNavigate();

    // --- NEW STATE ---
    const [organizations, setOrganizations] = useState([]);
    const [selectedOrgId, setSelectedOrgId] = useState("");
    const [fetchingOrgs, setFetchingOrgs] = useState(false);
    // -----------------

    const [title, setTitle] = useState("");
    const [productType, setProductType] = useState("");
    const [selectedPlacements, setSelectedPlacements] = useState([]);
    const [variants, setVariants] = useState([{ color: "", file: null }]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const PLACEMENT_OPTIONS = {
        // ... (Placement options remain the same)
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

    // 1. Fetch Organizations on component mount (Only for Super Admins)
    useEffect(() => {
        const fetchOrganizations = async () => {
            if (user?.role !== "Super Admin" || !accessToken) return;

            setFetchingOrgs(true);
            try {
                const res = await axios.get(
                    "https://neil-backend-1.onrender.com/organization/all-organizations",
                    { headers: { Authorization: `Bearer ${accessToken}` } }
                );
                
                // Assuming res.data.organizations contains the list of { id, title }
                setOrganizations(res.data.organizations || []);

            } catch (err) {
                console.error("Error fetching organizations:", err);
                // Non-critical error, just show the message but allow form to load
                setError("Failed to load organizations for dropdown.");
            } finally {
                setFetchingOrgs(false);
            }
        };
        fetchOrganizations();
    }, [user, accessToken]);

    // 2. Navigation logic (remains the same)
    const navigation = () => {
        if (user.role === "Super Admin") {
            navigate('/admin/logos');
        } else {
            navigate(`/${user.org_id}/logos`);
        }
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

    // 3. Update handleSubmit to include org_id
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        // Validation: Super Admin must select an organization
        if (user.role === "Super Admin" && !selectedOrgId) {
             setError("Super Admin must assign the logo to an organization.");
             return;
        }
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
            
            // --- ADD ORG_ID LOGIC ---
            // If Super Admin, use selectedOrgId. If not, use the user's assigned org_id.
            const orgIdToUse = user.role === "Super Admin" ? selectedOrgId : user.org_id;
            if (orgIdToUse) {
                formData.append("org_id", orgIdToUse);
            }
            // -------------------------

            variants.forEach(v => formData.append("logos", v.file));

            const res = await axios.post("https://neil-backend-1.onrender.com/logos/new-logo", formData, {
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
                setSelectedOrgId(""); // Clear organization selection
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
                                {/* 4. ORGANIZATION DROPDOWN (Visible only to Super Admin) */}
                                {user?.role === "Super Admin" && (
                                    <Form.Group className="mb-3">
                                        <Form.Label>Assign to Organization</Form.Label>
                                        <Form.Select
                                            value={selectedOrgId}
                                            onChange={(e) => setSelectedOrgId(e.target.value)}
                                            disabled={loading || fetchingOrgs}
                                        >
                                            <option value="">{fetchingOrgs ? "Loading organizations..." : "Select an organization"}</option>
                                            {organizations.map(org => (
                                                <option key={org.id} value={org.id}>
                                                    {org.title} 
                                                </option>
                                            ))}
                                        </Form.Select>
                                        {fetchingOrgs && <Spinner animation="border" size="sm" className="ms-2" />}
                                    </Form.Group>
                                )}
                                
                                {/* Logo Title, Product Type, Placements, and Variants follow... */}

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