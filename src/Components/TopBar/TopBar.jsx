import React, { useContext, useEffect, useState } from "react";
import { Navbar, Nav, Container, Dropdown, Button, Badge } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUserCircle,
  faPowerOff,
  faUser,
  faBoxOpen,
  faShoppingCart, // Shopping cart icon add kiya
} from "@fortawesome/free-solid-svg-icons";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import "./TopBar.css";
import { CartContext } from "../../context/CartContext";
import axios from "axios";

function TopBar() {
  const { logout, user, accessToken } = useContext(AuthContext);
  // cartCount ko context se nikala
  const { cart, cartCount } = useContext(CartContext); 
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
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
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

  const handleCartClick = () => navigate("/cart");
  const handleOrdersClick = () => navigate("/orders");

  return (
    <Navbar bg="white" expand="lg" fixed="top" className="shadow-sm py-2 topbar">
      <Container fluid>
        <Navbar.Brand
          onClick={handleNavigation}
          className="fw-bold text-primary d-flex align-items-center"
          style={{ cursor: "pointer" }}
        >
          {orgDetails?.logo ? (
            <img
              src={orgDetails.logo}
              alt="Org Logo"
              style={{ height: "40px", objectFit: "contain" }}
            />
          ) : (
            "Neil Prints"
          )}
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="main-navbar" />
        <Navbar.Collapse id="main-navbar" className="justify-content-end">
          <Nav className="d-flex align-items-center gap-3">
            
            {/* 🛒 Updated Cart Section */}
            {!isAdminPage && (
              <div 
                onClick={handleCartClick} 
                className="position-relative me-2" 
                style={{ cursor: "pointer" }}
              >
                <Button variant="outline-primary" className="rounded-pill px-3 d-flex align-items-center gap-2">
                  <FontAwesomeIcon icon={faShoppingCart} />
                  <span className="d-none d-md-inline">My Cart</span>
                  {cartCount > 0 && (
                    <Badge 
                      pill 
                      bg="danger" 
                      className="ms-1 px-2"
                      style={{ fontSize: '0.75rem' }}
                    >
                      {cartCount > 9 ? "9+" : cartCount}
                    </Badge>
                  )}
                </Button>
              </div>
            )}

            {user ? (
              <Dropdown align="end">
                <Dropdown.Toggle
                  variant="light"
                  id="dropdown-basic"
                  className="border-0 d-flex align-items-center text-dark bg-transparent px-0"
                >
                  <FontAwesomeIcon icon={faUserCircle} size="lg" className="me-2 text-primary" />
                  <span className="fw-semibold d-none d-sm-inline">
                    {user?.email?.split('@')[0] || "User"}
                  </span>
                </Dropdown.Toggle>

                <Dropdown.Menu className="shadow border-0 mt-2">
                  <Dropdown.Item onClick={handleProfileNav} className="py-2">
                    <FontAwesomeIcon icon={faUser} className="me-2 text-primary" />
                    My Profile
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
                className="px-4 rounded-pill fw-bold"
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