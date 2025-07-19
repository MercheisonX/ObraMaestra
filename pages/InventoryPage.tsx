
import React, { useState, useEffect, useMemo } from 'react';
import { Material, Tool, Supplier } from '../types';
import Input from '../components/ui/Input';
import MagnifyingGlassIcon from '../components/icons/MagnifyingGlassIcon';
import Button from '../components/ui/Button';
import PlusIcon from '../components/icons/PlusIcon';
import PencilIcon from '../components/icons/PencilIcon';
import TrashIcon from '../components/icons/TrashIcon';
import BellAlertIcon from '../components/icons/BellAlertIcon';
import { 
  getMaterials, addMaterial, updateMaterial, deleteMaterial as deleteMaterialFromStorage,
  getTools, addTool, updateTool, deleteTool as deleteToolFromStorage,
  getSuppliers, addSupplier, updateSupplier, deleteSupplier as deleteSupplierFromStorage,
  generateId, getLowStockMaterials
} from '../utils/localStorageManager';
import MaterialFormModal from '../components/modals/MaterialFormModal';
import ToolFormModal from '../components/modals/ToolFormModal';
import SupplierFormModal from '../components/modals/SupplierFormModal'; // New Modal
import ConfirmModal from '../components/modals/ConfirmModal';
import { ITEMS_PER_LOAD_SETTINGS, CURRENCY_FORMATTER, TOOL_STATUS_OPTIONS } from '../constants';
import { useParams, useNavigate } from 'react-router-dom';
import { useHeaderVisibility } from '../App';

type ActiveTab = 'materials' | 'tools' | 'suppliers';

const InventoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { isHeaderVisible } = useHeaderVisibility();
  const { tab: activeTabFromParams } = useParams<{ tab?: ActiveTab }>();
  const [activeTab, setActiveTab] = useState<ActiveTab>(activeTabFromParams || 'materials');
  
  const [materials, setMaterials] = useState<Material[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [lowStockAlertMaterials, setLowStockAlertMaterials] = useState<Material[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLowStock, setFilterLowStock] = useState(false);


  const [visibleMaterialsCount, setVisibleMaterialsCount] = useState(ITEMS_PER_LOAD_SETTINGS);
  const [visibleToolsCount, setVisibleToolsCount] = useState(ITEMS_PER_LOAD_SETTINGS);
  const [visibleSuppliersCount, setVisibleSuppliersCount] = useState(ITEMS_PER_LOAD_SETTINGS);


  const [isMaterialFormModalOpen, setIsMaterialFormModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [isToolFormModalOpen, setIsToolFormModalOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [isSupplierFormModalOpen, setIsSupplierFormModalOpen] = useState(false); // New State
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null); // New State


  const [itemToDelete, setItemToDelete] = useState<{ id: string; type: ActiveTab } | null>(null);
  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);

  const fetchInventory = () => {
    setMaterials(getMaterials());
    setTools(getTools());
    setSuppliers(getSuppliers());
    setLowStockAlertMaterials(getLowStockMaterials());
  }

  useEffect(() => {
    fetchInventory();
  }, []);

  useEffect(() => {
    if (activeTabFromParams) {
      setActiveTab(activeTabFromParams);
    }
  }, [activeTabFromParams]);

  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
    setSearchTerm(''); 
    setFilterLowStock(false);
    setVisibleMaterialsCount(ITEMS_PER_LOAD_SETTINGS);
    setVisibleToolsCount(ITEMS_PER_LOAD_SETTINGS);
    setVisibleSuppliersCount(ITEMS_PER_LOAD_SETTINGS);
    navigate(`/inventory/${tab}`);
  };

  const filteredMaterials = useMemo(() => {
    let currentMaterials = materials;
    if (filterLowStock) {
        const lowStockIds = new Set(lowStockAlertMaterials.map(m => m.id));
        currentMaterials = materials.filter(m => lowStockIds.has(m.id));
    }
    return currentMaterials.filter(material =>
      material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (material.description && material.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (material.supplier && material.supplier.toLowerCase().includes(searchTerm.toLowerCase()))
    ).sort((a,b) => a.name.localeCompare(b.name));
  }, [materials, searchTerm, filterLowStock, lowStockAlertMaterials]);

  const filteredTools = useMemo(() => {
    return tools.filter(tool =>
      tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tool.description && tool.description.toLowerCase().includes(searchTerm.toLowerCase()))
    ).sort((a,b) => a.name.localeCompare(b.name));
  }, [tools, searchTerm]);

  const filteredSuppliers = useMemo(() => { // New Filter
    return suppliers.filter(supplier =>
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (supplier.contactPerson && supplier.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (supplier.phone && supplier.phone.includes(searchTerm)) ||
      (supplier.email && supplier.email.toLowerCase().includes(searchTerm.toLowerCase()))
    ).sort((a,b) => a.name.localeCompare(b.name));
  }, [suppliers, searchTerm]);


  const materialsToDisplay = useMemo(() => filteredMaterials.slice(0, visibleMaterialsCount), [filteredMaterials, visibleMaterialsCount]);
  const toolsToDisplay = useMemo(() => filteredTools.slice(0, visibleToolsCount), [filteredTools, visibleToolsCount]);
  const suppliersToDisplay = useMemo(() => filteredSuppliers.slice(0, visibleSuppliersCount), [filteredSuppliers, visibleSuppliersCount]); // New Display List


  const handleLoadMore = (type: ActiveTab) => {
    if (type === 'materials') setVisibleMaterialsCount(prev => prev + ITEMS_PER_LOAD_SETTINGS);
    else if (type === 'tools') setVisibleToolsCount(prev => prev + ITEMS_PER_LOAD_SETTINGS);
    else if (type === 'suppliers') setVisibleSuppliersCount(prev => prev + ITEMS_PER_LOAD_SETTINGS); // New
  };

  const handleOpenMaterialForm = (material: Material | null = null) => {
    setEditingMaterial(material);
    setIsMaterialFormModalOpen(true);
  };
  const handleSaveMaterial = (materialData: Material) => {
    if (materialData.id) updateMaterial(materialData);
    else addMaterial({ ...materialData, id: generateId('mat-') });
    fetchInventory();
    setVisibleMaterialsCount(ITEMS_PER_LOAD_SETTINGS);
    setIsMaterialFormModalOpen(false);
    setEditingMaterial(null);
  };

  const handleOpenToolForm = (tool: Tool | null = null) => {
    setEditingTool(tool);
    setIsToolFormModalOpen(true);
  };
  const handleSaveTool = (toolData: Tool) => {
    if (toolData.id) updateTool(toolData);
    else addTool({ ...toolData, id: generateId('tool-') });
    fetchInventory();
    setVisibleToolsCount(ITEMS_PER_LOAD_SETTINGS);
    setIsToolFormModalOpen(false);
    setEditingTool(null);
  };

  const handleOpenSupplierForm = (supplier: Supplier | null = null) => { // New Handler
    setEditingSupplier(supplier);
    setIsSupplierFormModalOpen(true);
  };
  const handleSaveSupplier = (supplierData: Supplier) => { // New Handler
    if (supplierData.id) updateSupplier(supplierData);
    else addSupplier({ ...supplierData, id: generateId('sup-')});
    fetchInventory();
    setVisibleSuppliersCount(ITEMS_PER_LOAD_SETTINGS);
    setIsSupplierFormModalOpen(false);
    setEditingSupplier(null);
  };


  const requestDeleteItem = (id: string, type: ActiveTab) => {
    setItemToDelete({ id, type });
    setIsConfirmDeleteModalOpen(true);
  };
  const confirmDeleteItem = () => {
    if (itemToDelete) {
      if (itemToDelete.type === 'materials') deleteMaterialFromStorage(itemToDelete.id);
      else if (itemToDelete.type === 'tools') deleteToolFromStorage(itemToDelete.id);
      else if (itemToDelete.type === 'suppliers') deleteSupplierFromStorage(itemToDelete.id); // New
      fetchInventory();
    }
    setIsConfirmDeleteModalOpen(false);
    setItemToDelete(null);
  };

  const renderItemCardActions = (onEdit: () => void, onDelete: () => void) => (
    <div className="flex space-x-1 flex-shrink-0 ml-2">
      <Button variant="ghost" size="sm" onClick={onEdit} className="p-2"><PencilIcon className="w-5 h-5"/></Button>
      <Button variant="danger" size="sm" onClick={onDelete} className="p-2"><TrashIcon className="w-5 h-5"/></Button>
    </div>
  );
  
  const isMaterialLowStock = (materialId: string) => {
    return lowStockAlertMaterials.some(m => m.id === materialId);
  }

  return (
    <div className="px-6 pb-24 space-y-6">
      <div 
        className="sticky top-0 bg-[var(--color-primary-app)]/80 backdrop-blur-sm z-20 -mx-6 px-6 transition-transform duration-300"
        style={{
          transform: isHeaderVisible ? 'translateY(0)' : 'translateY(calc(-1 * 6rem))'
        }}
      > 
        <div className="flex justify-between items-center mb-4 pt-4">
          <h2 className="text-2xl font-bold text-white">Gestión de Inventario</h2>
          <Button 
            size="sm" 
            shape="pill"
            leftIcon={<PlusIcon className="w-4 h-4"/>} 
            onClick={() => {
                if (activeTab === 'materials') handleOpenMaterialForm();
                else if (activeTab === 'tools') handleOpenToolForm();
                else if (activeTab === 'suppliers') handleOpenSupplierForm();
            }}
            className="bg-gradient-to-r from-cyan-400 to-blue-500 text-white font-bold"
          >
            Añadir
          </Button>
        </div>
        <div className="mb-4">
            <Input
              placeholder={`Buscar ${activeTab === 'materials' ? 'materiales' : activeTab === 'tools' ? 'herramientas' : 'proveedores'}...`}
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                if (activeTab === 'materials') setVisibleMaterialsCount(ITEMS_PER_LOAD_SETTINGS);
                else if (activeTab === 'tools') setVisibleToolsCount(ITEMS_PER_LOAD_SETTINGS);
                else if (activeTab === 'suppliers') setVisibleSuppliersCount(ITEMS_PER_LOAD_SETTINGS);
              }}
              leadingIcon={<MagnifyingGlassIcon />}
              className="rounded-xl !pl-11"
            />
        </div>
         {activeTab === 'materials' && (
            <div className="mb-3 flex justify-start">
                <button
                    onClick={() => setFilterLowStock(!filterLowStock)}
                    className={`px-4 py-1.5 rounded-full text-sm font-semibold flex items-center gap-2 flex-shrink-0 transition-colors ${filterLowStock ? 'bg-gradient-to-r from-amber-500 to-red-500 text-white' : 'bg-[var(--color-secondary-bg)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]'}`}
                >
                    <BellAlertIcon className="w-4 h-4" />
                    {filterLowStock ? `Mostrando Stock Bajo (${filteredMaterials.length})` : `Filtrar Stock Bajo (${lowStockAlertMaterials.length})`}
                </button>
            </div>
        )}
        <div className="flex gap-2 pb-3 overflow-x-auto styled-scrollbar-horizontal-thin border-t border-[var(--color-border)] pt-3">
            {(['materials', 'tools', 'suppliers'] as ActiveTab[]).map(tabName => (
              <button
                key={tabName}
                onClick={() => handleTabChange(tabName)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold flex-shrink-0 transition-colors ${activeTab === tabName ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-white' : 'bg-[var(--color-secondary-bg)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]'}`}
              >
                {tabName === 'materials' ? `Materiales (${materials.length})` : tabName === 'tools' ? `Herramientas (${tools.length})` : `Proveedores (${suppliers.length})`}
              </button>
            ))}
        </div>
      </div>
      
      <div className="pt-2">
        {activeTab === 'materials' && (
          materialsToDisplay.length > 0 ? (
            <div className="space-y-4">
              {materialsToDisplay.map(mat => (
                <div key={mat.id} className={`bg-[var(--color-secondary-bg)] p-3 rounded-2xl flex items-center justify-between transition-all duration-200 border border-l-4 ${isMaterialLowStock(mat.id) ? 'border-l-red-500 border-[var(--color-border)]' : 'border-l-transparent border-[var(--color-border)] hover:border-[var(--color-accent)]'}`}>
                  <div className="flex items-center space-x-3 flex-grow overflow-hidden">
                    <img src={mat.photoUrl || `https://picsum.photos/seed/${mat.id}/48/48`} alt={mat.name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0 border border-[var(--color-border)]"/>
                    <div className="flex-grow overflow-hidden">
                      <h3 className="text-md font-semibold text-white truncate" title={mat.name}>{mat.name}</h3>
                      <p className="text-sm text-[var(--color-text-secondary)]">Stock: {mat.stock} {mat.unit}</p>
                      <p className="text-xs text-[var(--color-accent)]">{CURRENCY_FORMATTER.format(mat.unitPrice)}/{mat.unit}</p>
                    </div>
                  </div>
                  {renderItemCardActions(() => handleOpenMaterialForm(mat), () => requestDeleteItem(mat.id, 'materials'))}
                </div>
              ))}
              {visibleMaterialsCount < filteredMaterials.length && (
                <Button variant="secondary" shape="rounded" fullWidth onClick={() => handleLoadMore('materials')} className="mt-4">
                  Cargar Más Materiales ({filteredMaterials.length - visibleMaterialsCount} restantes)
                </Button>
              )}
            </div>
          ) : <p className="text-[var(--color-text-secondary)] text-center py-6">{filterLowStock ? 'No hay materiales con stock bajo.' : 'No hay materiales.'}</p>
        )}

        {activeTab === 'tools' && (
          toolsToDisplay.length > 0 ? (
            <div className="space-y-4">
              {toolsToDisplay.map(tool => (
                <div key={tool.id} className="bg-[var(--color-secondary-bg)] p-3 rounded-2xl flex items-center justify-between transition-all duration-200 border border-[var(--color-border)] hover:border-[var(--color-accent)]">
                  <div className="flex items-center space-x-3 flex-grow overflow-hidden">
                    <img src={tool.photoUrl || `https://picsum.photos/seed/${tool.id}/48/48`} alt={tool.name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0 border border-[var(--color-border)]"/>
                    <div className="flex-grow overflow-hidden">
                      <h3 className="text-md font-semibold text-white truncate" title={tool.name}>{tool.name}</h3>
                      <p className={`text-sm font-medium ${tool.status === 'disponible' ? 'text-green-400' : tool.status === 'en uso' ? 'text-yellow-400' : 'text-red-400'}`}>
                        {TOOL_STATUS_OPTIONS.find(opt => opt.value === tool.status)?.label || tool.status}
                      </p>
                    </div>
                  </div>
                  {renderItemCardActions(() => handleOpenToolForm(tool), () => requestDeleteItem(tool.id, 'tools'))}
                </div>
              ))}
              {visibleToolsCount < filteredTools.length && (
                <Button variant="secondary" shape="rounded" fullWidth onClick={() => handleLoadMore('tools')} className="mt-4">
                  Cargar Más Herramientas ({filteredTools.length - visibleToolsCount} restantes)
                </Button>
              )}
            </div>
          ) : <p className="text-[var(--color-text-secondary)] text-center py-6">No hay herramientas.</p>
        )}

        {activeTab === 'suppliers' && (
          suppliersToDisplay.length > 0 ? (
            <div className="space-y-4">
              {suppliersToDisplay.map(sup => (
                <div key={sup.id} className="bg-[var(--color-secondary-bg)] p-4 rounded-2xl flex items-center justify-between transition-all duration-200 border border-[var(--color-border)] hover:border-[var(--color-accent)]">
                   <div className="flex-grow overflow-hidden">
                      <h3 className="text-lg font-semibold text-white truncate" title={sup.name}>{sup.name}</h3>
                      {sup.contactPerson && <p className="text-sm text-[var(--color-text-secondary)]">Contacto: {sup.contactPerson}</p>}
                      {sup.phone && <p className="text-sm text-[var(--color-text-secondary)]">Tel: {sup.phone}</p>}
                    </div>
                  {renderItemCardActions(() => handleOpenSupplierForm(sup), () => requestDeleteItem(sup.id, 'suppliers'))}
                </div>
              ))}
              {visibleSuppliersCount < filteredSuppliers.length && (
                <Button variant="secondary" shape="rounded" fullWidth onClick={() => handleLoadMore('suppliers')} className="mt-4">
                  Cargar Más Proveedores ({filteredSuppliers.length - visibleSuppliersCount} restantes)
                </Button>
              )}
            </div>
          ) : <p className="text-[var(--color-text-secondary)] text-center py-6">No hay proveedores registrados.</p>
        )}
      </div>

      {isMaterialFormModalOpen && (
        <MaterialFormModal
          isOpen={isMaterialFormModalOpen}
          onClose={() => {setIsMaterialFormModalOpen(false); setEditingMaterial(null);}}
          onMaterialSaved={handleSaveMaterial}
          material={editingMaterial}
        />
      )}
      {isToolFormModalOpen && (
        <ToolFormModal
          isOpen={isToolFormModalOpen}
          onClose={() => {setIsToolFormModalOpen(false); setEditingTool(null);}}
          onToolSaved={handleSaveTool}
          tool={editingTool}
        />
      )}
      {isSupplierFormModalOpen && (
        <SupplierFormModal
            isOpen={isSupplierFormModalOpen}
            onClose={() => {setIsSupplierFormModalOpen(false); setEditingSupplier(null);}}
            onSave={handleSaveSupplier}
            supplier={editingSupplier}
        />
      )}
      <ConfirmModal
        isOpen={isConfirmDeleteModalOpen}
        onClose={() => setIsConfirmDeleteModalOpen(false)}
        onConfirm={confirmDeleteItem}
        title="Confirmar Eliminación"
        message={`¿Está seguro de que desea eliminar este ${itemToDelete?.type === 'materials' ? 'material' : itemToDelete?.type === 'tools' ? 'herramienta' : 'proveedor'}? Esta acción no se puede deshacer.`}
      />
    </div>
  );
};

export default InventoryPage;