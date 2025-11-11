import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';

const Footer = () => {
  return (
    <footer className="bg-dark text-white py-4 mt-auto" style={{ marginTop: 'auto' }}>
      <Container>
        <Row>
          <Col className="text-center">
            &copy; {new Date().getFullYear()} Neil Prints and Packaging
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;