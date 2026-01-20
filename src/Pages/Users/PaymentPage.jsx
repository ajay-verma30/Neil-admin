import React, { useContext, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";
import { Spinner, Container, Card, Button } from "react-bootstrap";

function PaymentPage() {
  const { accessToken, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  // Destructure state from navigation
  const { clientSecret, subtotal, walletUsed, total, cartItems, shipping, billing } = location.state || {};
  const finalAmount = Number(total || 0);

  const handlePayment = async (e) => {
    e.preventDefault();
    setProcessing(true);

    try {
      let paymentIntentId = "WALLET_ONLY"; // Default if no stripe is used

      // 1️⃣ Case: Agar kuch amount pay karna bacha hai (Stripe Payment)
      if (finalAmount > 0) {
        if (!stripe || !elements) return;
        const card = elements.getElement(CardElement);
        
        const result = await stripe.confirmCardPayment(clientSecret, {
          payment_method: { card },
        });

        if (result.error) throw new Error(result.error.message);
        
        if (result.paymentIntent.status === "succeeded") {
          paymentIntentId = result.paymentIntent.id;
        } else {
          throw new Error("Payment was not successful.");
        }
      }

      // 2️⃣ Deduct wallet only after successful Stripe payment OR if it's a 100% Wallet payment
      if (walletUsed > 0) {
        await axios.patch(
          "http://localhost:3000/wallet/deduct-wallet",
          { amount: walletUsed, description: `Order Payment - Used $${walletUsed}` },
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
      }

      // 3️⃣ Create order in backend
      const res = await axios.post(
        "https://neil-backend-1.onrender.com/checkout/create",
        {
          user_id: user.id,
          shipping_address_id: shipping,
          billing_address_id: billing,
          payment_status: "Paid",
          stripe_payment_id: paymentIntentId,
          amount: finalAmount,
          walletUsed: walletUsed,
          cartItems: cartItems // Bhejna zaroori ho sakta hai backend logic ke liye
        },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (res.data.success) {
        localStorage.removeItem("cart");
        navigate("/orders");
      } else {
        throw new Error("Order creation failed after payment.");
      }

    } catch (err) {
      alert(err.message || "Payment failed");
      console.error("Payment/Order Error:", err);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Container className="mt-5 d-flex justify-content-center">
      <Card style={{ maxWidth: "450px", width: "100%" }} className="p-4 shadow border-0">
        <h4 className="text-center mb-4 fw-bold">Payment Summary</h4>
        
        <div className="bg-light p-3 mb-4 rounded border">
          <div className="d-flex justify-content-between mb-2">
            <span>Subtotal:</span>
            <span>${Number(subtotal).toFixed(2)}</span>
          </div>
          {walletUsed > 0 && (
            <div className="d-flex justify-content-between mb-2 text-danger">
              <span>Wallet Applied:</span>
              <span>-${Number(walletUsed).toFixed(2)}</span>
            </div>
          )}
          <hr />
          <div className="d-flex justify-content-between fw-bold fs-5">
            <span>Total Payable:</span>
            <span className="text-success">${finalAmount.toFixed(2)}</span>
          </div>
        </div>

        <form onSubmit={handlePayment}>
          {/* Card Element sirf tab dikhayenge jab amount > 0 ho */}
          {finalAmount > 0 ? (
            <div className="border p-3 rounded mb-4 bg-white shadow-sm">
              <CardElement options={{ 
                hidePostalCode: true,
                style: { base: { fontSize: '16px' } } 
              }} />
            </div>
          ) : (
            <div className="alert alert-info text-center">
              Full amount will be paid using your Wallet balance.
            </div>
          )}

          <Button 
            variant="primary" 
            className="w-100 py-2 fw-bold" 
            type="submit" 
            disabled={processing || (finalAmount > 0 && !stripe)}
          >
            {processing ? (
              <><Spinner animation="border" size="sm" className="me-2" /> Processing...</>
            ) : finalAmount > 0 ? (
              `Pay $${finalAmount.toFixed(2)}`
            ) : (
              "Confirm Order (Wallet)"
            )}
          </Button>
        </form>
      </Card>
    </Container>
  );
}

export default PaymentPage;