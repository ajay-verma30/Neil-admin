import React, { useEffect, useState, useContext, useRef } from "react";
import TopBar from "../../Components/TopBar/TopBar";
import Sidebar from "../../Components/SideBar/SideBar";
import { Col, Row, Badge } from "react-bootstrap";
import { AuthContext } from "../../context/AuthContext";
import { useParams } from "react-router-dom";
import { Rnd } from "react-rnd";
import axios from "axios";

function CustomizeProduct() {
  const { accessToken } = useContext(AuthContext);
  const { id } = useParams();
  const canvasRef = useRef(null);

  const [logos, setLogos] = useState([]);
  const [variantImages, setVariantImages] = useState([]);
  const [selectedImageObj, setSelectedImageObj] = useState(null);
  const [selectedVariantId, setSelectedVariantId] = useState(null);
  const [placedLogos, setPlacedLogos] = useState([]);
  const [selectedLogoId, setSelectedLogoId] = useState(null);

  // ------------------------
  // FETCH LOGOS
  // ------------------------
  useEffect(() => {
    const fetchLogos = async () => {
      try {
        const res = await fetch("https://neil-backend-1.onrender.com/logos/all-logos", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const data = await res.json();
        const formatted = data
          .map((item) => ({
            id: item.id,
            title: item.title,
            url: item?.variants?.[0]?.url || null,
            variant_id: item?.variants?.[0]?.id || null,
          }))
          .filter((i) => i.url);
        setLogos(formatted);
      } catch (err) {
        console.error("Failed to load logos:", err);
      }
    };
    fetchLogos();
  }, [accessToken]);

  // ------------------------
  // FETCH VARIANT IMAGES
  // ------------------------
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`https://neil-backend-1.onrender.com/products/${id}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const data = await res.json();
        const variantImgs = data?.product?.variants?.[0]?.images || [];
        setVariantImages(variantImgs);
      } catch (err) {
        console.error("Failed to load product:", err);
      }
    };
    fetchProduct();
  }, [accessToken, id]);

  const handleLogoClick = (logo) => {
    const newLogo = {
      id: Date.now(),
      logo_id: logo.id,
      logo_variant_id: logo.variant_id,
      url: logo.url,
      widthPercent: 20,
      heightPercent: 20,
      xPercent: 50,
      yPercent: 50,
      name: "",
      zIndex: 1,
    };
    setPlacedLogos((prev) => [...prev, newLogo]);
    setSelectedLogoId(newLogo.id);
  };

  const handleUpdateLogo = (updatedLogo) => {
    setPlacedLogos((prev) =>
      prev.map((logo) => (logo.id === updatedLogo.id ? updatedLogo : logo))
    );
  };

  const handleDeleteLogo = (logoId) => {
    setPlacedLogos((prev) => prev.filter((logo) => logo.id !== logoId));
    if (selectedLogoId === logoId) setSelectedLogoId(null);
  };

  // ------------------------
  // SAVE CUSTOMIZATIONS (Updated with 'type')
  // ------------------------
  const saveCustomizations = async () => {
    if (!selectedImageObj) return alert("Select a variant image first");
    try {
      const payload = placedLogos.map((logo) => ({
        variant_id: selectedVariantId,
        logo_id: logo.logo_id,
        logo_variant_id: logo.logo_variant_id,
        name: logo.name || `placement_${logo.id}`,
        type: selectedImageObj.type, // <--- Side (front, back, etc.) yahan se ja raha hai
        position_x_percent: logo.xPercent,
        position_y_percent: logo.yPercent,
        width_percent: logo.widthPercent,
        height_percent: logo.heightPercent,
        z_index: logo.zIndex,
      }));

      await Promise.all(
        payload.map((data) =>
          axios.post("http://localhost:3000/custom-product/new", data, {
            headers: { Authorization: `Bearer ${accessToken}` },
          })
        )
      );
      alert("Customizations saved successfully!");
    } catch (err) {
      console.error(err);
      alert("Error saving customizations");
    }
  };

  return (
    <>
      <TopBar />
      <Row className="g-0">
        <Col xs={2}><Sidebar /></Col>
        <Col xs={10} className="form-box">
          <Row>
            <Col xs={2} className="p-4 border-end" style={{ height: "100vh", overflowY: "auto" }}>
              <h5 className="text-center">Logos</h5>
              {logos.map((logo) => (
                <div key={logo.id} onClick={() => handleLogoClick(logo)} style={{ marginBottom: 15, padding: 8, cursor: "pointer", border: "1px solid #ddd", borderRadius: 6, textAlign: "center", background: "#fafafa" }}>
                  <img src={logo.url} width={60} alt={logo.title} />
                  <p style={{ fontSize: 13, marginTop: 5 }}>{logo.title}</p>
                </div>
              ))}
            </Col>

            <Col xs={10} className="p-3">
              <h5>Variant Images</h5>
              <div className="d-flex flex-wrap gap-3 mt-3">
                {variantImages.map((img) => (
                  <div key={img.id} className="text-center">
                    <img
                      src={img.url}
                      alt={img.type}
                      width={120}
                      className={`border rounded p-1 ${img.url === selectedImageObj?.url ? "border-primary" : "border-secondary"}`}
                      style={{ cursor: "pointer", background: "#f9f9f9" }}
                      onClick={() => {
                        setSelectedImageObj(img);
                        setSelectedVariantId(img.variant_id);
                        setPlacedLogos([]);
                      }}
                    />
                    <div className="text-muted small text-capitalize">{img.type}</div>
                  </div>
                ))}
              </div>

              {selectedImageObj && (
                <div className="mt-4">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h5 className="mb-0">Canvas Preview</h5>
                    <Badge bg="dark" className="text-uppercase px-3 py-2">Side: {selectedImageObj.type}</Badge>
                  </div>

                  <div
                    ref={canvasRef}
                    style={{
                      width: "100%",
                      aspectRatio: "1/1",
                      border: "1px solid #ccc",
                      borderRadius: 10,
                      position: "relative",
                      background: `url(${selectedImageObj.url}) center/contain no-repeat`,
                      overflow: 'hidden'
                    }}
                  >
                    {placedLogos.map((logo) => {
                      if (!canvasRef.current) return null;
                      const rect = canvasRef.current.getBoundingClientRect();
                      const x = (logo.xPercent / 100) * rect.width;
                      const y = (logo.yPercent / 100) * rect.height;
                      const width = (logo.widthPercent / 100) * rect.width;
                      const height = (logo.heightPercent / 100) * rect.height;

                      return (
                        <Rnd
                          key={logo.id}
                          bounds="parent"
                          size={{ width, height }}
                          position={{ x, y }}
                          onDragStop={(e, d) => {
                            handleUpdateLogo({ ...logo, xPercent: (d.x / rect.width) * 100, yPercent: (d.y / rect.height) * 100 });
                          }}
                          onResizeStop={(e, dir, ref, delta, pos) => {
                            handleUpdateLogo({
                              ...logo,
                              widthPercent: (ref.offsetWidth / rect.width) * 100,
                              heightPercent: (ref.offsetHeight / rect.height) * 100,
                              xPercent: (pos.x / rect.width) * 100,
                              yPercent: (pos.y / rect.height) * 100,
                            });
                          }}
                          style={{
                            border: logo.id === selectedLogoId ? "2px dashed blue" : "1px solid transparent",
                            zIndex: logo.zIndex,
                          }}
                          onClick={() => setSelectedLogoId(logo.id)}
                        >
                          {/* DELETE CROSS MARK */}
                          {logo.id === selectedLogoId && (
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteLogo(logo.id);
                              }}
                              style={{
                                position: "absolute",
                                top: -12,
                                right: -12,
                                background: "red",
                                color: "white",
                                width: 24,
                                height: 24,
                                borderRadius: "50%",
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                cursor: "pointer",
                                fontSize: 16,
                                fontWeight: "bold",
                                zIndex: 1000,
                              }}
                            >
                              ×
                            </div>
                          )}

                          {logo.id === selectedLogoId && (
                            <input
                              type="text"
                              value={logo.name}
                              placeholder="Name"
                              onChange={(e) => handleUpdateLogo({ ...logo, name: e.target.value })}
                              style={{ position: "absolute", bottom: -25, left: 0, width: "100%", fontSize: 10 }}
                            />
                          )}
                          <img
                            src={logo.url}
                            alt="logo"
                            style={{ width: "100%", height: "100%", objectFit: "contain", pointerEvents: "none" }}
                          />
                        </Rnd>
                      );
                    })}
                  </div>
                </div>
              )}

              {placedLogos.length > 0 && (
                <button className="btn btn-primary mt-3" onClick={saveCustomizations}>
                  Save Customizations
                </button>
              )}
            </Col>
          </Row>
        </Col>
      </Row>
    </>
  );
}

export default CustomizeProduct;