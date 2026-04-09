import React from "react";

const privacySections = [
  {
    title: "What we collect",
    body:
      "We collect the details needed to run your account and deliver orders, including your name, phone number, email address, delivery address, and subscription preferences."
  },
  {
    title: "How we use it",
    body:
      "We use your information to manage subscriptions, process payments, coordinate deliveries, send service updates, and respond to support requests."
  },
  {
    title: "Sharing",
    body:
      "We only share information with delivery, payment, and service partners when it is necessary to fulfill your order or keep the platform running."
  },
  {
    title: "Your controls",
    body:
      "You can contact our team to update your profile details, request corrections, or ask for account deletion, subject to billing and record-keeping obligations."
  }
];

export default function PrivacyPage() {
  return (
    <section className="section-card privacy-page">
      <p className="section-kicker">Privacy</p>
      <h2>Your data, handled for delivery and support only.</h2>
      <p className="lead">
        Mazara Dairy uses customer information to run subscriptions, complete
        deliveries, and keep account communication reliable. We do not sell
        personal information.
      </p>

      <div className="grid">
        {privacySections.map((section) => (
          <article key={section.title} className="feature">
            <h3>{section.title}</h3>
            <p>{section.body}</p>
          </article>
        ))}
      </div>

      <div className="privacy-note">
        <h3>Questions or requests</h3>
        <p>
          For privacy-related requests, contact{" "}
          <a href="mailto:hello@dairydaily.in">hello@dairydaily.in</a> or call
          +91 90000 00000.
        </p>
      </div>
    </section>
  );
}
