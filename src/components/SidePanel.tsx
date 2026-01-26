import React from 'react';
import { useProviders } from '@/context/ProvidersContext';
import { SearchBar } from './SearchBar';
import { ProvidersList } from './ProvidersList';
import { MapPin, List, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SidePanelProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const SidePanel: React.FC<SidePanelProps> = ({ isOpen, onToggle }) => {
  const { filteredProviders, providers } = useProviders();

  return (
    <>
      {/* Toggle Button */}
      <Button
        variant="outline"
        size="icon"
        onClick={onToggle}
        className={`
          fixed top-20 z-50 bg-card shadow-lg border-border
          transition-all duration-300
          ${isOpen ? 'left-[380px]' : 'left-0 rounded-l-none'}
        `}
      >
        {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </Button>

      {/* Side Panel */}
      <div
        className={`
          fixed left-0 top-0 h-full w-[380px] bg-card shadow-panel z-40
          flex flex-col transition-transform duration-300
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="p-4 bg-primary text-primary-foreground">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            <h1 className="text-lg font-semibold">Buscador de Proveedores</h1>
          </div>
          <p className="text-sm text-primary-foreground/80 mt-1">
            Encuentra proveedores de asistencia cercanos
          </p>
        </div>

        {/* Search Bar */}
        <SearchBar />

        {/* Results Header */}
        <div className="px-4 py-2 bg-muted/50 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <List className="w-4 h-4" />
            <span>
              <strong className="text-foreground">{filteredProviders.length}</strong>
              {' '}de{' '}
              <strong className="text-foreground">{providers.length}</strong>
              {' '}proveedores
            </span>
          </div>
        </div>

        {/* Providers List */}
        <ProvidersList />
      </div>
    </>
  );
};

export default SidePanel;
