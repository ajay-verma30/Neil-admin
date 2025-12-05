import React, { useState, useEffect } from "react";
import TopBar from "../../Components/TopBar/TopBar";
import { Col, Row, Form, Button, Spinner } from "react-bootstrap";
import Sidebar from "../../Components/SideBar/SideBar";
import axios from "axios";
import { useParams } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";

function Customize() {
  const { id } = useParams();
  const {accessToken} = useContext(AuthContext)
  const [orgContext, setOrgContext] = useState("");
  const [textColor, setTextColor] = useState("#000000");
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [logoFile, setLogoFile] = useState(null);
  const [orgImageFile, setOrgImageFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [orgImagePreview, setOrgImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // -------------------------------
  // LOAD EXISTING ATTRIBUTES
  // -------------------------------
  
  
  useEffect(() => {
    const fetchAttributes = async () => {
      try {
        const res = await axios.get(`https://neil-backend-1.onrender.com/attributes/organization/${id}/attributes`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        const data = res.data.attributes;

        setOrgContext(data.org_context || "");
        setTextColor(data.text_color || "#000000");
        setBackgroundColor(data.background_color || "#ffffff");

        if (data.logo) setLogoPreview(data.logo);
        if (data.org_image) setOrgImagePreview(data.org_image);
      } catch (err) {
        console.warn("No existing attributes found:", err.response?.data);
      } finally {
        setFetching(false);
      }
    };

    fetchAttributes();
  }, [id, accessToken]);

  // -------------------------------
  // FILE PREVIEW HANDLER
  // -------------------------------
  const handleFileChange = (e, setFile, setPreview) => {
    const file = e.target.files[0];
    if (file) {
      setFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  // -------------------------------
  // SUBMIT FORM
  // -------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setErrorMsg("");

    try {
      const formData = new FormData();
      formData.append("org_id", id);
      formData.append("org_context", orgContext);
      formData.append("text_color", textColor);
      formData.append("background_color", backgroundColor);

      if (logoFile) formData.append("logo", logoFile);
      if (orgImageFile) formData.append("org_image", orgImageFile);

      const res = await axios.post("https://neil-backend-1.onrender.com/attributes/new-attribute",
        formData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      console.log(res);
    //   setMessage(res.data.message || "Attributes saved.");
    } catch (err) {
      console.error(err);
      setErrorMsg(
        err.response?.data?.message || "Something went wrong. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="p-5 text-center">
        <Spinner animation="border" /> <br />
        Loading organization attributes...
      </div>
    );
  }

  return (
    <>
      <TopBar />
      <Row>
        <Col xs={2} md={2}>
          <Sidebar />
        </Col>

        <Col xs={12} md={10}>
          <div className="p-4 form-box">
            <h2 className="mb-4">Customize Organization Frontend</h2>

            {message && <div className="alert alert-success">{message}</div>}
            {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}

            {/* FORM */}
            <Form onSubmit={handleSubmit}>
              {/* LOGO */}
              <Row>
                <Col xs={12} md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Upload Logo</Form.Label>
                    <Form.Control
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        handleFileChange(e, setLogoFile, setLogoPreview)
                      }
                    />
                    {logoPreview && (
                      <img
                        src={logoPreview}
                        alt="Logo Preview"
                        className="mt-3"
                        style={{ width: "120px", borderRadius: "8px" }}
                      />
                    )}
                  </Form.Group>
                </Col>
              </Row>

              {/* CONTEXT */}
              <Form.Group className="mb-3">
                <Form.Label>Organization Context</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={orgContext}
                  onChange={(e) => setOrgContext(e.target.value)}
                  placeholder="Write context..."
                />
              </Form.Group>

              {/* COLORS */}
              <Row>
                <Col xs={12} md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Text Color</Form.Label>
                    <Form.Control
                      type="color"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                    />
                  </Form.Group>
                </Col>

                <Col xs={12} md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Background Color</Form.Label>
                    <Form.Control
                      type="color"
                      value={backgroundColor}
                      onChange={(e) => setBackgroundColor(e.target.value)}
                    />
                  </Form.Group>
                </Col>
              </Row>

              {/* COVER IMAGE */}
              <Form.Group className="mb-3">
                <Form.Label>Upload Cover Image</Form.Label>
                <Form.Control
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    handleFileChange(e, setOrgImageFile, setOrgImagePreview)
                  }
                />
                {orgImagePreview && (
                  <img
                    src={orgImagePreview}
                    alt="Cover Preview"
                    className="mt-3"
                    style={{ width: "200px", borderRadius: "8px" }}
                  />
                )}
              </Form.Group>

              {/* SUBMIT */}
              <Button
                type="submit"
                variant="primary"
                disabled={loading}
                className="mt-3"
              >
                {loading ? <Spinner size="sm" /> : "Save Attributes"}
              </Button>
            </Form>
          </div>
        </Col>
      </Row>
    </>
  );
}

export default Customize;
