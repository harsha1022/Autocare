import React, { useState } from 'react';
import './Services.css';
import { Link } from 'react-router-dom';

const carServices = [
    {
        icon: '⚡',
        name: 'Battery Jump-Start',
        description: 'Dead battery? Our mechanics will jump-start your car and get you moving in minutes.',
        serviceType: 'Engine starting issue / battery jump-start'
    },
    {
        icon: '⛽',
        name: 'Fuel Delivery',
        description: 'Ran out of petrol or diesel? We deliver the fuel you need right to your location.',
        serviceType: 'Fuel delivery (petrol/diesel)'
    },
    {
        icon: '🔩',
        name: 'Tyre Puncture Repair',
        description: 'Got a flat? We\'ll patch or plug your tyre on the spot so you can continue your journey.',
        serviceType: 'Tyre puncture repair'
    },
    {
        icon: '🔄',
        name: 'Tyre Replacement',
        description: 'We\'ll swap your damaged tyre with your stepney or arrange a full replacement.',
        serviceType: 'Tyre replacement (stepney support)'
    },
    {
        icon: '🛑',
        name: 'Brake Failure Inspection',
        description: 'Experiencing brake issues? We\'ll diagnose and safely inspect your braking system.',
        serviceType: 'Brake failure inspection'
    },
    {
        icon: '🌡️',
        name: 'Overheating / Coolant Refill',
        description: 'Engine overheating? We\'ll top up your radiator coolant and check for leaks.',
        serviceType: 'Overheating / radiator coolant refill'
    },
    {
        icon: '🔧',
        name: 'Clutch & Cable Issues',
        description: 'Clutch slipping or accelerator stuck? Our team handles cable adjustments and replacements.',
        serviceType: 'Clutch & accelerator cable issues'
    },
    {
        icon: '💡',
        name: 'Minor Electrical Repairs',
        description: 'Short circuit, faulty fuse, or a dead socket — we fix common electrical issues on-site.',
        serviceType: 'Minor electrical repairs'
    },
    {
        icon: '🏎️',
        name: 'Steering & Suspension Check',
        description: 'Unusual vibrations or pulling? We perform quick steering and suspension diagnostics.',
        serviceType: 'Steering & suspension quick checks'
    },
];

const bikeServices = [
    {
        icon: '🏍️',
        name: 'Kick / Self-Start Issues',
        description: 'Bike not starting? We\'ll diagnose ignition and starter motor issues right away.',
        serviceType: 'Bike kick/self start issues'
    },
    {
        icon: '🔗',
        name: 'Chain Break / Tightening',
        description: 'Broken or loose chain? We\'ll repair, link, or tighten your bike\'s drive chain.',
        serviceType: 'Chain break or chain tightening'
    },
    {
        icon: '🪢',
        name: 'Clutch Cable Replacement',
        description: 'Clutch cable snapped or frayed? Fast replacement to restore smooth gear changes.',
        serviceType: 'Clutch cable replacement'
    },
    {
        icon: '🎚️',
        name: 'Accelerator Cable Repair',
        description: 'Sticky or broken throttle cable? We\'ll fix it so your bike responds properly.',
        serviceType: 'Accelerator cable repair'
    },
    {
        icon: '✨',
        name: 'Spark Plug Replacement',
        description: 'Engine misfiring or poor fuel economy? A fresh spark plug can fix that instantly.',
        serviceType: 'Spark plug replacement'
    },
    {
        icon: '🔋',
        name: 'Battery Jump-Start',
        description: 'Bike battery dead? We\'ll jump-start or replace it so you\'re back on the road fast.',
        serviceType: 'Battery jump-start'
    },
    {
        icon: '🛞',
        name: 'Puncture Repair',
        description: 'Tube or tubeless flat? On-spot puncture repair for all bike tyre types.',
        serviceType: 'Tube/Tubeless puncture repair'
    },
    {
        icon: '⛽',
        name: 'Emergency Fuel Delivery',
        description: 'Stranded without fuel? We\'ll deliver petrol to wherever your bike has stopped.',
        serviceType: 'Emergency fuel delivery'
    },
    {
        icon: '⚙️',
        name: 'Minor Engine Tuning',
        description: 'Rough idle or sluggish performance? Quick carburettor and engine tuning on-site.',
        serviceType: 'Minor engine tuning'
    },
];

const recoveryServices = [
    {
        icon: '🚛',
        name: 'Vehicle Towing',
        description: 'Short & long distance towing for all vehicles. Available 24/7 anywhere in the city.',
        serviceType: 'Vehicle Towing'
    },
    {
        icon: '🚨',
        name: 'Accident Assistance',
        description: 'Damage inspection, emergency relocation, and coordination with recovery teams.',
        serviceType: 'Accident Assistance'
    },
    {
        icon: '🛻',
        name: 'Flatbed Towing',
        description: 'Dedicated flatbed service for luxury cars and vehicles that cannot be towed normally.',
        serviceType: 'Flatbed Towing'
    },
];

const ServiceCard = ({ service, vehicleType }) => (
    <div className="svc-card">
        <div className="svc-card-icon-wrap">
            <span className="svc-card-icon">{service.icon}</span>
        </div>
        <div className="svc-card-body">
            <h3 className="svc-card-name">{service.name}</h3>
            <p className="svc-card-desc">{service.description}</p>
        </div>
        <Link
            to="/book-assistance"
            state={{ vehicleType: vehicleType || 'Car', serviceType: service.serviceType }}
            className="svc-card-btn"
        >
            Book Now →
        </Link>
    </div>
);

const Services = () => {
    const [activeTab, setActiveTab] = useState('car');

    return (
        <div className="svc-page fade-in">
            {/* ── Header ── */}
            <header className="svc-hero">
                <div className="svc-hero-badge">🔧 Professional Roadside Assistance</div>
                <h1>Our <span>Services</span></h1>
                <p>Expert help for every vehicle emergency — delivered fast, wherever you are.</p>

                {/* ── Tab Switcher ── */}
                <div className="svc-tabs">
                    <button
                        className={`svc-tab ${activeTab === 'car' ? 'active' : ''}`}
                        onClick={() => setActiveTab('car')}
                    >
                        🚘 Car Services
                    </button>
                    <button
                        className={`svc-tab ${activeTab === 'bike' ? 'active' : ''}`}
                        onClick={() => setActiveTab('bike')}
                    >
                        🏍️ Bike Services
                    </button>
                    <button
                        className={`svc-tab ${activeTab === 'recovery' ? 'active' : ''}`}
                        onClick={() => setActiveTab('recovery')}
                    >
                        🚨 Recovery
                    </button>
                </div>
            </header>

            {/* ── Car Services ── */}
            {activeTab === 'car' && (
                <section className="svc-section fade-in">
                    <div className="svc-section-label">
                        <span className="svc-section-emoji">🚘</span>
                        <div>
                            <h2>Car Assistance</h2>
                            <p>{carServices.length} services available</p>
                        </div>
                    </div>
                    <div className="svc-grid">
                        {carServices.map((svc, i) => (
                            <ServiceCard key={i} service={svc} vehicleType="Car" />
                        ))}
                    </div>
                </section>
            )}

            {/* ── Bike Services ── */}
            {activeTab === 'bike' && (
                <section className="svc-section fade-in">
                    <div className="svc-section-label">
                        <span className="svc-section-emoji">🏍️</span>
                        <div>
                            <h2>Bike Assistance</h2>
                            <p>{bikeServices.length} services available</p>
                        </div>
                    </div>
                    <div className="svc-grid">
                        {bikeServices.map((svc, i) => (
                            <ServiceCard key={i} service={svc} vehicleType="Bike" />
                        ))}
                    </div>
                </section>
            )}

            {/* ── Recovery Services ── */}
            {activeTab === 'recovery' && (
                <section className="svc-section fade-in">
                    <div className="svc-section-label">
                        <span className="svc-section-emoji">🚨</span>
                        <div>
                            <h2>Recovery & Support</h2>
                            <p>{recoveryServices.length} services available</p>
                        </div>
                    </div>
                    <div className="svc-grid svc-grid--3">
                        {recoveryServices.map((svc, i) => (
                            <ServiceCard key={i} service={svc} vehicleType="Car" />
                        ))}
                    </div>
                </section>
            )}

            {/* ── CTA Banner ── */}
            <div className="svc-cta">
                <div className="svc-cta-content">
                    <h3>Need immediate help?</h3>
                    <p>Our mechanics are on standby 24/7. Book any service and get a mechanic assigned instantly.</p>
                </div>
                <Link to="/book-assistance" className="svc-cta-btn">
                    Request Assistance Now
                </Link>
            </div>
        </div>
    );
};

export default Services;
