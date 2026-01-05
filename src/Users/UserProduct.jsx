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
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCartPlus,
  faArrowLeft,
  faCheckCircle,
} from "@fortawesome/free-solid-svg-icons";
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

  const productVariant = useMemo(
    () =>
      product?.variants?.find(
        (v) => String(v.id) === String(selectedVariantId)
      ) || null,
    [product, selectedVariantId]
  );

  const selectedLogo = useMemo(
    () => logos.find((l) => String(l.id) === String(selectedLogoId)) || null,
    [logos, selectedLogoId]
  );

  const selectedLogoVariant = useMemo(
    () =>
      selectedLogo?.variants?.find(
        (v) => String(v.id) === String(selectedLogoVariantId)
      ) || null,
    [selectedLogo, selectedLogoVariantId]
  );

  const viewPlacements = productVariant?.placements || [];
  const allSizes = useMemo(
    () => sizeAttributes.map((attr) => attr.name.toLowerCase()),
    [sizeAttributes]
  );

  const { totalPrice, basePrice } = useMemo(() => {
    const price = Number(productVariant?.price ?? product?.price ?? 0);
    const finalPriceMap = sizeAttributes.reduce((acc, attr) => {
      acc[attr.name.toLowerCase()] = Number(attr.final_price);
      return acc;
    }, {});
    let total = 0;
    Object.entries(quantities).forEach(([size, qty]) => {
      if (qty > 0) {
        const sizePrice = finalPriceMap[size.toLowerCase()] ?? price;
        total += sizePrice * qty;
      }
    });
    return { totalPrice: total, basePrice: price };
  }, [product, productVariant, quantities, sizeAttributes]);

  useEffect(() => {
    if (!id || !accessToken) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        const prodRes = await axios.get(
          `https://neil-backend-1.onrender.com/products/${id}`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
        const prod = prodRes.data.product;
        setProduct(prod);

        if (prod.variants?.length > 0) {
          const firstV = prod.variants[0];
          setSelectedVariantId(firstV.id);
          setSizeAttributes(firstV.attributes || []);
          setQuantities(
            (firstV.attributes || []).reduce(
              (acc, a) => ({ ...acc, [a.name.toLowerCase()]: 0 }),
              {}
            )
          );
          setMainImageUrl(
            firstV.images?.find((i) => i.type?.toLowerCase() === "front")
              ?.url ||
              firstV.images?.[0]?.url ||
              ""
          );
        }

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
        setError("Product load failed.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, accessToken]);

  useEffect(() => {
    if (!productVariant) return;
    const match = productVariant.images?.find(
      (i) => i.type?.toLowerCase() === selectedView.toLowerCase()
    );
    if (match) setMainImageUrl(match.url);
  }, [selectedView, productVariant]);

  useEffect(() => {
    const update = () => {
      if (previewRef.current) {
        setPreviewDimensions({
          width: previewRef.current.offsetWidth,
          height: previewRef.current.offsetHeight,
        });
      }
    };
    window.addEventListener("resize", update);
    const timer = setTimeout(update, 500);
    return () => {
      window.removeEventListener("resize", update);
      clearTimeout(timer);
    };
  }, [mainImageUrl, selectedVariantId]);

  // --- RENDER PLACEMENT WITH VIEW CHECK ---
  const renderPlacement = (placement) => {
    // Check 1: Is this placement selected?
    if (!selectedPlacementIds.includes(placement.id)) return null;

    // Check 2: Does placement view type match current selected view (e.g., "front" === "front")?
    const placementType = placement.type?.toLowerCase() || "front";
    if (placementType !== selectedView.toLowerCase()) return null;

    const { width, height } = previewDimensions;
    if (!width) return null;

    const logoUrl = selectedLogoVariant
      ? selectedLogoVariant.url
      : placement.logo_url || placement.logo?.url;
    if (!logoUrl) return null;

    const t =
      ((placement.position_y_percent || placement.position_y || 0) / 100) *
      height;
    const l =
      ((placement.position_x_percent || placement.position_x || 0) / 100) *
      width;
    const w =
      ((placement.width_percent || placement.width || 10) / 100) * width;

    return (
      <img
        key={placement.id}
        src={logoUrl}
        className="position-absolute"
        style={{
          top: `${t}px`,
          left: `${l}px`,
          width: `${w}px`,
          zIndex: 50,
          pointerEvents: "none",
          objectFit: "contain",
        }}
        crossOrigin="anonymous"
      />
    );
  };

  const handleAddToCart = async () => {
    const totalQty = Object.values(quantities).reduce((a, b) => a + b, 0);
    if (totalQty === 0) return setMessage("⚠️ Please add quantity.");

    setIsProcessing(true);
    try {
      const canvas = await html2canvas(previewRef.current, {
        useCORS: true,
        backgroundColor: null,
      });
      const blob = await new Promise((r) => canvas.toBlob(r, "image/png"));
      const file = new File([blob], "custom.png", { type: "image/png" });

      const fd = new FormData();
      fd.append("preview", file);
      fd.append("user_id", user.id);
      fd.append("product_variant_id", selectedVariantId);
      fd.append("logo_variant_id", selectedLogoVariantId);
      fd.append("placement_id", selectedPlacementIds[0] || "");

      const res = await axios.post(
        "https://neil-backend-1.onrender.com/customization/new",
        fd,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      const item = {
        user_id: user.id,
        product_id: product.id,
        title: product.title,
        image: res.data.customization.preview_image_url,
        customizations_id: res.data.customization.id,
        quantity: totalQty,
        total_price: totalPrice.toFixed(2),
        sizes: quantities,
      };

      await axios.post("https://neil-backend-1.onrender.com/cart/add", item, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      addToCart(item);
      setMessage("✅ Added to cart!");
    } catch (e) {
      setMessage("❌ Error adding to cart.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading)
    return (
      <div className="vh-100 d-flex justify-content-center align-items-center">
        <Spinner animation="border" variant="primary" />
      </div>
    );

  return (
    <div className="bg-light min-vh-100">
      <TopBar />
      <Container className="py-4">
        <Button
          variant="outline-secondary"
          size="sm"
          onClick={() => navigate(-1)}
          className="mb-4 rounded-pill px-3"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="me-2" /> Back
        </Button>

        <Row className="g-4">
          <Col lg={5}>
            <div className="sticky-top" style={{ top: "90px" }}>
              <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
                <div
                  ref={previewRef}
                  className="position-relative bg-white"
                  style={{ aspectRatio: "1/1" }}
                >
                  <img
                    src={mainImageUrl}
                    className="w-100 h-100 object-fit-contain"
                    alt="base"
                    crossOrigin="anonymous"
                  />
                  {viewPlacements.map(renderPlacement)}
                </div>
                <div className="p-2 bg-dark text-white text-center small">
                  Live Design Preview
                </div>
              </Card>
              <div className="d-flex justify-content-center gap-2 mt-3">
                {productVariant?.images?.map((img) => (
                  <Button
                    key={img.id}
                    variant={
                      selectedView.toLowerCase() === img.type?.toLowerCase()
                        ? "primary"
                        : "white"
                    }
                    size="sm"
                    className="shadow-sm rounded-pill px-4 py-2 border"
                    onClick={() => setSelectedView(img.type)}
                  >
                    {img.type?.toUpperCase()}
                  </Button>
                ))}
              </div>
            </div>
          </Col>

          <Col lg={7}>
            <div className="bg-white p-4 rounded-4 shadow-sm border">
              <Badge bg="primary" className="mb-2">
                Customizable
              </Badge>
              <h2 className="fw-bold">{product.title}</h2>
              <p className="text-muted">{product.category?.title}</p>
              <hr />

              <div className="mb-4">
                <h6 className="fw-bold text-uppercase small text-primary mb-3">
                  1. Configuration
                </h6>
                <Row className="g-3">
                  <Col md={6}>
                    <Form.Label className="small fw-bold">
                      Select Variant
                    </Form.Label>
                    <Form.Select
                      className="rounded-3 shadow-sm"
                      value={selectedVariantId}
                      onChange={(e) => setSelectedVariantId(e.target.value)}
                    >
                      {product.variants.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.color}
                        </option>
                      ))}
                    </Form.Select>
                  </Col>
                  <Col md={6}>
                    <Form.Label className="small fw-bold">
                      Select Logo
                    </Form.Label>
                    <Form.Select
                      className="rounded-3 shadow-sm"
                      value={selectedLogoId}
                      onChange={(e) => setSelectedLogoId(e.target.value)}
                    >
                      {logos.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.title}
                        </option>
                      ))}
                    </Form.Select>
                  </Col>
                </Row>
              </div>

              {selectedLogo && (
                <div className="mb-4">
                  <h6 className="fw-bold text-uppercase small text-primary mb-3">
                    2. Logo Style
                  </h6>
                  <div className="d-flex gap-3">
                    {selectedLogo.variants.map((lv) => (
                      <div
                        key={lv.id}
                        onClick={() => setSelectedLogoVariantId(lv.id)}
                        className={`p-2 border-2 rounded-3 transition-all ${
                          selectedLogoVariantId === lv.id
                            ? "border-primary bg-light"
                            : "border-light shadow-sm"
                        }`}
                        style={{
                          width: "70px",
                          height: "70px",
                          cursor: "pointer",
                          background: "#fdfdfd",
                        }}
                      >
                        <img
                          src={lv.url}
                          className="w-100 h-100 object-fit-contain"
                          alt="variant"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {viewPlacements.length > 0 && (
                <div className="mb-4">
                  <h6 className="fw-bold text-uppercase small text-primary mb-3">
                    3. Placement
                  </h6>
                  <div className="d-flex flex-wrap gap-2">
                    {viewPlacements.map((p) => (
                      <Button
                        key={p.id}
                        variant={
                          selectedPlacementIds.includes(p.id)
                            ? "primary"
                            : "outline-secondary"
                        }
                        className={`rounded-pill px-4 ${
                          selectedPlacementIds.includes(p.id)
                            ? ""
                            : "text-dark border-secondary bg-light"
                        }`}
                        onClick={() => {
                          setSelectedPlacementIds((prev) =>
                            prev.includes(p.id) ? [] : [p.id]
                          );

                          requestAnimationFrame(() => {
                            if (previewRef.current) {
                              setPreviewDimensions({
                                width: previewRef.current.offsetWidth,
                                height: previewRef.current.offsetHeight,
                              });
                            }
                          });
                        }}
                      >
                        {selectedPlacementIds.includes(p.id) && (
                          <FontAwesomeIcon
                            icon={faCheckCircle}
                            className="me-2"
                          />
                        )}
                        {p.name}{" "}
                        <Badge
                          bg="light"
                          text="dark"
                          className="ms-1 border small opacity-75"
                        >
                          {p.type}
                        </Badge>
                      </Button>
                    ))}
                  </div>
                  <Form.Text className="text-muted d-block mt-2">
                    Note: Logos will only appear on their respective view
                    (Front/Back).
                  </Form.Text>
                </div>
              )}

              <div className="mb-4 pt-3 border-top">
                <h6 className="fw-bold text-uppercase small text-primary mb-3">
                  4. Size & Quantity
                </h6>
                <Row className="g-2">
                  {allSizes.map((size) => (
                    <Col xs={4} md={3} key={size}>
                      <div className="p-3 border rounded-3 text-center bg-light shadow-sm">
                        <div className="fw-bold small text-muted">
                          {size.toUpperCase()}
                        </div>
                        <Form.Control
                          type="number"
                          className="text-center border-0 mt-2 bg-white rounded-2 fw-bold"
                          value={quantities[size] || 0}
                          onChange={(e) =>
                            setQuantities((prev) => ({
                              ...prev,
                              [size]: parseInt(e.target.value) || 0,
                            }))
                          }
                        />
                      </div>
                    </Col>
                  ))}
                </Row>
              </div>

              <div className="d-flex justify-content-between align-items-center bg-primary bg-opacity-10 p-4 rounded-4 mt-4 border border-primary border-opacity-25">
                <div>
                  <div className="small text-muted fw-bold">Grand Total</div>
                  <h2 className="fw-bold text-primary mb-0">
                    ${totalPrice.toFixed(2)}
                  </h2>
                </div>
                <Button
                  variant="primary"
                  size="lg"
                  className="rounded-pill px-5 py-3 fw-bold shadow"
                  onClick={handleAddToCart}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <Spinner size="sm" />
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faCartPlus} className="me-2" /> Add
                      to Cart
                    </>
                  )}
                </Button>
              </div>
              {message && (
                <Alert
                  className="mt-3 rounded-4 shadow-sm"
                  variant={message.includes("✅") ? "success" : "danger"}
                >
                  {message}
                </Alert>
              )}
            </div>
          </Col>
        </Row>
      </Container>
      <Footer />
    </div>
  );
}

export default UserProduct;
