import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileSpreadsheet, Table2, HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface TopBarProps {
  onOpenUpload: () => void;
  onOpenTable: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onOpenUpload, onOpenTable }) => {
  return (
    <div className="fixed top-0 right-0 z-50 p-4 flex items-center gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            className="bg-card shadow-md"
            onClick={onOpenUpload}
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Cargar Excel
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          Subir archivo Excel con proveedores
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            className="bg-card shadow-md"
            onClick={onOpenTable}
          >
            <Table2 className="w-4 h-4 mr-2" />
            Gestionar
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          Ver y editar proveedores
        </TooltipContent>
      </Tooltip>
    </div>
  );
};

export default TopBar;
