import React from 'react'
import TopBar from '../Components/TopBar/TopBar'
import './Common.css'
import ProductList from './ProductList'
import { Row,Col } from 'react-bootstrap'

function UserProducts() {
  return (
    <>
      <TopBar/>
      <div className="hero">
      </div>
      <Row>
        <Col xs={12}>
          <ProductList/>
        </Col>
      </Row>
    </>
  )
}

export default UserProducts