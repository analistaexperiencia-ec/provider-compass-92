import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { Provider, SearchLocation, FilterState } from '@/types/provider';
import { sampleProviders } from '@/data/sampleProviders';

interface ProvidersContextType {
  providers: Provider[];
  setProviders: (providers: Provider[]) => void;
  addProvider: (provider: Omit<Provider, 'id'>) => void;
  updateProvider: (id: string, provider: Partial<Provider>) => void;
  deleteProvider: (id: string) => void;
  selectedProvider: Provider | null;
  setSelectedProvider: (provider: Provider | null) => void;
  searchLocation: SearchLocation | null;
  setSearchLocation: (location: SearchLocation | null) => void;
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
  filteredProviders: Provider[];
  categories: string[];
  provinces: string[];
  cities: string[];
}

const ProvidersContext = createContext<ProvidersContextType | undefined>(undefined);

const generateId = () => Math.random().toString(36).substr(2, 9);

// Haversine formula to calculate distance between two points
const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export const ProvidersProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [providers, setProvidersState] = useState<Provider[]>(sampleProviders);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [searchLocation, setSearchLocation] = useState<SearchLocation | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    categoria: '',
    provincia: '',
    ciudad: '',
    searchQuery: '',
    radius: 20,
  });

  const setProviders = useCallback((newProviders: Provider[]) => {
    setProvidersState(newProviders.map(p => ({ ...p, id: p.id || generateId() })));
  }, []);

  const addProvider = useCallback((provider: Omit<Provider, 'id'>) => {
    setProvidersState(prev => [...prev, { ...provider, id: generateId() }]);
  }, []);

  const updateProvider = useCallback((id: string, updates: Partial<Provider>) => {
    setProvidersState(prev => 
      prev.map(p => p.id === id ? { ...p, ...updates } : p)
    );
  }, []);

  const deleteProvider = useCallback((id: string) => {
    setProvidersState(prev => prev.filter(p => p.id !== id));
    if (selectedProvider?.id === id) {
      setSelectedProvider(null);
    }
  }, [selectedProvider]);

  const categories = useMemo(() => 
    [...new Set(providers.map(p => p.categoria).filter(Boolean))].sort(),
    [providers]
  );

  const provinces = useMemo(() => 
    [...new Set(providers.map(p => p.provincia).filter(Boolean))].sort(),
    [providers]
  );

  const cities = useMemo(() => {
    let filteredCities = providers;
    if (filters.provincia) {
      filteredCities = providers.filter(p => p.provincia === filters.provincia);
    }
    return [...new Set(filteredCities.map(p => p.ciudad).filter(Boolean))].sort();
  }, [providers, filters.provincia]);

  const filteredProviders = useMemo(() => {
    let result = providers.map(p => {
      if (searchLocation) {
        const distance = calculateDistance(
          searchLocation.lat, searchLocation.lng,
          p.lat, p.lng
        );
        return { ...p, distance };
      }
      return p;
    });

    // Filter by radius if search location is set
    if (searchLocation && filters.radius) {
      result = result.filter(p => (p.distance || 0) <= filters.radius);
    }

    // Filter by category
    if (filters.categoria) {
      result = result.filter(p => p.categoria === filters.categoria);
    }

    // Filter by province
    if (filters.provincia) {
      result = result.filter(p => p.provincia === filters.provincia);
    }

    // Filter by city
    if (filters.ciudad) {
      result = result.filter(p => p.ciudad === filters.ciudad);
    }

    // Filter by search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      result = result.filter(p => 
        p.nombre_proveedor.toLowerCase().includes(query) ||
        p.nombre_contacto.toLowerCase().includes(query) ||
        p.ciudad.toLowerCase().includes(query)
      );
    }

    // Sort by distance if search location is set
    if (searchLocation) {
      result.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    }

    return result;
  }, [providers, searchLocation, filters]);

  return (
    <ProvidersContext.Provider value={{
      providers,
      setProviders,
      addProvider,
      updateProvider,
      deleteProvider,
      selectedProvider,
      setSelectedProvider,
      searchLocation,
      setSearchLocation,
      filters,
      setFilters,
      filteredProviders,
      categories,
      provinces,
      cities,
    }}>
      {children}
    </ProvidersContext.Provider>
  );
};

export const useProviders = () => {
  const context = useContext(ProvidersContext);
  if (!context) {
    throw new Error('useProviders must be used within a ProvidersProvider');
  }
  return context;
};
