import React, { useState, useContext, useEffect } from "react";
import TopBar from "../../Components/TopBar/TopBar";
import Sidebar from "../../Components/SideBar/SideBar";
import { Row, Col, Container, Form, Button, Alert, Spinner } from "react-bootstrap";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate, useParams } from "react-router-dom";

const IMAGE_TYPES = ["front", "back", "left", "right"];

function CreateProducts() {
    const { accessToken, user } = useContext(AuthContext);
    const { org_id: urlOrgId } = useParams(); 
    const navigate = useNavigate();

    // --- STATES ---
    const [groups, setGroups] = useState([]);
    const [groupVisibility, setGroupVisibility] = useState([]);
    const [categories, setCategories] = useState([]);
    const [subCategories, setSubCategories] = useState([]);
    const [organizations, setOrganizations] = useState([]);
    
    // Default Org Logic: Agar Super Admin hai toh URL ya Global, warna User ki apni Org
    const [selectedOrg, setSelectedOrg] = useState(user.role === "Super Admin" ? (urlOrgId || "") : user.org_id);
    const [selectedCategory, setSelectedCategory] = useState("");
    const [selectedSubCategory, setSelectedSubCategory] = useState("");

    const [formData, setFormData] = useState({
        sku: "", title: "", description: "", price: "", actual_price: "", productImages: null,
    });

    const [variants, setVariants] = useState([{
        color: "", sku: "", images: { front: null, back: null, left: null, right: null },
        attributes: [{ name: "", adjustment: 0, stock: 0, id: Date.now() }],
    }]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // --- FETCHING LOGIC ---

    // 1. Fetch Organizations (Admin Only)
    useEffect(() => {
        if (user.role !== "Super Admin" || !accessToken) return;
        const fetchOrganizations = async () => {
            try {
                const res = await axios.get("https://neil-backend-1.onrender.com/organization/all-organizations", {
                    headers: { Authorization: `Bearer ${accessToken}` },
                });
                if (res.data.success) setOrganizations(res.data.organizations);
            } catch (err) { console.error("Error fetching organizations:", err); }
        };
        fetchOrganizations();
    }, [accessToken, user.role]);

    // 2. Fetch Categories (Hybrid: Global + Selected Org)
    useEffect(() => {
        if (!accessToken) return;
        const fetchCategories = async () => {
            try {
                const res = await axios.get("http://localhost:3000/categories/all", {
                    headers: { Authorization: `Bearer ${accessToken}` },
                    params: { org_id: selectedOrg } 
                });
                if (res.data.success) setCategories(res.data.categories);
            } catch (err) { console.error("Error fetching categories:", err); }
        };
        fetchCategories();
    }, [accessToken, selectedOrg]);

useEffect(() => {
    const fetchSubCategories = async () => {
        if (!selectedCategory || !accessToken) {
            setSubCategories([]);
            return;
        }

        try {
            const res = await axios.get("http://localhost:3000/sub-categories/all", {
                headers: { Authorization: `Bearer ${accessToken}` },
                params: { 
                    category_id: selectedCategory, 
                    org_id: selectedOrg 
                }
            });

            const data = res.data.subCategories || res.data.data || [];
            setSubCategories(data);
            
            // Agar purani selected sub-category naye list mein nahi hai, toh reset kar do
            if (!data.find(sub => sub.id === selectedSubCategory)) {
                setSelectedSubCategory("");
            }
        } catch (err) { 
            console.error("Sub-category fetch error:", err);
            setSubCategories([]); 
        }
    };

    fetchSubCategories();
}, [selectedCategory, selectedOrg, accessToken]); 

    // 4. Fetch Groups
    useEffect(() => {
        if (!accessToken) return;
        const fetchGroups = async () => {
            try {
                const res = await axios.get("https://neil-backend-1.onrender.com/groups/all", {
                    headers: { Authorization: `Bearer ${accessToken}` },
                    params: { org_id: selectedOrg },
                });
                const fetchedGroups = res.data.groups || [];
                setGroups(fetchedGroups);
                setGroupVisibility(fetchedGroups.map((g) => ({ group_id: g.id, is_visible: false })));
            } catch (err) { console.error(err); }
        };
        fetchGroups();
    }, [accessToken, selectedOrg]);

    // --- HANDLERS ---
    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleProductImagesChange = (e) => {
        const files = e.target.files;
        if (files && files.length > 5) {
            setError("Maximum 5 product images allowed");
            e.target.value = "";
            return;
        }
        setFormData({ ...formData, productImages: files });
    };

    const handleVariantChange = (index, e) => {
        const updated = [...variants];
        updated[index][e.target.name] = e.target.value;
        setVariants(updated);
    };

    const handleVariantImageChange = (index, type, e) => {
        const updated = [...variants];
        updated[index].images[type] = e.target.files;
        setVariants(updated);
    };

    const handleAttributeChange = (variantIndex, attrId, e) => {
        const updatedVariants = [...variants];
        const attrIndex = updatedVariants[variantIndex].attributes.findIndex(attr => attr.id === attrId);
        if (attrIndex !== -1) {
            let value = e.target.value;
            if (e.target.name === 'adjustment') value = parseFloat(value) || 0;
            if (e.target.name === 'stock') value = parseInt(value) || 0;
            updatedVariants[variantIndex].attributes[attrIndex][e.target.name] = value;
            setVariants(updatedVariants);
        }
    };

    const addAttribute = (variantIndex) => {
        const updatedVariants = [...variants];
        updatedVariants[variantIndex].attributes.push({ name: "", adjustment: 0, stock: 0, id: Date.now() + Math.random() });
        setVariants(updatedVariants);
    };

    const removeAttribute = (variantIndex, attrId) => {
        const updatedVariants = [...variants];
        if (updatedVariants[variantIndex].attributes.length > 1) {
            updatedVariants[variantIndex].attributes = updatedVariants[variantIndex].attributes.filter(attr => attr.id !== attrId);
            setVariants(updatedVariants);
        }
    };

    const addVariant = () => setVariants([...variants, { color: "", sku: "", images: { front: null, back: null, left: null, right: null }, attributes: [{ name: "", adjustment: 0, stock: 0, id: Date.now() }] }]);
    const removeVariant = (index) => { if (variants.length > 1) setVariants(variants.filter((_, i) => i !== index)); };
    const toggleGroupVisibility = (groupId) => setGroupVisibility(prev => prev.map(gv => gv.group_id === groupId ? { ...gv, is_visible: !gv.is_visible } : gv));

    const resetForm = () => {
        setFormData({ sku: "", title: "", description: "", price: "", actual_price: "", productImages: null });
        setVariants([{ color: "", sku: "", images: { front: null, back: null, left: null, right: null }, attributes: [{ name: "", adjustment: 0, stock: 0, id: Date.now() }] }]);
        setSelectedCategory("");
        setSelectedSubCategory("");
        document.querySelectorAll("input[type=file]").forEach(input => input.value = "");
    };

    // --- SUBMIT ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedCategory || !selectedSubCategory) return setError("Category and Sub-Category are required.");
        
        setLoading(true);
        setError("");
        setSuccess("");

        try {
            const data = new FormData();
            data.append("title", formData.title);
            data.append("description", formData.description);
            data.append("sku", formData.sku);
            data.append("category_id", selectedCategory);
            data.append("sub_category_id", selectedSubCategory);
            data.append("org_id", selectedOrg || ""); 
            data.append("price", formData.price);
            if (formData.actual_price) data.append("actual_price", formData.actual_price);
            data.append("group_visibility", JSON.stringify(groupVisibility));

            if (formData.productImages) Array.from(formData.productImages).forEach(file => data.append("productImages", file));

            variants.forEach((v, index) => {
                IMAGE_TYPES.forEach(type => {
                    if (v.images[type]) Array.from(v.images[type]).forEach(file => data.append(`variant-${index}-${type}`, file));
                });
            });

            const variantsPayload = variants.map(v => ({
                color: v.color,
                sku: v.sku,
                sizes: v.attributes.map(a => ({ name: a.name, adjustment: a.adjustment, stock: a.stock }))
            }));
            data.append("variants", JSON.stringify(variantsPayload));

            const res = await axios.post("https://neil-backend-1.onrender.com/products/new", data, {
                headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "multipart/form-data" },
            });

            setSuccess("Product created successfully!");
            setTimeout(() => navigate(-1), 1500);
        } catch (err) {
            setError(err.response?.data?.message || "Server Error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <TopBar />
            <Row className="m-0">
                <Col xs={2} className="p-0"><Sidebar /></Col>
                <Col xs={10} className="main-content py-4 bg-light min-vh-100">
                    <Container fluid className="p-4 bg-white shadow-sm rounded">
                        <Form onSubmit={handleSubmit}>
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h4 className="fw-bold text-dark m-0">Create New Product</h4>
                                <Button variant="outline-secondary" size="sm" onClick={() => navigate(-1)}>Back</Button>
                            </div>

                            {error && <Alert variant="danger" onClose={() => setError("")} dismissible>{error}</Alert>}
                            {success && <Alert variant="success">{success}</Alert>}

                            {/* --- Category & Org Section --- */}
                            <div className="p-3 border rounded mb-4" style={{ backgroundColor: "#f8f9fa" }}>
                                <Row>
                                    {user.role === "Super Admin" && (
                                        <Col md={4}>
                                            <Form.Group className="mb-3">
                                                <Form.Label className="fw-bold">Organization Scope</Form.Label>
                                                <Form.Select value={selectedOrg} onChange={(e) => { 
                                                    setSelectedOrg(e.target.value); 
                                                    setSelectedCategory(""); 
                                                    setSelectedSubCategory(""); 
                                                }}>
                                                    <option value="">Global (Default)</option>
                                                    {organizations.map(org => <option key={org.id} value={org.id}>{org.title}</option>)}
                                                </Form.Select>
                                            </Form.Group>
                                        </Col>
                                    )}
                                    <Col md={user.role === "Super Admin" ? 4 : 6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label className="fw-bold">Category <span className="text-danger">*</span></Form.Label>
                                            <Form.Select 
                                                value={selectedCategory} 
                                                onChange={(e) => { 
                                                    setSelectedCategory(e.target.value); 
                                                    setSelectedSubCategory(""); 
                                                }} 
                                                required
                                            >
                                                <option value="">Select Category</option>
                                                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.title}</option>)}
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                    <Col md={user.role === "Super Admin" ? 4 : 6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label className="fw-bold">Sub-Category <span className="text-danger">*</span></Form.Label>
                                            <Form.Select 
                                                value={selectedSubCategory} 
                                                onChange={(e) => setSelectedSubCategory(e.target.value)} 
                                                disabled={!subCategories.length}
                                                required
                                            >
                                                <option value="">{subCategories.length > 0 ? "Select Sub-Category" : "No Options (Select Category first)"}</option>
                                                {subCategories.map(sub => <option key={sub.id} value={sub.id}>{sub.title}</option>)}
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                </Row>
                            </div>

                            {/* --- Basic Details --- */}
                            <Row>
                                <Col md={8}>
                                    <Form.Group className="mb-3">
                                        <Form.Label className="fw-bold">Product Title</Form.Label>
                                        <Form.Control name="title" value={formData.title} onChange={handleChange} placeholder="Enter product name" required />
                                    </Form.Group>
                                </Col>
                                <Col md={4}>
                                    <Form.Group className="mb-3">
                                        <Form.Label className="fw-bold">Base SKU</Form.Label>
                                        <Form.Control name="sku" value={formData.sku} onChange={handleChange} placeholder="e.g. MUG-001" required />
                                    </Form.Group>
                                </Col>
                            </Row>

                            <Form.Group className="mb-3">
                                <Form.Label className="fw-bold">Description</Form.Label>
                                <Form.Control name="description" as="textarea" rows={4} value={formData.description} onChange={handleChange} required />
                            </Form.Group>

                            <Row>
                                <Col md={6}><Form.Group className="mb-3"><Form.Label className="fw-bold">Selling Price</Form.Label><Form.Control type="number" name="price" value={formData.price} onChange={handleChange} required /></Form.Group></Col>
                                <Col md={6}><Form.Group className="mb-3"><Form.Label className="fw-bold">MRP Price</Form.Label><Form.Control type="number" name="actual_price" value={formData.actual_price} onChange={handleChange} /></Form.Group></Col>
                            </Row>

                            <Form.Group className="mb-4">
                                <Form.Label className="fw-bold">Main Product Images</Form.Label>
                                <Form.Control type="file" multiple onChange={handleProductImagesChange} />
                            </Form.Group>

                            {/* --- Visibility Section --- */}
                            <div className="mb-5 p-3 border rounded bg-light">
                                <h6 className="fw-bold mb-3">Group Visibility</h6>
                                <div className="d-flex gap-4 flex-wrap">
                                    {groups.length > 0 ? groups.map(g => (
                                        <Form.Check key={g.id} type="checkbox" label={g.title} 
                                            checked={groupVisibility.find(v => v.group_id === g.id)?.is_visible || false}
                                            onChange={() => toggleGroupVisibility(g.id)} 
                                        />
                                    )) : <span className="text-muted small">No customer groups found.</span>}
                                </div>
                            </div>

                            {/* --- Variants Section --- */}
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h5 className="fw-bold m-0 text-primary">Color Variants</h5>
                                <Button variant="primary" size="sm" onClick={addVariant}>+ Add Variant</Button>
                            </div>

                            {variants.map((variant, index) => (
                                <div key={index} className="border p-4 mb-4 rounded bg-white shadow-sm position-relative">
                                    {variants.length > 1 && (
                                        <Button variant="danger" size="sm" className="position-absolute top-0 end-0 m-2" onClick={() => removeVariant(index)}>Remove</Button>
                                    )}
                                    <Row>
                                        <Col md={6}><Form.Group className="mb-3"><Form.Label className="small fw-bold">Color Name</Form.Label><Form.Control name="color" value={variant.color} onChange={(e) => handleVariantChange(index, e)} placeholder="Red, Blue, etc." /></Form.Group></Col>
                                        <Col md={6}><Form.Group className="mb-3"><Form.Label className="small fw-bold">Variant SKU <span className="text-danger">*</span></Form.Label><Form.Control name="sku" value={variant.sku} onChange={(e) => handleVariantChange(index, e)} required /></Form.Group></Col>
                                    </Row>

                                    <div className="mt-3 bg-light p-3 rounded">
                                        <h6 className="fw-bold small mb-3">Sizes, Stock & Pricing</h6>
                                        {variant.attributes.map((attr) => (
                                            <Row key={attr.id} className="mb-2 align-items-center">
                                                <Col md={3}><Form.Control placeholder="Size" name="name" value={attr.name} onChange={(e) => handleAttributeChange(index, attr.id, e)} required /></Col>
                                                <Col md={3}><Form.Control type="number" placeholder="+/- Price" name="adjustment" value={attr.adjustment} onChange={(e) => handleAttributeChange(index, attr.id, e)} /></Col>
                                                <Col md={3}><Form.Control type="number" placeholder="Stock" name="stock" value={attr.stock} onChange={(e) => handleAttributeChange(index, attr.id, e)} required /></Col>
                                                <Col md={2}><Button variant="link" className="text-danger p-0" onClick={() => removeAttribute(index, attr.id)}>Remove</Button></Col>
                                            </Row>
                                        ))}
                                        <Button variant="link" size="sm" className="p-0 text-decoration-none" onClick={() => addAttribute(index)}>+ Add size</Button>
                                    </div>

                                    <Row className="mt-4">
                                        {IMAGE_TYPES.map(type => (
                                            <Col md={3} key={type}>
                                                <Form.Group>
                                                    <Form.Label className="small text-uppercase">{type} View</Form.Label>
                                                    <Form.Control type="file" size="sm" onChange={(e) => handleVariantImageChange(index, type, e)} />
                                                </Form.Group>
                                            </Col>
                                        ))}
                                    </Row>
                                </div>
                            ))}

                            <div className="mt-5 border-top pt-4 text-end">
                                <Button variant="light" className="me-3" onClick={resetForm} disabled={loading}>Reset</Button>
                                <Button variant="primary" type="submit" size="lg" disabled={loading} className="px-5">
                                    {loading ? <Spinner animation="border" size="sm" className="me-2" /> : "🚀 Publish Product"}
                                </Button>
                            </div>
                        </Form>
                    </Container>
                </Col>
            </Row>
        </>
    );
}

export default CreateProducts;