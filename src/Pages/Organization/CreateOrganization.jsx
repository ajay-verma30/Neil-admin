import React, { useState, useContext } from 'react';
import TopBar from '../../Components/TopBar/TopBar';
import Sidebar from '../../Components/SideBar/SideBar';
import { Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function CreateOrganization() {
  const { accessToken, user } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    title: '',
    f_name: '',
    l_name: '',
    email: '',
    contact: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const nav = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const { title, f_name, l_name, email, contact, password } = formData;
    if (!title || !f_name || !l_name || !email || !contact || !password) {
      setErrorMsg('Please fill all the required fields.');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(
        'http://localhost:3000/organization/new',
        formData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          withCredentials: true,
        }
      );

      setSuccessMsg(res.data.message || 'Organization created successfully!');
      nav('/admin/organizations');

    } catch (err) {
      setErrorMsg(
        err.response?.data?.message ||
          'Failed to create organization. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'Super Admin') {
    return (
      <div className="text-center mt-5">
        <h3 className="text-danger">You are not allowed to access this page</h3>
      </div>
    );
  }

  return (
    <>
      <TopBar />
      <Row>
        <Col xs={2} md={2}>
          <Sidebar />
        </Col>

        <Col xs={10} md={10} className="p-4">
          <Card className="shadow-lg rounded-4 border-0 p-4 form-box">
            <Card.Body>
              <Card.Title className="mb-4 fw-bold text-primary fs-4">
                Create New Organization
              </Card.Title>

              {errorMsg && <Alert variant="danger">{errorMsg}</Alert>}
              {successMsg && <Alert variant="success">{successMsg}</Alert>}

              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Organization Title</Form.Label>
                      <Form.Control
                        type="text"
                        name="title"
                        placeholder="Enter organization title"
                        value={formData.title}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Admin Email</Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        placeholder="Enter admin email"
                        value={formData.email}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Admin First Name</Form.Label>
                      <Form.Control
                        type="text"
                        name="f_name"
                        placeholder="First name"
                        value={formData.f_name}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Admin Last Name</Form.Label>
                      <Form.Control
                        type="text"
                        name="l_name"
                        placeholder="Last name"
                        value={formData.l_name}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Contact Number</Form.Label>
                      <Form.Control
                        type="text"
                        name="contact"
                        placeholder="Enter contact number"
                        value={formData.contact}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Password</Form.Label>
                      <Form.Control
                        type="password"
                        name="password"
                        placeholder="Enter password"
                        value={formData.password}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <div className="text-end mt-3">
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={loading}
                    className="px-4"
                  >
                    {loading ? (
                      <>
                        <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          role="status"
                          aria-hidden="true"
                          className="me-2"
                        />
                        Creating...
                      </>
                    ) : (
                      'Create Organization'
                    )}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
}

export default CreateOrganization;
