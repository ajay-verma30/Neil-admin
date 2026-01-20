import React, { useContext, useEffect, useState } from "react";
import { Navbar, Nav, Container, Dropdown, Button, Badge } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUserCircle,
  faPowerOff,
  faUser,
  faBoxOpen,
  faShoppingCart,
  faWallet
} from "@fortawesome/free-solid-svg-icons";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import "./TopBar.css";
import { CartContext } from "../../context/CartContext";
import axios from "axios";

function TopBar() {
  const { logout, user, accessToken } = useContext(AuthContext);
  const { cartCount } = useContext(CartContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [orgDetails, setOrgDetails] = useState(null);

  const isAdminPage = location.pathname.includes("admin");

  useEffect(() => {
    if (!user || user.role === "Super Admin" || !user.org_id) return;

    const getOrgDetails = async () => {
      try {
        const response = await axios.get(
          `https://neil-backend-1.onrender.com/attributes/organization/${user.org_id}/attributes`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
        setOrgDetails(response.data.attributes);
      } catch (err) {
        console.log("Error fetching logo in TopBar:", err);
      }
    };

    getOrgDetails();
  }, [user, accessToken]);

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
    const mode = localStorage.getItem("mode");
    if (user?.role === "Super Admin" || user?.role === "Admin" || user?.role === "Manager") {
      if (mode === "shop") {
        navigate("/");
      } else {
        if (user?.role === "Super Admin") {
          navigate("/admin/dashboard");
        } else {
          navigate(`/${user?.org_id}/dashboard`);
        }
      }
    } else {
      navigate("/");
    }
  };

  const handleProfileNav = () => {
    if (user.role === "Super Admin") {
      navigate('/admin/my-profile');
    } else if (user.role === "Admin" || user.role === "Manager") {
      navigate(`/${user?.org_id}/my-profile`);
    } else {
      navigate('/my-profile');
    }
  };

  const handleWalletNav = () => navigate('/my-wallet');
  const handleCartClick = () => navigate("/cart");
  const handleOrdersClick = () => navigate("/orders");

  return (
    <Navbar bg="white" expand="lg" fixed="top" className="shadow-sm topbar-custom">
      <Container fluid className="px-lg-5">
        <Navbar.Brand
          onClick={handleNavigation}
          className="fw-bold text-primary d-flex align-items-center"
          style={{ cursor: "pointer" }}
        >
          {orgDetails?.logo ? (
            <img
              src={orgDetails.logo}
              alt="Org Logo"
              style={{ height: "35px", objectFit: "contain" }}
            />
          ) : (
            <span style={{ fontSize: "1.25rem" }}>Neil Prints</span>
          )}
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="main-navbar" />

        <Navbar.Collapse id="main-navbar" className="justify-content-end">
          <Nav className="align-items-center gap-2">
            
            {!isAdminPage && (
              <Nav.Item className="position-relative me-lg-2">
                <Button 
                  variant="light" 
                  onClick={handleCartClick}
                  className="rounded-pill cart-btn d-flex align-items-center justify-content-center"
                >
                  <FontAwesomeIcon icon={faShoppingCart} className="text-primary" />
                  {cartCount > 0 && (
                    <Badge pill bg="danger" className="cart-badge">
                      {cartCount > 9 ? "9+" : cartCount}
                    </Badge>
                  )}
                </Button>
              </Nav.Item>
            )}

            {user ? (
              <Dropdown as={Nav.Item} align="end">
                <Dropdown.Toggle
                  as="div"
                  id="user-dropdown"
                  className="d-flex align-items-center px-2 profile-toggle text-dark"
                  style={{ cursor: "pointer" }}
                >
                  <FontAwesomeIcon icon={faUserCircle} size="lg" className="text-primary me-2" />
                  <span className="fw-semibold d-none d-sm-inline">
                    {user?.email?.split('@')[0] || "User"}
                  </span>
                </Dropdown.Toggle>

                <Dropdown.Menu className="shadow border-0 mt-2 custom-dropdown-menu">
                  <Dropdown.Item onClick={handleProfileNav} className="py-2">
                    <FontAwesomeIcon icon={faUser} className="me-2 text-primary" />
                    My Profile
                  </Dropdown.Item>

                  <Dropdown.Item onClick={handleWalletNav} className="py-2">
                    <FontAwesomeIcon icon={faWallet} className="me-2 text-primary" />
                    Wallet
                  </Dropdown.Item>

                  {!isAdminPage && (
                    <Dropdown.Item onClick={handleOrdersClick} className="py-2">
                      <FontAwesomeIcon icon={faBoxOpen} className="me-2 text-primary" />
                      Orders
                    </Dropdown.Item>
                  )}

                  <Dropdown.Divider />
                  
                  <Dropdown.Item onClick={handleLogout} className="text-danger py-2">
                    <FontAwesomeIcon icon={faPowerOff} className="me-2" />
                    Logout
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            ) : (
              <Button 
                variant="primary" 
                onClick={() => navigate("/login")}
                className="px-4 rounded-pill fw-bold btn-sm"
              >
                Login
              </Button>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default TopBar;