import React, { useContext, useState } from 'react'
import TopBar from '../../Components/TopBar/TopBar'
import Sidebar from '../../Components/SideBar/SideBar'
import { Row, Col, Form, Button, Spinner, Alert } from 'react-bootstrap'
import { AuthContext } from '../../context/AuthContext'
import { useParams } from 'react-router-dom'
import axios from 'axios'

function NewUser() {
    const { user, accessToken } = useContext(AuthContext)
    const { org_id: orgIdFromParams } = useParams() // if coming from /:org_id/users/new
    const [formData, setFormData] = useState({
        f_name: '',
        l_name: '',
        email: '',
        contact: '',
        password: '',
        role: 'User',
        org_id: user.role === 'Super Admin' ? '' : (orgIdFromParams || user.org_id) // auto-fill
    })
    const [loading, setLoading] = useState(false)
    const [alert, setAlert] = useState(null)

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setAlert(null)
        setLoading(true)
        try {
            const payload = { ...formData }
            // Remove org_id for Admin/Manager in formData if it is empty (Super Admin handles it manually)
            if (user.role !== 'Super Admin') {
                payload.org_id = user.org_id
            }
            const res = await axios.post(
                'http://localhost:3000/users/new',
                payload,
                { headers: { Authorization: `Bearer ${accessToken}` } }
            )
            setAlert({ type: 'success', message: res.data.message })
            setFormData({
                f_name: '',
                l_name: '',
                email: '',
                contact: '',
                password: '',
                role: 'User',
                org_id: user.role === 'Super Admin' ? '' : (orgIdFromParams || user.org_id)
            })
        } catch (err) {
            console.error(err)
            setAlert({
                type: 'danger',
                message: err.response?.data?.message || 'Failed to create user'
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <TopBar/>
            <Row>
                <Col xs={2} md={2}>
                    <Sidebar/>
                </Col>
                <Col xs={10} md={10}>
                    <div className="form-box p-4">
                        <h4 className="mb-4">Create New User</h4>

                        {alert && (
                            <Alert variant={alert.type} onClose={() => setAlert(null)} dismissible>
                                {alert.message}
                            </Alert>
                        )}

                        <Form onSubmit={handleSubmit}>
                            <Row className="mb-3">
                                <Col>
                                    <Form.Label>First Name</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="f_name"
                                        value={formData.f_name}
                                        onChange={handleChange}
                                        required
                                    />
                                </Col>
                                <Col>
                                    <Form.Label>Last Name</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="l_name"
                                        value={formData.l_name}
                                        onChange={handleChange}
                                        required
                                    />
                                </Col>
                            </Row>

                            <Row className="mb-3">
                                <Col>
                                    <Form.Label>Email</Form.Label>
                                    <Form.Control
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                    />
                                </Col>
                                <Col>
                                    <Form.Label>Contact</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="contact"
                                        value={formData.contact}
                                        onChange={handleChange}
                                        required
                                    />
                                </Col>
                            </Row>

                            <Row className="mb-3">
                                <Col>
                                    <Form.Label>Password</Form.Label>
                                    <Form.Control
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                    />
                                </Col>
                                <Col>
                                    <Form.Label>Role</Form.Label>
                                    <Form.Select
                                        name="role"
                                        value={formData.role}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="User">User</option>
                                        <option value="Admin">Admin</option>
                                        <option value="Manager">Manager</option>
                                        {user.role === 'Super Admin' && <option value="Super Admin">Super Admin</option>}
                                    </Form.Select>
                                </Col>
                            </Row>

                            {user.role === 'Super Admin' ? (
                                <Form.Group className="mb-3">
                                    <Form.Label>Organization ID</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="org_id"
                                        value={formData.org_id}
                                        onChange={handleChange}
                                        required
                                    />
                                </Form.Group>
                            ) : (
                                <Form.Group className="mb-3">
                                    <Form.Label>Organization ID</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={formData.org_id}
                                        disabled
                                    />
                                </Form.Group>
                            )}

                            <Button variant="primary" type="submit" disabled={loading}>
                                {loading ? <Spinner animation="border" size="sm" className="me-2"/> : null}
                                {loading ? 'Creating...' : 'Create User'}
                            </Button>
                        </Form>
                    </div>
                </Col>
            </Row>
        </>
    )
}

export default NewUser
