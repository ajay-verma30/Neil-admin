import React from 'react'
import TopBar from '../Components/TopBar/TopBar'
import './Common.css'
import ProductList from './ProductList'

function UserProducts() {
  return (
    <>
      <TopBar/>
      <div className="hero">
      </div>
      <ProductList/>
    </>
  )
}

export default UserProducts