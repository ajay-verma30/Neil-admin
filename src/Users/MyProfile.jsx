import React, { useContext, useState, useEffect } from "react";
import {
  Col,
  Row,
  Spinner,
  Card,
  Badge,
  Alert,
  Button,
  Container,
  Modal,
  Form,
} from "react-bootstrap";
import TopBar from "../Components/TopBar/TopBar";
import Sidebar from "../Components/SideBar/SideBar";
import { AuthContext } from "../context/AuthContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import {
  PersonCircle,
  Envelope,
  TelephoneFill,
  CalendarDate,
} from "react-bootstrap-icons";

function MyProfile() {
  const { user, accessToken } = useContext(AuthContext);
  const [myUser, setMyUser] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const handleClose = () => {
    setShowModal(false);
    setEditMode(false);
    setSelectedAddressId(null);
    setAddress({
      type: "",
      address_line_1: "",
      address_line_2: "",
      city: "",
      state: "",
      postal_code: "",
      country: "",
      is_default: "",
    });
  };
  const handleShow = () => setShowModal(true);

  const [editMode, setEditMode] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState(null);

  // Address form state
  const [address, setAddress] = useState({
    type: "",
    address_line_1: "",
    address_line_2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "",
    is_default: "",
  });

  // Fetch user profile
  useEffect(() => {
    const getMyUser = async () => {
      try {
        const res = await axios.get("https://neil-backend-1.onrender.com/users/me", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setMyUser(res.data.user);
      } catch (err) {
        setError("Failed to load user profile.");
      }
    };
    getMyUser();
  }, [accessToken]);

  // Fetch user addresses
  const fetchAddresses = async () => {
    try {
      const res = await axios.get("https://neil-backend-1.onrender.com/address/my-address", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setAddresses(res.data.addresses || []);
    } catch (err) {
      if (err.response?.status === 404) {
        setAddresses([]);
      } else {
        setError("Failed to load addresses.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, [accessToken]);

  // Handle form input
  const handleChange = (e) => {
    const { name, value } = e.target;
    setAddress((prev) => ({ ...prev, [name]: value }));
  };

  // Edit handler
  const handleEdit = (addr) => {
    setAddress({
      type: addr.type,
      address_line_1: addr.address_line1,
      address_line_2: addr.address_line2 || "",
      city: addr.city,
      state: addr.state,
      postal_code: addr.postal_code,
      country: addr.country,
      is_default: addr.is_default ? "True" : "False",
    });
    setSelectedAddressId(addr.id);
    setEditMode(true);
    setShowModal(true);
  };

  // Submit handler (Add or Edit)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    try {
      const apiUrl = editMode
        ? `http://localhost:3000/address/edit-address/${selectedAddressId}`
        : "http://localhost:3000/address/new-address";

      const method = editMode ? "put" : "post";

      const res = await axios[method](
        apiUrl,
        {
          ...address,
          is_default: address.is_default === "True",
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      setMessage(
        res.data.message ||
          (editMode ? "Address updated successfully!" : "Address added successfully!")
      );
      handleClose();
      fetchAddresses();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save address.");
    }
  };

  // 🗑️ Handle delete address
const handleDelete = async (id) => {
  if (!window.confirm("Are you sure you want to delete this address?")) return;

  try {
    const res = await axios.delete(
      `https://neil-backend-1.onrender.com/address/delete-address/${id}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    setMessage(res.data.message || "Address deleted successfully!");
    fetchAddresses(); 
  } catch (err) {
    setError(err.response?.data?.message || "Failed to delete address.");
  }
};

  const formattedJoinDate = myUser?.created_at
    ? new Date(myUser.created_at).toLocaleDateString()
    : "N/A";

  const InfoItem = ({ icon, label, value }) => (
    <div className="d-flex align-items-start mb-3">
      <div className="text-primary me-3 pt-1">{icon}</div>
      <div>
        <small className="text-muted d-block">{label}</small>
        <p className="mb-0 fw-bold">{value || "N/A"}</p>
      </div>
    </div>
  );

  return (
    <div>
      <TopBar />
      <Row className="g-0">
        <Col xs={12} className="p-4 bg-light">
          <Container>
            <div className="content-container form-box">
              <h2 className="mb-4 text-dark">👤 My Profile</h2>

              {loading && (
                <div className="text-center p-5">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-3 text-muted">Loading profile data...</p>
                </div>
              )}

              {error && (
                <Alert variant="danger" className="mt-3">
                  {error}
                </Alert>
              )}

              {message && (
                <Alert variant="success" className="mt-3">
                  {message}
                </Alert>
              )}

              {!loading && myUser && (
                <>
                  {/* Profile Card */}
                  <Card className="shadow-sm border-0 rounded-3 mb-4 p-4">
                    <div className="d-flex align-items-center mb-4">
                      <PersonCircle size={60} className="text-secondary me-4" />
                      <div>
                        <h3>
                          {myUser.f_name} {myUser.l_name}
                        </h3>
                        <p className="text-muted mb-1">
                          {myUser.role} at {myUser.org_name}
                        </p>
                        <Badge
                          bg={myUser.isActive ? "success" : "secondary"}
                          className="fw-normal"
                        >
                          {myUser.isActive ? "Active User" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  </Card>

                  <Row>
                    {/* Contact Info */}
                    <Col lg={4} className="mb-4">
                      <Card className="shadow-sm border-0 rounded-3 h-100">
                        <Card.Header className="bg-primary text-white fw-bold">
                          Contact Information
                        </Card.Header>
                        <Card.Body>
                          <InfoItem
                            icon={<Envelope size={20} />}
                            label="Email Address"
                            value={myUser.email}
                          />
                          <InfoItem
                            icon={<TelephoneFill size={20} />}
                            label="Contact Number"
                            value={myUser.contact}
                          />
                          <InfoItem
                            icon={<CalendarDate size={20} />}
                            label="Joined Platform On"
                            value={formattedJoinDate}
                          />
                        </Card.Body>
                      </Card>
                    </Col>

                    {/* Address Section */}
                    <Col lg={8} className="mb-4">
                      <Card className="shadow-sm border-0 rounded-3 h-100">
                        <Card.Header className="bg-primary text-white fw-bold d-flex justify-content-between align-items-center">
                          <span>Saved Addresses</span>
                          <Button variant="light" size="sm" onClick={handleShow}>
                            + Add New
                          </Button>
                        </Card.Header>
                        <Card.Body>
                          {addresses.length > 0 ? (
                            addresses.map((addr) => (
                              <Card
                                key={addr.id}
                                className="mb-3 border rounded p-3 shadow-sm"
                              >
                                <div className="d-flex justify-content-between align-items-start">
                                  <div>
                                    <h6 className="fw-bold text-primary">
                                      {addr.type} Address
                                    </h6>
                                    <p className="mb-1">
                                      {addr.address_line1}
                                      {addr.address_line2
                                        ? `, ${addr.address_line2}`
                                        : ""}
                                    </p>
                                    <p className="mb-1">
                                      {addr.city}, {addr.state}, {addr.country}
                                    </p>
                                    <p className="mb-0">
                                      Postal Code: {addr.postal_code}
                                    </p>
                                  </div>
                                  <div className="text-end">
                                    {addr.is_default === 1 && (
                                      <Badge bg="success" className="mb-2 badge" style={{marginRight:"20px"}}>
                                        Default
                                      </Badge>
                                    )}
                                    <Button
                                      size="sm"
                                      variant="outline-primary"
                                      onClick={() => handleEdit(addr)}
                                    >
                                      Edit
                                    </Button>
                                    <Button
  size="sm"
  variant="outline-danger"
  style={{ marginLeft: "10px" }}
  onClick={() => handleDelete(addr.id)}
>
  <FontAwesomeIcon icon={faTrash} />
</Button>
                                  </div>
                                </div>
                              </Card>
                            ))
                          ) : (
                            <p className="text-muted">
                              No address added yet. Click “Add New”.
                            </p>
                          )}
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                </>
              )}
            </div>
          </Container>
        </Col>
      </Row>

      {/* 🧩 Modal for Add/Edit Address */}
      <Modal show={showModal} onHide={handleClose} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {editMode ? "Edit Address" : "Add New Address"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Address Line 1</Form.Label>
                  <Form.Control
                    name="address_line_1"
                    value={address.address_line_1}
                    onChange={handleChange}
                    required
                    placeholder="Street address"
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Address Line 2</Form.Label>
                  <Form.Control
                    name="address_line_2"
                    value={address.address_line_2}
                    onChange={handleChange}
                    placeholder="Apartment, suite, etc."
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>City</Form.Label>
                  <Form.Control
                    name="city"
                    value={address.city}
                    onChange={handleChange}
                    required
                    placeholder="City"
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>State</Form.Label>
                  <Form.Control
                    name="state"
                    value={address.state}
                    onChange={handleChange}
                    required
                    placeholder="State / Province"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Country</Form.Label>
                  <Form.Control
                    name="country"
                    value={address.country}
                    onChange={handleChange}
                    required
                    placeholder="Country"
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Postal Code</Form.Label>
                  <Form.Control
                    name="postal_code"
                    value={address.postal_code}
                    onChange={handleChange}
                    required
                    placeholder="Postal Code"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Is Default</Form.Label>
                  <Form.Select
                    name="is_default"
                    value={address.is_default}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Set Default...</option>
                    <option value="True">Yes</option>
                    <option value="False">No</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Address Type</Form.Label>
                  <Form.Select
                    name="type"
                    value={address.type}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Address Type...</option>
                    <option value="Billing">Billing</option>
                    <option value="Shipping">Shipping</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <div className="d-flex justify-content-end mt-3">
              <Button variant="secondary" onClick={handleClose} className="me-2">
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                {editMode ? "Update Address" : "Save Address"}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
}

export default MyProfile;
