import React, { useContext, useEffect, useState } from "react";
import { Navbar, Nav, Container, Dropdown,Button } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUserCircle,
  faPowerOff,
  faUser,
  faBoxOpen, 
} from "@fortawesome/free-solid-svg-icons";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "./TopBar.css";
import { CartContext } from "../../context/CartContext";
import { useLocation } from "react-router-dom";
import axios from "axios";

function TopBar() {
  const { logout, user, accessToken } = useContext(AuthContext);
  const navigate = useNavigate();
  const [orgDetails, setOrgDetails] = useState();
  const {cart} =useContext(CartContext);
  useEffect(() => {
  if (!user || user.role === "Super Admin") return;

  const getOrgDetails = async () => {
    try {
      const response = await axios.get(
        `https://neil-backend-1.onrender.com/attributes/organization/${user.org_id}/attributes`,
        {
          headers: {
            "Authorization": `Bearer ${accessToken}`,
          },
        }
      );
      setOrgDetails(response.data.attributes);
    } catch (err) {
      console.log(err);
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

  const location = useLocation();
  const isAdminPage = location.pathname.includes("admin");

  const handleNavigation = () => {
    const mode = localStorage.getItem("mode");

    if (user?.role === "Super Admin" || user?.role === "Admin" || user?.role === "Manager") {
      if (mode === "shop") {
        navigate("/products");
      } else {
        if (user?.role === "Super Admin") {
          navigate("/admin/dashboard");
        } else if (user?.role === "Admin" || user?.role === "Manager") {
          navigate(`/${user?.org_id}/dashboard`);
        }
      }
    } else {
      navigate("/products");
    }
  };

  const handleProfileNav = () => {
    if (user.role === "Super Admin"){
      navigate('/admin/my-profile');
    }
    else if(user.role === "Admin" || user.role === "Manager"){
      navigate(`/${user?.org_id}/my-profile`);
    }
    else{
      navigate('/my-profile')
    }
  }
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

            {/* 🛒 Cart Icon */}
            {!window.location.pathname.includes("admin") && (
  <div
    onClick={handleCartClick}
    className="position-relative"
    style={{ cursor: "pointer" }}
  >
    <Button className="btn-primary">My Cart</Button>
  </div>
)}


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

                <Dropdown.Item onClick={handleProfileNav}>
                  <FontAwesomeIcon icon={faUser} className="me-2 text-primary" />
                  My Profile
                </Dropdown.Item>


                <Dropdown.Menu>
      {!isAdminPage && (
        <Dropdown.Item onClick={handleOrdersClick}>
          <FontAwesomeIcon icon={faBoxOpen} className="me-2 text-primary" />
          Orders
        </Dropdown.Item>
      )}
    </Dropdown.Menu>

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
