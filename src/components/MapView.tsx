import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Provider } from '@/types/provider';
import { useProviders } from '@/context/ProvidersContext';
import { formatDistance } from '@/utils/coordinates';

interface MapViewProps {
  className?: string;
}

// Custom marker icon creator
const createMarkerIcon = (isSelected: boolean = false): L.DivIcon => {
  const size = isSelected ? 40 : 32;
  const color = isSelected ? '#2563eb' : '#dc2626';
  
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border: 3px solid white;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      "></div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
};

const createSearchIcon = (): L.DivIcon => {
  return L.divIcon({
    className: 'search-location-marker',
    html: `
      <div style="
        width: 20px;
        height: 20px;
        background: #0ea5e9;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 0 0 8px rgba(14, 165, 233, 0.2), 0 2px 8px rgba(0, 0, 0, 0.3);
      "></div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
};

const createPopupContent = (provider: Provider): string => {
  const distanceHtml = provider.distance !== undefined 
    ? `<div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
        Distancia: <strong style="color: #1f2937;">${formatDistance(provider.distance)}</strong>
      </div>` 
    : '';
  
  return `
    <div style="padding: 12px; min-width: 220px; font-family: 'Inter', system-ui, sans-serif;">
      <h3 style="font-weight: 600; font-size: 14px; margin-bottom: 8px; color: #1f2937;">
        ${provider.nombre_proveedor}
      </h3>
      <div style="font-size: 13px; color: #6b7280; line-height: 1.6;">
        ${provider.nombre_contacto ? `<div>👤 ${provider.nombre_contacto}</div>` : ''}
        ${provider.numero_celular ? `<div>📞 <a href="tel:${provider.numero_celular}" style="color: #2563eb; text-decoration: none;">${provider.numero_celular}</a></div>` : ''}
        <div>📍 ${provider.ciudad}, ${provider.provincia}</div>
        <div style="margin-top: 4px;">
          <span style="display: inline-block; padding: 2px 8px; background: rgba(37, 99, 235, 0.1); color: #2563eb; border-radius: 12px; font-size: 11px; font-weight: 500;">
            ${provider.categoria}
          </span>
        </div>
      </div>
      ${distanceHtml}
    </div>
  `;
};

export const MapView: React.FC<MapViewProps> = ({ className = '' }) => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const searchMarkerRef = useRef<L.Marker | null>(null);
  const radiusCircleRef = useRef<L.Circle | null>(null);
  const [mapReady, setMapReady] = useState(false);
  
  const { 
    filteredProviders, 
    selectedProvider, 
    setSelectedProvider, 
    searchLocation, 
    filters 
  } = useProviders();

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Default center (Buenos Aires, Argentina)
    const defaultCenter: L.LatLngExpression = [-34.6037, -58.3816];
    
    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: 12,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    mapRef.current = map;
    setMapReady(true);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update markers when providers change
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    
    const map = mapRef.current;
    
    // Remove old markers that are no longer in filteredProviders
    const currentIds = new Set(filteredProviders.map(p => p.id));
    markersRef.current.forEach((marker, id) => {
      if (!currentIds.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    });
    
    // Add/update markers
    filteredProviders.forEach((provider) => {
      let marker = markersRef.current.get(provider.id);
      
      if (marker) {
        // Update existing marker
        marker.setLatLng([provider.lat, provider.lng]);
        marker.setIcon(createMarkerIcon(selectedProvider?.id === provider.id));
        marker.getPopup()?.setContent(createPopupContent(provider));
      } else {
        // Create new marker
        marker = L.marker([provider.lat, provider.lng], {
          icon: createMarkerIcon(selectedProvider?.id === provider.id),
        });
        
        marker.bindPopup(createPopupContent(provider));
        
        marker.on('click', () => {
          setSelectedProvider(provider);
        });
        
        marker.addTo(map);
        markersRef.current.set(provider.id, marker);
      }
    });
  }, [filteredProviders, selectedProvider, setSelectedProvider, mapReady]);

  // Update search location marker and circle
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    
    const map = mapRef.current;
    
    // Remove existing search marker and circle
    if (searchMarkerRef.current) {
      searchMarkerRef.current.remove();
      searchMarkerRef.current = null;
    }
    if (radiusCircleRef.current) {
      radiusCircleRef.current.remove();
      radiusCircleRef.current = null;
    }
    
    if (searchLocation) {
      // Add search location marker
      const searchMarker = L.marker([searchLocation.lat, searchLocation.lng], {
        icon: createSearchIcon(),
      });
      searchMarker.bindPopup('<div style="padding: 8px; font-size: 14px;">📍 Ubicación de búsqueda</div>');
      searchMarker.addTo(map);
      searchMarkerRef.current = searchMarker;
      
      // Add radius circle
      const circle = L.circle([searchLocation.lat, searchLocation.lng], {
        radius: filters.radius * 1000,
        color: '#0ea5e9',
        fillColor: '#0ea5e9',
        fillOpacity: 0.1,
        weight: 2,
        dashArray: '5, 5',
      });
      circle.addTo(map);
      radiusCircleRef.current = circle;
      
      // Center map on search location
      map.flyTo([searchLocation.lat, searchLocation.lng], 12, { duration: 0.5 });
    }
  }, [searchLocation, filters.radius, mapReady]);

  // Center on selected provider
  useEffect(() => {
    if (!mapRef.current || !selectedProvider || !mapReady) return;
    
    mapRef.current.flyTo([selectedProvider.lat, selectedProvider.lng], 16, { duration: 0.5 });
    
    // Update marker icon
    markersRef.current.forEach((marker, id) => {
      const isSelected = id === selectedProvider.id;
      marker.setIcon(createMarkerIcon(isSelected));
      if (isSelected) {
        marker.openPopup();
      }
    });
  }, [selectedProvider, mapReady]);

  // Center map when providers are loaded
  useEffect(() => {
    if (!mapRef.current || !mapReady || filteredProviders.length === 0) return;
    
    if (!searchLocation && !selectedProvider) {
      const bounds = L.latLngBounds(
        filteredProviders.map(p => [p.lat, p.lng] as L.LatLngTuple)
      );
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [filteredProviders, searchLocation, selectedProvider, mapReady]);

  return (
    <div 
      ref={mapContainerRef} 
      className={`w-full h-full ${className}`} 
      style={{ minHeight: '100vh' }}
    />
  );
};

export default MapView;
