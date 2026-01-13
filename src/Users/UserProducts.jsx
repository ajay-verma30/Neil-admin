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
  const [orgDetails, setOrgDetails] = useState(null);
  const navigate = useNavigate();

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
    } else {
      setOrgDetails(null);
    }
  }, [user, accessToken]);

  // Fallback Values for Guest Users
  const bannerImage = orgDetails?.org_image || "/Images/product-hero.jpg";
  const bannerBgColor = orgDetails?.background_color || "#222";
  const bannerTextAlign = orgDetails?.text_align || "center";
  const bannerTextColor = orgDetails?.text_color || "#fff";

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
          justifyContent: bannerTextAlign,
          backgroundColor: bannerBgColor,
          backgroundImage: `url(${bannerImage})`, // Backfill image hamesha kaam karegi
          backgroundSize: "cover",
          backgroundPosition: "center",
          position: "relative",
          marginTop: "60px",
          zIndex: 1,
        }}
      >
        {/* Overlay hamesha dikhao readability ke liye, ya sirf image hone pe */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.4)", 
            zIndex: 1,
          }}
        />

        <div
          style={{
            position: "relative",
            zIndex: 2,
            width: "90%",
            maxWidth: "1200px",
            fontSize: "clamp(1.5rem, 4vw, 3rem)", // Font thoda bada kiya text ke liye
            fontWeight: 700,
            lineHeight: 1.2,
            color: bannerTextColor,
            textAlign: bannerTextAlign,
            textShadow: "2px 2px 8px rgba(0,0,0,0.7)",
            overflow: "hidden",
          }}
        >
          {/* 4. Logic: Agar user hai toh org_context, warna Default Text */}
          {user && orgDetails?.org_context ? (
            <div dangerouslySetInnerHTML={{ __html: orgDetails.org_context }} />
          ) : (
            <div>
              <h1>Neil Prints and Services</h1>
              <p style={{ fontSize: "1.2rem", fontWeight: 400 }}>Your One-Stop Custom Printing Solution</p>
            </div>
          )}
        </div>
      </div>

      <Container fluid className="py-4 py-lg-5 bg-light">
        <ProductList /> 
      </Container>      

      <Footer />
    </>
  );
}

export default UserProducts;