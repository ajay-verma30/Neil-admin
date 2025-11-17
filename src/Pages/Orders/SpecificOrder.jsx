import React, { useContext, useEffect, useState } from "react";
import {
    Row,
    Col,
    Card,
    Spinner,
    Alert,
    Table,
    Badge,
    Form,
    Button,
    Image,
} from "react-bootstrap";
import TopBar from "../../Components/TopBar/TopBar";
import Sidebar from "../../Components/SideBar/SideBar";
import { AuthContext } from "../../context/AuthContext";
import axios from "axios";
import { useParams } from "react-router-dom";

const flattenAndMergeOrderItems = (cartItems, customizations) => {
    const flattenedCartItems = cartItems.flat();
    const customizationMap = customizations.reduce((acc, curr) => {
        if (curr && curr.customization_id) {
            acc[curr.customization_id] = curr;
        }
        return acc;
    }, {});

    return flattenedCartItems.map(item => {
        const customization = customizationMap[item.customizations_id] || {};
        
        return {
            ...item,
            ...customization,
            cart_item_id: item.id, 
            customization_id: customization.customization_id || item.customizations_id, 
        };
    });
};


function SpecificOrder() {
    const { user, accessToken } = useContext(AuthContext);
    const { id } = useParams();

    const [order, setOrder] = useState(null);
    const [orderItems, setOrderItems] = useState([]); 
    const [loading, setLoading] = useState(false);
    const [errMsg, setErrMsg] = useState("");
    const [status, setStatus] = useState("");
    const [note, setNote] = useState("");
    const [updating, setUpdating] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");

    const statusOptions = [
        "Pending",
        "Processing",
        "Shipped",
        "Delivered",
        "Cancelled",
        "Returned",
    ];

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                setLoading(true);
                const res = await axios.get(
                    `https://neil-backend-1.onrender.com/checkout/${id}`,
                    {
                        headers: { Authorization: `Bearer ${accessToken}` },
                    }
                );
                const fetchedOrder = res.data.data || res.data;                
                setOrder(fetchedOrder);
                setStatus(fetchedOrder.status);
                if (fetchedOrder.cartItems && fetchedOrder.customizations) {
                    const mergedItems = flattenAndMergeOrderItems(
                        fetchedOrder.cartItems,
                        fetchedOrder.customizations
                    );
                    setOrderItems(mergedItems);
                }
            } catch (err) {
                console.error("Error fetching order:", err);
                setErrMsg(
                    err.response?.data?.message || "Failed to fetch order details."
                );
            } finally {
                setLoading(false);
            }
        };

        if (accessToken) fetchOrder();
    }, [id, accessToken]);

    const handleUpdate = async () => {
        if (!status && !note) return;
        setUpdating(true);
        setErrMsg("");
        setSuccessMsg("");

        try {
            const res = await axios.patch(
                `https://neil-backend-1.onrender.com/checkout/${id}`,
                { status, note },
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );

            setSuccessMsg("Order updated successfully!");
            setOrder((prev) => ({
                ...prev,
                status,
            }));
            setNote('');
        } catch (err) {
            console.error("Error updating order:", err);
            setErrMsg(err.response?.data?.message || "Failed to update order.");
        } finally {
            setUpdating(false);
        }
    };
    return (
        <>
            <TopBar />
            <Row>
                <Col xs={2}>
                    <Sidebar />
                </Col>
                <Col xs={10} md={10}>
                    <div className="d-flex">
                        <div className="p-4 flex-grow-1 bg-light min-vh-100 form-box">
                            {loading ? (
                                <div className="text-center mt-5">
                                    <Spinner animation="border" variant="primary" />
                                </div>
                            ) : errMsg ? (
                                <Alert variant="danger" className="mt-3">
                                    {errMsg}
                                </Alert>
                            ) : order ? (
                                <>
                                    <Card className="shadow-sm mb-4 border-0">
                                        <Card.Body>
                                            <div className="d-flex justify-content-between align-items-center">
                                                <h4 className="fw-bold text-primary mb-0">
                                                    Order #{order.id}
                                                </h4>
                                                <Badge
                                                    bg={
                                                        order.status === "Pending"
                                                            ? "warning"
                                                            : order.status === "Delivered"
                                                            ? "success"
                                                            : order.status === "Cancelled"
                                                            ? "danger"
                                                            : "secondary"
                                                    }
                                                >
                                                    {order.status}
                                                </Badge>
                                            </div>
                                            <p className="text-muted mb-0">
                                                <small>Batch ID: {order.order_batch_id}</small>
                                            </p>
                                        </Card.Body>
                                    </Card>

                                    {user?.role === "Super Admin" && (
                                        <Card className="shadow-sm mb-4 border-0">
                                            <Card.Header className="fw-semibold bg-white">
                                                Update Order
                                            </Card.Header>
                                            <Card.Body>
                                                {successMsg && (
                                                    <Alert variant="success">{successMsg}</Alert>
                                                )}
                                                {errMsg && <Alert variant="danger">{errMsg}</Alert>}

                                                <Form>
                                                    <Row className="align-items-center">
                                                        <Col md={4} className="mb-3">
                                                            <Form.Group>
                                                                <Form.Label>Status</Form.Label>
                                                                <Form.Select
                                                                    value={status}
                                                                    onChange={(e) => setStatus(e.target.value)}
                                                                >
                                                                    {statusOptions.map((opt) => (
                                                                        <option key={opt} value={opt}>
                                                                            {opt}
                                                                        </option>
                                                                    ))}
                                                                </Form.Select>
                                                            </Form.Group>
                                                        </Col>

                                                        <Col md={8} className="mb-3">
                                                            <Form.Group>
                                                                <Form.Label>Notes</Form.Label>
                                                                <Form.Control
                                                                    as="textarea"
                                                                    rows={4}
                                                                    placeholder="Enter notes about this order..."
                                                                    value={note}
                                                                    onChange={(e) => setNote(e.target.value)}
                                                                />
                                                            </Form.Group>
                                                        </Col>
                                                    </Row>

                                                    <div className="text-end">
                                                        <Button
                                                            variant="primary"
                                                            disabled={updating || (!status && !note)}
                                                            onClick={handleUpdate}
                                                        >
                                                            {updating ? "Updating..." : "Update Order"}
                                                        </Button>
                                                    </div>
                                                </Form>
                                            </Card.Body>
                                        </Card>
                                    )}

                                    <Card className="shadow-sm mb-4 border-0">
                                        <Card.Header className="fw-semibold bg-white">
                                            Customer Details
                                        </Card.Header>
                                        <Card.Body>
                                            <Row>
                                                <Col md={6}>
                                                    <p className="mb-1">
                                                        <strong>Name:</strong>{" "}
                                                        {order.customer?.f_name} {order.customer?.l_name}
                                                    </p>
                                                    <p className="mb-0">
                                                        <strong>Email:</strong> {order.customer?.email}
                                                    </p>
                                                </Col>
                                                <Col md={6}>
                                                    <p className="mb-1">
                                                        <strong>Payment Method:</strong>{" "}
                                                        {order.payment_method}
                                                    </p>
                                                    <p className="mb-0">
                                                        <strong>Payment Status:</strong>{" "}
                                                        <Badge
                                                            bg={
                                                                order.payment_status === "Paid"
                                                                    ? "success"
                                                                    : "secondary"
                                                            }
                                                        >
                                                            {order.payment_status}
                                                        </Badge>
                                                    </p>
                                                </Col>
                                            </Row>
                                        </Card.Body>
                                    </Card>

                                    {/* 📦 Addresses */}
                                    <Row>
                                        <Col md={6}>
                                            <Card className="shadow-sm mb-4 border-0">
                                                <Card.Header className="fw-semibold bg-white">
                                                    Shipping Address
                                                </Card.Header>
                                                <Card.Body>
                                                    <p className="mb-0">{order.shipping_address}</p>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                        <Col md={6}>
                                            <Card className="shadow-sm mb-4 border-0">
                                                <Card.Header className="fw-semibold bg-white">
                                                    Billing Address
                                                </Card.Header>
                                                <Card.Body>
                                                    <p className="mb-0">{order.billing_address}</p>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                    </Row>

                                    {/* 🧵 Order Items Table (FIXED) */}
                                    <Card className="shadow-sm border-0">
                                        <Card.Header className="fw-semibold bg-white">
                                            Order Items
                                        </Card.Header>
                                        <Card.Body>
                                            {orderItems.length > 0 ? (
                                                <Table bordered responsive hover className="align-middle">
                                                    <thead className="table-light">
                                                        <tr>
                                                            <th>Preview</th>
                                                            <th>Product</th>
                                                            <th>Color/SKU</th>
                                                            <th>Logo</th>
                                                            <th>Placement</th>
                                                            <th>Qty/Sizes</th>
                                                            <th>Total Price</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {orderItems.map((item, idx) => (
                                                            <tr key={idx}>
                                                                <td>
                                                                    {/* Use the rich customization preview image URL */}
                                                                    <Image
                                                                        src={item.preview_image_url || item.image}
                                                                        alt={item.title}
                                                                        width="80"
                                                                        className="rounded shadow-sm"
                                                                    />
                                                                </td>
                                                                <td>
                                                                    {/* Product Title and ID */}
                                                                    <p className="mb-0"><strong>{item.product_title || item.title}</strong></p>
                                                                    <small className="text-muted">ID: {item.product_id}</small>
                                                                </td>
                                                                <td>
                                                                    {/* Product Variant Color and SKU */}
                                                                    <p className="mb-0">Color: <strong>{item.variant_color || "N/A"}</strong></p>
                                                                    <small className="text-muted">SKU: {item.product_sku || "N/A"}</small>
                                                                </td>
                                                                <td>
                                                                    {/* Logo Details */}
                                                                    <small className="text-muted">Color: {item.logo_color || "N/A"}</small>
                                                                </td>
                                                                <td>
                                                                    {/* Placement Name and View */}
                                                                    <p className="mb-0">Name: <strong>{item.placement_name || "N/A"}</strong></p>
                                                                    <small className="text-muted">View: {item.placement_view || "N/A"}</small>
                                                                </td>
                                                                <td>
                                                                    {/* Quantity and Sizes Breakdown */}
                                                                    <p className="mb-1">Total Qty: <strong>{item.quantity}</strong></p>
                                                                    <ul className="list-unstyled small mb-0">
                                                                        {Object.entries(item.sizes || {}).map(
                                                                            ([size, details]) => (
                                                                                <li key={size}>
                                                                                    <strong>{size.toUpperCase()}</strong>: {details.qty} × ${details.price}
                                                                                </li>
                                                                            )
                                                                        )}
                                                                    </ul>
                                                                </td>
                                                                <td>
                                                                    {/* Total Price for this line item */}
                                                                    <h5 className="mb-0">${item.total_price}</h5>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </Table>
                                            ) : (
                                                <p className="text-muted mb-0">
                                                    No order items available.
                                                </p>
                                            )}
                                        </Card.Body>
                                    </Card>

                                    {/* 💰 Total */}
                                    <Card className="shadow-sm border-0 mt-4">
                                        <Card.Body className="text-end fw-bold">
                                            <h5>Total Amount: ${order.total_amount}</h5>
                                        </Card.Body>
                                    </Card>
                                </>
                            ) : (
                                <p>No order found.</p>
                            )}
                        </div>
                    </div>
                </Col>
            </Row>
        </>
    );
}

export default SpecificOrder;