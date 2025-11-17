import React, { useContext, useEffect } from 'react';
import TopBar from '../Components/TopBar/TopBar'; 
import Footer from './Footer'; 
import ProductList from './ProductList';
import { Container } from 'react-bootstrap'; 
import './Common.css';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function UserProducts() {
  const { user, loading, logout } = useContext(AuthContext);
  const navigate = useNavigate();

    useEffect(() => {
    if (!loading) {
      if (!user) {
        logout(); 
        navigate("/");
      }
    }
  }, [loading, user, logout, navigate]);
  return (
    <>
      <TopBar/> 
      <Container fluid className="py-4 py-lg-5 bg-light">
        <ProductList/> 
      </Container>      
      <Footer/>
    </>
  );
}

export default UserProducts;