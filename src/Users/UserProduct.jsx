import React, { useEffect, useState, useMemo, useRef, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import html2canvas from "html2canvas";
import { Container, Row, Col, Spinner, Alert, Button, Form, Image } from "react-bootstrap";

import TopBar from "../Components/TopBar/TopBar";
import Footer from "./Footer";
import { AuthContext } from "../context/AuthContext";
import { CartContext } from "../context/CartContext";

function UserProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, accessToken } = useContext(AuthContext);
  const { addToCart } = useContext(CartContext);
const [logoDropdownOpen, setLogoDropdownOpen] = useState(false);
  const previewRef = useRef(null);

  const [product, setProduct] = useState(null);
  const [variantId, setVariantId] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [currentView, setCurrentView] = useState("front");
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const [qty, setQty] = useState({});
  const [previewSize, setPreviewSize] = useState({ w: 0, h: 0 });

  const [selectedLogos, setSelectedLogos] = useState([]);
  const [selectedPlacements, setSelectedPlacements] = useState({});
  
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [msg, setMsg] = useState("");

  const variant = useMemo(() => product?.variants?.find(v => v.id === variantId), [product, variantId]);

  const logos = useMemo(() => {
    if (!variant) return [];
    const map = {};
    variant.placements.forEach(p => { if (p.logo) map[p.logo.id] = p.logo; });
    return Object.values(map);
  }, [variant]);

  const totalPrice = useMemo(() => {
    if (!variant || !product) return 0;
    let total = 0;
    variant.attributes.forEach(a => {
      const q = qty[a.name] || 0;
      total += (Number(product.price) + Number(a.adjustment || 0)) * q;
    });
    return total;
  }, [qty, variant, product]);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(`https://neil-backend-1.onrender.com/products/public/${id}`);
        const p = data.product;
        const v = p.variants[0];
        setProduct(p);
        setVariantId(v.id);
        setImageUrl(v.images[0]?.url);
        setCurrentView(v.images[0]?.type || "front");
        const q = {};
        v.attributes.forEach(a => (q[a.name] = 0));
        setQty(q);
      } catch { setMsg("Failed to load product"); }
      finally { setLoading(false); }
    })();
  }, [id]);

  useEffect(() => {
    if (!previewRef.current) return;
    const resize = () => setPreviewSize({ w: previewRef.current.offsetWidth, h: previewRef.current.offsetHeight });
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [imageUrl, loading]); // Added loading to dependency to ensure it runs after UI renders

  // Check if placement matches the current view (Front/Back)
  const isPlacementSelectable = (p) => {
    const pType = p.type || "front";
    return pType === currentView;
  };

  const toggleLogo = id => {
    setSelectedLogos(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const togglePlacement = (logoId, pid) => {
    setSelectedPlacements(prev => {
      const s = new Set(prev[logoId] || []);
      s.has(pid) ? s.delete(pid) : s.add(pid);
      return { ...prev, [logoId]: s };
    });
  };

  const handleAddToCart = async () => {
  // 1. Quantity Check (Sabse pehle check karo qty select hui hai ya nahi)
  const totalQty = Object.values(qty).reduce((a, b) => a + b, 0);
  if (!totalQty) {
    setMsg("Select quantity");
    return;
  }

  // 2. Prepare Item Data (Data object ko pehle hi ready kar lo)
  const currentItemData = {
    product_id: product.id,
    title: product.title,
    variant_id: variantId,
    quantity: totalQty,
    qty: qty, // Raw quantities for sizes
    selectedLogos: selectedLogos,
    selectedPlacements: Object.keys(selectedPlacements).reduce((acc, key) => {
      acc[key] = Array.from(selectedPlacements[key]);
      return acc;
    }, {}),
    total_price: totalPrice,
  };

  if (!user) {
    localStorage.setItem("pendingCartItem", JSON.stringify(currentItemData));
    localStorage.setItem("redirectAfterLogin", window.location.pathname);
    
    navigate("/login", { state: { redirectTo: window.location.pathname } });
    return;
  }

  setProcessing(true);
  try {
    const canvas = await html2canvas(previewRef.current, { 
      useCORS: true, 
      backgroundColor: null 
    });
    const blob = await new Promise((r) => canvas.toBlob(r));
    const file = new File([blob], "preview.png", { type: "image/png" });
    const fd = new FormData();
    fd.append("preview", file);
    fd.append("user_id", user.id);
    fd.append("product_variant_ids", JSON.stringify([variantId]));
    fd.append("logo_variant_ids", JSON.stringify(selectedLogos.length > 0 ? selectedLogos : null));    
    const placementPayload = Object.keys(selectedPlacements).length > 0 
      ? currentItemData.selectedPlacements 
      : null;
    fd.append("placement_ids", JSON.stringify(placementPayload));
    const res = await axios.post("https://neil-backend-1.onrender.com/customization/new", fd, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const sizesWithDetails = {};
    variant.attributes.forEach((a) => {
      const q = qty[a.name] || 0;
      if (q > 0) {
        const unitPrice = Number(product.price) + Number(a.adjustment || 0);
        sizesWithDetails[a.name] = {
          qty: q,
          price: unitPrice,
          subtotal: unitPrice * q,
        };
      }
    });
      const finalItem = {
      user_id: user.id,
      product_id: product.id,
      title: product.title,
      image: res.data.customization.preview_image_url, 
      customizations_id: res.data.customization.id,
      quantity: totalQty,
      sizes: sizesWithDetails,
      total_price: totalPrice,
    };

    await axios.post("https://neil-backend-1.onrender.com/cart/add", finalItem, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    addToCart(finalItem);
    navigate("/cart");

  } catch (err) {
    console.error("Add to cart error:", err);
    setMsg("Add to cart failed. Please try again.");
  } finally {
    setProcessing(false);
  }
};

  if (loading) return <div className="vh-100 d-flex justify-content-center align-items-center"><Spinner /></div>;

  return (
    <>
      <TopBar />
      <Container className="py-4">
        <Row className="g-4 form-box">
          {/* PREVIEW SECTION */}
          <Col md={4}>
            <div ref={previewRef} className="border rounded bg-white position-relative" style={{ aspectRatio: "1/1", overflow: 'hidden' }}>
              <img src={imageUrl} alt="" className="w-100 h-100 object-fit-contain p-4" />
              
              {/* DISPLAY LOGOS ON PRODUCT */}
              {selectedLogos.map(logoId =>
                Array.from(selectedPlacements[logoId] || []).map(pid => {
                  const p = variant.placements.find(pl => pl.id === pid);
                  // Render only if placement exists AND matches current view
                  if (!p || (p.type || "front") !== currentView) return null;
                  
                  return (
                    <img key={pid} src={p.logo.url} alt="" className="position-absolute"
                      style={{
                        top: `${(p.position_y / 100) * previewSize.h}px`,
                        left: `${(p.position_x / 100) * previewSize.w}px`,
                        width: `${(p.width / 100) * previewSize.w}px`,
                        pointerEvents: 'none',
                        zIndex: 10
                      }}
                    />
                  );
                })
              )}
            </div>
            
            <div className="d-flex gap-2 mt-2">
              {variant?.images.map((img, i) => (
                <Image key={img.id} src={img.url} width={60} height={60} rounded
                  onClick={() => { setImageUrl(img.url); setSelectedImageIndex(i); setCurrentView(img.type || "front"); }}
                  style={{ cursor: "pointer", border: i === selectedImageIndex ? "2px solid #000" : "1px solid #ccc" }}
                />
              ))}
            </div>
          </Col>

          {/* CONTROLS SECTION */}
          <Col md={5}>
            <h3>{product.title}</h3>
            <p className="text-muted small">{product.description}</p>

            <div className="mb-3 position-relative">
  <b>Select Logos</b>

  {/* DROPDOWN HEADER */}
  <div
    onClick={() => setLogoDropdownOpen(prev => !prev)}
    className="border rounded p-2 mt-2 d-flex justify-content-between align-items-center"
    style={{ cursor: "pointer", background: "#333", color: "#fff" }}
  >
    <span>
      {selectedLogos.length === 0
        ? "Select Logos"
        : `${selectedLogos.length} Logo(s) Selected`}
    </span>
    <span style={{ transform: logoDropdownOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
      ▼
    </span>
  </div>

  {/* DROPDOWN LIST */}
  {logoDropdownOpen && (
    <div
      className="border rounded mt-1 p-2"
      style={{
        position: "absolute",
        top: "100%",
        left: 0,
        right: 0,
        background: "#555",
        zIndex: 20,
        maxHeight: 220,
        overflowY: "auto"
      }}
    >
      {logos.map(logo => {
        const selected = selectedLogos.includes(logo.id);

        return (
          <div
            key={logo.id}
            onClick={() => toggleLogo(logo.id)}
            className={`d-flex align-items-center gap-2 p-2 rounded mb-1
              ${selected ? "border border-primary" : ""}`}
            style={{ cursor: "pointer", background: "#666" }}
          >
            <img
              src={logo.url}
              alt={logo.title}
              style={{ width: 40, height: 40, objectFit: "contain", background: "#fff", borderRadius: 4 }}
            />
            <span className="text-white flex-grow-1">{logo.title}</span>
            <Form.Check
              type="checkbox"
              checked={selected}
              readOnly
            />
          </div>
        );
      })}
    </div>
  )}
</div>


            {selectedLogos.map(logoId => (
              <div key={logoId} className="mb-3 p-3 border rounded bg-light">
                <b>Placements for {logos.find(l => l.id === logoId)?.title}</b>
                {variant.placements.filter(p => p.logo?.id === logoId).map(p => {
                  const selectable = isPlacementSelectable(p);
                  return (
                    <Form.Check key={p.id} type="checkbox"
                      label={`${p.name} ${!selectable ? `(Switch to ${p.type || 'front'} view)` : ''}`}
                      disabled={!selectable}
                      checked={(selectedPlacements[logoId] || new Set()).has(p.id)}
                      onChange={() => togglePlacement(logoId, p.id)}
                    />
                  );
                })}
              </div>
            ))}

            <div className="mb-3">
  <b>Size & Quantity</b>

  {variant?.attributes.map(a => {
    const unitPrice =
       Number(a.adjustment || 0);

    return (
      <div
        key={a.name}
        className="d-flex align-items-center justify-content-between mt-2 p-2 border rounded"
      >
        <div>
          <div><b>Size:</b> {a.name}</div>
          <div className="text-muted small">
            Base Price + ${unitPrice.toFixed(2)}
          </div>
        </div>
        
        <Form.Control
          type="number"
          min="0"
          style={{ width: 90 }}
          value={qty[a.name] || 0}
          onChange={e =>
            setQty({
              ...qty,
              [a.name]: Number(e.target.value)
            })
          }
        />
      </div>
    );
  })}
</div>

          </Col>

          <Col md={3}>
            <div className="border rounded p-3 shadow-sm sticky-top" style={{ top: '20px' }}>
              <h4>Base Price: ${product.price}</h4>
              <div className="d-flex justify-content-between mt-3"><span>Total</span><b>$ {totalPrice.toFixed(2)}</b></div>
              <Button className="w-100 mt-3" variant="warning" disabled={processing} onClick={handleAddToCart}>
                {processing ? <Spinner size="sm" /> : "Add to Cart"}
              </Button>
              {msg && <Alert className="mt-2" variant="danger">{msg}</Alert>}
            </div>
          </Col>
        </Row>
      </Container>
      <Footer />
    </>
  );
}

export default UserProduct;