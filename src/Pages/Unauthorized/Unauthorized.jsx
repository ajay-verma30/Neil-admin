import React from "react";
import { Container, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

function Unauthorized() {
  const navigate = useNavigate();

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light text-center">
      <Container>
        <div className="p-5 shadow-lg rounded-4 bg-white mx-auto" style={{ maxWidth: "500px" }}>
          <div className="display-1 text-danger fw-bold mb-3">403</div>
          <h2 className="fw-bold text-dark mb-3">Access Denied</h2>
          <p className="text-muted mb-4">
            Oops! You don't have permission to access this page. 
            It seems you've wandered into a restricted area.
          </p>
          <div className="d-grid gap-2">
            <Button 
              variant="primary" 
              size="lg" 
              onClick={() => navigate("/")}
              className="fw-semibold"
            >
              Back to Home
            </Button>
            <Button 
              variant="outline-secondary" 
              onClick={() => navigate(-1)}
            >
              Go Back
            </Button>
          </div>
        </div>
      </Container>
    </div>
  );
}

export default Unauthorized;