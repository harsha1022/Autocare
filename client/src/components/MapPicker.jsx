import React, { useState, useCallback, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet's default marker icon issue with bundlers (Vite/Webpack)
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const defaultCenter = [28.6139, 77.2090]; // Default to New Delhi

// ─── Reverse Geocode via Nominatim (free, no API key) ───────────────────────
const reverseGeocode = async (lat, lng) => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const data = await res.json();
    return data.display_name || 'Unknown location';
  } catch {
    return 'Custom Picked Location';
  }
};

// ─── Places Search using Nominatim (free, no API key) ───────────────────────
const PlacesSearch = ({ onSelect }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef(null);

  const handleInput = (e) => {
    const val = e.target.value;
    setQuery(val);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (val.length < 3) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(val)}&limit=5&addressdetails=1`,
          { headers: { 'Accept-Language': 'en' } }
        );
        const data = await res.json();
        setResults(data);
      } catch {
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 400);
  };

  const handleSelect = (item) => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    setQuery(item.display_name);
    setResults([]);
    onSelect({ lat, lng }, item.display_name);
  };

  return (
    <div style={{ position: 'relative', width: '100%', marginBottom: '10px' }}>
      <input
        value={query}
        onChange={handleInput}
        placeholder="Search for an area, landmark, or street..."
        style={{
          width: '100%',
          padding: '12px',
          borderRadius: '8px',
          border: '1px solid rgba(214, 181, 136, 0.4)',
          background: 'rgba(30, 20, 10, 0.6)',
          color: '#fff',
          outline: 'none',
          boxSizing: 'border-box'
        }}
      />
      {results.length > 0 && (
        <ul style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          background: '#2c1e0e',
          color: '#fff',
          listStyle: 'none',
          padding: 0,
          margin: '5px 0 0',
          borderRadius: '8px',
          zIndex: 1000,
          border: '1px solid rgba(214, 181, 136, 0.2)',
          boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
          maxHeight: '200px',
          overflowY: 'auto'
        }}>
          {results.map((item, index) => {
            // Split display_name into main text and secondary text
            const parts = item.display_name.split(',');
            const mainText = parts[0]?.trim() || '';
            const secondaryText = parts.slice(1).join(',').trim();
            return (
              <li
                key={item.place_id || index}
                onClick={() => handleSelect(item)}
                style={{
                  padding: '10px',
                  cursor: 'pointer',
                  borderBottom: '1px solid rgba(255,255,255,0.05)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(214,181,136,0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <strong>{mainText}</strong>{' '}
                <small style={{ color: '#9d8d7a' }}>{secondaryText}</small>
              </li>
            );
          })}
        </ul>
      )}
      {isSearching && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0,
          background: '#2c1e0e', color: '#9d8d7a', padding: '10px',
          borderRadius: '8px', marginTop: '5px', textAlign: 'center',
          border: '1px solid rgba(214, 181, 136, 0.2)'
        }}>
          Searching...
        </div>
      )}
    </div>
  );
};

// ─── Map Click Handler (Leaflet hook) ────────────────────────────────────────
const MapClickHandler = ({ onMapClick }) => {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

// ─── Map Recenter Helper ─────────────────────────────────────────────────────
const MapRecenter = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom || map.getZoom(), { animate: true });
    }
  }, [center, zoom, map]);
  return null;
};

// ─── Main MapPicker Component ────────────────────────────────────────────────
const MapPicker = ({ onLocationSelect, initialLocationText }) => {
  const [markerPos, setMarkerPos] = useState(defaultCenter);
  const [address, setAddress] = useState(initialLocationText || '');
  const [flyTo, setFlyTo] = useState(null);
  const [flyZoom, setFlyZoom] = useState(null);
  const markerRef = useRef(null);

  // Reverse geocode and notify parent
  const updateLocation = useCallback(async (lat, lng) => {
    setMarkerPos([lat, lng]);
    const addr = await reverseGeocode(lat, lng);
    setAddress(addr);
    onLocationSelect({ lat, lng }, addr);
  }, [onLocationSelect]);

  // Get user's current location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setMarkerPos([lat, lng]);
          setFlyTo([lat, lng]);
          updateLocation(lat, lng);
        },
        () => console.log('Geolocation permission denied.')
      );
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle map click
  const handleMapClick = useCallback((lat, lng) => {
    updateLocation(lat, lng);
  }, [updateLocation]);

  // Handle search selection
  const handleSearchSelect = useCallback((coords, addr) => {
    const pos = [coords.lat, coords.lng];
    setMarkerPos(pos);
    setAddress(addr);
    setFlyTo(pos);
    setFlyZoom(15);
    onLocationSelect(coords, addr);
  }, [onLocationSelect]);

  // Handle marker drag end
  const handleDragEnd = useCallback(() => {
    const marker = markerRef.current;
    if (marker) {
      const { lat, lng } = marker.getLatLng();
      updateLocation(lat, lng);
    }
  }, [updateLocation]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      <PlacesSearch onSelect={handleSearchSelect} />

      {/* Display computed address for visual feedback */}
      {address && (
        <div style={{ fontSize: '0.85rem', color: '#D6B588', marginBottom: '5px' }}>
          📍 {address}
        </div>
      )}

      <MapContainer
        center={markerPos}
        zoom={14}
        style={{
          width: '100%',
          height: '300px',
          borderRadius: '8px',
          marginTop: '10px',
          zIndex: 1
        }}
        zoomControl={true}
      >
        {/* Dark-themed OpenStreetMap tiles to match the app's aesthetic */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        <MapClickHandler onMapClick={handleMapClick} />
        <MapRecenter center={flyTo} zoom={flyZoom} />

        <Marker
          position={markerPos}
          draggable={true}
          ref={markerRef}
          eventHandlers={{ dragend: handleDragEnd }}
        >
          <Popup>
            <span style={{ fontSize: '0.8rem' }}>
              {address || 'Selected Location'}
            </span>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

export default React.memo(MapPicker);
