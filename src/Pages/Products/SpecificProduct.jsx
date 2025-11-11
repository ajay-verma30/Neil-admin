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
import { FaTrash, FaPlus, FaCamera, FaSave, FaEdit } from "react-icons/fa";
import { nanoid } from "nanoid"; // You might need to install nanoid if not available

// Helper to format currency
const formatPrice = (price) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    price
  );

// Helper to safely parse numbers
const safeParseFloat = (value) => {
  const num = parseFloat(value);
  return isNaN(num) ? 0.0 : num;
};

// =========================================================================
// ✏️ EDIT PRODUCT COMPONENT
// =========================================================================
function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { accessToken, user } = useContext(AuthContext);

  // --- Core State ---
  const [productDetails, setProductDetails] = useState(null); // Base fields: title, sku, price, etc.
  const [currentVariants, setCurrentVariants] = useState([]); // Array of variants (with sizes/attributes)
  const [productImages, setProductImages] = useState([]); // [{id, url, file, isNew}]
  const [deletedImages, setDeletedImages] = useState([]); // URLs/IDs of images to delete
  const [deletedVariants, setDeletedVariants] = useState([]); // IDs of variants to delete

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
    console.error(err);
    setError("Failed to fetch product details.");
  } finally {
    setLoading(false);
  }
}, [accessToken, id]);


  useEffect(() => {
    if (accessToken && id) fetchData();
  }, [accessToken, id, fetchData]);

  // --- Change Handlers for Base Product ---

  const handleDetailChange = (e) => {
    const { name, value } = e.target;
    setProductDetails((prev) => ({ ...prev, [name]: value }));
  };

  // --- Change Handlers for Variants ---

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
      // Only add to deletedVariants list if it has an actual DB ID
      if (variantIdToDelete) {
        setDeletedVariants((prev) => [...prev, variantIdToDelete]);
      }
      // Filter out from the current list using the tempId
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

  // --- Change Handlers for Images ---

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


  // --- Submission Handler ---

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

    // 2. Append Deleted Images (URLs)
    if (deletedImages.length) {
      formData.append("deleted_images", JSON.stringify(deletedImages));
    }

    // 3. Append Deleted Variants (IDs)
    if (deletedVariants.length) {
      formData.append("deleted_variants", JSON.stringify(deletedVariants));
    }

    const variantsPayload = currentVariants.map((v) => {
      // Find all image files associated with this variant
      const newVariantImageFiles = v.images.filter((img) => img.isNew);

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

    // 5. Append Group Visibility (Replacement logic)
    const visibilityPayload = groupVisibility.map(
      ({ group_id, is_visible }) => ({
        group_id,
        is_visible,
      })
    );
    formData.append("group_visibility", JSON.stringify(visibilityPayload));

    // 6. Append Image Files (New Product Images)
    const newProductImageFiles = productImages.filter((img) => img.isNew);
    newProductImageFiles.forEach((img) => {
      formData.append(img.fieldname, img.file); // fieldname is 'productImages'
    });

    // 7. Append Image Files (New Variant Images)
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

    // 8. API Call
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
      console.error("Update error:", err.response ? err.response.data : err);
      setError(err.response?.data?.message || "Failed to update product.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Render Block ---

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

  return (
    <>
      <TopBar />
      <Row className="g-0">
        <Col xs={2}>
          <Sidebar />
        </Col>
        <Col xs={10} className="main-content px-4 py-3">
          <Container fluid className="form-box">
            <Card className="shadow-sm border-0">
              <Card.Body>
                {/* Header */}
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h4 className="fw-semibold text-dark mb-0">
                    Edit Product: {productDetails.title}
                  </h4>
                  <div>
                    {/* Status Messages */}
                    {message && (
                      <Alert
                        variant="success"
                        className="p-2 me-2 mb-0 d-inline-block"
                      >
                        {message}
                      </Alert>
                    )}
                    {error && (
                      <Alert
                        variant="danger"
                        className="p-2 me-2 mb-0 d-inline-block"
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

                {/* Main Form */}
                <Form onSubmit={handleUpdate}>
                  {/* === Group Visibility === */}
                  <Accordion defaultActiveKey="0" className="mb-4">
                    <Accordion.Item eventKey="0">
                      <Accordion.Header>👀 Group Visibility</Accordion.Header>
                      <Accordion.Body>
                        <p className="text-muted small">
                          Select groups that can view this product.
                        </p>
                        <div className="d-flex flex-wrap gap-3 mt-2">
                          {groupVisibility.map((g) => (
                            <Form.Check
                              key={g.group_id}
                              type="checkbox"
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
                      </Accordion.Body>
                    </Accordion.Item>
                  </Accordion>

                  {/* === Product Info Fields === */}
                  <h5>Product Details</h5>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Title</Form.Label>
                        <Form.Control
                          name="title"
                          value={productDetails.title}
                          onChange={handleDetailChange}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={3}>
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
</Col>

<Col md={3}>
  <Form.Group className="mb-3">
    <Form.Label>Sub Category</Form.Label>
    <Form.Select
      name="sub_cat"
      value={productDetails.sub_cat || ""}
      onChange={handleDetailChange}
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
</Col>

                  </Row>

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

                  <Row>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>SKU</Form.Label>
                        <Form.Control
                          name="sku"
                          value={productDetails.sku}
                          onChange={handleDetailChange}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={2}>
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
                      <Col md={2}>
                        <Form.Group className="mb-3">
                          <Form.Label>Actual Price</Form.Label>
                          <InputGroup>
                            <InputGroup.Text>$</InputGroup.Text>
                            <Form.Control
                              name="actual_price"
                              value={productDetails.actual_price}
                              readOnly
                            />
                          </InputGroup>
                        </Form.Group>
                      </Col>
                    )}

                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Status</Form.Label>
                        <Form.Control value={"Active"} readOnly />{" "}
                        {/* Assuming isActive update is handled separately */}
                      </Form.Group>
                    </Col>
                  </Row>

                  {/* === Product Images === */}
                  <div className="mt-4 border-top pt-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5>Product Images ({productImages.length})</h5>
                      <Form.Group className="mb-0">
                        <Form.Label
                          htmlFor="productImageInput"
                          className="btn btn-sm btn-outline-primary mb-0"
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
                    </div>

                    <div className="d-flex flex-wrap gap-3 mt-2">
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
                        <p className="text-muted">No images added.</p>
                      )}
                    </div>
                  </div>

                  {/* === Variants Section === */}
                  <div className="mt-5 border-top pt-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5>Variants ({currentVariants.length})</h5>
                      <Button variant="success" size="sm" onClick={addVariant}>
                        <FaPlus className="me-1" /> Add Variant
                      </Button>
                    </div>

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
                            {v.color || "New Variant"} — {v.sku || "No SKU"}
                            {v.id ? (
                              <span className="text-muted small ms-2">
                                (ID: {v.id})
                              </span>
                            ) : (
                              <span className="ms-2 badge bg-success">NEW</span>
                            )}
                          </Accordion.Header>
                          <Accordion.Body>
                            <Row>
                              <Col md={6}>
                                <Form.Group className="mb-3">
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
                                <Form.Group className="mb-3">
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
                            <div className="d-flex justify-content-between align-items-center mt-3 mb-2">
                              <h6 className="mb-0">
                                Size & Pricing Attributes
                              </h6>
                              <Button
                                variant="outline-info"
                                size="sm"
                                onClick={() => addSizeToVariant(v.tempId)}
                              >
                                <FaPlus size={12} className="me-1" /> Add Size
                              </Button>
                            </div>
                            {v.attributes?.length > 0 && (
                              <Table striped bordered size="sm">
                                <thead>
                                  <tr>
                                    <th>Size</th>
                                    <th>Price Adjustment ($)</th>
                                    <th>Stock</th>
                                    <th>Action</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {v.attributes.map((a) => (
                                    <tr key={a.name}>
                                      <td>{a.name}</td>
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
                                      <td>
                                        <Button
                                          variant="danger"
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
                            )}

                            {/* Variant Images */}
                            <div className="d-flex justify-content-between align-items-center mt-4 mb-2 border-top pt-3">
                              <h6 className="mb-0">
                                Variant Images ({v.images.length})
                              </h6>
                              <Form.Group className="mb-0">
                                <Form.Label
                                  htmlFor={`variantImageInput-${v.tempId}`}
                                  className="btn btn-sm btn-outline-secondary mb-0"
                                >
                                  <FaCamera className="me-1" /> Add Variant
                                  Images
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
                            </div>

                            <div className="d-flex flex-wrap gap-3">
                              {v.images.map((img) => (
  <div key={img.id} className="position-relative" style={{ width: 100, height: 100 }}>
    <img
      src={img.url}
      alt={img.type}
      className="rounded border w-100 h-100 object-fit-cover"
    />
    
    {/* Type Selector */}
    {img.isNew && (
      <Form.Select
        size="sm"
        value={img.type || "front"}
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
      </Form.Select>
    )}

    {img.isNew && (
      <span className="position-absolute top-0 start-0 badge bg-info">NEW</span>
    )}
  </div>
))}

                              {!v.images.length && (
                                <p className="text-muted">
                                  No images for this variant.
                                </p>
                              )}
                            </div>

                            <div className="text-end mt-3 border-top pt-3">
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
                    </Accordion>
                  </div>
                  <Button
                    variant="primary"
                    onClick={handleUpdate}
                    disabled={isSubmitting}
                    style={{ marginTop: "20px" }}
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
                    <br />
                  </Button>
                </Form>
              </Card.Body>
            </Card>
          </Container>
        </Col>
      </Row>
    </>
  );
}

export default EditProduct;
