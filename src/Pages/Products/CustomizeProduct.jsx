import React, { useEffect, useState, useContext } from "react";
import TopBar from "../../Components/TopBar/TopBar";
import { Col, Row } from "react-bootstrap";
import Sidebar from "../../Components/SideBar/SideBar";
import { AuthContext } from "../../context/AuthContext";
import { useParams } from "react-router-dom";
import { Rnd } from "react-rnd"; // npm install react-rnd
import axios from "axios";

function CustomizeProduct() {
  const { accessToken } = useContext(AuthContext);
  const { id } = useParams();

  const [logos, setLogos] = useState([]);
  const [variantImages, setVariantImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedVariantId, setSelectedVariantId] = useState(null);
  // Holds all placed logos on the canvas
  const [placedLogos, setPlacedLogos] = useState([]);
  const [selectedLogoId, setSelectedLogoId] = useState(null);

  // ------------------------
  // LOAD LOGOS
  // ------------------------
  useEffect(() => {
    const fetchLogos = async () => {
      try {
        const res = await fetch(
          "https://neil-backend-1.onrender.com/logos/all-logos",
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          }
        );
        const data = await res.json();
        const formatted = data
  .map((item) => ({
    id: item.id,                // main logo ID
    title: item.title,
    url: item?.variants?.[0]?.url || null,   // first variant URL
    variant_id: item?.variants?.[0]?.id || null,  // store variant ID
  }))
  .filter((i) => i.url);

setLogos(formatted);
      } catch (err) {
      }
    };

    fetchLogos();
  }, [accessToken]);

  // ------------------------
  // LOAD VARIANT IMAGES
  // ------------------------
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(
          `https://neil-backend-1.onrender.com/products/${id}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          }
        );

        const data = await res.json();
        const variantImgs = data?.product?.variants?.[0]?.images || [];
        setVariantImages(variantImgs);
      } catch (err) {
      }
    };

    fetchProduct();
  }, [accessToken, id]);

  // ------------------------
  // HANDLERS
  // ------------------------

  // Add a new logo to the canvas
  const handleLogoClick = (logo) => {
    const newLogo = {
      id: Date.now(),
      logo_id: logo.id, // main logo id
      logo_variant_id: logo.variant_id, 
      url: logo.url,
      width: 120,
      height: 120,
      x: 50,
      y: 50,
      name: "", // user can input name
    };
    setPlacedLogos((prev) => [...prev, newLogo]);
    setSelectedLogoId(newLogo.id);
  };

  // Update logo properties (position, size, or name)
  const handleUpdateLogo = (updatedLogo) => {
    setPlacedLogos((prev) =>
      prev.map((logo) => (logo.id === updatedLogo.id ? updatedLogo : logo))
    );
  };

  // Delete a placed logo
  const handleDeleteLogo = (logoId) => {
    setPlacedLogos((prev) => prev.filter((logo) => logo.id !== logoId));
    if (selectedLogoId === logoId) setSelectedLogoId(null);
  };

  // Save all placed logos to backend
  const saveCustomizations = async () => {
  if (!selectedImage) return alert("Select a variant image first");

  try {
    const payload = placedLogos.map((logo) => ({
      variant_id: selectedVariantId,         // product variant
      logo_id: logo.logo_id,                 // main logo ID
      logo_variant_id: logo.logo_variant_id, // correct logo variant
      name: logo.name || `placement_${logo.id}`,
      position_x: logo.x,
      position_y: logo.y,
      width: logo.width,
      height: logo.height,
      z_index: 1,
    }));

    console.log("Payload being sent:", payload); // verify before sending

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
            {/* LEFT SIDE LOGOS */}
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

            {/* RIGHT SIDE VARIANT */}
            <Col xs={10} className="p-3">
              <h5>Variant Images</h5>
              <div
                style={{
                  display: "flex",
                  gap: 20,
                  flexWrap: "wrap",
                  marginTop: 20,
                }}
              >
                {variantImages.map((img) => (
                  <img
                    key={img.id}
                    src={img.url}
                    alt="variant"
                    width={120}
                    style={{
                      cursor: "pointer",
                      border:
                        img.url === selectedImage
                          ? "2px solid blue"
                          : "1px solid #ddd",
                      borderRadius: 8,
                      padding: 5,
                      background: "#f9f9f9",
                    }}
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
                  style={{
                    marginTop: 30,
                    width: "100%",
                    height: 500,
                    border: "1px solid #ccc",
                    borderRadius: 10,
                    position: "relative",
                    background: "#eee",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {/* Close Button */}
                  <span
                    style={{
                      position: "absolute",
                      top: 10,
                      right: 15,
                      cursor: "pointer",
                      fontSize: 20,
                      fontWeight: "bold",
                      zIndex: 20,
                    }}
                    onClick={() => {
                      setSelectedImage(null);
                      setPlacedLogos([]);
                    }}
                  >
                    ×
                  </span>

                  {/* Variant Image */}
                  <img
                    src={selectedImage}
                    alt="canvas"
                    style={{
                      maxWidth: "90%",
                      maxHeight: "90%",
                      objectFit: "contain",
                    }}
                  />

                  {/* Draggable & Resizable Logos */}
                  {placedLogos.map((logo) => (
                    <Rnd
                      key={logo.id}
                      size={{ width: logo.width, height: logo.height }}
                      position={{ x: logo.x, y: logo.y }}
                      onDragStop={(e, d) =>
                        handleUpdateLogo({ ...logo, x: d.x, y: d.y })
                      }
                      onResizeStop={(e, direction, ref, delta, position) =>
                        handleUpdateLogo({
                          ...logo,
                          width: ref.offsetWidth,
                          height: ref.offsetHeight,
                          x: position.x,
                          y: position.y,
                        })
                      }
                      bounds="parent"
                      enableResizing={{
                        top: true,
                        right: true,
                        bottom: true,
                        left: true,
                        topRight: true,
                        bottomRight: true,
                        bottomLeft: true,
                        topLeft: true,
                      }}
                      style={{
                        border:
                          logo.id === selectedLogoId
                            ? "2px dashed blue"
                            : "1px solid #333",
                        padding: 2,
                        zIndex: 10,
                        position: "absolute",
                      }}
                      onClick={() => setSelectedLogoId(logo.id)}
                    >
                      {/* Name Input */}
                      {logo.id === selectedLogoId && (
                        <input
                          type="text"
                          placeholder="Enter placement name"
                          value={logo.name}
                          onChange={(e) =>
                            handleUpdateLogo({ ...logo, name: e.target.value })
                          }
                          style={{
                            position: "absolute",
                            top: -30,
                            left: 0,
                            width: "100%",
                            fontSize: 12,
                            padding: 2,
                            zIndex: 15,
                          }}
                        />
                      )}

                      {/* Delete Button */}
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
                  ))}
                </div>
              )}

              {/* Save Button */}
              {placedLogos.length > 0 && (
                <button
                  onClick={saveCustomizations}
                  className="btn btn-primary mt-3"
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
