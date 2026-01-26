import React, { useRef, useState } from 'react';
import { useProviders } from '@/context/ProvidersContext';
import { parseExcelFile, ParseResult } from '@/utils/excelParser';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, FileSpreadsheet, Check, AlertCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ExcelUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExcelUploadModal: React.FC<ExcelUploadModalProps> = ({ isOpen, onClose }) => {
  const { setProviders } = useProviders();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ParseResult | null>(null);

  const handleFileSelect = async (file: File) => {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast.error('Por favor selecciona un archivo Excel (.xlsx o .xls)');
      return;
    }

    setIsProcessing(true);
    setResult(null);

    try {
      const parseResult = await parseExcelFile(file);
      setResult(parseResult);

      if (parseResult.success) {
        toast.success(`${parseResult.providers.length} proveedores cargados correctamente`);
      }
    } catch (error) {
      toast.error('Error al procesar el archivo');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleConfirmUpload = () => {
    if (result?.providers) {
      setProviders(result.providers);
      toast.success('Proveedores actualizados en el mapa');
      onClose();
      setResult(null);
    }
  };

  const handleClose = () => {
    setResult(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
            Cargar Proveedores desde Excel
          </DialogTitle>
          <DialogDescription>
            Sube un archivo Excel con los datos de los proveedores
          </DialogDescription>
        </DialogHeader>

        {/* Drop Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center transition-all
            ${isDragging 
              ? 'border-primary bg-primary/5' 
              : 'border-border hover:border-primary/50'
            }
          `}
        >
          {isProcessing ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Procesando archivo...</p>
            </div>
          ) : (
            <>
              <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-2">
                Arrastra tu archivo Excel aquí o
              </p>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                Seleccionar archivo
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleInputChange}
                className="hidden"
              />
            </>
          )}
        </div>

        {/* Required Columns Info */}
        <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
          <p className="font-medium mb-1">Columnas requeridas:</p>
          <ul className="grid grid-cols-2 gap-1">
            <li>• nombre_proveedor</li>
            <li>• ciudad</li>
            <li>• provincia</li>
            <li>• url_maps_ubicacion</li>
            <li>• nombre_contacto</li>
            <li>• numero_celular</li>
            <li>• Categoria_Linea</li>
          </ul>
        </div>

        {/* Result Display */}
        {result && (
          <div className="space-y-3">
            {/* Success Message */}
            {result.success && (
              <div className="flex items-center gap-2 p-3 bg-success/10 text-success rounded-lg">
                <Check className="w-5 h-5" />
                <span className="text-sm font-medium">
                  {result.providers.length} proveedores listos para cargar
                </span>
              </div>
            )}

            {/* Categories Found */}
            {result.categories.length > 0 && (
              <div className="text-xs">
                <p className="text-muted-foreground mb-1">Categorías encontradas:</p>
                <div className="flex flex-wrap gap-1">
                  {result.categories.map((cat) => (
                    <span 
                      key={cat} 
                      className="px-2 py-0.5 bg-primary/10 text-primary rounded-full"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Errors */}
            {result.errors.length > 0 && (
              <div className="p-3 bg-destructive/10 rounded-lg">
                <div className="flex items-center gap-2 text-destructive mb-2">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {result.errors.length} errores encontrados
                  </span>
                </div>
                <ScrollArea className="max-h-24">
                  <ul className="text-xs text-destructive space-y-1">
                    {result.errors.map((error, i) => (
                      <li key={i}>• {error}</li>
                    ))}
                  </ul>
                </ScrollArea>
              </div>
            )}

            {/* Warnings */}
            {result.warnings.length > 0 && (
              <div className="p-3 bg-warning/10 rounded-lg">
                <div className="flex items-center gap-2 text-warning mb-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm font-medium">Advertencias</span>
                </div>
                <ul className="text-xs text-warning space-y-1">
                  {result.warnings.map((warning, i) => (
                    <li key={i}>• {warning}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Confirm Button */}
            {result.success && (
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={handleClose}>
                  Cancelar
                </Button>
                <Button onClick={handleConfirmUpload}>
                  <Check className="w-4 h-4 mr-2" />
                  Confirmar y cargar
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ExcelUploadModal;
