import React, { useContext, useEffect, useState, useMemo } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { Container, Row, Col, Card, Button, Spinner, Alert, ListGroup } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { ChevronDown, Filter } from "lucide-react";

function ProductList() {
    const navigate = useNavigate();
    const [expandedCategory, setExpandedCategory] = useState(null);
    const [selectedSubcategory, setSelectedSubcategory] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const { accessToken } = useContext(AuthContext);
    const [categories, setCategories] = useState([]);

    // --- Data Fetching ---

    // 1. Fetch Products
    useEffect(() => {
        const getProducts = async () => {
            try {
                setLoading(true);
                setError("");
                // Optionally pass selectedSubcategory to backend for server-side filtering
                const filterQuery = selectedSubcategory ? `?sub_cat=${selectedSubcategory}` : '';
                const res = await axios.get(`https://neil-backend-1.onrender.com/products/all-products${filterQuery}`, {
                    headers: { Authorization: `Bearer ${accessToken}` },
                });
                setProducts(res.data.products || []);
            } catch (err) {
                if (err.response?.status === 404) {
                    setProducts([]); // No products found
                } else if (err.response) {
                    setError(err.response.data.message || "Failed to fetch products.");
                } else {
                    setError("Network error or something went wrong while fetching products.");
                }
            } finally {
                setLoading(false);
            }
        };
        getProducts();
    // Re-fetch products when accessToken or selectedSubcategory changes
    }, [accessToken, selectedSubcategory]); 


    // 2. Fetch Categories
    useEffect(() => {
        const getCategories = async () => {
            try {
                const res = await axios.get("https://neil-backend-1.onrender.com/products/categories", {
                    headers: { "Authorization": `Bearer ${accessToken}` }
                })
                setCategories(res.data.data || []);
            } catch (e) {
                console.error("Failed to fetch categories:", e);
                // Optionally set a category error, but don't block product list rendering
            }
        }
        getCategories();
    }, [accessToken]);

    // --- Filtering Logic (Client-side Fallback) ---
    // If you implemented server-side filtering (by changing the useEffect above), 
    // this client-side filter is only needed for initial data load or if server-side filtering isn't available.

    const filteredProducts = useMemo(() => {
        if (!selectedSubcategory) {
            return products;
        }
        // Client-side filtering if you don't use the sub_cat query parameter in the useEffect
        return products.filter(product => product.sub_cat === selectedSubcategory);
    }, [products, selectedSubcategory]);


    // --- Handlers ---

    const toggleCategory = (index) => {
        setExpandedCategory(expandedCategory === index ? null : index);
    };

    const handleSubcategorySelect = (sub) => {
        // Toggle off if the same subcategory is clicked again
        setSelectedSubcategory(selectedSubcategory === sub ? null : sub);
    };
    
    const productNav = (id) => {
        navigate(`/products/${id}`);
    };

    // --- Render Logic ---

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
                <Spinner animation="border" variant="primary" role="status" />
                <span className="ms-2 text-muted">Loading products...</span>
            </div>
        );
    }

    if (error) {
        return (
            <Container className="py-5">
                <Alert variant="danger" className="text-center">
                    <Alert.Heading>Error</Alert.Heading>
                    <p>{error}</p>
                </Alert>
            </Container>
        );
    }

    if (products.length === 0 && !selectedSubcategory) {
        return (
            <Container
                fluid
                className="d-flex flex-column justify-content-center align-items-center min-vh-100 bg-light"
            >
                <div className="p-4 text-center bg-white shadow-sm rounded-3" style={{ maxWidth: 500 }}>
                    <img
                        src="https://illustrations.popsy.co/gray/product-empty-state.svg"
                        alt="No products"
                        className="mb-3"
                        style={{ width: "180px", opacity: 0.8 }}
                    />
                    <h4 className="fw-semibold text-secondary">No products added yet</h4>
                    <p className="text-muted mb-3">
                        Start adding products to your catalog to get started.
                    </p>
                </div>
            </Container>
        );
    }

    return (
        <Container fluid className="p-0 bg-light min-vh-100">
            <Row className="g-0">
                {/* FIX: Using React-Bootstrap classes for the sidebar
                  Changed Col xs={2} to Col lg={3} for better desktop layout, 
                  and added sticky positioning/styling.
                */}
                <Col lg={3} xl={2} className="d-none d-lg-block"> 
                    <div 
                        className="bg-white border-end shadow-sm" 
                        style={{ minHeight: '100vh', position: 'sticky', top: 0, overflowY: 'auto' }}
                    >
                        {/* Header */}
                        <div className="p-3 border-bottom">
                            <div className="d-flex align-items-center mb-1">
                                <Filter className="me-2 text-primary" size={20} />
                                <h4 className="fw-bold mb-0">Filters</h4>
                            </div>
                            <p className="text-muted small mb-0">Browse by category</p>
                        </div>

                        {/* Categories */}
                        <div className="p-3">
                            {categories.length === 0 ? (
                                <div className="text-center py-4">
                                    <p className="text-muted small mb-0">No categories available</p>
                                </div>
                            ) : (
                                <ListGroup variant="flush">
                                    {categories.map((cat, index) => (
                                        <div key={index} className="mb-1">
                                            {/* Category Header */}
                                            <Button
                                                variant={expandedCategory === index ? "primary" : "light"}
                                                onClick={() => toggleCategory(index)}
                                                className={`w-100 d-flex align-items-center justify-content-between text-start ${
                                                    expandedCategory === index ? "text-white" : "text-dark"
                                                }`}
                                                style={{ transition: 'none' }}
                                            >
                                                <span>{cat.title}</span>
                                                <ChevronDown
                                                    size={16}
                                                    className={`transition-transform duration-200 ${
                                                        expandedCategory === index ? "rotate-180" : ""
                                                    }`}
                                                />
                                            </Button>

                                            {/* Subcategories */}
                                            {expandedCategory === index &&
                                                cat.sub_categories &&
                                                cat.sub_categories.length > 0 && (
                                                    <ListGroup className="ms-2 mt-2 border-start border-primary border-3">
                                                        {cat.sub_categories.map((sub, i) => (
                                                            <ListGroup.Item
                                                                key={i}
                                                                action
                                                                onClick={() => handleSubcategorySelect(sub)}
                                                                active={selectedSubcategory === sub}
                                                                className="py-2 small border-0 ps-4"
                                                            >
                                                                {sub}
                                                            </ListGroup.Item>
                                                        ))}
                                                    </ListGroup>
                                                )}
                                        </div>
                                    ))}
                                </ListGroup>
                            )}
                        </div>

                        {/* Clear Filters Button */}
                        {selectedSubcategory && (
                            <div className="p-3 border-top sticky-bottom bg-white">
                                <Button
                                    variant="outline-secondary"
                                    onClick={() => setSelectedSubcategory(null)}
                                    className="w-100"
                                >
                                    Clear Filter: **{selectedSubcategory}**
                                </Button>
                            </div>
                        )}
                    </div>
                </Col>

                {/* Product List Content */}
                {/* Changed Col xs={10} to Col lg={9} to match the new filter sidebar size */}
                <Col xs={12} lg={9} xl={10} className="p-4"> 
                    <Container>
                        <div className="mb-4">
                            <h3 className="fw-bold">Products</h3>
                            <p className="text-muted mb-0">
                                Viewing {filteredProducts.length} of {products.length} total items.
                                {selectedSubcategory && (
                                    <span className="ms-2 badge bg-primary">Filtered by: {selectedSubcategory}</span>
                                )}
                            </p>
                        </div>

                        {filteredProducts.length === 0 && selectedSubcategory ? (
                             <Alert variant="info" className="text-center my-5">
                                <Alert.Heading>No Products Found</Alert.Heading>
                                <p>There are no products matching the subcategory **{selectedSubcategory}**.</p>
                                <Button variant="outline-info" onClick={() => setSelectedSubcategory(null)}>
                                    Show All Products
                                </Button>
                            </Alert>
                        ) : (
                            <Row className="g-4">
                                {filteredProducts.map((product) => {
                                    const imageUrl =
                                        product?.variants?.[0]?.images?.[0]?.url ||
                                        "https://via.placeholder.com/300x200.png?text=No+Image";
                                    const price = product.price ? `$${parseFloat(product.price).toFixed(2)}` : "Price N/A";

                                    return (
                                        <Col key={product.id} xs={12} sm={6} md={4} lg={4} xl={3}>
                                            <Card className="h-100 shadow-sm border-0 product-card">
                                                <div className="position-relative">
                                                    <Card.Img
                                                        variant="top"
                                                        src={imageUrl}
                                                        alt={product.title}
                                                        style={{ height: "200px", objectFit: "contain" }}
                                                    />
                                                    <span
                                                        className={`badge position-absolute top-0 end-0 m-2 ${
                                                            product.isActive ? "bg-success" : "bg-danger"
                                                        }`}
                                                    >
                                                        {product.isActive ? "Active" : "Inactive"}
                                                    </span>
                                                </div>

                                                <Card.Body className="d-flex flex-column">
                                                    <Card.Title className="fw-semibold mb-2 fs-5">
                                                        {product.title}
                                                    </Card.Title>

                                                    <div className="mb-2">
                                                        {product.category && (
                                                            <span className="badge bg-primary-subtle text-primary me-1">
                                                                {product.category}
                                                            </span>
                                                        )}
                                                        {product.sub_cat && (
                                                            <span className="badge bg-info-subtle text-info">
                                                                {product.sub_cat}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <Card.Text className="text-muted small mb-2">
                                                        <strong>SKU:</strong> {product.sku || "N/A"}
                                                    </Card.Text>

                                                    <Card.Text className="text-secondary small mb-3 flex-grow-1">
                                                        {product.description && product.description.length > 80
                                                            ? product.description.slice(0, 80) + "..."
                                                            : product.description || "No description available."}
                                                    </Card.Text>
                                                </Card.Body>

                                                <Card.Footer className="bg-white border-0 d-flex justify-content-between align-items-center">
                                                    <h5 className="fw-bold mb-0 text-primary">
                                                        {price}
                                                    </h5>
                                                    <Button
                                                        variant="outline-primary"
                                                        size="sm"
                                                        onClick={() => productNav(product.id)}
                                                    >
                                                        View Details
                                                    </Button>
                                                </Card.Footer>
                                            </Card>
                                        </Col>
                                    );
                                })}
                            </Row>
                        )}
                    </Container>
                </Col>
            </Row>
        </Container>
    );
}

export default ProductList;