import React, { useEffect, useState, useContext, useMemo, useRef } from "react";
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
import Footer from "./Footer";
import { AuthContext } from "../context/AuthContext";
import { CartContext } from "../context/CartContext";

function UserProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { accessToken, user } = useContext(AuthContext);
  const { addToCart } = useContext(CartContext);
  const previewRef = useRef(null);

  const [product, setProduct] = useState(null);
  const [logos, setLogos] = useState([]);
  const [selectedVariantId, setSelectedVariantId] = useState(null);
  const [selectedView, setSelectedView] = useState("front");
  const [selectedLogoId, setSelectedLogoId] = useState(null);
  const [selectedLogoVariantId, setSelectedLogoVariantId] = useState(null);
  const [selectedPlacementIds, setSelectedPlacementIds] = useState([]);
  const [mainImageUrl, setMainImageUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState("");
  const [quantities, setQuantities] = useState({});
  const [sizeAttributes, setSizeAttributes] = useState([]);
  const [previewDimensions, setPreviewDimensions] = useState({
    width: 0,
    height: 0,
  });

  const productVariant =
    product?.variants?.find(
      (v) => String(v.id) === String(selectedVariantId)
    ) || null;
  const selectedLogo =
    logos.find((l) => String(l.id) === String(selectedLogoId)) || null;
  const selectedLogoVariant =
    selectedLogo?.variants?.find(
      (v) => String(v.id) === String(selectedLogoVariantId)
    ) || null;
  const viewPlacements = productVariant?.placements || [];

  const allSizes = useMemo(
    () => sizeAttributes.map((attr) => attr.name.toLowerCase()),
    [sizeAttributes]
  );

  // Price calculation
  const { basePrice, totalPrice } = useMemo(() => {
    const price = Number(productVariant?.price ?? product?.price ?? 0);
    const finalPriceMap = sizeAttributes.reduce((acc, attr) => {
      acc[attr.name.toLowerCase()] = Number(attr.final_price);
      return acc;
    }, {});
    let calculatedTotalPrice = 0;
    Object.entries(quantities).forEach(([size, qty]) => {
      if (qty > 0) {
        const sizeFinalPrice = finalPriceMap[size.toLowerCase()] ?? price;
        calculatedTotalPrice += sizeFinalPrice * qty;
      }
    });
    return { basePrice: price, totalPrice: calculatedTotalPrice };
  }, [product, productVariant, quantities, sizeAttributes]);

  // Fetch product & logos
  useEffect(() => {
    if (!id || !accessToken) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        // Fetch product
        const prodRes = await axios.get(
          `https://neil-backend-1.onrender.com/products/${id}`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
        const prod = prodRes.data.product;
        setProduct(prod);

        if (prod.variants?.length > 0) {
          const firstVariant = prod.variants[0];
          setSelectedVariantId(firstVariant.id);
          setSizeAttributes(firstVariant.attributes || []);
          setQuantities(
            (firstVariant.attributes || []).reduce((acc, attr) => {
              acc[attr.name.toLowerCase()] = 0;
              return acc;
            }, {})
          );
          const frontImg =
            firstVariant.images?.find(
              (i) => i.type?.toLowerCase() === "front"
            ) || firstVariant.images?.[0];
          setMainImageUrl(frontImg?.url || prod.images?.[0]?.url || "");
        } else if (prod.images?.length > 0) {
          setMainImageUrl(prod.images[0].url);
        }

        // Fetch logos
        const logosRes = await axios.get(
          `https://neil-backend-1.onrender.com/logos/all-logos`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
        const validLogos = logosRes.data.filter((l) => l.variants?.length > 0);
        setLogos(validLogos);

        if (validLogos.length > 0) {
          setSelectedLogoId(validLogos[0].id);
          setSelectedLogoVariantId(validLogos[0].variants[0].id);
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load product.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, accessToken]);

  // Update main image based on view
  useEffect(() => {
    if (!product) return;
    let imgUrl = "";
    if (productVariant?.images?.length) {
      const match = productVariant.images.find(
        (i) => i?.type?.toLowerCase() === selectedView.toLowerCase()
      );
      imgUrl = match?.url || productVariant.images[0]?.url;
    } else if (product.images?.length) {
      imgUrl = product.images[0].url;
    }
    setMainImageUrl(imgUrl || "");
  }, [selectedView, productVariant, product]);

  // FIX START: Update preview dimensions with a deferred check
 useEffect(() => {
  const updateDimensions = () => {
    if (previewRef.current) {
      setPreviewDimensions({
        width: previewRef.current.offsetWidth,
        height: previewRef.current.offsetHeight,
      });
    }
  };

  const frame = requestAnimationFrame(updateDimensions);

  window.addEventListener("resize", updateDimensions);

  return () => {
    cancelAnimationFrame(frame);
    window.removeEventListener("resize", updateDimensions);
  };
}, [mainImageUrl, selectedVariantId]);


  const togglePlacement = (pid) => {
    setSelectedPlacementIds((prev) =>
      prev.includes(pid) ? prev.filter((p) => p !== pid) : [...prev, pid]
    );
  };

  const handleQuantityChange = (size, value) => {
    const qty = Math.max(0, parseInt(value, 10) || 0);
    setQuantities((prev) => ({ ...prev, [size]: qty }));
  };

  const handleAddToCart = async () => {
    setMessage("");
    setIsProcessing(true);

    const totalQuantity = Object.values(quantities).reduce((a, b) => a + b, 0);
    if (totalQuantity === 0) {
      setMessage("⚠️ Please enter a quantity before adding to cart.");
      setIsProcessing(false);
      return;
    }

    try {
      const previewEl = previewRef.current;
      if (!previewEl) throw new Error("Preview element not found.");

      const canvas = await html2canvas(previewEl, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
      });
      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/png")
      );
      const file = new File([blob], "custom_preview.png", {
        type: "image/png",
      });

      const formData = new FormData();
      formData.append("user_id", user?.id || "temporary_user");
      formData.append("product_variant_id", selectedVariantId);
      formData.append("logo_variant_id", selectedLogoVariantId || "");
      formData.append("placement_id", selectedPlacementIds[0] || "");
      formData.append("preview", file);

      const customizationRes = await axios.post(
        "https://neil-backend-1.onrender.com/customization/new",
        formData,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      const customization = customizationRes.data.customization;

      const cartItem = {
        id: customization.id,
        product_id: product.id,
        title: product.title,
        image: customization.preview_image_url,
        quantity: totalQuantity,
        customizations_id: customization.id,
        total_price: totalPrice.toFixed(2),
        sizes: Object.entries(quantities).reduce((acc, [size, qty]) => {
          if (qty > 0) {
            const attr = sizeAttributes.find(
              (a) => a.name.toLowerCase() === size
            );
            const sizePrice = attr ? Number(attr.final_price) : basePrice;
            acc[size] = {
              qty,
              price: sizePrice,
              subtotal: (sizePrice * qty).toFixed(2),
            };
          }
          return acc;
        }, {}),
      };

      await axios.post(
        "https://neil-backend-1.onrender.com/cart/add",
        {
          user_id: user.id,
          product_id: cartItem.product_id,
          title: cartItem.title,
          image: cartItem.image,
          customizations_id: cartItem.customizations_id,
          quantity: cartItem.quantity,
          sizes: cartItem.sizes,
          total_price: cartItem.total_price,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      addToCart(cartItem);
      setMessage("✅ Added to cart successfully.");
    } catch (err) {
      setMessage(err.response?.data?.message || "❌ Failed to add to cart.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper function to render placement with proper positioning
  const renderPlacement = (placement) => {
    if (!selectedPlacementIds.includes(placement.id)) return null;

    const { width, height } = previewDimensions;
    // Already fixed the dimension issue, but this check remains necessary
    if (width === 0 || height === 0) return null;

    let topPx, leftPx, widthPx, heightPx;

    // Check if using new percentage-based keys (preferred)
    if (
      placement.position_x_percent !== undefined &&
      placement.position_y_percent !== undefined
    ) {
      topPx = (placement.position_y_percent / 100) * height;
      leftPx = (placement.position_x_percent / 100) * width;
      widthPx = (placement.width_percent / 100) * width;
      heightPx = (placement.height_percent / 100) * height;
    } else {
      // FIX: Assuming the existing old keys are storing percentage values (like 54.2142)
      // to ensure correct scaling and positioning relative to the preview size.
      const px = placement.position_x || 0;
      const py = placement.position_y || 0;
      const w = placement.width || 100;
      const h = placement.height || 100;

      topPx = (py / 100) * height;
      leftPx = (px / 100) * width;
      widthPx = (w / 100) * width;
      heightPx = (h / 100) * height;
    }

    // Get logo URL from placement
    const logoUrl =
      placement.logo?.variants?.[0]?.url ||
      placement.logo?.url ||
      placement.logo_variant?.url ||
      placement.logo_url;

    if (!logoUrl) return null;

    return (
      <img
        key={placement.id}
        src={logoUrl}
        alt={placement.name}
        className="position-absolute"
        style={{
          top: `${topPx}px`,
          left: `${leftPx}px`,
          width: `${widthPx}px`,
          height: `${heightPx}px`,
          zIndex: placement.z_index || 1,
          objectFit: "contain",
          pointerEvents: "none",
        }}
        crossOrigin="anonymous"
      />
    );
  };

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

  return (
    <>
      <TopBar />
      <Container fluid className="py-4 px-3 px-md-4 form-box">
        <Button
          variant="outline-secondary"
          size="sm"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          ← Back to Products
        </Button>

        <Row className="g-4">
          {/* Preview */}
          <Col lg={4} md={4} className="d-flex">
            <Card className="shadow-sm border-0 w-100">
              <div
                ref={previewRef}
                className="position-relative bg-light"
                style={{ aspectRatio: "1/1", overflow: "hidden" }}
              >
                {mainImageUrl ? (
                 <img
  src={mainImageUrl}
  onLoad={() => {
    if (previewRef.current) {
      setPreviewDimensions({
        width: previewRef.current.offsetWidth,
        height: previewRef.current.offsetHeight,
      });
    }
  }}
  className="w-100 h-100"
  style={{ objectFit: "cover" }}
/>

                ) : (
                  <div className="text-center text-muted p-5 d-flex align-items-center justify-content-center h-100">
                    No image available
                  </div>
                )}

                {/* Render selected placements with proper positioning */}
                {viewPlacements.map((placement) =>
                  renderPlacement(placement)
                )}
              </div>

              {/* Placements Badges */}
              {selectedPlacementIds.length > 0 && (
                <Card.Footer className="bg-light">
                  <div className="d-flex flex-wrap gap-2">
                    {selectedPlacementIds.map((pid) => {
                      const placement = viewPlacements.find(
                        (p) => p.id === pid
                      );
                      return placement ? (
                        <Badge key={pid} bg="primary">
                          {placement.name}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                </Card.Footer>
              )}
            </Card>
          </Col>

          {/* Product Details */}
          <Col lg={7} md={6}>
            <Card className="shadow-sm border-0 p-4">
              <h2 className="mb-2">{product.title}</h2>
              <p className="text-muted mb-3">
                {product.category?.title} {">"} {product.sub_category?.title}
              </p>
              <h4 className="text-primary mb-3">
                $
                {Number(productVariant?.price || product?.price || 0).toFixed(
                  2
                )}
              </h4>
              {product.description && (
                <p className="text-secondary small mb-4">
                  {product.description}
                </p>
              )}

              <Row className="g-3 mb-4">
                {/* Variant */}
                {product.variants?.length > 0 && (
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label className="fw-bold">
                        Select Variant
                      </Form.Label>
                      <Form.Select
                        value={selectedVariantId}
                        onChange={(e) => setSelectedVariantId(e.target.value)}
                      >
                        {product.variants.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.color} {v.size && `- ${v.size}`}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                )}

                {/* View */}
                {productVariant?.images?.length > 0 && (
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label className="fw-bold">View</Form.Label>
                      <Form.Select
                        value={selectedView}
                        onChange={(e) => setSelectedView(e.target.value)}
                      >
                        {productVariant.images.map((img) => (
                          <option key={img.id} value={img.type}>
                            {(img.type || "View").toUpperCase()}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                )}

                {/* Logo */}
                {logos.length > 0 && (
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label className="fw-bold">Select Logo</Form.Label>
                      <Form.Select
                        value={selectedLogoId || ""}
                        onChange={(e) => setSelectedLogoId(e.target.value)}
                      >
                        <option value="">(No Logo)</option>
                        {logos.map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.title}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                )}
              </Row>

              {/* Logo Variants */}
              {selectedLogo?.variants?.length > 0 && (
                <div className="mb-4">
                  <Form.Label className="fw-bold d-block mb-2">
                    Logo Color
                  </Form.Label>
                  <div className="d-flex flex-wrap gap-2">
                    {selectedLogo.variants.map((l) => (
                      <div
                        key={l.id}
                        onClick={() => setSelectedLogoVariantId(l.id)}
                        className={`p-2 border rounded ${
                          l.id === selectedLogoVariantId
                            ? "border-primary bg-light"
                            : "border-secondary"
                        }`}
                        style={{
                          width: "80px",
                          textAlign: "center",
                          cursor: "pointer",
                        }}
                      >
                        <img
                          src={l.url}
                          alt={l.color}
                          style={{
                            width: "100%",
                            height: "60px",
                            objectFit: "contain",
                            marginBottom: "8px",
                          }}
                        />
                        <small>{l.color}</small>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Placements Checkboxes */}
              {viewPlacements.length > 0 && selectedLogoId && (
                <div className="mb-4">
                  <Form.Label className="fw-bold d-block mb-2">
                    Logo Placements
                  </Form.Label>
                  <div className="d-flex flex-wrap gap-2">
                    {viewPlacements.map((p) => (
                      <Form.Check
                        key={p.id}
                        type="checkbox"
                        id={`placement-${p.id}`}
                        label={p.name}
                        checked={selectedPlacementIds.includes(p.id)}
                        onChange={() => togglePlacement(p.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Sizes */}
              <div className="mb-4">
                <Form.Label className="fw-bold d-block mb-3">
                  Order by Size
                </Form.Label>
                <Row className="g-2">
                  {allSizes.map((size) => {
                    const attr = sizeAttributes.find(
                      (a) => a.name.toLowerCase() === size
                    );
                    const sizePrice = attr
                      ? Number(attr.final_price)
                      : basePrice;
                    return (
                      <Col xs={6} sm={4} key={size}>
                        <Form.Group>
                          <Form.Label className="text-uppercase small fw-bold">
                            {size}
                            <span className="text-success small ms-1 d-block">
                              ${sizePrice.toFixed(2)}
                            </span>
                          </Form.Label>
                          <Form.Control
                            type="number"
                            min="0"
                            placeholder="0"
                            value={quantities[size] || 0}
                            onChange={(e) =>
                              handleQuantityChange(size, e.target.value)
                            }
                            className="text-center"
                          />
                        </Form.Group>
                      </Col>
                    );
                  })}
                </Row>
              </div>

              {/* Total & Add to Cart */}
              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span className="fw-bold fs-5">Total Price:</span>
                  <span className="fs-4 text-primary fw-bold">
                    ${totalPrice.toFixed(2)}
                  </span>
                </div>
                <Button
                  variant="primary"
                  onClick={handleAddToCart}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      {" "}
                      <Spinner
                        animation="border"
                        size="sm"
                        className="me-2"
                      />{" "}
                      Processing...
                    </>
                  ) : (
                    "🛒 Add to Cart"
                  )}
                </Button>
              </div>

              {message && (
                <Alert
                  variant={message.startsWith("✅") ? "success" : "danger"}
                  className="py-3"
                  dismissible
                  onClose={() => setMessage("")}
                >
                  {message}
                </Alert>
              )}
            </Card>
          </Col>
        </Row>
      </Container>
      <Footer
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          width: "100%",
        }}
      />
    </>
  );
}

export default UserProduct;