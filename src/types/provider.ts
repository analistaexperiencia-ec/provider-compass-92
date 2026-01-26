export interface Provider {
  id: string;
  nombre_proveedor: string;
  nombre_contacto: string;
  numero_celular: string;
  ciudad: string;
  provincia: string;
  url_maps_ubicacion: string;
  categoria: string;
  lat: number;
  lng: number;
  distance?: number; // Distance in km from search location
}

export interface SearchLocation {
  lat: number;
  lng: number;
  address: string;
}

export interface FilterState {
  categoria: string;
  provincia: string;
  ciudad: string;
  searchQuery: string;
  radius: number; // in km
}
