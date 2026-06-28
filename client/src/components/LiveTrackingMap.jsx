import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { io } from 'socket.io-client';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Custom mechanic icon
const mechanicIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const MapRecenter = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom(), { animate: true });
    }
  }, [center, map]);
  return null;
};

const LiveTrackingMap = ({ requestId, initialLocation }) => {
    const [mechanicPos, setMechanicPos] = useState(null);
    const userPos = initialLocation?.coordinates && initialLocation.coordinates.length === 2 
        ? [initialLocation.coordinates[1], initialLocation.coordinates[0]] // GeoJSON is [lng, lat]
        : null;

    useEffect(() => {
        if (!requestId) return;
        
        const socket = io(API);
        socket.on(`tracking_${requestId}`, (data) => {
            setMechanicPos([data.lat, data.lng]);
        });

        return () => socket.disconnect();
    }, [requestId]);

    const centerPos = mechanicPos || userPos || [28.6139, 77.2090];

    return (
        <div style={{ position: 'relative', width: '100%', height: '200px', borderRadius: '8px', overflow: 'hidden', marginTop: '10px', border: '1px solid rgba(214, 181, 136, 0.2)' }}>
            <MapContainer center={centerPos} zoom={15} style={{ width: '100%', height: '100%' }} zoomControl={false}>
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; OpenStreetMap contributors &copy; CARTO'
                />
                <MapRecenter center={mechanicPos || centerPos} />
                
                {userPos && (
                    <Marker position={userPos}>
                        <Popup>Your Location</Popup>
                    </Marker>
                )}
                
                {mechanicPos && (
                    <Marker position={mechanicPos} icon={mechanicIcon}>
                        <Popup>Mechanic's Live Location</Popup>
                    </Marker>
                )}
            </MapContainer>
            
            {/* Overlay Status */}
            <div style={{
                position: 'absolute', top: 10, right: 10, zIndex: 1000,
                background: 'rgba(30, 20, 10, 0.8)', padding: '6px 12px', borderRadius: '20px',
                color: '#fff', fontSize: '0.75rem', fontWeight: 600, border: '1px solid rgba(214, 181, 136, 0.4)',
                backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', gap: '6px'
            }}>
                <span style={{ width: 8, height: 8, background: mechanicPos ? '#10b981' : '#f59e0b', borderRadius: '50%', display: 'inline-block' }} />
                {mechanicPos ? 'Live Tracking Active' : 'Waiting for mechanic location...'}
            </div>
        </div>
    );
};

export default LiveTrackingMap;
