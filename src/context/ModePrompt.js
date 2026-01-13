import React, { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { Button, Modal } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

const ModePrompt = ({ onClose }) => {
  const { user, setMode } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSelect = (selectedMode) => {
    setMode(selectedMode);

    // ✅ close popup before navigating
    if (onClose) onClose();

    if (selectedMode === "admin") {
      if (user.role === "Super Admin") navigate("/admin/dashboard");
      else navigate(`/${user.org_id}/dashboard`);
    } else {
      navigate("/");
    }
  };

  if (!user || (user.role === "User" && !user.org_id)) return null;

  return (
    <Modal show centered backdrop="static">
      <Modal.Header>
        <Modal.Title>Choose Mode</Modal.Title>
      </Modal.Header>
      <Modal.Body className="text-center">
        <p>How would you like to continue?</p>
        <div className="d-flex justify-content-around mt-4">
          <Button variant="primary" onClick={() => handleSelect("admin")}>
            Go to Admin Dashboard
          </Button>
          <Button variant="success" onClick={() => handleSelect("shop")}>
            Shop as User
          </Button>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default ModePrompt;
