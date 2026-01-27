// ========================================
// Estado Global de la Aplicación
// ========================================
const AppState = {
  providers: [],
  filteredProviders: [],
  selectedProvider: null,
  searchLocation: null,
  filters: {
    category: '',
    radius: 20
  },
  map: null,
  markers: new Map(),
  searchMarker: null,
  radiusCircle: null
};

// ========================================
// Datos de Ejemplo
// ========================================
const sampleProviders = [
  {
    id: '1',
    nombre_proveedor: 'Grúas Rápidas SA',
    nombre_contacto: 'Carlos Mendoza',
    numero_celular: '+54 11 4567-8901',
    ciudad: 'Buenos Aires',
    provincia: 'Buenos Aires',
    categoria: 'Vial',
    lat: -34.6037,
    lng: -58.3816
  },
  {
    id: '2',
    nombre_proveedor: 'Asistencia Médica 24hs',
    nombre_contacto: 'María González',
    numero_celular: '+54 11 5678-9012',
    ciudad: 'La Plata',
    provincia: 'Buenos Aires',
    categoria: 'Médica',
    lat: -34.9214,
    lng: -57.9544
  },
  {
    id: '3',
    nombre_proveedor: 'Dental Express',
    nombre_contacto: 'Juan Pérez',
    numero_celular: '+54 351 456-7890',
    ciudad: 'Córdoba',
    provincia: 'Córdoba',
    categoria: 'Dental',
    lat: -31.4201,
    lng: -64.1888
  },
  {
    id: '4',
    nombre_proveedor: 'Auxilio Mecánico Norte',
    nombre_contacto: 'Roberto Sánchez',
    numero_celular: '+54 381 567-8901',
    ciudad: 'San Miguel de Tucumán',
    provincia: 'Tucumán',
    categoria: 'Vial',
    lat: -26.8241,
    lng: -65.2226
  },
  {
    id: '5',
    nombre_proveedor: 'Centro Médico Rosario',
    nombre_contacto: 'Ana Martínez',
    numero_celular: '+54 341 678-9012',
    ciudad: 'Rosario',
    provincia: 'Santa Fe',
    categoria: 'Médica',
    lat: -32.9442,
    lng: -60.6505
  },
  {
    id: '6',
    nombre_proveedor: 'Grúas del Sur',
    nombre_contacto: 'Pedro López',
    numero_celular: '+54 291 789-0123',
    ciudad: 'Bahía Blanca',
    provincia: 'Buenos Aires',
    categoria: 'Vial',
    lat: -38.7196,
    lng: -62.2724
  },
  {
    id: '7',
    nombre_proveedor: 'Odontología Integral',
    nombre_contacto: 'Laura Fernández',
    numero_celular: '+54 261 890-1234',
    ciudad: 'Mendoza',
    provincia: 'Mendoza',
    categoria: 'Dental',
    lat: -32.8895,
    lng: -68.8458
  },
  {
    id: '8',
    nombre_proveedor: 'Emergencias Médicas Cuyo',
    nombre_contacto: 'Diego Ruiz',
    numero_celular: '+54 264 901-2345',
    ciudad: 'San Juan',
    provincia: 'San Juan',
    categoria: 'Médica',
    lat: -31.5375,
    lng: -68.5364
  }
];

// ========================================
// Utilidades
// ========================================
function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Radio de la Tierra en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function formatDistance(km) {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(1)} km`;
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  toast.innerHTML = `
    <span class="toast-icon">${icons[type]}</span>
    <span class="toast-message">${message}</span>
  `;
  
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideIn 0.3s ease reverse';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ========================================
// Parseo de Coordenadas
// ========================================
function extractCoordsFromGoogleMapsUrl(url) {
  if (!url) return null;
  
  // Patrón @lat,lng
  const atPattern = /@(-?\d+\.?\d*),(-?\d+\.?\d*)/;
  const atMatch = url.match(atPattern);
  if (atMatch) {
    return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };
  }
  
  // Patrón !3d y !4d
  const dPattern = /!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/;
  const dMatch = url.match(dPattern);
  if (dMatch) {
    return { lat: parseFloat(dMatch[1]), lng: parseFloat(dMatch[2]) };
  }
  
  // Patrón q=lat,lng
  const qPattern = /[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/;
  const qMatch = url.match(qPattern);
  if (qMatch) {
    return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };
  }
  
  // Patrón place/lat,lng
  const placePattern = /place\/(-?\d+\.?\d*),(-?\d+\.?\d*)/;
  const placeMatch = url.match(placePattern);
  if (placeMatch) {
    return { lat: parseFloat(placeMatch[1]), lng: parseFloat(placeMatch[2]) };
  }
  
  return null;
}

function parseCoordinates(input) {
  // Formato: -34.6037, -58.3816
  const pattern = /(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)/;
  const match = input.match(pattern);
  if (match) {
    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[2]);
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { lat, lng };
    }
  }
  return null;
}

async function geocodeAddress(address) {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        address: data[0].display_name
      };
    }
  } catch (error) {
    console.error('Error en geocodificación:', error);
  }
  return null;
}

async function parseLocationInput(input) {
  // Primero intentar extraer de URL de Google Maps
  if (input.includes('google.com/maps') || input.includes('goo.gl') || input.includes('maps.app')) {
    const coords = extractCoordsFromGoogleMapsUrl(input);
    if (coords) {
      return { ...coords, address: `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}` };
    }
  }
  
  // Intentar parsear como coordenadas directas
  const coords = parseCoordinates(input);
  if (coords) {
    return { ...coords, address: `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}` };
  }
  
  // Intentar geocodificar como dirección
  return await geocodeAddress(input);
}

// ========================================
// Mapa
// ========================================
function initMap() {
  const defaultCenter = [-34.6037, -58.3816];
  
  AppState.map = L.map('map', {
    center: defaultCenter,
    zoom: 5,
    zoomControl: true
  });
  
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(AppState.map);
}

function createMarkerIcon(isSelected = false) {
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
    popupAnchor: [0, -size]
  });
}

function createSearchIcon() {
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
    iconAnchor: [10, 10]
  });
}

function createPopupContent(provider) {
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
}

function updateMapMarkers() {
  // Remover marcadores antiguos
  AppState.markers.forEach(marker => marker.remove());
  AppState.markers.clear();
  
  // Agregar nuevos marcadores
  AppState.filteredProviders.forEach(provider => {
    const isSelected = AppState.selectedProvider?.id === provider.id;
    const marker = L.marker([provider.lat, provider.lng], {
      icon: createMarkerIcon(isSelected)
    });
    
    marker.bindPopup(createPopupContent(provider));
    marker.on('click', () => selectProvider(provider));
    marker.addTo(AppState.map);
    
    AppState.markers.set(provider.id, marker);
  });
  
  // Ajustar vista si hay proveedores
  if (AppState.filteredProviders.length > 0 && !AppState.searchLocation) {
    const bounds = L.latLngBounds(
      AppState.filteredProviders.map(p => [p.lat, p.lng])
    );
    AppState.map.fitBounds(bounds, { padding: [50, 50] });
  }
}

function updateSearchLocation() {
  // Remover marcador y círculo anteriores
  if (AppState.searchMarker) {
    AppState.searchMarker.remove();
    AppState.searchMarker = null;
  }
  if (AppState.radiusCircle) {
    AppState.radiusCircle.remove();
    AppState.radiusCircle = null;
  }
  
  if (AppState.searchLocation) {
    // Agregar marcador de ubicación de búsqueda
    AppState.searchMarker = L.marker(
      [AppState.searchLocation.lat, AppState.searchLocation.lng],
      { icon: createSearchIcon() }
    );
    AppState.searchMarker.bindPopup('<div style="padding: 8px; font-size: 14px;">📍 Ubicación de búsqueda</div>');
    AppState.searchMarker.addTo(AppState.map);
    
    // Agregar círculo de radio
    AppState.radiusCircle = L.circle(
      [AppState.searchLocation.lat, AppState.searchLocation.lng],
      {
        radius: AppState.filters.radius * 1000,
        color: '#0ea5e9',
        fillColor: '#0ea5e9',
        fillOpacity: 0.1,
        weight: 2,
        dashArray: '5, 5'
      }
    );
    AppState.radiusCircle.addTo(AppState.map);
    
    // Centrar mapa
    AppState.map.flyTo([AppState.searchLocation.lat, AppState.searchLocation.lng], 12, { duration: 0.5 });
    
    // Actualizar info de ubicación
    document.getElementById('location-info').textContent = `📍 ${AppState.searchLocation.address}`;
  } else {
    document.getElementById('location-info').textContent = '';
  }
}

// ========================================
// Filtrado y Ordenamiento
// ========================================
function filterProviders() {
  let result = AppState.providers.map(p => {
    if (AppState.searchLocation) {
      const distance = calculateDistance(
        AppState.searchLocation.lat, AppState.searchLocation.lng,
        p.lat, p.lng
      );
      return { ...p, distance };
    }
    return { ...p, distance: undefined };
  });
  
  // Filtrar por radio
  if (AppState.searchLocation && AppState.filters.radius) {
    result = result.filter(p => (p.distance || 0) <= AppState.filters.radius);
  }
  
  // Filtrar por categoría
  if (AppState.filters.category) {
    result = result.filter(p => p.categoria === AppState.filters.category);
  }
  
  // Ordenar por distancia
  if (AppState.searchLocation) {
    result.sort((a, b) => (a.distance || 0) - (b.distance || 0));
  }
  
  AppState.filteredProviders = result;
  
  updateProvidersList();
  updateMapMarkers();
  updateProvidersCount();
}

function updateProvidersList() {
  const list = document.getElementById('providers-list');
  
  if (AppState.filteredProviders.length === 0) {
    list.innerHTML = `
      <div style="text-align: center; padding: 40px 20px; color: var(--muted-foreground);">
        <div style="font-size: 48px; margin-bottom: 12px;">📍</div>
        <p>No se encontraron proveedores</p>
      </div>
    `;
    return;
  }
  
  list.innerHTML = AppState.filteredProviders.map(provider => `
    <div class="provider-card ${AppState.selectedProvider?.id === provider.id ? 'selected' : ''}" 
         data-id="${provider.id}">
      <div class="provider-name">${provider.nombre_proveedor}</div>
      <span class="provider-category">${provider.categoria}</span>
      <div class="provider-info">
        ${provider.nombre_contacto ? `<div>👤 ${provider.nombre_contacto}</div>` : ''}
        ${provider.numero_celular ? `<div>📞 ${provider.numero_celular}</div>` : ''}
        <div>📍 ${provider.ciudad}, ${provider.provincia}</div>
      </div>
      ${provider.distance !== undefined ? `
        <div class="provider-distance">
          Distancia: <strong>${formatDistance(provider.distance)}</strong>
        </div>
      ` : ''}
    </div>
  `).join('');
  
  // Agregar event listeners
  list.querySelectorAll('.provider-card').forEach(card => {
    card.addEventListener('click', () => {
      const provider = AppState.filteredProviders.find(p => p.id === card.dataset.id);
      if (provider) selectProvider(provider);
    });
  });
}

function updateProvidersCount() {
  document.getElementById('providers-count').textContent = AppState.filteredProviders.length;
}

function updateCategoryFilter() {
  const categories = [...new Set(AppState.providers.map(p => p.categoria).filter(Boolean))].sort();
  const select = document.getElementById('filter-category');
  
  select.innerHTML = '<option value="">Todas las categorías</option>' +
    categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
}

function selectProvider(provider) {
  AppState.selectedProvider = provider;
  
  // Actualizar UI
  document.querySelectorAll('.provider-card').forEach(card => {
    card.classList.toggle('selected', card.dataset.id === provider.id);
  });
  
  // Actualizar marcadores
  AppState.markers.forEach((marker, id) => {
    marker.setIcon(createMarkerIcon(id === provider.id));
    if (id === provider.id) {
      marker.openPopup();
    }
  });
  
  // Centrar mapa
  AppState.map.flyTo([provider.lat, provider.lng], 16, { duration: 0.5 });
}

// ========================================
// Parseo de Excel
// ========================================
function parseExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        const providers = [];
        const errors = [];
        
        jsonData.forEach((row, index) => {
          const rowNum = index + 2; // +2 porque la fila 1 es el encabezado
          
          // Validar campos obligatorios
          if (!row.nombre_proveedor) {
            errors.push(`Fila ${rowNum}: Falta nombre_proveedor`);
            return;
          }
          if (!row.ciudad) {
            errors.push(`Fila ${rowNum}: Falta ciudad`);
            return;
          }
          if (!row.provincia) {
            errors.push(`Fila ${rowNum}: Falta provincia`);
            return;
          }
          if (!row.url_maps_ubicacion) {
            errors.push(`Fila ${rowNum}: Falta url_maps_ubicacion`);
            return;
          }
          
          // Extraer coordenadas
          const coords = extractCoordsFromGoogleMapsUrl(row.url_maps_ubicacion);
          if (!coords) {
            errors.push(`Fila ${rowNum}: No se pudieron extraer coordenadas de la URL`);
            return;
          }
          
          providers.push({
            id: generateId(),
            nombre_proveedor: row.nombre_proveedor.toString().trim(),
            nombre_contacto: row.nombre_contacto?.toString().trim() || '',
            numero_celular: row.numero_celular?.toString().trim() || '',
            ciudad: row.ciudad.toString().trim(),
            provincia: row.provincia.toString().trim(),
            categoria: row.Categoria_Linea?.toString().trim() || 'Sin categoría',
            lat: coords.lat,
            lng: coords.lng
          });
        });
        
        resolve({ providers, errors });
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Error al leer el archivo'));
    reader.readAsArrayBuffer(file);
  });
}

// ========================================
// Modales
// ========================================
function openModal(modalId) {
  document.getElementById(modalId).classList.remove('hidden');
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.add('hidden');
}

function initModals() {
  // Cerrar modales al hacer clic en overlay o botón de cerrar
  document.querySelectorAll('.modal-overlay, .modal-close').forEach(el => {
    el.addEventListener('click', (e) => {
      const modal = e.target.closest('.modal');
      if (modal) modal.classList.add('hidden');
    });
  });
  
  // Botones de cancelar
  document.getElementById('btn-cancel-upload').addEventListener('click', () => closeModal('upload-modal'));
  document.getElementById('btn-cancel-edit').addEventListener('click', () => closeModal('edit-modal'));
}

// ========================================
// Upload Modal
// ========================================
let selectedFile = null;

function initUploadModal() {
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input');
  const fileInfo = document.getElementById('file-info');
  const confirmBtn = document.getElementById('btn-confirm-upload');
  
  // Click para seleccionar archivo
  dropZone.addEventListener('click', () => fileInput.click());
  
  // Drag and drop
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });
  
  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
  });
  
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  });
  
  // Input file change
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) handleFileSelect(file);
  });
  
  // Remover archivo
  fileInfo.querySelector('.btn-remove-file').addEventListener('click', () => {
    selectedFile = null;
    fileInfo.classList.add('hidden');
    confirmBtn.disabled = true;
  });
  
  // Confirmar carga
  confirmBtn.addEventListener('click', async () => {
    if (!selectedFile) return;
    
    try {
      confirmBtn.disabled = true;
      confirmBtn.textContent = 'Procesando...';
      
      const result = await parseExcelFile(selectedFile);
      
      if (result.errors.length > 0) {
        showToast(`${result.errors.length} errores encontrados. Se cargaron ${result.providers.length} proveedores.`, 'info');
        console.log('Errores:', result.errors);
      }
      
      if (result.providers.length > 0) {
        AppState.providers = result.providers;
        updateCategoryFilter();
        filterProviders();
        showToast(`${result.providers.length} proveedores cargados exitosamente`, 'success');
      } else {
        showToast('No se pudieron cargar proveedores válidos', 'error');
      }
      
      closeModal('upload-modal');
      resetUploadModal();
    } catch (error) {
      showToast('Error al procesar el archivo', 'error');
      console.error(error);
    } finally {
      confirmBtn.disabled = false;
      confirmBtn.textContent = 'Cargar Datos';
    }
  });
}

function handleFileSelect(file) {
  if (!file.name.match(/\.(xlsx|xls)$/i)) {
    showToast('Por favor selecciona un archivo Excel (.xlsx o .xls)', 'error');
    return;
  }
  
  selectedFile = file;
  document.querySelector('.file-name').textContent = file.name;
  document.getElementById('file-info').classList.remove('hidden');
  document.getElementById('btn-confirm-upload').disabled = false;
}

function resetUploadModal() {
  selectedFile = null;
  document.getElementById('file-input').value = '';
  document.getElementById('file-info').classList.add('hidden');
  document.getElementById('btn-confirm-upload').disabled = true;
}

// ========================================
// Table Modal
// ========================================
function initTableModal() {
  const searchInput = document.getElementById('table-search');
  const provinceSelect = document.getElementById('table-filter-province');
  const citySelect = document.getElementById('table-filter-city');
  const categorySelect = document.getElementById('table-filter-category');
  
  // Event listeners para filtros
  [searchInput, provinceSelect, citySelect, categorySelect].forEach(el => {
    el.addEventListener('input', updateTable);
    el.addEventListener('change', updateTable);
  });
}

function updateTableFilters() {
  const provinces = [...new Set(AppState.providers.map(p => p.provincia).filter(Boolean))].sort();
  const cities = [...new Set(AppState.providers.map(p => p.ciudad).filter(Boolean))].sort();
  const categories = [...new Set(AppState.providers.map(p => p.categoria).filter(Boolean))].sort();
  
  document.getElementById('table-filter-province').innerHTML = 
    '<option value="">Todas las provincias</option>' +
    provinces.map(p => `<option value="${p}">${p}</option>`).join('');
  
  document.getElementById('table-filter-city').innerHTML = 
    '<option value="">Todas las ciudades</option>' +
    cities.map(c => `<option value="${c}">${c}</option>`).join('');
  
  document.getElementById('table-filter-category').innerHTML = 
    '<option value="">Todas las categorías</option>' +
    categories.map(c => `<option value="${c}">${c}</option>`).join('');
}

function updateTable() {
  const search = document.getElementById('table-search').value.toLowerCase();
  const province = document.getElementById('table-filter-province').value;
  const city = document.getElementById('table-filter-city').value;
  const category = document.getElementById('table-filter-category').value;
  
  let filtered = AppState.providers;
  
  if (search) {
    filtered = filtered.filter(p => 
      p.nombre_proveedor.toLowerCase().includes(search) ||
      p.nombre_contacto.toLowerCase().includes(search)
    );
  }
  
  if (province) {
    filtered = filtered.filter(p => p.provincia === province);
  }
  
  if (city) {
    filtered = filtered.filter(p => p.ciudad === city);
  }
  
  if (category) {
    filtered = filtered.filter(p => p.categoria === category);
  }
  
  const tbody = document.getElementById('table-body');
  tbody.innerHTML = filtered.map(provider => `
    <tr>
      <td>${provider.nombre_proveedor}</td>
      <td>${provider.nombre_contacto || '-'}</td>
      <td>${provider.numero_celular || '-'}</td>
      <td>${provider.ciudad}</td>
      <td>${provider.provincia}</td>
      <td>${provider.categoria}</td>
      <td>
        <div class="action-buttons">
          <button class="btn btn-secondary btn-sm btn-edit" data-id="${provider.id}">✏️</button>
          <button class="btn btn-danger btn-sm btn-delete" data-id="${provider.id}">🗑️</button>
        </div>
      </td>
    </tr>
  `).join('');
  
  // Event listeners para acciones
  tbody.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', () => openEditModal(btn.dataset.id));
  });
  
  tbody.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', () => deleteProvider(btn.dataset.id));
  });
}

// ========================================
// Edit Modal
// ========================================
function openEditModal(id) {
  const provider = AppState.providers.find(p => p.id === id);
  if (!provider) return;
  
  document.getElementById('edit-id').value = provider.id;
  document.getElementById('edit-nombre').value = provider.nombre_proveedor;
  document.getElementById('edit-contacto').value = provider.nombre_contacto;
  document.getElementById('edit-celular').value = provider.numero_celular;
  document.getElementById('edit-ciudad').value = provider.ciudad;
  document.getElementById('edit-provincia').value = provider.provincia;
  document.getElementById('edit-categoria').value = provider.categoria;
  
  openModal('edit-modal');
}

function initEditModal() {
  document.getElementById('btn-save-edit').addEventListener('click', () => {
    const id = document.getElementById('edit-id').value;
    const index = AppState.providers.findIndex(p => p.id === id);
    
    if (index !== -1) {
      AppState.providers[index] = {
        ...AppState.providers[index],
        nombre_proveedor: document.getElementById('edit-nombre').value,
        nombre_contacto: document.getElementById('edit-contacto').value,
        numero_celular: document.getElementById('edit-celular').value,
        ciudad: document.getElementById('edit-ciudad').value,
        provincia: document.getElementById('edit-provincia').value,
        categoria: document.getElementById('edit-categoria').value
      };
      
      updateCategoryFilter();
      filterProviders();
      updateTable();
      closeModal('edit-modal');
      showToast('Proveedor actualizado', 'success');
    }
  });
}

function deleteProvider(id) {
  if (!confirm('¿Estás seguro de eliminar este proveedor?')) return;
  
  AppState.providers = AppState.providers.filter(p => p.id !== id);
  
  if (AppState.selectedProvider?.id === id) {
    AppState.selectedProvider = null;
  }
  
  updateCategoryFilter();
  filterProviders();
  updateTable();
  showToast('Proveedor eliminado', 'success');
}

// ========================================
// Event Listeners Principales
// ========================================
function initEventListeners() {
  // Toggle panel
  document.getElementById('toggle-panel').addEventListener('click', () => {
    const panel = document.getElementById('side-panel');
    const mapContainer = document.getElementById('map-container');
    const toggleBtn = document.getElementById('toggle-panel');
    
    panel.classList.toggle('collapsed');
    mapContainer.classList.toggle('expanded');
    toggleBtn.textContent = panel.classList.contains('collapsed') ? '›' : '‹';
    
    // Invalidar tamaño del mapa
    setTimeout(() => AppState.map.invalidateSize(), 300);
  });
  
  // Abrir modales
  document.getElementById('btn-upload').addEventListener('click', () => {
    resetUploadModal();
    openModal('upload-modal');
  });
  
  document.getElementById('btn-table').addEventListener('click', () => {
    updateTableFilters();
    updateTable();
    openModal('table-modal');
  });
  
  // Búsqueda de ubicación
  document.getElementById('btn-search').addEventListener('click', handleLocationSearch);
  document.getElementById('location-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleLocationSearch();
  });
  
  // Filtros
  document.getElementById('filter-category').addEventListener('change', (e) => {
    AppState.filters.category = e.target.value;
    filterProviders();
  });
  
  document.getElementById('filter-radius').addEventListener('change', (e) => {
    AppState.filters.radius = parseInt(e.target.value);
    if (AppState.radiusCircle) {
      AppState.radiusCircle.setRadius(AppState.filters.radius * 1000);
    }
    filterProviders();
  });
}

async function handleLocationSearch() {
  const input = document.getElementById('location-input').value.trim();
  
  if (!input) {
    showToast('Ingresa una ubicación, link de Google Maps o coordenadas', 'error');
    return;
  }
  
  const btn = document.getElementById('btn-search');
  btn.textContent = '⏳';
  btn.disabled = true;
  
  try {
    const result = await parseLocationInput(input);
    if (result) {
      AppState.searchLocation = result;
      updateSearchLocation();
      filterProviders();
      showToast('Ubicación encontrada', 'success');
    } else {
      showToast('No se pudo encontrar la ubicación', 'error');
    }
  } catch (error) {
    showToast('Error al buscar la ubicación', 'error');
  } finally {
    btn.textContent = '🔍';
    btn.disabled = false;
  }
}

// ========================================
// Inicialización
// ========================================
document.addEventListener('DOMContentLoaded', () => {
  // Cargar datos de ejemplo
  AppState.providers = sampleProviders;
  
  // Inicializar componentes
  initMap();
  initModals();
  initUploadModal();
  initTableModal();
  initEditModal();
  initEventListeners();
  
  // Actualizar UI
  updateCategoryFilter();
  filterProviders();
  
  console.log('🗺️ Aplicación de Gestión de Proveedores iniciada');
});
