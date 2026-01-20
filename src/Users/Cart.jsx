import React, { useContext, useEffect, useState, useMemo } from "react";
import TopBar from "../Components/TopBar/TopBar";
import Footer from "./Footer";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Container, Table, Image, Button, Spinner, Modal, Form, Alert } from "react-bootstrap";
import axios from "axios";

function Cart() {
  const { user, accessToken } = useContext(AuthContext);
  const navigate = useNavigate();

  // =========================
  // States
  // =========================
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const [walletBalance, setWalletBalance] = useState(0);
  const [applyWallet, setApplyWallet] = useState(false);

  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [fetchingAddresses, setFetchingAddresses] = useState(false);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    type: "",
    address_line_1: "",
    address_line_2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "",
    is_default: false,
  });
  const [selectedShipping, setSelectedShipping] = useState("");
  const [selectedBilling, setSelectedBilling] = useState("");
  const [addressContext, setAddressContext] = useState("");

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // =========================
  // Fetch Cart Items
  // =========================
  useEffect(() => {
    const fetchCart = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`https://neil-backend-1.onrender.com/cart/${user.id}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setCartItems(res.data || []);
        localStorage.setItem("cart", JSON.stringify(res.data || []));
      } catch (err) {
        console.error("Failed to fetch cart:", err);
        setError("Failed to fetch cart items");
      } finally {
        setLoading(false);
      }
    };
    fetchCart();
  }, [user, accessToken]);

  // =========================
  // Fetch Wallet Balance
  // =========================
  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const res = await axios.get("http://localhost:3000/wallet/wallet-balance", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setWalletBalance(Number(res.data.balance || 0));
      } catch (err) {
        console.error("Failed to fetch wallet balance:", err);
        setWalletBalance(0);
      }
    };
    fetchWallet();
  }, [accessToken]);

  // =========================
  // Subtotal & Total Calculation
  // =========================
  const subtotal = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + parseFloat(item.total_price || 0), 0);
  }, [cartItems]);

  const total = useMemo(() => {
    if (!applyWallet) return subtotal;
    return Math.max(subtotal - walletBalance, 0);
  }, [subtotal, walletBalance, applyWallet]);

  // =========================
  // Delete Cart Item
  // =========================
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to remove this item?")) return;
    try {
      setDeletingId(id);
      await axios.delete(`https://neil-backend-1.onrender.com/cart/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const updatedCart = cartItems.filter(item => item.id !== id);
      setCartItems(updatedCart);
      localStorage.setItem("cart", JSON.stringify(updatedCart));
    } catch (err) {
      alert("Failed to delete item.");
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  // =========================
  // Handle Order Button
  // =========================
  const handleOrderClick = async () => {
    setShowAddressModal(true);
    setFetchingAddresses(true);
    try {
      const res = await axios.get("https://neil-backend-1.onrender.com/address/my-address", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setAddresses(res.data.addresses || []);
    } catch (err) {
      console.error("Failed to fetch addresses:", err);
      setAddresses([]);
    } finally {
      setFetchingAddresses(false);
    }
  };

  // =========================
  // Save New Address
  // =========================
  const handleSaveAddress = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        "https://neil-backend-1.onrender.com/address/new-address",
        newAddress,
        { headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" } }
      );
      alert("✅ Address added successfully.");
      setShowNewAddressForm(false);
      setNewAddress({
        type: "",
        address_line_1: "",
        address_line_2: "",
        city: "",
        state: "",
        postal_code: "",
        country: "USA",
        is_default: false,
      });
      handleOrderClick(); // refresh addresses
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save address.");
    }
  };

  // =========================
  // Confirm Order
  // =========================
const handleConfirmOrder = async () => {
  if (!selectedShipping || !selectedBilling) return alert("Select shipping and billing addresses");
  
  try {
    setLoading(true);

    let walletUsed = 0;
    if (applyWallet && walletBalance > 0) {
      walletUsed = Math.min(walletBalance, subtotal);
    }
    const remainingTotal = subtotal - walletUsed;
    let clientSecret = null;
    if (remainingTotal > 0) {
      const pi = await axios.post(
        "https://neil-backend-1.onrender.com/create-payment-intent",
        { amount: Math.round(remainingTotal * 100) }, 
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      clientSecret = pi.data.clientSecret;
    }
    navigate("/payment", {
      state: {
        clientSecret,      
        subtotal,          
        total: remainingTotal,
        walletUsed,        
        cartItems,
        shipping: selectedShipping,
        billing: selectedBilling,
      },
    });

  } catch (err) {
    alert(err.response?.data?.message || "❌ Failed to process order");
    console.error(err);
  } finally {
    setLoading(false);
  }
};

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <TopBar />

      <Container className="mt-5 pt-5" style={{ flex: 1, paddingBottom: "100px" }}>
        <h3 className="mb-4 fw-bold text-primary">🛒 My Cart</h3>

        {/* Wallet Balance Section */}
        <div className="d-flex justify-content-between align-items-center my-3 p-3 border rounded shadow-sm">
          <div><strong>Wallet Balance:</strong> ${walletBalance.toFixed(2)}</div>
          <Form.Check 
            type="checkbox"
            label="Apply Wallet"
            checked={applyWallet}
            onChange={() => setApplyWallet(prev => !prev)}
          />
        </div>

        {/* Messages */}
        {success && <Alert variant="success">{success}</Alert>}
        {error && <Alert variant="danger">{error}</Alert>}

        {/* Cart Table */}
        {loading ? (
          <div className="text-center mt-5"><Spinner animation="border" /></div>
        ) : cartItems.length === 0 ? (
          <p className="text-muted">Your cart is empty.</p>
        ) : (
          <>
            <Table bordered hover responsive className="shadow-sm align-middle">
              <thead className="table-light">
                <tr>
                  <th>#</th>
                  <th>Product</th>
                  <th>Sizes & Quantities</th>
                  <th>Total Price ($)</th>
                  <th className="text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {cartItems.map((item, index) => (
                  <tr key={item.id}>
                    <td>{index + 1}</td>
                    <td className="d-flex align-items-center gap-3">
                      <Image src={item.image} alt={item.title} width={60} height={60} rounded />
                      <span>{item.title}</span>
                    </td>
                    <td>
                      {Object.entries(item.sizes || {}).map(([size, details]) => (
                        <div key={size}>
                          <strong>{size.toUpperCase()}</strong>: {details?.qty} × ${details?.price} = ${details?.subtotal}
                        </div>
                      ))}
                    </td>
                    <td className="fw-semibold">${item.total_price}</td>
                    <td className="text-center">
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                        disabled={deletingId === item.id}
                      >
                        {deletingId === item.id ? <Spinner animation="border" size="sm" /> : "🗑️ Delete"}
                      </Button>
                    </td>
                  </tr>
                ))}
                <tr className="table-secondary fw-bold">
                  <td colSpan={3} className="text-end">Subtotal:</td>
                  <td colSpan={2}>${subtotal.toFixed(2)}</td>
                </tr>
                {applyWallet && (
                  <tr className="table-info fw-bold">
                    <td colSpan={3} className="text-end">Total after Wallet:</td>
                    <td colSpan={2}>${total.toFixed(2)}</td>
                  </tr>
                )}
              </tbody>
            </Table>

            <div className="text-end mt-3">
              <Button variant="success" size="lg" onClick={handleOrderClick}>
                🛍️ Order
              </Button>
            </div>
          </>
        )}
      </Container>

      {/* =========================
          Address Modal
      ========================= */}
      <Modal
        show={showAddressModal}
        onHide={() => setShowAddressModal(false)}
        size="lg"
        centered
        className="form-box"
      >
        <Modal.Header closeButton>
          <Modal.Title>Select Shipping & Billing Addresses</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {fetchingAddresses ? (
            <div className="text-center py-4"><Spinner animation="border" /></div>
          ) : (
            <div className="row">
              {/* Shipping */}
              <div className="col-md-6 border-end">
                <h5 className="fw-bold mb-3 text-primary">Shipping Address</h5>
                {addresses.length > 0 ? (
                  <>
                    <Form.Group className="mb-3">
                      <Form.Select
                        value={selectedShipping || ""}
                        onChange={(e) => setSelectedShipping(e.target.value)}
                      >
                        <option value="">Select Shipping Address</option>
                        {addresses.map((addr) => (
                          <option key={addr.id} value={addr.id}>
                            {addr.type} - {addr.city}, {addr.state}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                    <Button variant="outline-primary" size="sm" onClick={() => { setShowNewAddressForm(true); setAddressContext("shipping"); }}>
                      ➕ Add New Shipping Address
                    </Button>
                  </>
                ) : (
                  <div className="text-center">
                    <p>No addresses found.</p>
                    <Button variant="outline-primary" size="sm" onClick={() => { setShowNewAddressForm(true); setAddressContext("shipping"); }}>
                      ➕ Add Address
                    </Button>
                  </div>
                )}
              </div>

              {/* Billing */}
              <div className="col-md-6">
                <h5 className="fw-bold mb-3 text-success">Billing Address</h5>
                {addresses.length > 0 ? (
                  <>
                    <Form.Group className="mb-3">
                      <Form.Select
                        value={selectedBilling || ""}
                        onChange={(e) => setSelectedBilling(e.target.value)}
                      >
                        <option value="">Select Billing Address</option>
                        {addresses.map((addr) => (
                          <option key={addr.id} value={addr.id}>
                            {addr.type} - {addr.city}, {addr.state}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                    <Button variant="outline-success" size="sm" onClick={() => { setShowNewAddressForm(true); setAddressContext("billing"); }}>
                      ➕ Add New Billing Address
                    </Button>
                  </>
                ) : (
                  <div className="text-center">
                    <p>No addresses found.</p>
                    <Button variant="outline-success" size="sm" onClick={() => { setShowNewAddressForm(true); setAddressContext("billing"); }}>
                      ➕ Add Address
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* New Address Form */}
          {showNewAddressForm && (
            <div className="mt-4 border-top pt-3">
              <h6 className="fw-bold">Add New {addressContext === "shipping" ? "Shipping" : "Billing"} Address</h6>
              <Form className="mt-3" onSubmit={handleSaveAddress}>
                <Form.Group className="mb-2">
                  <Form.Label>Type</Form.Label>
                  <Form.Control type="text" value={newAddress.type} onChange={(e) => setNewAddress({...newAddress, type: e.target.value})} />
                </Form.Group>
                <Form.Group className="mb-2">
                  <Form.Label>Address Line 1</Form.Label>
                  <Form.Control type="text" value={newAddress.address_line_1} onChange={(e) => setNewAddress({...newAddress, address_line_1: e.target.value})} />
                </Form.Group>
                <Form.Group className="mb-2">
                  <Form.Label>Address Line 2</Form.Label>
                  <Form.Control type="text" value={newAddress.address_line_2} onChange={(e) => setNewAddress({...newAddress, address_line_2: e.target.value})} />
                </Form.Group>
                <div className="row">
                  <div className="col-md-6">
                    <Form.Group className="mb-2">
                      <Form.Label>City</Form.Label>
                      <Form.Control type="text" value={newAddress.city} onChange={(e) => setNewAddress({...newAddress, city: e.target.value})} />
                    </Form.Group>
                  </div>
                  <div className="col-md-6">
                    <Form.Group className="mb-2">
                      <Form.Label>State</Form.Label>
                      <Form.Control type="text" value={newAddress.state} onChange={(e) => setNewAddress({...newAddress, state: e.target.value})} />
                    </Form.Group>
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-6">
                    <Form.Group className="mb-2">
                      <Form.Label>Postal Code</Form.Label>
                      <Form.Control type="text" value={newAddress.postal_code} onChange={(e) => setNewAddress({...newAddress, postal_code: e.target.value})} />
                    </Form.Group>
                  </div>
                  <div className="col-md-6">
                    <Form.Group className="mb-2">
                      <Form.Label>Country</Form.Label>
                      <Form.Control type="text" value={newAddress.country} onChange={(e) => setNewAddress({...newAddress, country: e.target.value})} />
                    </Form.Group>
                  </div>
                </div>

                <Form.Check type="checkbox" label="Set as default" checked={newAddress.is_default} onChange={(e) => setNewAddress({...newAddress, is_default: e.target.checked})} />

                <div className="text-end mt-3">
                  <Button type="submit" variant="success" disabled={loading}>
                    {loading ? <Spinner animation="border" size="sm" /> : "Save Address"}
                  </Button>
                </div>
              </Form>
            </div>
          )}
        </Modal.Body>

        <Modal.Footer className="d-flex justify-content-between">
          <Button variant="secondary" onClick={() => setShowAddressModal(false)}>Cancel</Button>
          <Button variant="success" disabled={!selectedShipping || !selectedBilling || loading} onClick={handleConfirmOrder}>
            {loading ? <Spinner animation="border" size="sm" /> : "Confirm & Place Order"}
          </Button>
        </Modal.Footer>
      </Modal>

      <Footer />
    </div>
  );
}

export default Cart;
