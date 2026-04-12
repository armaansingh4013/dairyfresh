import React from "react";

export default function ContactPage() {
  return (
    <section className="section-card">
      <p className="section-kicker">Contact</p>
      <h2>Talk to our team</h2>
      <div className="grid">
        <div className="feature">
          <h3>Support</h3>
          <p>Call or WhatsApp: +91 90000 00000</p>
          <p>Email: majaradairy@gmail.com</p>
        </div>
        <div className="feature">
          <h3>Address</h3>
          <p>Vill majara , Dist - UNA , Himachal Praqdesh 174301</p>
          <p>Open 6:00 AM - 8:00 PM</p>
        </div>
        <div className="feature">
          <h3>Onboarding</h3>
          <p>Need help setting up subscriptions? We will guide you.</p>
        </div>
      </div>
    </section>
  );
}
