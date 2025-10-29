import React, { useContext, useMemo } from "react";
import { AuthContext } from "../context/AuthContext";
import TopBar from "../Components/TopBar/TopBar";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Table,
  Alert,
  Form,
} from "react-bootstrap";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Cart() {
  const { cart, removeFromCart, addToCart,user,accessToken } = useContext(AuthContext);
  const navigate = useNavigate();

  console.log(user);
  const totalAmount = useMemo(() => {
    return cart
      ?.reduce(
        (sum, item) => sum + parseFloat(item.price || 0) * (item.quantity || 0),
        0
      )
      .toFixed(2);
  }, [cart]);


  const handleQuantityChange = (item, newQuantity) => {
    const qty = Math.max(0, parseInt(newQuantity, 10) || 0);
    if (qty === 0) {
      removeFromCart(item.id);
    } else {
      addToCart({ ...item, quantity: qty - item.quantity });
    }
  };

const handleCheckout = async () => {
  try {
    const res = await axios.post(
      "http://localhost:3000/checkout/new",
      { user, cart },
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    alert(`✅ Order placed successfully! Order ID: ${res.data.orderBatchId || res.data.orderId}`);
    cart.forEach((item) => removeFromCart(item.id));
    navigate("/orders"); 
  } catch (err) {
    console.error("Checkout Error:", err);

    if (err.response?.status === 401) {
      alert("⚠️ Please login to continue checkout.");
      navigate("/login");
    } else {
      alert("❌ Failed to place order. Please try again.");
    }
  }
};



  return (
    <>
      <TopBar />
      <Container className="py-4">
        <h3 className="mb-4">🛒 Your Cart</h3>

        {!cart || cart.length === 0 ? (
          <Alert variant="info" className="text-center py-4">
            Your cart is empty. <br />
            <Button
              variant="primary"
              className="mt-3"
              onClick={() => navigate("/products")}
            >
              Browse Products
            </Button>
          </Alert>
        ) : (
          <Card className="shadow-sm border-0">
            <Card.Body>
              <Table responsive hover className="align-middle">
                <thead>
                  <tr>
                    <th className="text-center">Title</th>
                    <th className="text-center">Quantity</th>
                    <th className="text-center">Price</th>
                    <th className="text-center">Subtotal</th>
                    <th className="text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map((item) => (
  <tr key={item.id}>
    
    <td className="text-center">


      {item.sizes && (
        <div className="text-muted small mt-1">
          {Object.entries(item.sizes)
            .filter(([_, qty]) => qty > 0)
            .map(([size, qty]) => (
              <span key={size} className="me-2">
                {size.toUpperCase()}: {qty}
              </span>
            ))}
        </div>
      )}
    </td>
    <td className="text-center" style={{ width: "100px" }}>
      <Form.Control
        type="number"
        min="0"
        value={item.quantity}
        onChange={(e) => handleQuantityChange(item, e.target.value)}
      />
    </td>
    <td className="text-center">${item.price}</td>
    <td className="text-center">
      ${(parseFloat(item.price) * item.quantity).toFixed(2)}
    </td>
    <td className="text-center">
      <Button
        variant="outline-danger"
        size="sm"
        onClick={() => removeFromCart(item.id)}
      >
        🗑 Remove
      </Button>
    </td>
  </tr>
))}

                </tbody>
              </Table>

              <Row className="mt-4">
                <Col md={6}></Col>
                <Col
                  md={6}
                  className="d-flex flex-column align-items-end border-top pt-3"
                >
                  <h5 className="fw-bold">Total: ${totalAmount}</h5>
                  <Button
                    variant="success"
                    className="mt-3 px-4"
                    onClick={handleCheckout}
                  >
                    Order
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        )}
      </Container>
    </>
  );
}

export default Cart;
