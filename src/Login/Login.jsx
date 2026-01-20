import React, { useState, useContext, useEffect } from "react";
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from "react-bootstrap";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "./Login.css";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useContext(AuthContext);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const redirectPath = location.state?.redirectTo;

  useEffect(() => {
    setEmail("");
    setPassword("");
    setErrorMsg("");
  }, [isAdmin]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);
    try {
      const res = await login(email, password);
      if (res.success) {
        setSuccessMsg("Login successful! Redirecting...");
        setTimeout(() => {
          if (redirectPath) navigate(redirectPath);
          else {
            if (res.role === "Super Admin") navigate("/admin/dashboard");
            else if (res.role === "Admin" || res.role === "Manager") navigate(`/${res.org_id}/dashboard`);
            else navigate(`/`);
          }
        }, 1000);
      } else {
        setErrorMsg(res.message || "Invalid credentials.");
      }
    } catch (err) {
      setErrorMsg("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page d-flex align-items-center justify-content-center min-vh-100 bg-light">
      <Container>
        <Row className="justify-content-center">
          <Col md={6} lg={5} className="flip-card-wrapper">
            <div className={`flip-card ${isAdmin ? "flipped" : ""}`}>
              <div className="flip-card-inner">
                
                {/* Front Side - User Login */}
                <div className="flip-card-front">
                  <Card className="shadow-lg border-0 rounded-4">
                    <Card.Body className="p-4">
                      <h3 className="text-center text-primary fw-bold mb-3">Login as User 👤</h3>
                      <p className="text-center text-muted mb-4 small">Please log in to access your dashboard.</p>
                      
                      {errorMsg && !isAdmin && <Alert variant="danger">{errorMsg}</Alert>}
                      {successMsg && !isAdmin && <Alert variant="success">{successMsg}</Alert>}

                      <Form onSubmit={handleLogin}>
                        <Form.Group className="mb-3">
                          <Form.Label>Email</Form.Label>
                          <Form.Control type="email" placeholder="user@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                        </Form.Group>
                        <Form.Group className="mb-4">
                          <Form.Label>Password</Form.Label>
                          <Form.Control type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                        </Form.Group>
                        <div className="d-grid mb-3">
                          <Button type="submit" variant="primary" disabled={loading} className="fw-semibold">
                            {loading ? <Spinner animation="border" size="sm" /> : "Login"}
                          </Button>
                        </div>
                        <div className="text-center">
                          <Button variant="link" className="text-decoration-none" onClick={() => setIsAdmin(true)}>Login as Admin →</Button>
                        </div>
                      </Form>
                    </Card.Body>
                  </Card>
                </div>

                {/* Back Side - Admin Login */}
                <div className="flip-card-back">
                  <Card className="shadow-lg border-0 rounded-4">
                    <Card.Body className="p-4">
                      <h3 className="text-center text-danger fw-bold mb-3">Login as Admin 🛠️</h3>
                      <p className="text-center text-muted mb-4 small">Administrative access for management.</p>
                      
                      {errorMsg && isAdmin && <Alert variant="danger">{errorMsg}</Alert>}
                      {successMsg && isAdmin && <Alert variant="success">{successMsg}</Alert>}

                      <Form onSubmit={handleLogin}>
                        <Form.Group className="mb-3">
                          <Form.Label>Email</Form.Label>
                          <Form.Control type="email" placeholder="admin@org.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                        </Form.Group>
                        <Form.Group className="mb-4">
                          <Form.Label>Password</Form.Label>
                          <Form.Control type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                        </Form.Group>
                        <div className="d-grid mb-3">
                          <Button type="submit" variant="danger" disabled={loading} className="fw-semibold">
                            {loading ? <Spinner animation="border" size="sm" /> : "Login as Admin"}
                          </Button>
                        </div>
                        <div className="text-center">
                          <Button variant="link" className="text-decoration-none" onClick={() => setIsAdmin(false)}>← Back to User Login</Button>
                        </div>
                      </Form>
                    </Card.Body>
                  </Card>
                </div>

              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default Login;