import { Link } from 'react-router-dom';
import { Car, Bike, Zap, Truck } from 'lucide-react';
import './Home.css';

const Home = () => {
    return (
        <div className="home-container">
            {/* Hero Section */}
            <section className="hero">
                <div className="hero-content fade-in">
                    <h1>Instant Roadside Assistance, <span>Anytime, Anywhere.</span></h1>
                    <p>The smartest platform connecting you to verified mechanics for cars and bikes on highways and urban roads.</p>
                    <div className="hero-btns">
                        <Link to="/book-assistance" className="btn-primary">Book Help Now</Link>
                        <Link to="/services" className="btn-secondary">Explore Services</Link>
                    </div>
                </div>

                <div className="hero-image fade-in">
                    <img src="/hero.png" alt="Car Assistance Hero" />
                </div>
            </section>

            {/* Services Section */}
            <section className="services-overview">
                <div className="section-title">
                    <h2>Our Specialized Services</h2>
                    <p>Quick, reliable, and location-based assistance for your vehicle.</p>
                </div>
                <div className="services-grid">
                    <Link to="/book-assistance" state={{ vehicleType: 'Car' }} className="service-card">
                        <div className="icon">
                            <Car size={64} strokeWidth={1.5} />
                        </div>
                        <h3>Car Assistance</h3>
                        <p>Engine jump-start, tyre repair, fuel delivery, and more.</p>
                    </Link>
                    <Link to="/book-assistance" state={{ vehicleType: 'Bike' }} className="service-card">
                        <div className="icon">
                            <Bike size={64} strokeWidth={1.5} />
                        </div>
                        <h3>Bike Assistance</h3>
                        <p>Chain repair, spark plug replacement, and on-the-spot tuning.</p>
                    </Link>
                    <Link to="/book-assistance" state={{ serviceType: 'Emergency Support' }} className="service-card">
                        <div className="icon">
                            <Zap size={64} strokeWidth={1.5} />
                        </div>
                        <h3>Emergency Support</h3>
                        <p>24/7 SOS button and instant connection to verified partners.</p>
                    </Link>
                    <Link to="/book-assistance" state={{ serviceType: 'Towing' }} className="service-card">
                        <div className="icon">
                            <Truck size={64} strokeWidth={1.5} />
                        </div>
                        <h3>Towing Services</h3>
                        <p>Flatbed and standard towing for short/long distances.</p>
                    </Link>
                </div>
            </section>
        </div>
    );
};

export default Home;
