import React from 'react';
import './HowItWorks.css';

const HowItWorks = () => {
    return (
        <div className="how-it-works-page">
            <section className="how-it-works fade-in">
                <div className="section-title">
                    <h1>How <span>CarAssist</span> Works</h1>
                    <p>Experience seamless roadside assistance in just a few steps. Our platform is designed to get you back on the road FAST.</p>
                </div>

                <div className="steps-container">
                    <div className="step-item">
                        <div className="step-number">1</div>
                        <h3>Request Help</h3>
                        <p>Open the app or website, select the type of assistance you need (Car/Bike), and confirm your location.</p>
                    </div>
                    <div className="step-line"></div>
                    <div className="step-item">
                        <div className="step-number">2</div>
                        <h3>Matching Process</h3>
                        <p>Our intelligent system instantly notifies the nearest verified mechanics and service partners.</p>
                    </div>
                    <div className="step-line"></div>
                    <div className="step-item">
                        <div className="step-number">3</div>
                        <h3>Service Arrival</h3>
                        <p>Track your mechanic in real-time as they arrive at your location to provide professional on-site repair.</p>
                    </div>
                </div>

                <div className="extra-info">
                    <div className="info-card">
                        <h3>24/7 Availability</h3>
                        <p>Broken down at midnight? No worries. Our network operates round the clock, including weekends and holidays.</p>
                    </div>
                    <div className="info-card">
                        <h3>Verified Partners</h3>
                        <p>Every mechanic on our platform undergoes a rigorous background check and quality verification process.</p>
                    </div>
                    <div className="info-card">
                        <h3>Transparent Pricing</h3>
                        <p>No hidden charges. Get estimated costs upfront before you confirm your booking.</p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default HowItWorks;
