import * as XLSX from 'xlsx';
import { Provider } from '@/types/provider';
import { extractCoordinatesFromUrl, isValidGoogleMapsUrl } from './coordinates';

export interface ParseResult {
  success: boolean;
  providers: Provider[];
  errors: string[];
  warnings: string[];
  categories: string[];
}

const generateId = () => Math.random().toString(36).substr(2, 9);

export const parseExcelFile = async (file: File): Promise<ParseResult> => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const providers: Provider[] = [];
  const categories = new Set<string>();

  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    // Get the first sheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: '' });
    
    if (data.length === 0) {
      return {
        success: false,
        providers: [],
        errors: ['El archivo Excel está vacío'],
        warnings: [],
        categories: [],
      };
    }

    // Validate headers
    const firstRow = data[0];
    const requiredFields = ['nombre_proveedor', 'ciudad', 'provincia', 'url_maps_ubicacion'];
    const missingFields = requiredFields.filter(field => 
      !Object.keys(firstRow).some(key => 
        key.toLowerCase().replace(/\s+/g, '_') === field.toLowerCase()
      )
    );

    if (missingFields.length > 0) {
      return {
        success: false,
        providers: [],
        errors: [`Faltan columnas obligatorias: ${missingFields.join(', ')}`],
        warnings: [],
        categories: [],
      };
    }

    // Normalize column names
    const normalizeKey = (key: string) => key.toLowerCase().replace(/\s+/g, '_').trim();
    
    // Process each row
    data.forEach((row, index) => {
      const rowNum = index + 2; // Excel row number (1-indexed, plus header)
      
      // Normalize the row keys
      const normalizedRow: Record<string, string> = {};
      Object.entries(row).forEach(([key, value]) => {
        normalizedRow[normalizeKey(key)] = String(value || '').trim();
      });

      // Get values with fallbacks for common variations
      const nombre_proveedor = normalizedRow.nombre_proveedor || normalizedRow.proveedor || '';
      const nombre_contacto = normalizedRow.nombre_contacto || normalizedRow.contacto || '';
      const numero_celular = normalizedRow.numero_celular || normalizedRow.celular || normalizedRow.telefono || '';
      const ciudad = normalizedRow.ciudad || '';
      const provincia = normalizedRow.provincia || '';
      const url_maps = normalizedRow.url_maps_ubicacion || normalizedRow.url_maps || normalizedRow.ubicacion || '';
      const categoria = normalizedRow.categoria_linea || normalizedRow.categoria || normalizedRow.linea || 'Sin categoría';

      // Validate required fields
      if (!nombre_proveedor) {
        errors.push(`Fila ${rowNum}: nombre_proveedor está vacío`);
        return;
      }
      if (!ciudad) {
        errors.push(`Fila ${rowNum}: ciudad está vacía`);
        return;
      }
      if (!provincia) {
        errors.push(`Fila ${rowNum}: provincia está vacía`);
        return;
      }
      if (!url_maps) {
        errors.push(`Fila ${rowNum}: url_maps_ubicacion está vacía`);
        return;
      }

      // Validate and extract coordinates from URL
      if (!isValidGoogleMapsUrl(url_maps)) {
        errors.push(`Fila ${rowNum}: URL de Google Maps no válida para "${nombre_proveedor}"`);
        return;
      }

      const coords = extractCoordinatesFromUrl(url_maps);
      if (!coords) {
        errors.push(`Fila ${rowNum}: No se pudieron extraer coordenadas de la URL para "${nombre_proveedor}"`);
        return;
      }

      // Add category to set
      if (categoria) {
        categories.add(categoria);
      }

      // Create provider
      providers.push({
        id: generateId(),
        nombre_proveedor,
        nombre_contacto,
        numero_celular,
        ciudad,
        provincia,
        url_maps_ubicacion: url_maps,
        categoria,
        lat: coords.lat,
        lng: coords.lng,
      });
    });

    // Add warnings for missing optional fields
    if (providers.some(p => !p.nombre_contacto)) {
      warnings.push('Algunos proveedores no tienen nombre_contacto');
    }
    if (providers.some(p => !p.numero_celular)) {
      warnings.push('Algunos proveedores no tienen numero_celular');
    }

    return {
      success: providers.length > 0,
      providers,
      errors,
      warnings,
      categories: Array.from(categories).sort(),
    };

  } catch (error) {
    return {
      success: false,
      providers: [],
      errors: [`Error al procesar el archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`],
      warnings: [],
      categories: [],
    };
  }
};
