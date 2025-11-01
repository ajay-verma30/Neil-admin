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
  const { org_id } = useParams(); 
  const navigate = useNavigate();

  const [groups, setGroups] = useState([]);
  const [groupVisibility, setGroupVisibility] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubCategory, setSelectedSubCategory] = useState("");
  const [formData, setFormData] = useState({
    sku: "",
    title: "",
    description: "",
    price: "",
    productImages: null,
  });

  const initialVariant = {
    color: "",
    size: "",
    sku: "",
    images: { front: null, back: null, left: null, right: null },
  };

  const [variants, setVariants] = useState([initialVariant]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleProductImagesChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 5) {
      setError("Maximum 5 product images allowed");
      e.target.value = "";
      return;
    }
    setFormData({ ...formData, productImages: files });
    if (error === "Maximum 5 product images allowed") setError("");
  };

  useEffect(() => {
    if (!accessToken) return;
    const fetchGroups = async () => {
      try {
        const res = await axios.get("https://neil-backend-1.onrender.com/groups/all", {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: { org_id },
        });
        setGroups(res.data.groups || []);
        setGroupVisibility(
          res.data.groups.map((g) => ({ group_id: g.id, is_visible: false }))
        );
      } catch (err) {
      }
    };
    fetchGroups();
  }, [accessToken, org_id]);

  const toggleGroupVisibility = (groupId) => {
    setGroupVisibility((prev) =>
      prev.map((gv) =>
        gv.group_id === groupId ? { ...gv, is_visible: !gv.is_visible } : gv
      )
    );
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

  const addVariant = () => {
    setVariants([
      ...variants,
      { ...initialVariant, images: { front: null, back: null, left: null, right: null } },
    ]);
  };

  const removeVariant = (index) => {
    if (variants.length > 1) setVariants(variants.filter((_, i) => i !== index));
  };

  const fetchSubCategories = async (category) => {
    if (!category) {
      setSubCategories([]);
      setSelectedSubCategory("");
      return;
    }
    try {
      const res = await axios.get("https://neil-backend-1.onrender.com/sub-categories/all", {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { category, org_id },
      });
      setSubCategories(res.data.subCategories || []);
      setSelectedSubCategory("");
    } catch (err) {
      setSubCategories([]);
    }
  };

  const resetForm = () => {
    setFormData({ sku: "", title: "", description: "", price: "", productImages: null });
    setVariants([{ ...initialVariant }]);
    setSelectedCategory("");
    setSelectedSubCategory("");
    document.querySelectorAll("input[type=file]").forEach((input) => (input.value = ""));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedCategory)
      return setError("Please select a category.");

    if (!formData.title || !formData.description || !formData.sku || !formData.price)
      return setError("Please fill all required product fields.");

    if (variants.some((v) => !v.sku))
      return setError("All variants must have a SKU.");

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const data = new FormData();
      data.append("title", formData.title);
      data.append("description", formData.description);
      data.append("sku", formData.sku);
      data.append("category", selectedCategory);
      if (selectedSubCategory) data.append("sub_cat", selectedSubCategory);
      data.append("price", formData.price);
      if (org_id) data.append("org_id", org_id);
      data.append("group_visibility", JSON.stringify(groupVisibility));

      // Product Images
      if (formData.productImages)
        Array.from(formData.productImages).forEach((file) => data.append("productImages", file));

      // Variants + Images
      variants.forEach((v, index) => {
        IMAGE_TYPES.forEach((type) => {
          const files = v.images[type];
          if (files && files.length > 0)
            Array.from(files).forEach((file) =>
              data.append(`variant-${index}-${type}`, file)
            );
        });
      });

      const variantsPayload = variants.map((v) => ({
        color: v.color,
        size: v.size,
        sku: v.sku,
      }));
      data.append("variants", JSON.stringify(variantsPayload));

      const response = await axios.post("https://neil-backend-1.onrender.com/products/new", data, {
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "multipart/form-data" },
      });

      setSuccess(response.data.message || "Product added successfully!");
      resetForm();
    } catch (err) {

      setError(err.response?.data?.message || "Something went wrong while adding the product.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubCategories = () =>{
    if(user.role === "Super Admin"){
      navigate('/admin/sub-categories')
    }
    else{
      navigate(`/${org_id}/sub-categories`)
    }
  }

  return (
    <>
      <TopBar />
      <Row>
        <Col xs={2} md={2}><Sidebar /></Col>
        <Col xs={10} className="main-content py-3">
          <Container fluid className="form-box">
            <Form className="product-form" onSubmit={handleSubmit}>
              <h4 className="mb-3 fw-bold">Add Product</h4>

              {error && <Alert variant="danger" onClose={() => setError("")} dismissible>{error}</Alert>}
              {success && <Alert variant="success" onClose={() => setSuccess("")} dismissible>{success}</Alert>}

              <Row>
                <Col xs={12} md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Product SKU</Form.Label>
                    <Form.Control
                      name="sku"
                      value={formData.sku}
                      onChange={handleChange}
                      placeholder="e.g. LOGO-TSHIRT-001"
                      required
                    />
                  </Form.Group>
                </Col>

                <Col xs={12} md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Category</Form.Label>
                    <Form.Select
                      value={selectedCategory}
                      onChange={(e) => { setSelectedCategory(e.target.value); fetchSubCategories(e.target.value); }}
                      required
                    >
                      <option value="">Select a category</option>
                      {["Tshirts", "Mugs", "Pens", "Bottles", "Books", "Hoodies"].map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col xs={12} md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Sub-Category (Optional)</Form.Label>
                    <Form.Select
                      value={selectedSubCategory}
                      onChange={(e) => setSelectedSubCategory(e.target.value)}
                      disabled={!selectedCategory || subCategories.length === 0}
                    >
                      <option value="">Select Sub-Category</option>
                      {subCategories.map((sub) => (
                        <option key={sub.id} value={sub.title}>{sub.title}</option>
                      ))}
                    </Form.Select>
                    {!subCategories.length && selectedCategory && (
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        className="mt-2"
                        onClick={handleSubCategories}
                      >
                        + Add Sub-Category
                      </Button>
                    )}
                  </Form.Group>
                </Col>
              </Row>

              <div className="group-visibility mt-4">
                <h5>Group Visibility</h5>
                <div className="d-flex flex-wrap gap-3">
                  {groups.map((g) => {
                    const gv = groupVisibility.find((v) => v.group_id === g.id);
                    return (
                      <Form.Check
                        key={g.id}
                        type="checkbox"
                        label={g.title}
                        checked={gv?.is_visible || false}
                        onChange={() => toggleGroupVisibility(g.id)}
                      />
                    );
                  })}
                </div>
              </div>

              <Form.Group className="mb-3 mt-3">
                <Form.Label>Title</Form.Label>
                <Form.Control name="title" value={formData.title} onChange={handleChange} placeholder="Product title" required />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control name="description" value={formData.description} onChange={handleChange} as="textarea" rows={4} placeholder="Product description..." required />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Base Price</Form.Label>
                <Form.Control name="price" value={formData.price} onChange={handleChange} type="number" step="0.01" min="0" placeholder="Base Price" required />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Upload Product Images (Max 5)</Form.Label>
                <Form.Control type="file" multiple accept="image/*" onChange={handleProductImagesChange} id="product-images-input" />
              </Form.Group>

              <div className="variant-section mt-4 mb-3">
                <h5 className="fw-bold mb-3">Product Variants</h5>
                {variants.map((variant, index) => (
                  <div key={index} className="variant-row border p-3 mb-3 rounded">
                    <Row className="align-items-end mb-3">
                      <Col md={3}><Form.Group><Form.Label>Color</Form.Label><Form.Control name="color" value={variant.color} onChange={(e) => handleVariantChange(index, e)} /></Form.Group></Col>
                      <Col md={3}><Form.Group><Form.Label>Size</Form.Label><Form.Control name="size" value={variant.size} onChange={(e) => handleVariantChange(index, e)} /></Form.Group></Col>
                      <Col md={4}><Form.Group><Form.Label>Variant SKU (Required)</Form.Label><Form.Control name="sku" value={variant.sku} onChange={(e) => handleVariantChange(index, e)} required /></Form.Group></Col>
                      <Col md={2}><Button variant="danger" size="sm" onClick={() => removeVariant(index)} disabled={variants.length === 1}>Remove</Button></Col>
                    </Row>

                    <Row className="mb-3">
                      {IMAGE_TYPES.map((type) => (
                        <Col md={3} key={type}>
                          <Form.Group>
                            <Form.Label>{type.charAt(0).toUpperCase() + type.slice(1)} View</Form.Label>
                            <Form.Control type="file" accept="image/*" multiple onChange={(e) => handleVariantImageChange(index, type, e)} className="variant-image-input" />
                          </Form.Group>
                        </Col>
                      ))}
                    </Row>
                  </div>
                ))}
                <Button variant="outline-primary" size="sm" onClick={addVariant}>+ Add Variant</Button>
              </div>

              <Button variant="primary" type="submit" disabled={loading}>
                {loading ? <><Spinner animation="border" size="sm" className="me-2" /> Saving...</> : "Add Product"}
              </Button>
            </Form>
          </Container>
        </Col>
      </Row>
    </>
  );
}

export default CreateProducts;
