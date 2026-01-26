import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Provider } from '@/types/provider';
import { useProviders } from '@/context/ProvidersContext';
import { formatDistance } from '@/utils/coordinates';
import { Phone, MapPin, User, Tag } from 'lucide-react';

// Custom marker icons
const createMarkerIcon = (isSelected: boolean = false) => {
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

const searchLocationIcon = L.divIcon({
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

// Component to handle map center changes
const MapController: React.FC<{ center: [number, number] | null; zoom?: number }> = ({ center, zoom = 14 }) => {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom, { duration: 0.5 });
    }
  }, [center, zoom, map]);
  
  return null;
};

interface MapViewProps {
  className?: string;
}

const ProviderPopup: React.FC<{ provider: Provider }> = ({ provider }) => (
  <div className="p-3 min-w-[240px]">
    <h3 className="font-semibold text-foreground text-base mb-2">
      {provider.nombre_proveedor}
    </h3>
    
    <div className="space-y-1.5 text-sm">
      {provider.nombre_contacto && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <User className="w-3.5 h-3.5 text-primary" />
          <span>{provider.nombre_contacto}</span>
        </div>
      )}
      
      {provider.numero_celular && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Phone className="w-3.5 h-3.5 text-success" />
          <a 
            href={`tel:${provider.numero_celular}`}
            className="text-primary hover:underline font-medium"
          >
            {provider.numero_celular}
          </a>
        </div>
      )}
      
      <div className="flex items-center gap-2 text-muted-foreground">
        <MapPin className="w-3.5 h-3.5 text-destructive" />
        <span>{provider.ciudad}, {provider.provincia}</span>
      </div>
      
      <div className="flex items-center gap-2 text-muted-foreground">
        <Tag className="w-3.5 h-3.5 text-accent" />
        <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full font-medium">
          {provider.categoria}
        </span>
      </div>
      
      {provider.distance !== undefined && (
        <div className="mt-2 pt-2 border-t border-border">
          <span className="text-xs text-muted-foreground">
            Distancia: <span className="font-semibold text-foreground">{formatDistance(provider.distance)}</span>
          </span>
        </div>
      )}
    </div>
  </div>
);

export const MapView: React.FC<MapViewProps> = ({ className = '' }) => {
  const { filteredProviders, selectedProvider, setSelectedProvider, searchLocation, filters } = useProviders();
  
  // Default center (Buenos Aires, Argentina)
  const defaultCenter: [number, number] = [-34.6037, -58.3816];
  
  // Calculate map center based on providers or search location
  const mapCenter = React.useMemo(() => {
    if (selectedProvider) {
      return [selectedProvider.lat, selectedProvider.lng] as [number, number];
    }
    if (searchLocation) {
      return [searchLocation.lat, searchLocation.lng] as [number, number];
    }
    if (filteredProviders.length > 0) {
      const avgLat = filteredProviders.reduce((sum, p) => sum + p.lat, 0) / filteredProviders.length;
      const avgLng = filteredProviders.reduce((sum, p) => sum + p.lng, 0) / filteredProviders.length;
      return [avgLat, avgLng] as [number, number];
    }
    return defaultCenter;
  }, [selectedProvider, searchLocation, filteredProviders]);

  return (
    <div className={`w-full h-full ${className}`} style={{ minHeight: '100vh' }}>
      <MapContainer
        center={defaultCenter}
        zoom={12}
        style={{ width: '100%', height: '100%', minHeight: '100vh' }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapController center={mapCenter} zoom={selectedProvider ? 16 : 12} />
        
        {/* Search location marker and radius circle */}
        {searchLocation && (
          <>
            <Marker 
              position={[searchLocation.lat, searchLocation.lng]}
              icon={searchLocationIcon}
            >
              <Popup>
                <div className="p-2 text-sm font-medium">
                  📍 Ubicación de búsqueda
                </div>
              </Popup>
            </Marker>
            
            <Circle
              center={[searchLocation.lat, searchLocation.lng]}
              radius={filters.radius * 1000}
              pathOptions={{
                color: '#0ea5e9',
                fillColor: '#0ea5e9',
                fillOpacity: 0.1,
                weight: 2,
                dashArray: '5, 5',
              }}
            />
          </>
        )}
        
        {/* Provider markers */}
        {filteredProviders.map((provider) => (
          <Marker
            key={provider.id}
            position={[provider.lat, provider.lng]}
            icon={createMarkerIcon(selectedProvider?.id === provider.id)}
            eventHandlers={{
              click: () => setSelectedProvider(provider),
            }}
          >
            <Popup>
              <ProviderPopup provider={provider} />
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default MapView;
