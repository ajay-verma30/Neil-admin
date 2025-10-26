import React, { useEffect, useState, useContext } from "react";
import TopBar from "../../Components/TopBar/TopBar";
import Sidebar from "../../Components/SideBar/SideBar";
import { Row, Col, Container, Table, Spinner } from "react-bootstrap";
import { AuthContext } from "../../context/AuthContext";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useNavigate } from "react-router-dom";
import { faPencil, faPlus } from "@fortawesome/free-solid-svg-icons";

function Products() {
  const navigate = useNavigate();
  const { user, accessToken } = useContext(AuthContext);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;

    const fetchProducts = async () => {
      try {
        setLoading(true);
        const res = await axios.get("http://localhost:3000/products/all-products", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setProducts(res.data.products || []);
      } catch (err) {
        console.error("Error fetching products:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [accessToken]);

  const createProduct = () => {
    if (user.role === "Super Admin") {
      navigate("/new");
    } else {
      navigate(`/${user.org_id}/products/new`);
    }
  };

  // Updated function: accept product id
  const specProducts = (productId) => {
    if (user.role === "Super Admin") {
      navigate(`/products/${productId}`);
    } else {
      navigate(`/${user.org_id}/products/${productId}`);
    }
  };

  return (
    <>
      <TopBar />
      <Row>
        <Col xs={2} md={2}>
          <Sidebar />
        </Col>
        <Col xs={10} md={10}>
          <div className="form-box py-3">
            <Container fluid>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="fw-light text-secondary">Product Management</h2>
                <button
                  className="btn btn-primary d-flex align-items-center shadow-sm"
                  title="Add New Product"
                  onClick={createProduct}
                >
                  <FontAwesomeIcon icon={faPlus} className="me-2" />
                  Add Product
                </button>
              </div>

              {loading ? (
                <div className="text-center my-5">
                  <Spinner animation="border" />
                </div>
              ) : (
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Title</th>
                      <th>SKU</th>
                      <th>Variants</th>
                      <th>Created At</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p, index) => (
                      <tr key={p.id}>
                        <td>{index + 1}</td>
                        <td>{p.title}</td>
                        <td>{p.sku}</td>
                        <td>
                          {p.variants.map((v) => (
                            <div key={v.id}>
                              {v.color ? `${v.color} / ${v.size} (${v.sku})` : v.sku}
                            </div>
                          ))}
                        </td>
                        <td>{new Date(p.created_at).toLocaleString()}</td>
                        <td className="text-center">
                          <FontAwesomeIcon
                            icon={faPencil}
                            style={{ cursor: "pointer" }}
                            onClick={() => specProducts(p.id)} 
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Container>
          </div>
        </Col>
      </Row>
    </>
  );
}

export default Products;
