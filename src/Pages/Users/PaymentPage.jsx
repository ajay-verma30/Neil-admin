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

  const { clientSecret, totalAmount, subtotal, paymentType, couponData, shipping, billing } = location.state || {};
  const finalAmount = paymentType === "coupon" ? totalAmount : subtotal;

  const handlePayment = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    const card = elements.getElement(CardElement);

    try {
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card },
      });

      if (result.error) throw new Error(result.error.message);

      if (result.paymentIntent.status === "succeeded") {
  const stripeId = result.paymentIntent.id;
  if (paymentType === "coupon") {
    const updateRes = await axios.patch(
      "https://neil-backend-1.onrender.com/coupon/update-status",
      {
        batchId: location.state.batchId,
        status: "SUCCESS" 
      },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (updateRes.data.success) {
      alert("✅ Payment Received & Coupons Activated!");
      if(user?.role === "Super Admin"){
        navigate("/admin/coupons");
      }
      else{
        const orgId = user?.organization_id || "my-org"; 
    navigate(`/${orgId}/coupons`);
      }
    }
        } 
        else {
          const res = await axios.post(
            "https://neil-backend-1.onrender.com/checkout/create",
            {
              user_id: couponData?.admin_id, 
              shipping_address_id: shipping,
              billing_address_id: billing,
              payment_status: "Paid",
              stripe_payment_id: stripeId,
              amount: finalAmount,
            },
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
          if (res.data.success) { navigate("/orders"); }
        }
      }
    } catch (err) {
      alert(err.message || "Something went wrong");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Container className="mt-5 d-flex justify-content-center">
      <Card style={{ maxWidth: "450px", width: "100%" }} className="p-4 shadow">
        <h4 className="text-center mb-4">Complete Your Payment</h4>
        <div className="bg-light p-3 mb-3 text-center rounded">
          <p className="mb-0">Payable Amount</p>
          <h2 className="text-success">${finalAmount?.toFixed(2)}</h2>
        </div>
        <form onSubmit={handlePayment}>
          <div className="border p-3 rounded mb-3 bg-white">
            <CardElement options={{ hidePostalCode: true }} />
          </div>
          <Button variant="primary" className="w-100" type="submit" disabled={processing || !stripe}>
            {processing ? <Spinner animation="border" size="sm" /> : `Pay Now`}
          </Button>
        </form>
      </Card>
    </Container>
  );
}

export default PaymentPage;