import React, { useContext } from "react";
import { Navbar, Nav, Container, Dropdown, Badge } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserCircle, faPowerOff, faShoppingCart } from "@fortawesome/free-solid-svg-icons";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "./TopBar.css";

function TopBar() {
  const { logout, user, cartCount } = useContext(AuthContext); // ✅ get cartCount here
  const navigate = useNavigate();

  const handleLogout = async (e) => {
    e.preventDefault();
    try {
      await logout();
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Logout failed:", error);
      navigate("/", { replace: true });
    }
  };

  const handleNavigation = () => {
    if (user?.role === "Super Admin") navigate("/dashboard");
    else if (user?.role === "Admin" || user?.role === "Manager")
      navigate(`/${user?.org_id}/dashboard`);
    else navigate("/products");
  };

  const handleCartClick = () => navigate("/cart");

  return (
    <Navbar bg="white" expand="lg" fixed="top" className="shadow-sm py-2 topbar">
      <Container fluid>
        <Navbar.Brand onClick={handleNavigation} className="fw-bold text-primary" style={{ cursor: "pointer" }}>
          Neil Prints & Services
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="main-navbar" />
        <Navbar.Collapse id="main-navbar" className="justify-content-end">
          <Nav className="d-flex align-items-center gap-3">

            {/* 🛒 Cart Icon */}
            <div onClick={handleCartClick} className="position-relative" style={{ cursor: "pointer" }}>
              <FontAwesomeIcon icon={faShoppingCart} size="lg" />
              {cartCount > 0 && (
                <Badge
                  bg="danger"
                  pill
                  className="position-absolute top-0 start-100 translate-middle"
                >
                  {cartCount}
                </Badge>
              )}
            </div>

            {/* 👤 User Dropdown */}
            <Dropdown align="end">
              <Dropdown.Toggle
                variant="light"
                id="dropdown-basic"
                className="border-0 d-flex align-items-center text-dark"
              >
                <FontAwesomeIcon icon={faUserCircle} className="me-2" />
                <span className="fw-semibold">{user?.email || "User"}</span>
              </Dropdown.Toggle>

              <Dropdown.Menu className="topbar-dropdown-menu">
                <Dropdown.Item onClick={handleLogout} className="text-danger">
                  <FontAwesomeIcon icon={faPowerOff} className="me-2" />
                  Logout
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default TopBar;
