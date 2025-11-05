import React from 'react'
import TopBar from '../Components/TopBar/TopBar'
import './Common.css'
import ProductList from './ProductList'
import { Row,Col } from 'react-bootstrap'
import Sidebar from './SideBar'

function UserProducts() {
  return (
    <>
      <TopBar/>
      <div className="hero">
      </div>
      <Row>
        <Col xs={2}>
        <Sidebar/>
        </Col>
        <Col xs={10}>
          <ProductList/>
        </Col>
      </Row>
    </>
  )
}

export default UserProducts