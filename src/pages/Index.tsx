import React, { useState } from 'react';
import { ProvidersProvider } from '@/context/ProvidersContext';
import { MapView } from '@/components/MapView';
import { SidePanel } from '@/components/SidePanel';
import { TopBar } from '@/components/TopBar';
import { ExcelUploadModal } from '@/components/ExcelUploadModal';
import { ProvidersTable } from '@/components/ProvidersTable';

const Index = () => {
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isTableOpen, setIsTableOpen] = useState(false);

  return (
    <ProvidersProvider>
      <div className="fixed inset-0 overflow-hidden bg-background">
        {/* Top Bar with Actions */}
        <TopBar
          onOpenUpload={() => setIsUploadModalOpen(true)}
          onOpenTable={() => setIsTableOpen(true)}
        />

        {/* Side Panel */}
        <SidePanel 
          isOpen={isSidePanelOpen} 
          onToggle={() => setIsSidePanelOpen(!isSidePanelOpen)} 
        />

        {/* Map Container */}
        <div 
          className="absolute inset-0 transition-all duration-300"
          style={{ 
            left: isSidePanelOpen ? '380px' : '0',
            height: '100vh',
            width: isSidePanelOpen ? 'calc(100vw - 380px)' : '100vw'
          }}
        >
          <MapView className="w-full h-full" />
        </div>

        {/* Excel Upload Modal */}
        <ExcelUploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
        />

        {/* Providers Table Modal */}
        <ProvidersTable
          isOpen={isTableOpen}
          onClose={() => setIsTableOpen(false)}
        />
      </div>
    </ProvidersProvider>
  );
};

export default Index;
