import React, { useState } from "react";
import { Button, Container, Form, Alert, Spinner } from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "./Login.css";

function PasswordReset() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get("token");
  const email = queryParams.get("email");
  const [password, setPassword] = useState("");
  const [confPassword, setConfPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
const [passwordError, setPasswordError] = useState("");
const [confPasswordError, setConfPasswordError] = useState("");

  const resetUserPassword = async (e) => {
    e.preventDefault();
    setErrMsg("");
    setSuccessMsg("");
    setPasswordError("");
  setConfPasswordError("");

  const passwordRegex = /^(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;

    if (!password || !confPassword) {
      setErrMsg("Please fill in all fields.");
      return;
    }

    if (!passwordRegex.test(password)) {
    setPasswordError(
      "Password must be at least 8 characters long, include one lowercase letter, one number, and one special character."
    );
    return;
  }

    if (password !== confPassword) {
      setErrMsg("Passwords do not match.");
      return;
    }

    if (!token || !email) {
      setErrMsg("Invalid or expired reset link.");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post("https://neil-backend-1.onrender.com/auth/reset-password", {
        email,
        token,
        password,
      });

      if (res.status === 200) {
        setSuccessMsg("✅ Password reset successful! Redirecting to login...");
        setTimeout(() => navigate("/"), 3000);
      }
    } catch (error) {
      console.error("Reset error:", error);
      setErrMsg(
        error.response?.data?.message || "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="reset-box">
      <h4 className="text-center mb-4">Reset Password</h4>

      {errMsg && <Alert variant="danger">{errMsg}</Alert>}
      {successMsg && <Alert variant="success">{successMsg}</Alert>}

     <Form onSubmit={resetUserPassword}>
  <Form.Group className="mb-3">
    <Form.Label>New Password</Form.Label>
    <Form.Control
      type="password"
      placeholder="Enter new password"
      value={password}
      onChange={(e) => setPassword(e.target.value)}
      disabled={loading}
      isInvalid={passwordError !== ""}
    />
    {passwordError && (
      <Form.Control.Feedback type="invalid">
        {passwordError}
      </Form.Control.Feedback>
    )}
  </Form.Group>

  <Form.Group className="mb-3">
    <Form.Label>Confirm Password</Form.Label>
    <Form.Control
      type="password"
      placeholder="Re-enter new password"
      value={confPassword}
      onChange={(e) => setConfPassword(e.target.value)}
      disabled={loading}
      isInvalid={confPasswordError !== ""}
    />
    {confPasswordError && (
      <Form.Control.Feedback type="invalid">
        {confPasswordError}
      </Form.Control.Feedback>
    )}
  </Form.Group>

        <hr />

        <div className="text-center">
          <Button type="submit" className="btn-primary w-100" disabled={loading}>
            {loading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Resetting...
              </>
            ) : (
              "Reset Password"
            )}
          </Button>
        </div>
      </Form>
    </Container>
  );
}

export default PasswordReset;
