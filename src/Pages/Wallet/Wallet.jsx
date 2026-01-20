import React, { useContext, useEffect, useState } from 'react';
import TopBar from '../../Components/TopBar/TopBar';
import { AuthContext } from '../../context/AuthContext';
import { Row, Col, Form, Button, Table, Container, Spinner, Alert } from 'react-bootstrap';
import axios from 'axios';
import Footer from '../../Users/Footer';

function Wallet() {
  const { user, accessToken } = useContext(AuthContext);

  const [couponCode, setCouponCode] = useState('');
  const [walletBalance, setWalletBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const couponRegex = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

  /* ======================
     Fetch Wallet Balance & Transactions
  ====================== */
  useEffect(() => {
    const fetchWalletData = async () => {
      try {
        // 1️⃣ Wallet balance
        const balanceRes = await axios.get("http://localhost:3000/wallet/wallet-balance", {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        setWalletBalance(Number(balanceRes.data.balance) || 0);

        // 2️⃣ Wallet transactions
        const txnsRes = await axios.get("http://localhost:3000/wallet/wallet-transactions", {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        setTransactions(txnsRes.data.transactions || []);

      } catch(err) {
        setError("Failed to fetch wallet data");
      } finally {
        setPageLoading(false);
      }
    };

    fetchWalletData();
  }, [accessToken]);

  /* ======================
     Redeem Coupon
  ====================== */
  const handleRedeem = async () => {
    const coupon_code = couponCode.trim().toUpperCase();
    if (!couponRegex.test(coupon_code)) {
      setError("Invalid coupon format. Example: XXXX-XXXX-XXXX");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const res = await axios.post(
        'http://localhost:3000/coupon/redeem-coupon',
        { coupon_code },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (res.status === 200) {
        setSuccess(res.data.message || "Coupon redeemed successfully");

        if (res.data.credited_amount) {
  setWalletBalance(prev => Number(prev) + Number(res.data.credited_amount));
}

        // Refetch transactions after redeem
        const txnsRes = await axios.get("http://localhost:3000/wallet/wallet-transactions", {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        setTransactions(txnsRes.data.transactions || []);

        setCouponCode('');
      }
    } catch (err) {
      if (err.response) {
        setError(err.response.data.message || "Coupon redeem failed");
      } else {
        setError("Server not reachable. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
        <Spinner animation="border" />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <TopBar />

      <Container fluid className="px-4 mt-5 pt-4" style={{ flex: 1 }}>
        <Row>
          <Col md={12} className="form-box p-4">

            {/* Wallet Balance */}
            <div className="text-center mb-4">
              <h5 className="text-muted mb-1">Total Wallet Balance</h5>
              <h1 style={{ fontSize: '3rem', fontWeight: 'bold', color: '#2c3e50' }}>
                ${walletBalance.toFixed(2)}
              </h1>
            </div>

            <hr />

            {/* Messages */}
            {success && <Alert variant="success">{success}</Alert>}
            {error && <Alert variant="danger">{error}</Alert>}

            {/* Redeem Coupon */}
            <Row className="justify-content-center my-4">
              <Col md={6}>
                <Form.Group className="d-flex gap-2">
                  <Form.Control
                    type="text"
                    placeholder="Enter Coupon Code (e.g. 256X-12TD-OZBN)"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    disabled={loading}
                    style={{ height: '50px' }}
                  />
                  <Button
                    variant="primary"
                    onClick={handleRedeem}
                    disabled={loading}
                    style={{ width: '150px', fontWeight: 'bold' }}
                  >
                    {loading ? 'Redeeming...' : 'Redeem'}
                  </Button>
                </Form.Group>
              </Col>
            </Row>

            <hr />

            {/* Transaction History */}
            <h4 className="mb-3">Transaction History</h4>

            <Table striped bordered hover responsive>
              <thead className="bg-light">
                <tr>
                  <th>#</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Description</th>
                  <th>Date</th>
                  <th>Coupon Code</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center text-muted">
                      No transactions found
                    </td>
                  </tr>
                ) : (
                  transactions.map((txn, index) => (
                    <tr key={txn.id}>
                      <td>{index + 1}</td>
                      <td>
                        <span className={txn.type === 'CREDIT' ? 'text-success' : 'text-danger'}>
                          {txn.type}
                        </span>
                      </td>
                      <td>${Number(txn.amount).toFixed(2)}</td>
                      <td>{txn.description}</td>
                      <td>{new Date(txn.created_at).toLocaleString()}</td>
                      <td>{txn.coupon_code || "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>

          </Col>
        </Row>
      </Container>

      <Footer />
    </div>
  );
}

export default Wallet;
