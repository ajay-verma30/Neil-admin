import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import html2canvas from "html2canvas";
import {
  Container,
  Row,
  Col,
  Card,
  Spinner,
  Alert,
  Badge,
  Button,
  Form,
} from "react-bootstrap";
import TopBar from "../Components/TopBar/TopBar";
import { AuthContext } from "../context/AuthContext";

function UserProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { accessToken, user, addToCart } = useContext(AuthContext);

  const [product, setProduct] = useState(null);
  const [logos, setLogos] = useState([]);
  const [selectedVariantId, setSelectedVariantId] = useState(null);
  const [selectedView, setSelectedView] = useState("front");
  const [selectedLogoId, setSelectedLogoId] = useState(null);
  const [selectedLogoVariantId, setSelectedLogoVariantId] = useState(null);
  const [selectedPlacementIds, setSelectedPlacementIds] = useState([]);
  const [logoSize, setLogoSize] = useState(100);
  const [mainImageUrl, setMainImageUrl] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState("");
  const [quantities, setQuantities] = useState({
    xs: 0, s: 0, m: 0, l: 0, xl: 0, xxl: 0,
  });

  const allSizes = Object.keys(quantities);

  const placementPositions = {
    front: { top: 30, left: 45, width: 20, height: 20 },
    back: { top: 38, left: 50, width: 20, height: 20 },
    "left chest": { top: 35, left: 38, width: 15, height: 15 },
    "right chest": { top: 35, left: 60, width: 15, height: 15 },
    "front chest": { top: 35, left: 48, width: 15, height: 15 },
    "left sleeve": { top: 40, left: 10, width: 10, height: 10 },
    "right sleeve": { top: 40, left: 90, width: 10, height: 10 },
    "lower back": { top: 70, left: 50, width: 20, height: 15 },
    "lower front": { top: 74, left: 48, width: 20, height: 15 },
  };

  // Fetch product + logos
  useEffect(() => {
    if (!id || !accessToken) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        const prodRes = await axios.get(`http://localhost:3000/products/${id}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const prod = prodRes.data.product;
        setProduct(prod);

        if (prod.variants?.length > 0) {
          const firstVariant = prod.variants[0];
          setSelectedVariantId(firstVariant.id);

          const frontImg =
            firstVariant.images?.find((i) => i.type?.toLowerCase() === "front") ||
            firstVariant.images?.[0];

          setMainImageUrl(frontImg?.url || prod.images?.[0]?.url || "");
        } else if (prod.images?.length > 0) {
          setMainImageUrl(prod.images[0].url);
        }

        const logosRes = await axios.get(`http://localhost:3000/logos/all-logos`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const valid = logosRes.data.filter((l) => l.variants?.length > 0);
        setLogos(valid);

        if (valid.length > 0) {
          setSelectedLogoId(valid[0].id);
          setSelectedLogoVariantId(valid[0].variants[0].id);
        }
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || "Failed to load product.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, accessToken]);

  const productVariant =
    product?.variants?.find((v) => String(v.id) === String(selectedVariantId)) || null;

  const selectedLogo =
    logos.find((l) => String(l.id) === String(selectedLogoId)) || null;

  const logoVariant =
    selectedLogo?.variants?.find((v) => String(v.id) === String(selectedLogoVariantId)) || null;

  const viewPlacements =
    logoVariant?.placements?.filter(
      (p) => p.view.toLowerCase() === selectedView.toLowerCase()
    ) || [];

  useEffect(() => {
    if (!productVariant) return;
    const img =
      productVariant.images?.find(
        (i) => i.type?.toLowerCase() === selectedView.toLowerCase()
      ) || productVariant.images?.[0];
    setMainImageUrl(img?.url || product?.images?.[0]?.url || "");
  }, [selectedView, productVariant, product]);

  const togglePlacement = (pid) => {
    setSelectedPlacementIds((prev) =>
      prev.includes(pid) ? prev.filter((p) => p !== pid) : [...prev, pid]
    );
  };

  const handleQuantityChange = (size, value) => {
    const quantity = Math.max(0, parseInt(value, 10) || 0);
    setQuantities((prev) => ({ ...prev, [size]: quantity }));
  };

  // ✅ Add to Cart Handler (fixed)
  const handleAddToCart = async () => {
    setMessage("");
    setIsProcessing(true);

    const totalQuantity = Object.values(quantities).reduce((a, b) => a + b, 0);
    if (totalQuantity === 0) {
      setMessage("⚠️ Please enter a quantity before adding to cart.");
      setIsProcessing(false);
      return;
    }
    if (!selectedVariantId || !selectedLogoVariantId || selectedPlacementIds.length === 0) {
      setMessage("⚠️ Please select a product variant, logo, and placement.");
      setIsProcessing(false);
      return;
    }

    try {
      const previewEl = document.getElementById("product-preview-area");
      if (!previewEl) throw new Error("Preview element not found.");

      const canvas = await html2canvas(previewEl, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
      });

      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
      const file = new File([blob], "custom_preview.png", { type: "image/png" });

      const formData = new FormData();
      formData.append("user_id", user?.id || "temporary_user");
      formData.append("product_variant_id", selectedVariantId);
      formData.append("logo_variant_id", selectedLogoVariantId);
      formData.append("placement_id", selectedPlacementIds[0]);
      formData.append("preview", file);

      const res = await axios.post("http://localhost:3000/customization/new", formData, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "multipart/form-data",
        },
      });

      const customization = res.data.customization;

      // ✅ Use the uploaded preview instead of base image
      const imageUrl = customization.preview
        ? `http://localhost:3000${customization.preview}`
        : mainImageUrl;

      const cartItem = {
        id: customization.id,
        product_id: product.id,
        title: product.title,
        image: imageUrl,
        quantity: totalQuantity,
        price: product.price,
        sizes: quantities,
      };

      console.log("🛒 Adding to Cart:", cartItem);
      addToCart(cartItem);

      setMessage(`✅ Customization saved and added to cart.`);
    } catch (err) {
      console.error("Customization/Cart Error:", err);
      const msg =
        err.message.includes("Preview element") ||
        err.response?.data?.message ||
        "❌ Failed to save customization or add to cart.";
      setMessage(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  // ✅ Loading / Error UI
  if (loading)
    return (
      <div className="d-flex vh-100 justify-content-center align-items-center bg-light">
        <Spinner animation="border" variant="primary" />
      </div>
    );

  if (error)
    return (
      <Container className="py-5 text-center">
        <Alert variant="danger">{error}</Alert>
        <Button variant="secondary" onClick={() => navigate(-1)}>
          ← Go Back
        </Button>
      </Container>
    );

  if (!product)
    return (
      <Container className="py-5 text-center">
        <Alert variant="info">Product not found.</Alert>
        <Button variant="secondary" onClick={() => navigate(-1)}>
          ← Go Back
        </Button>
      </Container>
    );

  // ✅ Main UI
  return (
    <>
      <TopBar />
      <Container className="py-4">
        <Button variant="outline-secondary" size="sm" onClick={() => navigate(-1)} className="mb-3">
          ← Back to Products
        </Button>

        <Row>
          {/* =============== Product Preview =============== */}
          <Col md={5}>
            <Card className="shadow-sm border-0">
              <div
                id="product-preview-area"
                className="position-relative bg-light"
                style={{ aspectRatio: "1/1" }}
              >
                {mainImageUrl ? (
                  <img
                    src={mainImageUrl}
                    alt={product.title}
                    className="w-100 h-100 object-fit-contain"
                    crossOrigin="anonymous"
                  />
                ) : (
                  <div className="text-center text-muted p-5">No image</div>
                )}

                {logoVariant &&
                  selectedPlacementIds.map((pid) => {
                    const placement = logoVariant.placements.find(
                      (p) => String(p.id) === String(pid)
                    );
                    if (!placement) return null;
                    const coords =
                      placementPositions[placement.name.toLowerCase()] || placementPositions.front;
                    const width = coords.width * (logoSize / 100);
                    const height = coords.height * (logoSize / 100);
                    return (
                      <img
                        key={pid}
                        src={logoVariant.url}
                        alt={placement.name}
                        className="position-absolute"
                        crossOrigin="anonymous"
                        style={{
                          top: `${coords.top}%`,
                          left: `${coords.left}%`,
                          width: `${width}%`,
                          height: `${height}%`,
                          transform: "translate(-50%, -50%)",
                        }}
                      />
                    );
                  })}
              </div>

              {selectedPlacementIds.length > 0 && (
                <Card.Footer className="bg-light d-flex flex-wrap gap-1">
                  {selectedPlacementIds.map((pid) => {
                    const name =
                      logoVariant?.placements.find((p) => String(p.id) === String(pid))?.name || "";
                    return (
                      <Badge key={pid} bg="primary">
                        {name}
                      </Badge>
                    );
                  })}
                </Card.Footer>
              )}
            </Card>
          </Col>

          {/* =============== Controls / Details =============== */}
          <Col md={7}>
            <Card className="shadow-sm border-0 p-3">
              <h3>{product.title}</h3>
              <p className="text-muted mb-1">
                {product.category}
                {product.sub_cat && ` > ${product.sub_cat}`}
              </p>
              <h5 className="text-primary mb-2">${product.price}</h5>
              <p className="text-secondary small">
                {product.description || "No description available."}
              </p>

              {/* Variants */}
              {product.variants?.length > 0 && (
                <Form.Group className="mb-3">
                  <Form.Label>Variant</Form.Label>
                  <Form.Select
                    value={selectedVariantId || ""}
                    onChange={(e) => setSelectedVariantId(e.target.value)}
                  >
                    {product.variants.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.color} {v.size && `- ${v.size}`} {v.sku && `(${v.sku})`}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              )}

              {/* View */}
              {productVariant?.images?.length > 0 && (
                <Form.Group className="mb-3">
                  <Form.Label>View</Form.Label>
                  <Form.Select value={selectedView} onChange={(e) => setSelectedView(e.target.value)}>
                    {productVariant.images.map((img) => (
                      <option key={img.id} value={img.type || "view"}>
                        {(img.type || "View").toUpperCase()}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              )}

              {/* Logos */}
              {logos.length > 0 && (
                <Form.Group className="mb-3">
                  <Form.Label>Logo</Form.Label>
                  <Form.Select
                    value={selectedLogoId || ""}
                    onChange={(e) => setSelectedLogoId(e.target.value)}
                  >
                    {logos.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.title}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              )}

              {/* Logo Variants */}
              {selectedLogo?.variants?.length > 0 && (
                <div className="mb-3 d-flex flex-wrap gap-2">
                  {selectedLogo.variants.map((v) => (
                    <div
                      key={v.id}
                      onClick={() => setSelectedLogoVariantId(v.id)}
                      className={`p-1 border rounded ${
                        v.id === selectedLogoVariantId
                          ? "border-primary bg-light"
                          : "border-secondary"
                      }`}
                      style={{ cursor: "pointer", width: "70px", textAlign: "center" }}
                    >
                      <img
                        src={v.url}
                        alt={v.color}
                        style={{ width: "100%", height: "50px", objectFit: "contain" }}
                      />
                      <small>{v.color}</small>
                    </div>
                  ))}
                </div>
              )}

              {/* Placements */}
              {viewPlacements.length > 0 && (
                <div className="mb-3">
                  <strong>Placements:</strong>
                  <div className="d-flex flex-wrap gap-2 mt-2">
                    {viewPlacements.map((p) => (
                      <Button
                        key={p.id}
                        variant={
                          selectedPlacementIds.includes(p.id)
                            ? "primary"
                            : "outline-secondary"
                        }
                        size="sm"
                        onClick={() => togglePlacement(p.id)}
                      >
                        {p.name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Sizes */}
              <div className="size-orders">
                <h6>Sizes to Order</h6>
                <Form>
                  <Row className="g-2">
                    {allSizes.map((size) => (
                      <Col xs={2} key={size}>
                        <Form.Group>
                          <Form.Label className="text-uppercase small">{size}</Form.Label>
                          <Form.Control
                            type="number"
                            min="0"
                            placeholder="0"
                            value={quantities[size]}
                            onChange={(e) => handleQuantityChange(size, e.target.value)}
                          />
                        </Form.Group>
                      </Col>
                    ))}
                  </Row>
                </Form>
              </div>

              {/* Add to Cart */}
              <div className="d-flex gap-2 mt-4">
                <Button variant="primary" onClick={handleAddToCart} disabled={isProcessing}>
                  {isProcessing ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" /> Processing...
                    </>
                  ) : (
                    "Add to Cart"
                  )}
                </Button>
              </div>

              {message && (
                <Alert
                  variant={message.startsWith("✅") ? "success" : "danger"}
                  className="mt-3 small py-2"
                >
                  {message}
                </Alert>
              )}
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
}

export default UserProduct;
