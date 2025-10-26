import React, { useContext } from 'react';
import { Navbar, Nav, Container, Dropdown, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserCircle, faPowerOff, faBookmark } from '@fortawesome/free-solid-svg-icons';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import './TopBar.css';

function TopBar() {
  const { logout, user } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = async (e) => {
    e.preventDefault();
    try {
      await logout();
      navigate('/', { replace: true });
    } catch (error) {
      console.error("Logout failed:", error);
      navigate('/', { replace: true });
    }
  };

  return (
    <Navbar bg="white" expand="lg" fixed="top" className="shadow-sm py-2 topbar">
      <Container fluid>
        <Navbar.Brand as={Link} to="/dashboard" className="fw-bold text-primary">
          Neil Prints & Services
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="main-navbar" />
        <Navbar.Collapse id="main-navbar" className="justify-content-end">
          {/* Use d-flex to ensure alignment of all elements on the right */}
          <Nav className="d-flex align-items-center"> 
               <Dropdown align="end" drop="down">
              <Dropdown.Toggle
                variant="light"
                id="dropdown-basic"
                className="border-0 d-flex align-items-center text-dark"
              >
                <FontAwesomeIcon icon={faUserCircle} className="me-2" />
                <span className="fw-semibold">{user?.email || 'User'}</span>
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