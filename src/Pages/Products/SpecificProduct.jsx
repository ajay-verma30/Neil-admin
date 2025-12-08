import React, { useEffect, useState, useContext, useCallback } from "react";
import {
  Col,
  Row,
  Spinner,
  Alert,
  Card,
  Button,
  Form,
  Container,
  Accordion,
  Table,
  InputGroup,
  FormControl,
} from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import TopBar from "../../Components/TopBar/TopBar";
import Sidebar from "../../Components/SideBar/SideBar";
import { AuthContext } from "../../context/AuthContext";
import { FaTrash, FaPlus, FaCamera, FaSave, FaEdit, FaEye } from "react-icons/fa"; // Added FaEye for visibility icon
import { nanoid } from "nanoid";

const formatPrice = (price) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    price
  );

const safeParseFloat = (value) => {
  const num = parseFloat(value);
  return isNaN(num) ? 0.0 : num;
};

function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { accessToken, user } = useContext(AuthContext);

  // --- Core State (Original State Variables) ---
  const [productDetails, setProductDetails] = useState(null);
  const [currentVariants, setCurrentVariants] = useState([]); // Array of variants (with sizes/attributes)
  const [productImages, setProductImages] = useState([]); // [{id, url, file, isNew}]
  const [deletedImages, setDeletedImages] = useState([]); // URLs/IDs of images to delete (Product Images)
  const [deletedVariants, setDeletedVariants] = useState([]); // IDs of variants to delete
  const [deletedVariantImages, setDeletedVariantImages] = useState([]); // URLs/IDs of variant images to delete (Variant Images)

  const [groups, setGroups] = useState([]);
  const [groupVisibility, setGroupVisibility] = useState([]);

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);


  // --- Data Fetching and Initialization ---

const fetchData = useCallback(async () => {
  try {
    setLoading(true);
    const [productRes, groupsRes] = await Promise.all([
      axios.get(`https://neil-backend-1.onrender.com/products/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      }),
      axios.get("https://neil-backend-1.onrender.com/groups/all", {
        headers: { Authorization: `Bearer ${accessToken}` },
      }),
    ]);

    const { product, categories, sub_categories } = productRes.data;
    const allGroups = groupsRes.data.groups || [];
    const visibilities = product.group_visibility || [];

    setCategories(categories || []);
    setSubCategories(sub_categories || []);

    setProductDetails({
      title: product.title || "",
      description: product.description || "",
      sku: product.sku || "",
      category: product.category?.id || "",
      sub_cat: product.sub_category?.id || "",
      price: product.price || "",
      actual_price: product.actual_price || "",
    });

    // Reset deletion trackers on successful fetch
    setDeletedImages([]);
    setDeletedVariants([]);
    setDeletedVariantImages([]);

    setCurrentVariants((product.variants || []).map((v) => ({ ...v, tempId: v.id })));
    setProductImages((product.images || []).map((img) => ({ ...img, isNew: false })));

    const mergedVisibility = allGroups.map((g) => {
      const match = visibilities.find((v) => v.group_id === g.id);
      return {
        group_id: g.id,
        title: g.title,
        is_visible: !!match?.is_visible,
      };
    });
    setGroups(allGroups);
    setGroupVisibility(mergedVisibility);
  } catch (err) {
    setError("Failed to fetch product details.");
  } finally {
    setLoading(false);
  }
}, [accessToken, id]);


  useEffect(() => {
    if (accessToken && id) fetchData();
  }, [accessToken, id, fetchData]);

  // --- Change Handlers for Base Product (Original Handlers) ---

  const handleDetailChange = (e) => {
    const { name, value } = e.target;
    setProductDetails((prev) => ({ ...prev, [name]: value }));
  };

  // --- Change Handlers for Variants (Original Handlers) ---

  const handleVariantChange = (tempId, field, value) => {
    setCurrentVariants((prev) =>
      prev.map((v) => (v.tempId === tempId ? { ...v, [field]: value } : v))
    );
  };

  const handleSizeChange = (variantTempId, sizeName, field, value) => {
    setCurrentVariants((prev) =>
      prev.map((v) => {
        if (v.tempId === variantTempId) {
          const updatedAttributes = v.attributes.map((attr) =>
            attr.name === sizeName
              ? {
                  ...attr,
                  [field]:
                    field === "adjustment"
                      ? safeParseFloat(value)
                      : field === "stock"
                      ? parseInt(value) || 0
                      : value,
                }
              : attr
          );
          return { ...v, attributes: updatedAttributes };
        }
        return v;
      })
    );
  };

  const addVariant = () => {
    setCurrentVariants((prev) => [
      ...prev,
      {
        tempId: nanoid(), // Use nanoid for temporary ID on frontend
        id: null, // Signals backend this is a NEW variant (ID is null)
        color: "",
        sku: "",
        attributes: [],
        images: [],
        // Placeholder image files/deletion logic can be added here
      },
    ]);
  };

  const deleteVariant = (variantIdToDelete, tempId) => {
  if (window.confirm("Are you sure you want to delete this variant?")) {
    const variantToDelete = currentVariants.find(v => v.tempId === tempId);
    if (variantToDelete) {
      const imagesToDelete = variantToDelete.images
        .filter(img => !img.isNew)
        .map(img => img.url);
      if (imagesToDelete.length > 0) {
        setDeletedVariantImages(prev => [...prev, ...imagesToDelete]);
      }
    }
    if (variantIdToDelete) {
      setDeletedVariants((prev) => [...prev, variantIdToDelete]);
    }
    setCurrentVariants((prev) => prev.filter((v) => v.tempId !== tempId));
  }
};

  const addSizeToVariant = (variantTempId) => {
    const newSize = prompt("Enter new size name (e.g., L, XL):");
    if (newSize) {
      setCurrentVariants((prev) =>
        prev.map((v) =>
          v.tempId === variantTempId
            ? {
                ...v,
                attributes: [
                  ...v.attributes,
                  {
                    name: newSize.toUpperCase(),
                    adjustment: 0.0,
                    stock: 0,
                  },
                ],
              }
            : v
        )
      );
    }
  };

  const deleteSizeFromVariant = (variantTempId, sizeName) => {
    setCurrentVariants((prev) =>
      prev.map((v) =>
        v.tempId === variantTempId
          ? {
              ...v,
              attributes: v.attributes.filter((attr) => attr.name !== sizeName),
            }
          : v
      )
    );
  };

  // --- Change Handlers for Images (Original Handlers) ---

  const handleNewProductImages = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.map((file) => ({
      id: nanoid(),
      url: URL.createObjectURL(file),
      file: file,
      isNew: true,
      fieldname: "productImages",
    }));
    setProductImages((prev) => [...prev, ...newImages]);
  };

  const deleteProductImage = (imageId, imageUrl, isNew) => {
    if (isNew) {
      setProductImages((prev) => prev.filter((img) => img.id !== imageId));
      URL.revokeObjectURL(imageUrl);
    } else {
      if (
        window.confirm("Are you sure you want to delete this existing image?")
      ) {
        setDeletedImages((prev) => [...prev, imageUrl]);
        setProductImages((prev) => prev.filter((img) => img.id !== imageId));
      }
    }
  };

  const handleNewVariantImages = (e, variantTempId, variantIndex) => {
    const files = Array.from(e.target.files);

    setCurrentVariants((prev) =>
      prev.map((v, i) => {
        if (v.tempId === variantTempId) {
          const newVariantImages = files.map((file) => ({
            id: nanoid(),
            url: URL.createObjectURL(file),
            file: file,
            isNew: true,
            type: "other",
            fieldname: `variant-${variantIndex}-${nanoid(4)}`,
          }));
          return { ...v, images: [...v.images, ...newVariantImages] };
        }
        return v;
      })
    );
  };


  // --- Submission Handler (Original Handler) ---

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    const formData = new FormData();
    setIsSubmitting(true);
    setMessage("");
    setError("");

    // 1. Append Base Details
    Object.keys(productDetails).forEach((key) => {
      if (productDetails[key] !== null) {
        formData.append(key, productDetails[key]);
      }
    });

    // 2. Append Deleted Product Images (URLs)
    if (deletedImages.length) {
      formData.append("deleted_images", JSON.stringify(deletedImages));
    }

    // 3. Append Deleted Variants (IDs)
    if (deletedVariants.length) {
      formData.append("deleted_variants", JSON.stringify(deletedVariants));
    }

    // 4. Append Deleted Variant Images (URLs)
    if (deletedVariantImages.length) {
      formData.append(
        "deleted_variant_images",
        JSON.stringify(deletedVariantImages)
      );
    }

    // 5. Append Variant Data Payload
    const variantsPayload = currentVariants.map((v) => {
      // Find all image files associated with this variant (handled below in step 8)

      return {
        id: v.id || null, // Important: ID is null for new variants, or actual ID for existing
        color: v.color,
        sku: v.sku,
        sizes: v.attributes.map((attr) => ({
          name: attr.name,
          adjustment: attr.adjustment,
          stock: attr.stock,
        })),
      };
    });
    formData.append("variants", JSON.stringify(variantsPayload));

    // 6. Append Group Visibility (Replacement logic)
    const visibilityPayload = groupVisibility.map(
      ({ group_id, is_visible }) => ({
        group_id,
        is_visible,
      })
    );
    formData.append("group_visibility", JSON.stringify(visibilityPayload));

    // 7. Append Image Files (New Product Images)
    const newProductImageFiles = productImages.filter((img) => img.isNew);
    newProductImageFiles.forEach((img) => {
      formData.append(img.fieldname, img.file); // fieldname is 'productImages'
    });

    // 8. Append Image Files (New Variant Images)
    currentVariants.forEach((v, variantIndex) => {
      v.images
        .filter((img) => img.isNew)
        .forEach((img) => {
          // Fieldname must match backend expectation: variant-index-type/nanoid
          formData.append(
            `variant-${variantIndex}-${img.type || "other"}`,
            img.file
          );
        });
    });

    // 9. API Call
    try {
      const url = `https://neil-backend-1.onrender.com/products/edit/${id}`;
      await axios.patch(url, formData, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "multipart/form-data", // Necessary for file uploads
        },
      });

      setMessage("✅ Product updated successfully!");
      // Re-fetch data to reflect latest changes from DB
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update product.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Render Block Helpers (Original Helpers) ---

  if (loading)
    return (
      // ... (Loading Spinner UI) ...
      <Row style={{ height: "100vh" }}>
        <Col
          xs={12}
          className="d-flex justify-content-center align-items-center"
        >
          <Spinner animation="border" variant="primary" />
        </Col>
      </Row>
    );

  if (error && !isSubmitting)
    return (
      // ... (Error UI) ...
      <Alert variant="danger">{error}</Alert>
    );

  if (!productDetails) return null;

  const customizeProduct = ()=>{
    navigate(`/admin/products/${id}/customize`)
  }

  const handleDeleteLogoPosition = async (positionId) => {
  if (!window.confirm("Delete this logo position?")) return;

  try {
    await axios.delete(
      `https://neil-backend-1.onrender.com/custom-product/${positionId}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    fetchData();
  } catch (err) {
    console.error(err);
    alert("Failed to delete position");
  }
};


  return (
    <>
      <TopBar />
      <Row className="g-0">
        <Col xs={2}>
          <Sidebar />
        </Col>
        <Col xs={10} className="main-content px-4 py-3">
          <Container fluid className="form-box">
            {/* --- Header Section with Title, Messages, and Actions --- */}
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h3 className="fw-bold text-dark mb-0">
                <FaEdit className="me-2 text-primary" />
                Editing Product: {productDetails.title}
              </h3>
              <div className="d-flex align-items-center">
                {/* Status Messages */}
                {message && (
                  <Alert
                    variant="success"
                    className="p-2 me-2 mb-0 d-inline-block fade show"
                  >
                    {message}
                  </Alert>
                )}
                {error && (
                  <Alert
                    variant="danger"
                    className="p-2 me-2 mb-0 d-inline-block fade show"
                  >
                    {error}
                  </Alert>
                )}
                <Button
                  variant="secondary"
                  className="me-2"
                  onClick={() => navigate(-1)}
                >
                  Back
                </Button>
                <Button
                  className="btn-info me-2 text-white"
                  onClick={customizeProduct}
                >
                  Customize
                </Button>
                <Button
                  variant="primary"
                  onClick={handleUpdate}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                      className="me-1"
                    />
                  ) : (
                    <FaSave className="me-1" />
                  )}
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>

            <Form onSubmit={handleUpdate}>
              <Row>
                {/* --- Left Column: Product Details, Prices, and Visibility --- */}
                <Col lg={4}>
                  {/* Card 1: Product Overview */}
                  <Card className="shadow-sm mb-4 border-0">
                    <Card.Header className="bg-light fw-semibold">
                      Product Overview
                    </Card.Header>
                    <Card.Body>
                      <Form.Group className="mb-3">
                        <Form.Label>Title</Form.Label>
                        <Form.Control
                          name="title"
                          value={productDetails.title}
                          onChange={handleDetailChange}
                        />
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Label>Description</Form.Label>
                        <Form.Control
                          as="textarea"
                          name="description"
                          rows={3}
                          value={productDetails.description}
                          onChange={handleDetailChange}
                        />
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Label>SKU</Form.Label>
                        <Form.Control
                          name="sku"
                          value={productDetails.sku}
                          onChange={handleDetailChange}
                        />
                      </Form.Group>
                      <Row>
                        <Col>
                          <Form.Group className="mb-3">
                            <Form.Label>Base Price</Form.Label>
                            <InputGroup>
                              <InputGroup.Text>$</InputGroup.Text>
                              <Form.Control
                                name="price"
                                type="number"
                                step="0.01"
                                value={productDetails.price}
                                onChange={handleDetailChange}
                              />
                            </InputGroup>
                          </Form.Group>
                        </Col>
                        {user?.role === "Super Admin" && (
                          <Col>
                            <Form.Group className="mb-3">
                              <Form.Label>Actual Price</Form.Label>
                              <InputGroup>
                                <InputGroup.Text>$</InputGroup.Text>
                                <Form.Control
                                  name="actual_price"
                                  value={productDetails.actual_price}
                                  readOnly
                                  className="bg-light"
                                />
                              </InputGroup>
                            </Form.Group>
                          </Col>
                        )}
                      </Row>
                      <Form.Group className="mb-0">
                        <Form.Label>Status</Form.Label>
                        <Form.Control value={"Active"} readOnly className="bg-success text-white fw-bold" />
                      </Form.Group>
                    </Card.Body>
                  </Card>

                  {/* Card 2: Categorization & Visibility */}
                  <Card className="shadow-sm mb-4 border-0">
                    <Card.Header className="bg-light fw-semibold">
                      <FaEye className="me-1" /> Categorization & Visibility
                    </Card.Header>
                    <Card.Body>
                      {/* Category Dropdowns */}
                      <Form.Group className="mb-3">
                        <Form.Label>Category</Form.Label>
                        <Form.Select
                          name="category"
                          value={productDetails.category || ""}
                          onChange={(e) => {
                            const selectedCategoryId = e.target.value;
                            setProductDetails((prev) => ({
                              ...prev,
                              category: selectedCategoryId,
                              sub_cat: "",
                            }));
                          }}
                        >
                          <option value="">Select Category</option>
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.title}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Label>Sub Category</Form.Label>
                        <Form.Select
                          name="sub_cat"
                          value={productDetails.sub_cat || ""}
                          onChange={handleDetailChange}
                          disabled={!productDetails.category}
                        >
                          <option value="">Select Subcategory</option>
                          {subCategories
                            .filter((sub) => sub.category_id === Number(productDetails.category))
                            .map((sub) => (
                              <option key={sub.id} value={sub.id}>
                                {sub.title}
                              </option>
                            ))}
                        </Form.Select>
                      </Form.Group>

                      <hr className="my-3" />

                      {/* Group Visibility */}
                      <h6 className="mb-2">Group Access:</h6>
                      <div className="d-flex flex-wrap gap-3">
                        {groupVisibility.map((g) => (
                          <Form.Check
                            key={g.group_id}
                            type="checkbox"
                            id={`group-check-${g.group_id}`}
                            label={g.title}
                            checked={g.is_visible}
                            onChange={() =>
                              setGroupVisibility((prev) =>
                                prev.map((item) =>
                                  item.group_id === g.group_id
                                    ? {
                                        ...item,
                                        is_visible: !item.is_visible,
                                      }
                                    : item
                                )
                              )
                            }
                          />
                        ))}
                      </div>
                    </Card.Body>
                  </Card>
                </Col>

                {/* --- Right Column: Images and Variants --- */}
                <Col lg={8}>
                  {/* Card 3: Product Images */}
                  <Card className="shadow-sm mb-4 border-0">
                    <Card.Header className="bg-light fw-semibold d-flex justify-content-between align-items-center">
                      Product Images ({productImages.length})
                      <Form.Group className="mb-0">
                        <Form.Label
                          htmlFor="productImageInput"
                          className="btn btn-sm btn-outline-primary mb-0"
                          style={{ cursor: 'pointer' }}
                        >
                          <FaCamera className="me-1" /> Add Images
                        </Form.Label>
                        <Form.Control
                          id="productImageInput"
                          type="file"
                          multiple
                          hidden
                          onChange={handleNewProductImages}
                        />
                      </Form.Group>
                    </Card.Header>
                    <Card.Body>
                      <div className="d-flex flex-wrap gap-3">
                        {productImages.map((img) => (
                          <div
                            key={img.id}
                            className="position-relative"
                            style={{ width: "120px", height: "120px" }}
                          >
                            <img
                              src={img.url}
                              alt="Product"
                              className="rounded border w-100 h-100 object-fit-cover"
                            />
                            <Button
                              variant="danger"
                              size="sm"
                              className="position-absolute top-0 end-0 p-1"
                              style={{ zIndex: 10 }}
                              onClick={() =>
                                deleteProductImage(img.id, img.url, img.isNew)
                              }
                            >
                              <FaTrash size={12} />
                            </Button>
                            {img.isNew && (
                              <span className="position-absolute bottom-0 start-0 badge bg-info">
                                NEW
                              </span>
                            )}
                          </div>
                        ))}
                        {!productImages.length && (
                          <p className="text-muted mb-0">No images added. Upload key product photos here.</p>
                        )}
                      </div>
                    </Card.Body>
                  </Card>

                  {/* Card 4: Variants Management */}
                  <Card className="shadow-sm mb-4 border-0">
                    <Card.Header className="bg-light fw-semibold d-flex justify-content-between align-items-center">
                      Product Variants ({currentVariants.length})
                      <Button variant="success" size="sm" onClick={addVariant}>
                        <FaPlus className="me-1" /> Add New Variant
                      </Button>
                    </Card.Header>
                    <Card.Body>
                      <Accordion
                        defaultActiveKey={
                          currentVariants.length > 0
                            ? currentVariants[0]?.tempId
                            : null
                        }
                      >
                        {currentVariants.map((v, variantIndex) => (
                          <Accordion.Item eventKey={v.tempId} key={v.tempId}>
                            <Accordion.Header>
                              <div className="d-flex justify-content-between w-100 pe-3">
                                <div>
                                  <strong className="me-2">{v.color || "New Variant"}</strong>
                                  <span className="text-muted small">
                                    SKU: {v.sku || "N/A"}
                                  </span>
                                  {v.id ? (
                                    <span className="ms-3 badge bg-light text-secondary">
                                      ID: {v.id}
                                    </span>
                                  ) : (
                                    <span className="ms-3 badge bg-success">NEW</span>
                                  )}
                                </div>
                              </div>
                            </Accordion.Header>
                            <Accordion.Body>
                              {/* Variant Details (Color, SKU) */}
                              <Row className="mb-3">
                                <Col md={6}>
                                  <Form.Group>
                                    <Form.Label>Color/Name</Form.Label>
                                    <Form.Control
                                      value={v.color}
                                      onChange={(e) =>
                                        handleVariantChange(
                                          v.tempId,
                                          "color",
                                          e.target.value
                                        )
                                      }
                                    />
                                  </Form.Group>
                                </Col>
                                <Col md={6}>
                                  <Form.Group>
                                    <Form.Label>Variant SKU</Form.Label>
                                    <Form.Control
                                      value={v.sku}
                                      onChange={(e) =>
                                        handleVariantChange(
                                          v.tempId,
                                          "sku",
                                          e.target.value
                                        )
                                      }
                                    />
                                  </Form.Group>
                                </Col>
                              </Row>

                              {/* Variant Sizes/Attributes */}
                              <h6 className="mb-2 mt-4 border-top pt-3 d-flex justify-content-between align-items-center">
                                Size & Pricing Attributes
                                <Button
                                  variant="outline-info"
                                  size="sm"
                                  onClick={() => addSizeToVariant(v.tempId)}
                                >
                                  <FaPlus size={12} className="me-1" /> Add Size
                                </Button>
                              </h6>
                              {v.attributes?.length > 0 ? (
                                <Table striped bordered hover size="sm" className="align-middle">
                                  <thead>
                                    <tr>
                                      <th>Size</th>
                                      <th>Price Adjustment ($)</th>
                                      <th>Stock</th>
                                      <th className="text-center">Action</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {v.attributes.map((a) => (
                                      <tr key={a.name}>
                                        <td className="fw-semibold">{a.name}</td>
                                        <td>
                                          <Form.Control
                                            size="sm"
                                            type="number"
                                            step="0.01"
                                            value={a.adjustment}
                                            onChange={(e) =>
                                              handleSizeChange(
                                                v.tempId,
                                                a.name,
                                                "adjustment",
                                                e.target.value
                                              )
                                            }
                                          />
                                        </td>
                                        <td>
                                          <Form.Control
                                            size="sm"
                                            type="number"
                                            value={a.stock}
                                            onChange={(e) =>
                                              handleSizeChange(
                                                v.tempId,
                                                a.name,
                                                "stock",
                                                e.target.value
                                              )
                                            }
                                          />
                                        </td>
                                        <td className="text-center">
                                          <Button
                                            variant="outline-danger"
                                            size="sm"
                                            onClick={() =>
                                              deleteSizeFromVariant(
                                                v.tempId,
                                                a.name
                                              )
                                            }
                                          >
                                            <FaTrash size={12} />
                                          </Button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </Table>
                              ) : (
                                <Alert variant="light" className="text-center">
                                  No sizes added. Click 'Add Size' to define stock and pricing for this variant.
                                </Alert>
                              )}

                              {/* Variant Images */}
                              <h6 className="mb-2 mt-4 border-top pt-3 d-flex justify-content-between align-items-center">
                                Variant Images ({v.images.length})
                                <Form.Group className="mb-0">
                                  <Form.Label
                                    htmlFor={`variantImageInput-${v.tempId}`}
                                    className="btn btn-sm btn-outline-secondary mb-0"
                                    style={{ cursor: 'pointer' }}
                                  >
                                    <FaCamera className="me-1" /> Add Images
                                  </Form.Label>
                                  <Form.Control
                                    id={`variantImageInput-${v.tempId}`}
                                    type="file"
                                    multiple
                                    hidden
                                    onChange={(e) =>
                                      handleNewVariantImages(
                                        e,
                                        v.tempId,
                                        variantIndex
                                      )
                                    }
                                  />
                                </Form.Group>
                              </h6>

                              <div className="d-flex flex-wrap gap-3">
                                {v.images.map((img) => (
                                  <div
                                    key={img.id}
                                    className="position-relative p-1 border rounded"
                                    style={{ width: 120, minHeight: 140 }}
                                  >
                                    <img
                                      src={img.url}
                                      alt={img.type}
                                      className="w-100 object-fit-cover rounded"
                                      style={{ height: 80 }}
                                    />

                                    {/* Type Selector for new images */}
                                    <Form.Select
                                      size="sm"
                                      value={img.type || "other"}
                                      onChange={(e) => {
                                        const newType = e.target.value;
                                        setCurrentVariants((prev) =>
                                          prev.map((variant) => {
                                            if (variant.tempId === v.tempId) {
                                              return {
                                                ...variant,
                                                images: variant.images.map((i) =>
                                                  i.id === img.id ? { ...i, type: newType } : i
                                                ),
                                              };
                                            }
                                            return variant;
                                          })
                                        );
                                      }}
                                      className="mt-1"
                                    >
                                      <option value="front">Front</option>
                                      <option value="back">Back</option>
                                      <option value="left">Left</option>
                                      <option value="right">Right</option>
                                      <option value="other">Other</option>
                                    </Form.Select>


                                    {/* Delete Button */}
                                    <Button
                                      variant="danger"
                                      size="sm"
                                      className="position-absolute top-0 end-0 p-1 rounded-circle"
                                      style={{ transform: 'translate(50%, -50%)', zIndex: 10 }}
                                      onClick={() => {
                                        if (img.isNew) {
                                          // Delete new image locally
                                          setCurrentVariants((prev) =>
                                            prev.map((variant) =>
                                              variant.tempId === v.tempId
                                                ? {
                                                    ...variant,
                                                    images: variant.images.filter((i) => i.id !== img.id),
                                                  }
                                                : variant
                                            )
                                          );
                                          URL.revokeObjectURL(img.url); // Free memory
                                        } else {
                                          // Delete existing variant image
                                          if (
                                            window.confirm(
                                              "Are you sure you want to delete this existing variant image?"
                                            )
                                          ) {
                                            setCurrentVariants((prev) =>
                                              prev.map((variant) =>
                                                variant.tempId === v.tempId
                                                  ? {
                                                      ...variant,
                                                      images: variant.images.filter((i) => i.id !== img.id),
                                                    }
                                                  : variant
                                              )
                                            );
                                            // Track the URL for backend deletion
                                            setDeletedVariantImages((prev) => [...prev, img.url]);
                                          }
                                        }
                                      }}
                                    >
                                      <FaTrash size={10} />
                                    </Button>


                                    {/* Badge for new images */}
                                    {img.isNew && (
                                      <span className="position-absolute top-0 start-0 badge bg-info">
                                        NEW
                                      </span>
                                    )}
                                  </div>
                                ))}
                                {!v.images.length && <p className="text-muted">No images for this variant.</p>}
                              </div>


                              {/* Logo Position List (Separated for clarity) */}
                              <div className="mt-4 border-top pt-3">
                                <h6 className="mb-2">Logo Positions ({v.placements?.length || 0})</h6>

                                {(!v.placements || v.placements.length === 0) && (
                                  <Alert variant="light" className="text-center">
                                    No logo positions added for this variant. Use the 'Customize' button above to manage them.
                                  </Alert>
                                )}

                                {v.placements?.map((pos) => (
                                  <div
                                    key={pos.id}
                                    className="d-flex justify-content-between align-items-start border rounded p-3 mb-2 bg-light"
                                  >
                                    <Row className="flex-grow-1">
                                      <Col md={3}>
                                        <strong>Name:</strong> {pos.name}
                                        <div className="small text-muted">Logo Variant: {pos.logo.title}</div>
                                      </Col>
                                      <Col md={3}>
                                        <strong>Placement:</strong> {pos.name}
                                        <div className="small text-muted">Z-Index: {pos.z_index}</div>
                                      </Col>
                                      <Col md={3}>
                                        <strong>Position/Size:</strong>
                                        <div className="small text-muted">X: {pos.x}, Y: {pos.y}</div>
                                        <div className="small text-muted">W: {pos.width}, H: {pos.height}</div>
                                      </Col>
                                      <Col md={2}>
                                        <strong>Logo Preview:</strong>
                                        <img
                                          src={pos.logo?.url}
                                          alt={pos.logo?.title || "logo"}
                                          width={40}
                                          height={40}
                                          style={{ objectFit: "contain", border: '1px solid #ccc' }}
                                          className="ms-2 rounded"
                                        />
                                      </Col>
                                    </Row>

                                    <Button
                                      variant="outline-danger"
                                      size="sm"
                                      className="ms-3"
                                      onClick={() => handleDeleteLogoPosition(pos.id)}
                                    >
                                      <FaTrash size={12} />
                                    </Button>
                                  </div>
                                ))}
                              </div>


                              {/* Variant Footer (Delete Button) */}
                              <div className="text-end mt-4 border-top pt-3">
                                <Button
                                  variant="danger"
                                  size="sm"
                                  onClick={() => deleteVariant(v.id, v.tempId)}
                                >
                                  <FaTrash className="me-1" /> Delete Variant
                                </Button>
                              </div>
                            </Accordion.Body>
                          </Accordion.Item>
                        ))}
                        {!currentVariants.length && (
                          <Alert variant="info" className="text-center my-3">
                            No variants yet. Click 'Add New Variant' to start defining product options.
                          </Alert>
                        )}
                      </Accordion>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
              {/* Final Save Button (Moved outside the two columns for prominence) */}
              <div className="text-end mt-3 pb-4">
                  <Button
                      variant="primary"
                      onClick={handleUpdate}
                      disabled={isSubmitting}
                      size="lg"
                  >
                      {isSubmitting ? (
                          <Spinner
                              as="span"
                              animation="border"
                              size="sm"
                              role="status"
                              aria-hidden="true"
                              className="me-1"
                          />
                      ) : (
                          <FaSave className="me-1" />
                      )}
                      {isSubmitting ? "Saving..." : "Save All Changes"}
                  </Button>
              </div>
            </Form>
          </Container>
        </Col>
      </Row>
    </>
  );
}

export default EditProduct;