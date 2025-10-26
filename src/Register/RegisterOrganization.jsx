import React, { useState } from "react";
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from "react-bootstrap";
import axios from "axios";
import "./Register.css"; 
import { useNavigate } from "react-router-dom";

function RegisterOrganization() {
  const [formData, setFormData] = useState({
    title: "",
    f_name: "",
    l_name: "",
    email: "",
    contact: "",
    password: "",
  });
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const { title, f_name, l_name, email, contact, password } = formData;
    if (!title || !f_name || !l_name || !email || !contact || !password) {
      setErrorMsg("Please fill all the fields.");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post("http://localhost:3000/organization/new", formData, {
        withCredentials: true,
      });

      setSuccessMsg(res.data.message || "Organization successfully registered!");
      setFormData({
        title: "",
        f_name: "",
        l_name: "",
        email: "",
        contact: "",
        password: "",
      });
    } catch (err) {
      setErrorMsg(
        err.response?.data?.message || "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const navigateLogin = (e)=>{
    e.preventDefault();
    nav('/')
  }

  return (
    <div className="register-page d-flex align-items-center justify-content-center min-vh-100 bg-light">
      <Container>
        <Row className="justify-content-center">
          <Col md={8} lg={6}>
            <Card className="shadow-lg border-0 rounded-4">
              <Card.Body className="p-4">
                <h3 className="text-center text-primary fw-bold mb-4">
                  Register Your Organization
                </h3>
                <p className="text-center text-muted mb-4">
                  Create your organization and the admin account in one step.
                </p>

                {errorMsg && <Alert variant="danger">{errorMsg}</Alert>}
                {successMsg && <Alert variant="success">{successMsg}</Alert>}

                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label>Organization Title</Form.Label>
                    <Form.Control
                      type="text"
                      name="title"
                      placeholder="e.g. Acme Corporation"
                      value={formData.title}
                      onChange={handleChange}
                    />
                  </Form.Group>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Admin First Name</Form.Label>
                        <Form.Control
                          type="text"
                          name="f_name"
                          placeholder="John"
                          value={formData.f_name}
                          onChange={handleChange}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Admin Last Name</Form.Label>
                        <Form.Control
                          type="text"
                          name="l_name"
                          placeholder="Doe"
                          value={formData.l_name}
                          onChange={handleChange}
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-3">
                    <Form.Label>Admin Email</Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      placeholder="admin@example.com"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Contact Number</Form.Label>
                    <Form.Control
                      type="text"
                      name="contact"
                      placeholder="e.g. +1 234 567 890"
                      value={formData.contact}
                      onChange={handleChange}
                    />
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label>Password</Form.Label>
                    <Form.Control
                      type="password"
                      name="password"
                      placeholder="Create a password"
                      value={formData.password}
                      onChange={handleChange}
                    />
                  </Form.Group>

                  <div className="d-grid">
                    <Button type="submit" variant="primary" disabled={loading}>
                      {loading ? (
                        <>
                          <Spinner
                            as="span"
                            animation="border"
                            size="sm"
                            role="status"
                            aria-hidden="true"
                            className="me-2"
                          />
                          Registering...
                        </>
                      ) : (
                        "Register Organization"
                      )}
                    </Button>
                  </div>
                </Form>

                <div className="text-center mt-4">
                  <p className="text-muted mb-0" onClick={navigateLogin}>
                    Already registered?{" "}
                    <a href="/" className="text-primary fw-semibold">
                      Log in here
                    </a>
                  </p>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default RegisterOrganization;
