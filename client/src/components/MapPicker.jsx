import React, { useState, useCallback, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import usePlacesAutocomplete, { getGeocode, getLatLng } from 'use-places-autocomplete';

const containerStyle = {
  width: '100%',
  height: '300px',
  borderRadius: '8px',
  marginTop: '10px'
};

const defaultCenter = {
  lat: 28.6139, // Default to New Delhi or generic India center
  lng: 77.2090
};

// Places Search Box Component
const PlacesSearch = ({ onSelect }) => {
  const {
    ready,
    value,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: {
      // Define search scope if needed
    },
    debounce: 300,
  });

  const handleInput = (e) => {
    setValue(e.target.value);
  };

  const handleSelect = ({ description }) => () => {
    setValue(description, false);
    clearSuggestions();

    getGeocode({ address: description }).then((results) => {
      const { lat, lng } = getLatLng(results[0]);
      onSelect({ lat, lng }, description);
    });
  };

  return (
    <div style={{ position: 'relative', width: '100%', marginBottom: '10px' }}>
      <input
        value={value}
        onChange={handleInput}
        disabled={!ready}
        placeholder="Search for an area, landmark, or street..."
        style={{
          width: '100%',
          padding: '12px',
          borderRadius: '8px',
          border: '1px solid rgba(214, 181, 136, 0.4)',
          background: 'rgba(30, 20, 10, 0.6)',
          color: '#fff',
          outline: 'none'
        }}
      />
      {status === 'OK' && (
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
          zIndex: 10,
          border: '1px solid rgba(214, 181, 136, 0.2)',
          boxShadow: '0 4px 15px rgba(0,0,0,0.5)'
        }}>
          {data.map((suggestion) => {
            const {
              place_id,
              structured_formatting: { main_text, secondary_text },
            } = suggestion;
            return (
              <li 
                key={place_id} 
                onClick={handleSelect(suggestion)}
                style={{ padding: '10px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
              >
                <strong>{main_text}</strong> <small>{secondary_text}</small>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

const MapPicker = ({ onLocationSelect, initialLocationText }) => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: ['places']
  });

  const [map, setMap] = useState(null);
  const [markerPos, setMarkerPos] = useState(defaultCenter);
  const [address, setAddress] = useState(initialLocationText || '');

  // Reverse geocode to get a readable address when a pin is dragged
  const getAddressFromCoordinates = (lat, lng) => {
    if (!window.google) return;
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const addr = results[0].formatted_address;
        setAddress(addr);
        onLocationSelect({ lat, lng }, addr);
      } else {
        onLocationSelect({ lat, lng }, "Custom Picked Location");
      }
    });
  };

  useEffect(() => {
    // Attempt to grab current position if the user clicks allow
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const currentPos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setMarkerPos(currentPos);
          getAddressFromCoordinates(currentPos.lat, currentPos.lng);
        },
        () => console.log('Geolocation permission denied.')
      );
    }
  }, []);

  const onLoad = useCallback(function callback(map) {
    setMap(map);
  }, []);

  const onUnmount = useCallback(function callback() {
    setMap(null);
  }, []);

  const handleMapClick = (e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    setMarkerPos({ lat, lng });
    getAddressFromCoordinates(lat, lng);
  };

  const handleSearchSelect = (coords, addr) => {
    setMarkerPos(coords);
    setAddress(addr);
    map?.panTo(coords);
    map?.setZoom(15);
    onLocationSelect(coords, addr);
  };

  if (!isLoaded) return <div style={{ color: '#D6B588', padding: '10px' }}>Loading Map Engine...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      <PlacesSearch onSelect={handleSearchSelect} />
      
      {/* Display computed address strictly for visual feedback */}
      {address && <div style={{ fontSize: '0.85rem', color: '#D6B588', marginBottom: '5px' }}>📍 {address}</div>}

      <GoogleMap
        mapContainerStyle={containerStyle}
        center={markerPos}
        zoom={14}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onClick={handleMapClick}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          styles: [ // Dark mode simple matching the theme
            { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
            { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
            { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
            { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
            { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
            { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
          ]
        }}
      >
        <Marker 
            position={markerPos} 
            draggable={true}
            onDragEnd={handleMapClick}
            animation={window.google.maps.Animation.DROP}
        />
      </GoogleMap>
    </div>
  );
};

export default React.memo(MapPicker);
