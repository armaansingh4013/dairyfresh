import React from "react";

export default function AboutPage() {
  return (
    <section className="section-card">
      <p className="section-kicker">About</p>
      <h2>Our dairy promise</h2>
      <p className="lead">
        We source from trusted farms, test every batch, and deliver within hours
        of milking. Our goal is to make pure dairy effortless for every home.
      </p>
      <div className="grid">
        <div className="feature">
          <h3>Farm Fresh</h3>
          <p>Direct procurement from local dairies each morning.</p>
        </div>
        <div className="feature">
          <h3>Reliable Delivery</h3>
          <p>Dedicated routes so your milk arrives at the same time daily.</p>
        </div>
        <div className="feature">
          <h3>Flexible Plans</h3>
          <p>Pause, skip, or update quantities without calling support.</p>
        </div>
      </div>
    </section>
  );
}
