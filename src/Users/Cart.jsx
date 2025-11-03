import React, { useContext, useEffect, useState, useMemo } from "react";
import TopBar from "../Components/TopBar/TopBar";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Table,
  Image,
  Button,
  Spinner,
  Modal,
  Form,
} from "react-bootstrap";
import axios from "axios";

function Cart() {
  const { user, accessToken } = useContext(AuthContext);
  const navigate = useNavigate();
  const [myCartProducts, setMyCartProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
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
  const [savingAddress, setSavingAddress] = useState(false);
  const [selectedShipping, setSelectedShipping] = useState("");
const [selectedBilling, setSelectedBilling] = useState("");
const [addressContext, setAddressContext] = useState("");

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }

    const getMyCart = async () => {
      try {
        setLoading(true);
        const res = await axios.get(
          `https://neil-backend-1.onrender.com/cart/${user.id}`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
        console.log(res.data);
        setMyCartProducts(res.data);
      } catch (err) {
        console.error("Error fetching cart:", err);
      } finally {
        setLoading(false);
      }
    };

    getMyCart();
  }, [user, accessToken, navigate]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to remove this item?")) return;

    try {
      setDeletingId(id);
      await axios.delete(`https://neil-backend-1.onrender.com/cart/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setMyCartProducts((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error("Error deleting item:", err);
      alert("Failed to delete item.");
    } finally {
      setDeletingId(null);
    }
  };

  const subtotal = useMemo(() => {
    return myCartProducts.reduce(
      (acc, item) => acc + parseFloat(item.total_price || 0),
      0
    );
  }, [myCartProducts]);

  // 🏠 Fetch user's saved addresses
  const handleOrderClick = async () => {
    setShowAddressModal(true);
    setFetchingAddresses(true);
    try {
      const res = await axios.get(
        "https://neil-backend-1.onrender.com/address/my-address",
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      setAddresses(res.data.addresses || []);
    } catch (err) {
      console.error("Error fetching addresses:", err);
      setAddresses([]);
    } finally {
      setFetchingAddresses(false);
    }
  };

  // ➕ Save new address
  const handleSaveAddress = async (e) => {
    e.preventDefault();
    try {
      setSavingAddress(true);
      await axios.post(
        "https://neil-backend-1.onrender.com/address/new-address",
        newAddress,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
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
        country: "",
        is_default: false,
      });
      handleOrderClick(); // refresh list
    } catch (err) {
      console.error("Error saving address:", err);
      alert(err.response?.data?.message || "Failed to save address.");
    } finally {
      setSavingAddress(false);
    }
  };

  return (
    <>
      <TopBar />
      <Container className="mt-5 pt-5">
        <h3 className="mb-4 fw-bold text-primary">🛒 My Cart</h3>

        {loading ? (
          <div className="text-center mt-5">
            <Spinner animation="border" />
          </div>
        ) : myCartProducts.length === 0 ? (
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
                {myCartProducts.map((item, index) => (
                  <tr key={item.id}>
                    <td>{index + 1}</td>
                    <td className="d-flex align-items-center gap-3">
                      <Image
                        src={item.image}
                        alt={item.title}
                        width={60}
                        height={60}
                        rounded
                      />
                      <span>{item.title}</span>
                    </td>
                    <td>
                      {Object.entries(item.sizes || {}).map(([size, details]) => (
                        <div key={size}>
                          <strong>{size.toUpperCase()}</strong>: {details.qty} × $
                          {details.price} = ${details.subtotal}
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
                        {deletingId === item.id ? (
                          <Spinner
                            as="span"
                            animation="border"
                            size="sm"
                            role="status"
                          />
                        ) : (
                          "🗑️ Delete"
                        )}
                      </Button>
                    </td>
                  </tr>
                ))}

                <tr className="table-secondary fw-bold">
                  <td colSpan={3} className="text-end">
                    Subtotal:
                  </td>
                  <td colSpan={2}>${subtotal.toFixed(2)}</td>
                </tr>
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

      {/* 🏠 Address Modal */}
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
      <div className="text-center py-4">
        <Spinner animation="border" />
      </div>
    ) : (
      <div className="row">
        {/* 🏠 Shipping Address */}
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
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => {
                  setShowNewAddressForm(true);
                  setAddressContext("shipping");
                }}
              >
                ➕ Add New Shipping Address
              </Button>
            </>
          ) : (
            <div className="text-center">
              <p>No addresses found.</p>
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => {
                  setShowNewAddressForm(true);
                  setAddressContext("shipping");
                }}
              >
                ➕ Add Address
              </Button>
            </div>
          )}
        </div>

        {/* 💳 Billing Address */}
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
              <Button
                variant="outline-success"
                size="sm"
                onClick={() => {
                  setShowNewAddressForm(true);
                  setAddressContext("billing");
                }}
              >
                ➕ Add New Billing Address
              </Button>
            </>
          ) : (
            <div className="text-center">
              <p>No addresses found.</p>
              <Button
                variant="outline-success"
                size="sm"
                onClick={() => {
                  setShowNewAddressForm(true);
                  setAddressContext("billing");
                }}
              >
                ➕ Add Address
              </Button>
            </div>
          )}
        </div>
      </div>
    )}

    {/* ➕ Add Address Form */}
    {showNewAddressForm && (
      <div className="mt-4 border-top pt-3">
        <h6 className="fw-bold">
          Add New {addressContext === "shipping" ? "Shipping" : "Billing"} Address
        </h6>
        <Form className="mt-3" onSubmit={handleSaveAddress}>
          <Form.Group className="mb-2">
            <Form.Label>Type</Form.Label>
            <Form.Control
              type="text"
              value={newAddress.type}
              onChange={(e) =>
                setNewAddress({ ...newAddress, type: e.target.value })
              }
            />
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label>Address Line 1</Form.Label>
            <Form.Control
              type="text"
              value={newAddress.address_line_1}
              onChange={(e) =>
                setNewAddress({ ...newAddress, address_line_1: e.target.value })
              }
            />
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label>Address Line 2</Form.Label>
            <Form.Control
              type="text"
              value={newAddress.address_line_2}
              onChange={(e) =>
                setNewAddress({ ...newAddress, address_line_2: e.target.value })
              }
            />
          </Form.Group>
          <div className="row">
            <div className="col-md-6">
              <Form.Group className="mb-2">
                <Form.Label>City</Form.Label>
                <Form.Control
                  type="text"
                  value={newAddress.city}
                  onChange={(e) =>
                    setNewAddress({ ...newAddress, city: e.target.value })
                  }
                />
              </Form.Group>
            </div>
            <div className="col-md-6">
              <Form.Group className="mb-2">
                <Form.Label>State</Form.Label>
                <Form.Control
                  type="text"
                  value={newAddress.state}
                  onChange={(e) =>
                    setNewAddress({ ...newAddress, state: e.target.value })
                  }
                />
              </Form.Group>
            </div>
          </div>
          <div className="row">
            <div className="col-md-6">
              <Form.Group className="mb-2">
                <Form.Label>Postal Code</Form.Label>
                <Form.Control
                  type="text"
                  value={newAddress.postal_code}
                  onChange={(e) =>
                    setNewAddress({ ...newAddress, postal_code: e.target.value })
                  }
                />
              </Form.Group>
            </div>
            <div className="col-md-6">
              <Form.Group className="mb-2">
                <Form.Label>Country</Form.Label>
                <Form.Control
                  type="text"
                  value={newAddress.country}
                  onChange={(e) =>
                    setNewAddress({ ...newAddress, country: e.target.value })
                  }
                />
              </Form.Group>
            </div>
          </div>

          <Form.Check
            type="checkbox"
            label="Set as default"
            checked={newAddress.is_default}
            onChange={(e) =>
              setNewAddress({ ...newAddress, is_default: e.target.checked })
            }
          />

          <div className="text-end mt-3">
            <Button type="submit" variant="success" disabled={savingAddress}>
              {savingAddress ? (
                <Spinner animation="border" size="sm" />
              ) : (
                "Save Address"
              )}
            </Button>
          </div>
        </Form>
      </div>
    )}
  </Modal.Body>

  <Modal.Footer className="d-flex justify-content-between">
    <Button variant="secondary" onClick={() => setShowAddressModal(false)}>
      Cancel
    </Button>
    <Button
  variant="success"
  disabled={!selectedShipping || !selectedBilling}
  onClick={async () => {
    try {
      setShowAddressModal(false);

      // ✅ Start loading (optional)
      setLoading(true);

      const payload = {
        user_id: user.id,
        org_id: user.org_id || 1, // replace with your actual org id logic
        shipping_address_id: selectedShipping,
        billing_address_id: selectedBilling,
        payment_method: "COD", // or whatever default you want
      };

      const res = await axios.post(
        "https://neil-backend-1.onrender.com/checkout/create",
        payload,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (res.data.success) {
        alert(`✅ Order placed successfully! Order ID: ${res.data.order_id}`);
        // You could also redirect:
        navigate(`/orders`);
      } else {
        alert("⚠️ Failed to create order. Please try again.");
      }
    } catch (err) {
      console.error("Order creation failed:", err);
      alert(
        err.response?.data?.message ||
          "❌ Something went wrong while creating your order."
      );
    } finally {
      setLoading(false);
    }
  }}
>
  {loading ? (
    <Spinner animation="border" size="sm" />
  ) : (
    "Confirm & Place Order"
  )}
</Button>

  </Modal.Footer>
</Modal>

    </>
  );
}

export default Cart;
