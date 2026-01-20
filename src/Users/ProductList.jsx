import React, { useContext, useEffect, useState, useMemo } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Spinner,
  Alert,
  ListGroup,
  Form
} from "react-bootstrap";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronDown, Filter, X, ChevronRight } from "lucide-react";
import "./Common.css"

/* ---------------- FILTER DISPLAY ---------------- */
function FilterDisplay({ category, subCategory, onClear }) {
  const cats = useMemo(() => (category ? category.split(",") : []), [category]);
  const subs = useMemo(() => (subCategory ? subCategory.split(",") : []), [subCategory]);

  if (!cats.length && !subs.length) {
    return (
      <div className="mb-4 p-3 bg-white rounded border shadow-sm">
        <em className="text-muted small">Showing all products — use sidebar filters to refine</em>
      </div>
    );
  }

  return (
    <div className="mb-4 p-3 bg-white shadow-sm rounded border-start border-primary border-4">
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <strong className="small text-uppercase text-muted">Active Filters:</strong>
          {cats.map(c => <span key={c} className="badge bg-primary px-3 py-2">{c}</span>)}
          {subs.length > 0 && <ChevronRight size={16} className="text-muted" />}
          {subs.map(s => <span key={s} className="badge bg-info text-dark px-3 py-2">{s}</span>)}
        </div>
        <Button size="sm" variant="outline-danger" className="rounded-pill px-3" onClick={onClear}>
          <X size={14} className="me-1" /> Clear All
        </Button>
      </div>
    </div>
  );
}

/* ---------------- MAIN COMPONENT ---------------- */
export default function ProductList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, accessToken, loading: authLoading } = useContext(AuthContext);

  const categoryParam = searchParams.get("category");
  const subCategoryParam = searchParams.get("sub_category");

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 1. Unified Fetch Logic
  useEffect(() => {
    // AGAAR AuthContext abhi load ho raha hai, toh wait karo
    if (authLoading) return;

    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await axios.get("https://neil-backend-1.onrender.com/products/public-list", {
          params: {
            category: categoryParam || undefined,
            sub_category: subCategoryParam || undefined,
            user_org_id: user?.org_id || null 
          },
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
        });

        if (response.data.success) {
          setProducts(response.data.products || []);
          setCategories(response.data.categories || []);
        }
      } catch (err) {
        console.error("API Error:", err);
        setError("Unable to connect to the server. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [categoryParam, subCategoryParam, user?.org_id, accessToken, authLoading]);

  // 2. Filter Handler
  const toggleFilter = (type, value, parent = null) => {
    const params = new URLSearchParams(searchParams);
    let cats = params.get("category")?.split(",") || [];
    let subs = params.get("sub_category")?.split(",") || [];

    if (type === "category") {
      if (cats.includes(value)) {
        cats = cats.filter(c => c !== value);
        const targetCat = categories.find(c => c.title === value);
        if (targetCat) {
          const subTitles = targetCat.subcategories.map(s => s.title);
          subs = subs.filter(s => !subTitles.includes(s));
        }
      } else {
        cats.push(value);
      }
    }

    if (type === "sub_category") {
      if (subs.includes(value)) {
        subs = subs.filter(s => s !== value);
      } else {
        subs.push(value);
        if (parent && !cats.includes(parent)) cats.push(parent);
      }
    }

    cats.length ? params.set("category", cats.join(",")) : params.delete("category");
    subs.length ? params.set("sub_category", subs.join(",")) : params.delete("sub_category");
    setSearchParams(params);
  };

  const clearFilters = () => setSearchParams({});

  if (authLoading || (loading && products.length === 0)) {
    return (
      <div className="vh-100 d-flex flex-column justify-content-center align-items-center bg-white">
        <Spinner animation="grow" variant="primary" />
        <span className="mt-3 text-muted fw-bold">Loading Amazing Products...</span>
      </div>
    );
  }

  return (
    <Container fluid className="bg-light min-vh-100 p-0">
      <Row className="g-0">
        {/* SIDEBAR */}
        <Col lg={3} xl={2} className="d-none d-lg-block bg-white border-end sticky-top vh-100 overflow-auto shadow-sm">
          <div className="p-4 border-bottom bg-white sticky-top">
            <h5 className="fw-bold mb-0 d-flex align-items-center">
              <Filter size={20} className="me-2 text-primary" /> Filter By
            </h5>
          </div>

          <div className="p-3">
            {categories.map((cat, idx) => (
              <div key={cat.id || idx} className="mb-3">
                <div
                  className={`p-2 rounded d-flex justify-content-between align-items-center transition-all ${
                    expandedIndex === idx ? "bg-primary text-white" : "hover-bg-light"
                  }`}
                  onClick={() => setExpandedIndex(expandedIndex === idx ? null : idx)}
                  style={{ cursor: "pointer", transition: "0.2s" }}
                >
                  <Form.Check
                    type="checkbox"
                    id={`cat-${cat.id}`}
                    label={<span className={`small fw-semibold ${expandedIndex === idx ? 'text-white' : 'text-dark'}`}>{cat.title}</span>}
                    checked={categoryParam?.split(",").includes(cat.title) || false}
                    onChange={() => {}} 
                    onClick={e => {
                      e.stopPropagation();
                      toggleFilter("category", cat.title);
                    }}
                  />
                  <ChevronDown size={14} className={expandedIndex === idx ? "rotate-180" : ""} />
                </div>

                {expandedIndex === idx && (
                  <div className="ms-3 mt-2 border-start ps-2">
                    {cat.subcategories?.map(sub => (
                      <div key={sub.id} className="py-1">
                        <Form.Check
                          type="checkbox"
                          id={`sub-${sub.id}`}
                          label={<small className="text-muted">{sub.title}</small>}
                          checked={subCategoryParam?.split(",").includes(sub.title) || false}
                          onChange={() => toggleFilter("sub_category", sub.title, cat.title)}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Col>

        {/* MAIN CONTENT */}
        <Col xs={12} lg={9} xl={10} className="p-4">
          <FilterDisplay
            category={categoryParam}
            subCategory={subCategoryParam}
            onClear={clearFilters}
          />

          {error && <Alert variant="danger" className="border-0 shadow-sm">{error}</Alert>}

          <Row className="g-4">
            {products.length > 0 ? (
              products.map(p => (
                <Col key={p.id} xs={12} sm={6} md={4} xl={3}>
                  <Card 
                    className="h-100 shadow-sm border-0 product-card-hover" 
                    onClick={() => navigate(`/products/${p.id}`)}
                    style={{ cursor: "pointer", borderRadius: '12px', overflow: 'hidden' }}
                  >
                    <div className="bg-white d-flex justify-content-center align-items-center p-4" style={{ height: 220 }}>
                      <Card.Img
                        src={p.image_url || "https://via.placeholder.com/200?text=No+Image"}
                        style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }}
                      />
                    </div>
                    <Card.Body className="d-flex flex-column pt-0">
                      <div className="mb-2">
                        <span className="badge bg-light text-primary border me-1 small">
                          {p.category_title || "Uncategorized"}
                        </span>
                        {p.org_id && <span className="badge bg-warning text-dark small">Exclusive</span>}
                      </div>
                      <h6 className="fw-bold text-dark mb-1">{p.title}</h6>
                      <p className="text-muted small mb-3 flex-grow-1">
                        {p.description?.slice(0, 65)}...
                      </p>
                      <div className="d-flex justify-content-between align-items-center mt-auto pt-2 border-top">
                        <span className="h5 mb-0 fw-bold text-primary">${p.price}</span>
                        <Button size="sm" variant="primary" className="rounded-pill px-3">View Details</Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))
            ) : (
              <Col xs={12} className="text-center py-5">
                <img src="https://illustrations.popsy.co/gray/searching.svg" alt="empty" style={{ width: 200 }} className="mb-4" />
                <h4 className="text-dark">No products found</h4>
                <p className="text-muted">Try adjusting your filters or check back later.</p>
                <Button variant="primary" onClick={clearFilters}>View All Products</Button>
              </Col>
            )}
          </Row>
        </Col>
      </Row>
    </Container>
  );
}