import React, { useContext, useMemo, useEffect, useState } from "react";
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
  Spinner,
} from "react-bootstrap";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Cart() {
  const { cart, removeFromCart, addToCart, user, accessToken } =
    useContext(AuthContext);
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [addressError, setAddressError] = useState("");
  const [newAddress, setNewAddress] = useState({
    type: "shipping",
    address_line_1: "",
    address_line_2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "",
    is_default: false,
  });
  const [selectedShipping, setSelectedShipping] = useState(null);
  const [selectedBilling, setSelectedBilling] = useState(null);

  const totalAmount = useMemo(
    () =>
      cart
        ?.reduce(
          (sum, item) =>
            sum + parseFloat(item.unit_price || 0) * (item.quantity || 0),
          0
        )
        .toFixed(2),
    [cart]
  );

  // 🏠 Fetch user's addresses
  useEffect(() => {
    const fetchAddresses = async () => {
      setLoadingAddresses(true);
      setAddressError("");
      try {
        const res = await axios.get(
          "https://neil-backend-1.onrender.com/address/my-address",
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
        setAddresses(res.data.addresses || []);
      } catch (err) {
        if (err.response?.status === 404) {
          setAddresses([]); // no addresses yet
        } else {
          setAddressError(
            err.response?.data?.message ||
              "Failed to load addresses. Try again later."
          );
        }
      } finally {
        setLoadingAddresses(false);
      }
    };
    if (accessToken) fetchAddresses();
  }, [accessToken]);

  // ➕ Add new address
  const handleAddAddress = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        "https://neil-backend-1.onrender.com/address/new-address",
        newAddress,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      alert("✅ Address added successfully!");
      setNewAddress({
        type: "shipping",
        address_line_1: "",
        address_line_2: "",
        city: "",
        state: "",
        postal_code: "",
        country: "",
        is_default: false,
      });
      // refetch addresses
      const res = await axios.get(
        "https://neil-backend-1.onrender.com/address/my-address",
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      setAddresses(res.data.addresses || []);
    } catch (err) {
      alert(
        err.response?.data?.message || "❌ Failed to add address. Try again."
      );
    }
  };

  // 🧾 Checkout handler
  const handleCheckout = async () => {
    if (!selectedShipping || !selectedBilling) {
      alert("⚠️ Please select both billing and shipping addresses.");
      return;
    }

    try {
      const res = await axios.post(
        "https://neil-backend-1.onrender.com/checkout/new",
        {
          user,
          cart,
          totalAmount,
          shipping_address_id: selectedShipping,
          billing_address_id: selectedBilling,
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      alert(
        `✅ Order placed successfully! Order ID: ${
          res.data.orderBatchId || res.data.orderId
        }`
      );
      cart.forEach((item) => removeFromCart(item.id));
      navigate("/orders");
    } catch (err) {
      if (err.response?.status === 401) {
        alert("⚠️ Please login to continue checkout.");
        navigate("/login");
      } else {
        alert("❌ Failed to place order. Please try again.");
      }
    }
  };

  // 🛒 Quantity change
  const handleQuantityChange = (item, newQuantity) => {
    const qty = Math.max(0, parseInt(newQuantity, 10) || 0);
    if (qty === 0) {
      removeFromCart(item.id);
    } else {
      addToCart({ ...item, quantity: qty - item.quantity });
    }
  };

  return (
    <>
      <TopBar />
      <Container className="py-4">
        <h3 className="mb-4">🛒 Your Cart</h3>

        {/* 🛍 Cart Section */}
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
                      <td className="text-center">{item.title}</td>
                      <td className="text-center" style={{ width: "100px" }}>
                        <Form.Control
                          type="number"
                          min="0"
                          value={item.quantity}
                          onChange={(e) =>
                            handleQuantityChange(item, e.target.value)
                          }
                        />
                      </td>
                      <td className="text-center">${item.unit_price}</td>
                      <td className="text-center">
                        $
                        {(
                          parseFloat(item.unit_price) * item.quantity
                        ).toFixed(2)}
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

              {/* 🏠 Address Section */}
              <div className="mt-4 border-top pt-3">
                <h5>Select Address</h5>

                {loadingAddresses ? (
                  <div className="text-center p-3">
                    <Spinner animation="border" />
                  </div>
                ) : addresses.length > 0 ? (
                  <>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Shipping Address</Form.Label>
                          <Form.Select
                            value={selectedShipping || ""}
                            onChange={(e) =>
                              setSelectedShipping(e.target.value)
                            }
                          >
                            <option value="">Select shipping address</option>
                            {addresses.map((a) => (
                              <option key={a.id} value={a.id}>
                                {a.address_line1}, {a.city}, {a.state}
                              </option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      </Col>

                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Billing Address</Form.Label>
                          <Form.Select
                            value={selectedBilling || ""}
                            onChange={(e) => setSelectedBilling(e.target.value)}
                          >
                            <option value="">Select billing address</option>
                            {addresses.map((a) => (
                              <option key={a.id} value={a.id}>
                                {a.address_line1}, {a.city}, {a.state}
                              </option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </Row>
                  </>
                ) : (
                  <>
                    <Alert variant="info">
                      No addresses found. Add one below 👇
                    </Alert>

                    <Form onSubmit={handleAddAddress}>
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-2">
                            <Form.Label>Address Line 1</Form.Label>
                            <Form.Control
                              required
                              value={newAddress.address_line_1}
                              onChange={(e) =>
                                setNewAddress({
                                  ...newAddress,
                                  address_line_1: e.target.value,
                                })
                              }
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-2">
                            <Form.Label>City</Form.Label>
                            <Form.Control
                              required
                              value={newAddress.city}
                              onChange={(e) =>
                                setNewAddress({
                                  ...newAddress,
                                  city: e.target.value,
                                })
                              }
                            />
                          </Form.Group>
                        </Col>
                      </Row>

                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-2">
                            <Form.Label>State</Form.Label>
                            <Form.Control
                              required
                              value={newAddress.state}
                              onChange={(e) =>
                                setNewAddress({
                                  ...newAddress,
                                  state: e.target.value,
                                })
                              }
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-2">
                            <Form.Label>Postal Code</Form.Label>
                            <Form.Control
                              required
                              value={newAddress.postal_code}
                              onChange={(e) =>
                                setNewAddress({
                                  ...newAddress,
                                  postal_code: e.target.value,
                                })
                              }
                            />
                          </Form.Group>
                        </Col>
                      </Row>

                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-2">
                            <Form.Label>Country</Form.Label>
                            <Form.Control
                              required
                              value={newAddress.country}
                              onChange={(e) =>
                                setNewAddress({
                                  ...newAddress,
                                  country: e.target.value,
                                })
                              }
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6} className="d-flex align-items-end">
                          <Button type="submit" variant="primary">
                            Add Address
                          </Button>
                        </Col>
                      </Row>
                    </Form>
                  </>
                )}
              </div>

              {/* 💰 Checkout Section */}
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
