import React, { useState, useMemo } from 'react';
import { useProviders } from '@/context/ProvidersContext';
import { Provider } from '@/types/provider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Edit2, Trash2, ExternalLink, X, Save, MapPin, Phone, User } from 'lucide-react';
import { toast } from 'sonner';

interface ProvidersTableProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProvidersTable: React.FC<ProvidersTableProps> = ({ isOpen, onClose }) => {
  const { providers, updateProvider, deleteProvider, categories, provinces, cities, filters, setFilters } = useProviders();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Provider | null>(null);

  // Get cities for selected province
  const filteredCities = useMemo(() => {
    if (!selectedProvince) return cities;
    return [...new Set(providers
      .filter(p => p.provincia === selectedProvince)
      .map(p => p.ciudad)
    )].sort();
  }, [providers, selectedProvince, cities]);

  // Filter providers
  const filteredProviders = useMemo(() => {
    return providers.filter(p => {
      const matchesSearch = !searchQuery || 
        p.nombre_proveedor.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.nombre_contacto.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesProvince = !selectedProvince || p.provincia === selectedProvince;
      const matchesCity = !selectedCity || p.ciudad === selectedCity;
      const matchesCategory = !selectedCategory || p.categoria === selectedCategory;
      
      return matchesSearch && matchesProvince && matchesCity && matchesCategory;
    });
  }, [providers, searchQuery, selectedProvince, selectedCity, selectedCategory]);

  const handleEdit = (provider: Provider) => {
    setEditingProvider({ ...provider });
  };

  const handleSaveEdit = () => {
    if (editingProvider) {
      updateProvider(editingProvider.id, editingProvider);
      toast.success('Proveedor actualizado correctamente');
      setEditingProvider(null);
    }
  };

  const handleDelete = () => {
    if (deleteConfirm) {
      deleteProvider(deleteConfirm.id);
      toast.success('Proveedor eliminado');
      setDeleteConfirm(null);
    }
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedProvince('');
    setSelectedCity('');
    setSelectedCategory('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Gestión de Proveedores
          </DialogTitle>
          <DialogDescription>
            {providers.length} proveedores cargados • {filteredProviders.length} mostrados
          </DialogDescription>
        </DialogHeader>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 py-3 border-b">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={selectedProvince} onValueChange={(v) => { setSelectedProvince(v === 'all' ? '' : v); setSelectedCity(''); }}>
            <SelectTrigger>
              <SelectValue placeholder="Provincia" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {provinces.map((p) => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedCity} onValueChange={(v) => setSelectedCity(v === 'all' ? '' : v)}>
            <SelectTrigger>
              <SelectValue placeholder="Ciudad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {filteredCities.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedCategory} onValueChange={(v) => setSelectedCategory(v === 'all' ? '' : v)}>
            <SelectTrigger>
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {(searchQuery || selectedProvince || selectedCity || selectedCategory) && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleClearFilters}
            className="self-start text-muted-foreground"
          >
            <X className="w-4 h-4 mr-1" />
            Limpiar filtros
          </Button>
        )}

        {/* Table */}
        <ScrollArea className="flex-1 border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Proveedor</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Ciudad</TableHead>
                <TableHead>Provincia</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProviders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No se encontraron proveedores
                  </TableCell>
                </TableRow>
              ) : (
                filteredProviders.map((provider) => (
                  <TableRow key={provider.id}>
                    <TableCell className="font-medium">{provider.nombre_proveedor}</TableCell>
                    <TableCell>{provider.nombre_contacto || '-'}</TableCell>
                    <TableCell>
                      {provider.numero_celular ? (
                        <a href={`tel:${provider.numero_celular}`} className="text-primary hover:underline">
                          {provider.numero_celular}
                        </a>
                      ) : '-'}
                    </TableCell>
                    <TableCell>{provider.ciudad}</TableCell>
                    <TableCell>{provider.provincia}</TableCell>
                    <TableCell>
                      <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
                        {provider.categoria}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => window.open(provider.url_maps_ubicacion, '_blank')}
                          title="Ver en Google Maps"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(provider)}
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteConfirm(provider)}
                          className="text-destructive hover:text-destructive"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>

        {/* Edit Dialog */}
        <Dialog open={!!editingProvider} onOpenChange={() => setEditingProvider(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Proveedor</DialogTitle>
            </DialogHeader>
            {editingProvider && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nombre del Proveedor</Label>
                    <Input
                      value={editingProvider.nombre_proveedor}
                      onChange={(e) => setEditingProvider({ ...editingProvider, nombre_proveedor: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nombre de Contacto</Label>
                    <Input
                      value={editingProvider.nombre_contacto}
                      onChange={(e) => setEditingProvider({ ...editingProvider, nombre_contacto: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Número de Celular</Label>
                    <Input
                      value={editingProvider.numero_celular}
                      onChange={(e) => setEditingProvider({ ...editingProvider, numero_celular: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Categoría</Label>
                    <Input
                      value={editingProvider.categoria}
                      onChange={(e) => setEditingProvider({ ...editingProvider, categoria: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Ciudad</Label>
                    <Input
                      value={editingProvider.ciudad}
                      onChange={(e) => setEditingProvider({ ...editingProvider, ciudad: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Provincia</Label>
                    <Input
                      value={editingProvider.provincia}
                      onChange={(e) => setEditingProvider({ ...editingProvider, provincia: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>URL de Google Maps</Label>
                  <Input
                    value={editingProvider.url_maps_ubicacion}
                    onChange={(e) => setEditingProvider({ ...editingProvider, url_maps_ubicacion: e.target.value })}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingProvider(null)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveEdit}>
                <Save className="w-4 h-4 mr-2" />
                Guardar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar eliminación</DialogTitle>
              <DialogDescription>
                ¿Estás seguro de eliminar a <strong>{deleteConfirm?.nombre_proveedor}</strong>? 
                Esta acción no se puede deshacer.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                <Trash2 className="w-4 h-4 mr-2" />
                Eliminar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
};

export default ProvidersTable;
