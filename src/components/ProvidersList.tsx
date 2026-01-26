import React from 'react';
import { useProviders } from '@/context/ProvidersContext';
import { formatDistance } from '@/utils/coordinates';
import { Phone, MapPin, User, ChevronRight } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export const ProvidersList: React.FC = () => {
  const { filteredProviders, selectedProvider, setSelectedProvider, searchLocation } = useProviders();

  if (filteredProviders.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-center">
        <div className="space-y-2">
          <div className="text-4xl">📍</div>
          <p className="text-muted-foreground text-sm">
            No hay proveedores que coincidan con tu búsqueda
          </p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1">
      <div className="divide-y divide-border">
        {filteredProviders.map((provider, index) => (
          <button
            key={provider.id}
            onClick={() => setSelectedProvider(provider)}
            className={`
              w-full text-left p-4 transition-all duration-200 hover:bg-muted
              ${selectedProvider?.id === provider.id 
                ? 'bg-primary/5 border-l-4 border-l-primary' 
                : 'border-l-4 border-l-transparent'
              }
            `}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                {/* Provider Name */}
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-5 h-5 flex items-center justify-center bg-destructive text-destructive-foreground text-xs font-bold rounded-full shrink-0">
                    {index + 1}
                  </span>
                  <h3 className="font-semibold text-foreground truncate text-sm">
                    {provider.nombre_proveedor}
                  </h3>
                </div>

                {/* Category Badge */}
                <span className="inline-block px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full font-medium mb-2">
                  {provider.categoria}
                </span>

                {/* Contact Info */}
                <div className="space-y-1 text-xs text-muted-foreground">
                  {provider.nombre_contacto && (
                    <div className="flex items-center gap-1.5">
                      <User className="w-3 h-3" />
                      <span className="truncate">{provider.nombre_contacto}</span>
                    </div>
                  )}
                  
                  {provider.numero_celular && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-success" />
                      <span className="font-medium text-foreground">{provider.numero_celular}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">{provider.ciudad}, {provider.provincia}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end shrink-0">
                {searchLocation && provider.distance !== undefined && (
                  <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded-full">
                    {formatDistance(provider.distance)}
                  </span>
                )}
                <ChevronRight className="w-4 h-4 text-muted-foreground mt-2" />
              </div>
            </div>
          </button>
        ))}
      </div>
    </ScrollArea>
  );
};

export default ProvidersList;
