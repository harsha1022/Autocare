import React, { useState } from 'react';
import { Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const RatingWidget = ({ requestId, onReviewSubmitted }) => {
    const { token } = useAuth();
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);
    const [feedback, setFeedback] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (rating === 0) {
            toast.error('Please select a star rating');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch(`${API}/api/services/${requestId}/review`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ rating, feedback })
            });

            const data = await res.json();
            if (res.ok) {
                toast.success('Thank you for your review!');
                if (onReviewSubmitted) onReviewSubmitted(data.review);
            } else {
                toast.error(data.message || 'Failed to submit review');
            }
        } catch (error) {
            toast.error('Server error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{ marginTop: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(214, 181, 136, 0.1)', padding: '12px', borderRadius: '8px' }}>
            <div style={{ fontSize: '0.85rem', color: '#a39585', marginBottom: '8px', fontWeight: 600 }}>Rate your experience</div>
            <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                {[...Array(5)].map((star, index) => {
                    const ratingValue = index + 1;
                    return (
                        <button
                            key={index}
                            type="button"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                            onClick={() => setRating(ratingValue)}
                            onMouseEnter={() => setHover(ratingValue)}
                            onMouseLeave={() => setHover(rating)}
                        >
                            <Star 
                                size={20} 
                                color={ratingValue <= (hover || rating) ? "#f59e0b" : "rgba(214, 181, 136, 0.2)"}
                                fill={ratingValue <= (hover || rating) ? "#f59e0b" : "none"}
                            />
                        </button>
                    );
                })}
            </div>
            {rating > 0 && (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input 
                        type="text" 
                        value={feedback} 
                        onChange={(e) => setFeedback(e.target.value)} 
                        placeholder="Leave feedback (optional)..."
                        style={{
                            flex: 1, padding: '6px 12px', borderRadius: '20px', 
                            background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(214, 181, 136, 0.3)',
                            color: '#fff', fontSize: '0.8rem', outline: 'none'
                        }}
                    />
                    <button 
                        onClick={handleSubmit} 
                        disabled={isSubmitting}
                        style={{
                            background: '#D6B588', color: '#0f0b07', border: 'none', 
                            padding: '6px 12px', borderRadius: '20px', fontSize: '0.8rem', 
                            fontWeight: 600, cursor: isSubmitting ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {isSubmitting ? 'Submitting...' : 'Submit'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default RatingWidget;
