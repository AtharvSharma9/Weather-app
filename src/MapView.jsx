import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

function MapView({ apiKey }) {
  const mapRef = useRef(null);
  const [overlayOpacity, setOverlayOpacity] = useState(0.6);
  const layerRefs = useRef({});
  const [baseLoaded, setBaseLoaded] = useState(false);
  const [overlayErrors, setOverlayErrors] = useState(0);
  const [logs, setLogs] = useState([]);
  const [osmTest, setOsmTest] = useState('pending');
  const [owTest, setOwTest] = useState('pending');

  const addLog = (msg) => setLogs(l => [...l, `${new Date().toLocaleTimeString()}: ${msg}`].slice(-50));

  useLayoutEffect(() => {
    if (mapRef.current) return; // already initialized
    const container = document.getElementById('leaflet-map');
    addLog(`MapView init: container exists? ${!!container}`);
    if (!container) {
      console.error('Map container not found. Ensure #leaflet-map exists in the DOM.');
      return;
    }

    console.log('API Key:', apiKey);
    if (!apiKey) {
      console.error('API Key is missing. Ensure it is set in the .env file.');
      return;
    }

    const map = L.map('leaflet-map', { center: [20.5937, 78.9629], zoom: 4 });
    mapRef.current = map;
    addLog('Map initialized successfully.');

    const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
    osm.on('tileerror', (err) => {
      console.warn('OSM tile error', err);
      addLog('OSM tile error');
    });
    osm.on('load', () => {
      setBaseLoaded(true);
      addLog('OSM base layer loaded (tile layer load event)');
    });

    map.whenReady(() => {
      try {
        map.invalidateSize();
        addLog('Map size invalidated successfully.');
      } catch (e) {
        console.error('Error invalidating map size:', e);
      }
      console.log('Map ready, center & zoom:', map.getCenter(), map.getZoom());
      addLog(`Map ready, center ${map.getCenter().toString()} zoom ${map.getZoom()}`);
    });

    L.control.scale({ position: 'bottomleft' }).addTo(map);

    return () => map.remove();
  }, [apiKey]);

  useEffect(() => {
    // update overlay opacity
    Object.values(layerRefs.current).forEach(layer => {
      if (layer && layer.setOpacity) layer.setOpacity(overlayOpacity);
    });
  }, [overlayOpacity]);

  return (
    <div className="map-wrapper">
      <div className="map-controls">
        <label>Overlay opacity</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={overlayOpacity}
          onChange={(e) => setOverlayOpacity(Number(e.target.value))}
        />
      </div>
      {!baseLoaded && (
        <div
          style={{
            padding: 8,
            background: 'rgba(255,255,255,0.02)',
            borderRadius: 6,
            color: 'var(--muted)',
            textAlign: 'center',
          }}
        >
          <strong>Map status:</strong> Base tiles not loaded yet. Check network or try reloading.
          {apiKey ? '' : ' No OpenWeather API key provided — overlays will be blank.'}
          {overlayErrors > 0 && (
            <div style={{ marginTop: 6, color: 'var(--accent)' }}>
              {overlayErrors} overlay tile errors detected.
            </div>
          )}
          <div style={{ marginTop: 10 }}>
            <strong>Loading...</strong>
          </div>
        </div>
      )}
      <div
        id="leaflet-map"
        style={{
          height: '520px',
          width: '100%',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          overflow: 'hidden',
        }}
      />
      <div className="diagnostics">
        <div>
          <strong>Logs</strong>
        </div>
        {logs.length === 0 && (
          <div style={{ color: 'var(--muted)' }}>No events yet</div>
        )}
        {logs.map((l, idx) => (
          <div key={idx}>{l}</div>
        ))}
        <div style={{ marginTop: 8 }}>
          <strong>Tile tests</strong>
          <div
            style={{
              display: 'flex',
              gap: 12,
              marginTop: 6,
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>OSM sample tile</div>
              <img
                alt="osm-test"
                src="https://tile.openstreetmap.org/2/1/1.png"
                style={{
                  width: 80,
                  height: 80,
                  objectFit: 'cover',
                  background: '#eee',
                }}
                onLoad={() => {
                  setOsmTest('ok');
                  addLog('OSM sample image loaded');
                }}
                onError={() => {
                  setOsmTest('error');
                  addLog('OSM sample image failed');
                }}
              />
              <div style={{ fontSize: 12, color: osmTest === 'ok' ? 'green' : 'red' }}>{osmTest}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>OpenWeather sample tile</div>
              <img
                alt="ow-test"
                src={`https://tile.openweathermap.org/map/clouds_new/2/1/1.png?appid=${apiKey}`}
                style={{
                  width: 80,
                  height: 80,
                  objectFit: 'cover',
                  background: '#eee',
                }}
                onLoad={() => {
                  setOwTest('ok');
                  addLog('OW sample image loaded');
                }}
                onError={() => {
                  setOwTest('error');
                  addLog('OW sample image failed');
                }}
              />
              <div style={{ fontSize: 12, color: owTest === 'ok' ? 'green' : 'red' }}>{owTest}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MapView;
