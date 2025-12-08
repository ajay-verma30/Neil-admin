import React, { useEffect, useState, useContext, useRef } from "react";
import TopBar from "../../Components/TopBar/TopBar";
import Sidebar from "../../Components/SideBar/SideBar";
import { Col, Row } from "react-bootstrap";
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
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedVariantId, setSelectedVariantId] = useState(null);
  const [placedLogos, setPlacedLogos] = useState([]);
  const [selectedLogoId, setSelectedLogoId] = useState(null);

  // ------------------------
  // FETCH LOGOS
  // ------------------------
  useEffect(() => {
    const fetchLogos = async () => {
      try {
        const res = await fetch(
          "https://neil-backend-1.onrender.com/logos/all-logos",
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
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
        const res = await fetch(
          `https://neil-backend-1.onrender.com/products/${id}`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        const data = await res.json();
        const variantImgs = data?.product?.variants?.[0]?.images || [];
        setVariantImages(variantImgs);
      } catch (err) {
        console.error("Failed to load product:", err);
      }
    };
    fetchProduct();
  }, [accessToken, id]);

  // ------------------------
  // LOGO HANDLERS
  // ------------------------
  const handleLogoClick = (logo) => {
    const newLogo = {
      id: Date.now(),
      logo_id: logo.id,
      logo_variant_id: logo.variant_id,
      url: logo.url,
      widthPercent: 20, // 20% of canvas width
      heightPercent: 20, // 20% of canvas height
      xPercent: 50, // center
      yPercent: 50, // center
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
  // SAVE CUSTOMIZATIONS
  // ------------------------
  const saveCustomizations = async () => {
    if (!selectedImage) return alert("Select a variant image first");

    try {
      const canvasRect = canvasRef.current.getBoundingClientRect();

      const payload = placedLogos.map((logo) => ({
        variant_id: selectedVariantId,
        logo_id: logo.logo_id,
        logo_variant_id: logo.logo_variant_id,
        name: logo.name || `placement_${logo.id}`,
        position_x_percent: logo.xPercent,
        position_y_percent: logo.yPercent,
        width_percent: logo.widthPercent,
        height_percent: logo.heightPercent,
        z_index: logo.zIndex,
      }));

      await Promise.all(
        payload.map((data) =>
          axios.post(
            "https://neil-backend-1.onrender.com/custom-product/new",
            data,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          )
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
        <Col xs={2}>
          <Sidebar />
        </Col>

        <Col xs={10} className="form-box">
          <Row>
            {/* LOGO SELECTION */}
            <Col xs={2} className="p-4 border-end" style={{ height: "100vh" }}>
              <h5 className="text-center">Logos</h5>
              {logos.map((logo) => (
                <div
                  key={logo.id}
                  onClick={() => handleLogoClick(logo)}
                  style={{
                    marginBottom: 15,
                    padding: 8,
                    cursor: "pointer",
                    border: "1px solid #ddd",
                    borderRadius: 6,
                    textAlign: "center",
                    background: "#fafafa",
                  }}
                >
                  <img src={logo.url} width={60} alt={logo.title} />
                  <p style={{ fontSize: 13, marginTop: 5 }}>{logo.title}</p>
                </div>
              ))}
            </Col>

            {/* VARIANT IMAGE & CANVAS */}
            <Col xs={10} className="p-3">
              <h5>Variant Images</h5>
              <div className="d-flex flex-wrap gap-3 mt-3">
                {variantImages.map((img) => (
                  <img
                    key={img.id}
                    src={img.url}
                    alt="variant"
                    width={120}
                    className={`border rounded p-1 ${
                      img.url === selectedImage
                        ? "border-primary"
                        : "border-secondary"
                    }`}
                    style={{ cursor: "pointer", background: "#f9f9f9" }}
                    onClick={() => {
                      setSelectedImage(img.url);
                      setSelectedVariantId(img.variant_id);
                      setPlacedLogos([]);
                    }}
                  />
                ))}
              </div>

              {selectedImage && (
                <div
                  ref={canvasRef}
                  style={{
                    marginTop: 30,
                    width: "100%",
                    height: 500,
                    border: "1px solid #ccc",
                    borderRadius: 10,
                    position: "relative",
                    background: `url(${selectedImage}) center/contain no-repeat`,
                  }}
                >
                  {placedLogos.map((logo) => {
                    const rect = canvasRef.current.getBoundingClientRect();
                    const canvasWidth = rect.width;
                    const canvasHeight = rect.height;

                    const x = (logo.xPercent / 100) * canvasWidth;
                    const y = (logo.yPercent / 100) * canvasHeight;
                    const width = (logo.widthPercent / 100) * canvasWidth;
                    const height = (logo.heightPercent / 100) * canvasHeight;

                    return (
                      <Rnd
                        key={logo.id}
                        bounds="parent"
                        size={{ width, height }}
                        position={{ x, y }}
                        onDragStop={(e, d) => {
                          const xPercent = (d.x / canvasWidth) * 100;
                          const yPercent = (d.y / canvasHeight) * 100;
                          handleUpdateLogo({ ...logo, xPercent, yPercent });
                        }}
                        onResizeStop={(e, dir, ref, delta, pos) => {
                          const wPercent =
                            (ref.offsetWidth / canvasWidth) * 100;
                          const hPercent =
                            (ref.offsetHeight / canvasHeight) * 100;
                          const xPercent = (pos.x / canvasWidth) * 100;
                          const yPercent = (pos.y / canvasHeight) * 100;
                          handleUpdateLogo({
                            ...logo,
                            widthPercent: wPercent,
                            heightPercent: hPercent,
                            xPercent,
                            yPercent,
                          });
                        }}
                        style={{
                          border:
                            logo.id === selectedLogoId
                              ? "2px dashed blue"
                              : "1px solid #333",
                          position: "absolute",
                          zIndex: logo.zIndex,
                        }}
                        onClick={() => setSelectedLogoId(logo.id)}
                      >
                        {logo.id === selectedLogoId && (
                          <input
                            type="text"
                            value={logo.name}
                            placeholder="Enter placement name"
                            onChange={(e) =>
                              handleUpdateLogo({
                                ...logo,
                                name: e.target.value,
                              })
                            }
                            style={{
                              position: "absolute",
                              top: -25,
                              left: 0,
                              width: "100%",
                              fontSize: 12,
                              padding: 2,
                              zIndex: 10,
                            }}
                          />
                        )}
                        {logo.id === selectedLogoId && (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteLogo(logo.id);
                            }}
                            style={{
                              position: "absolute",
                              top: -10,
                              right: -10,
                              background: "red",
                              color: "#fff",
                              borderRadius: "50%",
                              width: 20,
                              height: 20,
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                              cursor: "pointer",
                              fontWeight: "bold",
                              zIndex: 20,
                            }}
                          >
                            ×
                          </span>
                        )}
                        <img
                          src={logo.url}
                          alt="logo"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "contain",
                            pointerEvents: "none",
                          }}
                        />
                      </Rnd>
                    );
                  })}
                </div>
              )}

              {placedLogos.length > 0 && (
                <button
                  className="btn btn-primary mt-3"
                  onClick={saveCustomizations}
                >
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
