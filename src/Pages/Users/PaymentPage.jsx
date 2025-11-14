import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";
import { useContext, useState } from "react";

function PaymentPage() {
  const { user, accessToken } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const { clientSecret, subtotal, shipping, billing } = location.state || {};

 if (!location.state || !location.state.clientSecret) {
  return (
    <div className="text-center mt-5">
      <h4>Invalid payment session. Redirecting you back to cart...</h4>
      {setTimeout(() => navigate("/cart"), 2000)}
    </div>
  );
}



  const handlePayment = async (e) => {
  e.preventDefault();
  setProcessing(true);

  const card = elements.getElement(CardElement);
  try {
    const result = await stripe.confirmCardPayment(clientSecret, { payment_method: { card } });

    if (result.error) throw new Error(result.error.message);

    if (result.paymentIntent.status === "succeeded") {
      // ✅ Payment succeeded → create order
      const res = await axios.post(
        "https://neil-backend-1.onrender.com/checkout/create",
        {
          user_id: user.id,
          org_id: user.org_id || 1,
          shipping_address_id: shipping,
          billing_address_id: billing,
          payment_method: "STRIPE",
          stripe_payment_id: result.paymentIntent.id,
          amount: subtotal,
        },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (res.data.success) {
        alert("Payment successful! Order created.");
        navigate("/orders");
      } else {
        alert("Order creation failed even though payment succeeded!");
      }
    }
  } catch (err) {
    alert(err.message || "Payment failed");
  } finally {
    setProcessing(false);
  }
};


  return (
    <div className="container mt-5 pt-5" style={{ maxWidth: "500px" }}>
      <h3 className="text-center mb-4">Complete Your Payment</h3>
      <div className="card p-4 shadow">
        <p className="fw-bold mb-1">Amount to Pay:</p>
        <h4 className="text-success mb-4">${subtotal?.toFixed(2)}</h4>

        <form onSubmit={handlePayment}>
          <div className="mb-3 border p-3 rounded">
            <CardElement options={{ hidePostalCode: true }} />
          </div>

          <button className="btn btn-primary w-100" disabled={!stripe || processing}>
            {processing ? "Processing..." : "Pay Now"}
          </button>
        </form>
      </div>
    </div>
  );
}


export default PaymentPage;
