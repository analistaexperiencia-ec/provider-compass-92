import React, { useState } from 'react';
import { useProviders } from '@/context/ProvidersContext';
import { parseLocationInput } from '@/utils/coordinates';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, MapPin, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

const RADIUS_OPTIONS = [
  { value: 5, label: '5 km' },
  { value: 10, label: '10 km' },
  { value: 20, label: '20 km' },
  { value: 50, label: '50 km' },
  { value: 100, label: '100 km' },
];

export const SearchBar: React.FC = () => {
  const { filters, setFilters, categories, searchLocation, setSearchLocation } = useProviders();
  const [locationInput, setLocationInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleLocationSearch = async () => {
    if (!locationInput.trim()) {
      toast.error('Ingresa una ubicación, link de Google Maps o coordenadas');
      return;
    }

    setIsSearching(true);
    try {
      const result = await parseLocationInput(locationInput.trim());
      if (result) {
        setSearchLocation(result);
        toast.success('Ubicación encontrada');
      } else {
        toast.error('No se pudo encontrar la ubicación. Intenta con un formato diferente.');
      }
    } catch (error) {
      toast.error('Error al buscar la ubicación');
    } finally {
      setIsSearching(false);
    }
  };

  const handleClearLocation = () => {
    setSearchLocation(null);
    setLocationInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLocationSearch();
    }
  };

  return (
    <div className="p-4 space-y-3 bg-card border-b border-border">
      {/* Location Search */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" />
          Ubicación del cliente
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              type="text"
              placeholder="Link de Google Maps, dirección o coordenadas..."
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className="pr-8"
            />
            {searchLocation && (
              <button
                onClick={handleClearLocation}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <Button 
            onClick={handleLocationSearch}
            disabled={isSearching}
            size="icon"
          >
            {isSearching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </Button>
        </div>
        {searchLocation && (
          <p className="text-xs text-muted-foreground truncate">
            📍 {searchLocation.address}
          </p>
        )}
      </div>

      {/* Filters Row */}
      <div className="flex gap-2">
        {/* Category Filter */}
        <Select
          value={filters.categoria}
          onValueChange={(value) => setFilters({ ...filters, categoria: value === 'all' ? '' : value })}
        >
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Radius Filter */}
        <Select
          value={filters.radius.toString()}
          onValueChange={(value) => setFilters({ ...filters, radius: parseInt(value) })}
        >
          <SelectTrigger className="w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RADIUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value.toString()}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default SearchBar;
