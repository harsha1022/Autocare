import React from 'react';
import './Services.css';
import { Link } from 'react-router-dom';

const Services = () => {
    const carServices = [
        "Engine starting issue / battery jump-start",
        "Fuel delivery (petrol/diesel)",
        "Tyre puncture repair",
        "Tyre replacement (stepney support)",
        "Brake failure inspection",
        "Overheating / radiator coolant refill",
        "Clutch & accelerator cable issues",
        "Minor electrical repairs",
        "Steering & suspension quick checks"
    ];

    const bikeServices = [
        "Bike kick/self start issues",
        "Chain break or chain tightening",
        "Clutch cable replacement",
        "Accelerator cable repair",
        "Spark plug replacement",
        "Battery jump-start",
        "Tube/Tubeless puncture repair",
        "Emergency fuel delivery",
        "Minor engine tuning"
    ];

    const recoveryServices = [
        { title: "Vehicle Towing", desc: "Short & long distance towing for all vehicles." },
        { title: "Accident Assistance", desc: "Damage inspection and emergency relocation." },
        { title: "Flatbed Towing", desc: "Dedicated support for luxury cars." }
    ];

    return (
        <div className="services-container fade-in">
            <header className="services-header">
                <h1>Detailed <span>Services</span></h1>
                <p>Professional assistance for every situation.</p>
            </header>

            <div className="services-sections">
                <section className="category-section">
                    <h2>🚘 Car Assistance</h2>
                    <div className="services-list">
                        {carServices.map((service, index) => (
                            <div key={index} className="service-item">
                                <h3>Option {index + 1}</h3>
                                <p>{service}</p>
                                <Link
                                    to="/book-assistance"
                                    state={{ vehicleType: 'Car', serviceType: service }}
                                    className="btn-book-service"
                                >
                                    Book Now
                                </Link>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="category-section">
                    <h2>🏍️ Bike Assistance</h2>
                    <div className="services-list">
                        {bikeServices.map((service, index) => (
                            <div key={index} className="service-item">
                                <h3>Option {index + 1}</h3>
                                <p>{service}</p>
                                <Link
                                    to="/book-assistance"
                                    state={{ vehicleType: 'Bike', serviceType: service }}
                                    className="btn-book-service"
                                >
                                    Book Now
                                </Link>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="category-section">
                    <h2>🚨 Recovery & Support</h2>
                    <div className="services-list">
                        {recoveryServices.map((service, index) => (
                            <div key={index} className="service-item">
                                <h3>{service.title}</h3>
                                <p>{service.desc}</p>
                                <Link
                                    to="/book-assistance"
                                    state={{ serviceType: service.title }}
                                    className="btn-book-service"
                                >
                                    Request Help
                                </Link>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default Services;
