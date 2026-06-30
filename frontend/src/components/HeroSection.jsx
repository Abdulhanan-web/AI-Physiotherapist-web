// components/HeroSection.jsx

import React from "react";

const HeroSection = ({ exercisesCount, programsCount }) => {
  return (
    <div className="rp-hero">
      {/* Sliding background images */}
      <div className="rp-hero-slides">
        <img src="/images/image1.png" alt="" aria-hidden="true" />
        <img src="/images/image2.png" alt="" aria-hidden="true" />
        <img src="/images/image3.png" alt="" aria-hidden="true" />
        <img src="/images/image4.png" alt="" aria-hidden="true" />
      </div>

      <div className="rp-hero-content">
        <div className="rp-hero-tag">
          AI PHYSIOTHERAPIST AND HEALTH ASSISTANT
        </div>

        <div className="rp-hero-h1">
          Personalised Care.
          <br />
          <em>Proven Results.</em>
        </div>

        <div className="rp-hero-sub">
          Every recovery journey is unique. SpineSense uses real-time AI pose
          detection to guide you through clinically validated exercises.
        </div>

        <div className="rp-hero-cta">
          <button className="rp-hero-btn">
            Begin Your Recovery →
          </button>

          <button className="rp-hero-btn-outline">
            How It Works
          </button>
        </div>
      </div>

      <div className="rp-hero-stats">
        <div className="rp-hero-stat">
          <div className="rp-hero-stat-val">{exercisesCount}</div>
          <div className="rp-hero-stat-label">EXERCISES</div>
        </div>

        <div className="rp-hero-stat">
          <div className="rp-hero-stat-val">{programsCount}</div>
          <div className="rp-hero-stat-label">PROGRAMS</div>
        </div>

        <div className="rp-hero-stat">
          <div className="rp-hero-stat-val">AI</div>
          <div className="rp-hero-stat-label">FEEDBACK</div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;