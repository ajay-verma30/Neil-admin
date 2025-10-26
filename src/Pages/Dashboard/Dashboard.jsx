import React, { useContext, useEffect, useState } from 'react';
import TopBar from '../../Components/TopBar/TopBar';
import Sidebar from '../../Components/SideBar/SideBar';
import { AuthContext } from '../../context/AuthContext';
import { Modal, Button } from 'react-bootstrap';

function Dashboard() {
  const { user } = useContext(AuthContext);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    if (user) {
      const popupShown = sessionStorage.getItem('dashboardPopupShown');
      if (!popupShown) {
        setShowPopup(true);
        sessionStorage.setItem('dashboardPopupShown', 'true'); 
      }
    }
  }, [user]);

  const handleClose = () => setShowPopup(false);

  return (
    <>
      <TopBar />
      <Sidebar />

      <Modal show={showPopup} onHide={handleClose} centered>
        <Modal.Header closeButton>
          <Modal.Title>Welcome!</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          You are logged in as <strong>{user?.role}</strong>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={handleClose}>
            OK
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default Dashboard;
