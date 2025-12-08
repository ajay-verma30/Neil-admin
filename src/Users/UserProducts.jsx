import React, { useContext, useEffect, useState } from 'react';
import TopBar from '../Components/TopBar/TopBar'; 
import Footer from './Footer'; 
import ProductList from './ProductList';
import { Container } from 'react-bootstrap'; 
import './Common.css';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function UserProducts() {
  const { user, loading, logout, accessToken } = useContext(AuthContext);
  const [orgDetails, setOrgDetails] = useState();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      logout(); 
      navigate("/");
    }
  }, [loading, user, logout, navigate]);

  useEffect(() => {
    if (user?.org_id) {
      const getOrgDetails = async () => {
        try {
          const response = await axios.get(
            `https://neil-backend-1.onrender.com/attributes/organization/${user.org_id}/attributes`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
          setOrgDetails(response.data.attributes);
        } catch (err) {
          console.log("Error fetching org details:", err);
        }
      };
      getOrgDetails();
    }
  }, [user, accessToken]);

  return (
    <>
      <TopBar />

      <div
        className="banner"
        style={{
          height: "50vh",
          maxHeight: "50vh",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: orgDetails?.text_align || "center", // respects text_align
          backgroundColor: orgDetails?.background_color || "#f8f9fa",
          backgroundImage: orgDetails?.org_image
            ? `url(${orgDetails.org_image})`
            : "none",
          backgroundSize: "cover",
          backgroundPosition: "center",
          position: "relative",
          marginTop: "60px",
          zIndex: 1,
        }}
      >
        {orgDetails?.org_image && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              backgroundColor: "rgba(0,0,0,0.3)", // overlay for readability
              zIndex: 1,
            }}
          />
        )}

        {orgDetails?.org_context && (
          <div
            dangerouslySetInnerHTML={{ __html: orgDetails.org_context }}
            style={{
              position: "relative",
              zIndex: 2,
              width: "90%",
              maxWidth: "1200px",
              fontSize: "clamp(1rem, 2vw, 1.5rem)",
              fontWeight: 500,
              lineHeight: 1.5,
              color: orgDetails?.text_color || "#fff",
              textAlign: orgDetails?.text_align || "center",
              textShadow: "1px 1px 4px rgba(0,0,0,0.5)",
              overflow: "hidden",
            }}
          />
        )}
      </div>

      <Container fluid className="py-4 py-lg-5 bg-light">
        <ProductList /> 
      </Container>      

      <Footer />
    </>
  );
}

export default UserProducts;
