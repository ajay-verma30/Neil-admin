import React from 'react'
import TopBar from '../../Components/TopBar/TopBar'
import { Col, Row } from 'react-bootstrap'
import Sidebar from '../../Components/SideBar/SideBar'

function Orders() {
  return (
    <>
        <TopBar/>
        <Row>
            <Col xs={2} md={2}>
                <Sidebar/>
            </Col>
            <Col xs={10} md={10}>
                <div className="form-box">
                    
                </div>
            </Col>
        </Row>
    </>
  )
}

export default Orders