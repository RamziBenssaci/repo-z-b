import { useState, useEffect } from 'react';
import { Package, Search, Plus, Eye, Edit, Trash2, X, Save, ShoppingCart, FileText, Download, Loader2 } from 'lucide-react';
import { warehouseApi, reportsApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { exportToExcel, exportToPDF } from '@/utils/exportUtils';

export default function Warehouse() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  // Add Item Form State
  const [addFormData, setAddFormData] = useState({
    itemNumber: '',
    itemName: '',
    receivedQty: '',
    issuedQty: '',
    availableQty: '',
    minQuantity: '',
    purchaseValue: '',
    deliveryDate: '',
    supplierName: '',
    beneficiaryFacility: '',
    notes: ''
  });

  // Edit Item Form State
  const [editFormData, setEditFormData] = useState({
    itemNumber: '',
    itemName: '',
    receivedQty: '',
    issuedQty: '',
    availableQty: '',
    minQuantity: '',
    purchaseValue: '',
    deliveryDate: '',
    supplierName: '',
    beneficiaryFacility: '',
    notes: ''
  });

  // Withdraw Order Form State
  const [withdrawFormData, setWithdrawFormData] = useState({
    itemNumber: '',
    itemName: '',
    beneficiaryFacility: '',
    requestStatus: 'مفتوح تحت الاجراء',
    withdrawQty: '',
    withdrawDate: '',
    recipientName: '',
    recipientContact: '',
    notes: ''
  });

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [inventoryResponse, facilitiesResponse] = await Promise.all([
          warehouseApi.getInventory(),
          reportsApi.getFacilities()
        ]);

        if (inventoryResponse.success) {
          setInventoryItems(inventoryResponse.data || []);
        }

        if (facilitiesResponse.success) {
          setFacilities(facilitiesResponse.data || []);
        }
      } catch (error: any) {
        toast({
          title: "خطأ في تحميل البيانات",
          description: error.message || "فشل في تحميل بيانات المستودع",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [toast]);

  const filteredItems = inventoryItems.filter(item =>
    item.itemName?.includes(searchTerm) || item.itemNumber?.includes(searchTerm)
  );

  // Calculate available quantity automatically
  const calculateAvailableQty = (received: string, issued: string) => {
    const receivedNum = parseFloat(received) || 0;
    const issuedNum = parseFloat(issued) || 0;
    return Math.max(0, receivedNum - issuedNum);
  };

  const handleAddInputChange = (field: string, value: string) => {
    setAddFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-calculate available quantity
      if (field === 'receivedQty' || field === 'issuedQty') {
        updated.availableQty = calculateAvailableQty(
          field === 'receivedQty' ? value : prev.receivedQty,
          field === 'issuedQty' ? value : prev.issuedQty
        ).toString();
      }
      
      return updated;
    });
  };

  const handleWithdrawInputChange = (field: string, value: string) => {
    setWithdrawFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleEditInputChange = (field: string, value: string) => {
    setEditFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-calculate available quantity
      if (field === 'receivedQty' || field === 'issuedQty') {
        updated.availableQty = calculateAvailableQty(
          field === 'receivedQty' ? value : prev.receivedQty,
          field === 'issuedQty' ? value : prev.issuedQty
        ).toString();
      }
      
      return updated;
    });
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoadingAction(true);
      
      const response = await warehouseApi.addInventoryItem(addFormData);
      
      if (response.success) {
        toast({
          title: "تم بنجاح",
          description: "تم إضافة الصنف بنجاح",
        });
        
        // Force reload inventory data and wait for it
        try {
          const inventoryResponse = await warehouseApi.getInventory();
          if (inventoryResponse.success && inventoryResponse.data) {
            setInventoryItems(inventoryResponse.data);
          } else {
            // Fallback: optimistically add the new item to current list
            const newItem = {
              id: Date.now().toString(), // Temporary ID
              ...addFormData,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            setInventoryItems(prev => [...prev, newItem]);
          }
        } catch (reloadError) {
          console.error('Failed to reload inventory:', reloadError);
          // Optimistically add the new item
          const newItem = {
            id: Date.now().toString(),
            ...addFormData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          setInventoryItems(prev => [...prev, newItem]);
        }
        
        // Reset form and close modal
        setShowAddForm(false);
        setShowEditModal(false);
        setSelectedItem(null);
        setSearchTerm(''); // Clear search after adding new item
        setAddFormData({
          itemNumber: '',
          itemName: '',
          receivedQty: '',
          issuedQty: '',
          availableQty: '',
          minQuantity: '',
          purchaseValue: '',
          deliveryDate: '',
          supplierName: '',
          beneficiaryFacility: '',
          notes: ''
        });
      }
    } catch (error: any) {
      toast({
        title: "خطأ في الحفظ",
        description: error.message || "فشل في حفظ البيانات",
        variant: "destructive",
      });
    } finally {
      setLoadingAction(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem?.id) return;

    try {
      setLoadingAction(true);
      
      const response = await warehouseApi.updateInventoryItem(selectedItem.id, editFormData);
      
      if (response.success) {
        toast({
          title: "تم بنجاح",
          description: "تم تحديث الصنف بنجاح",
        });
        
        // Reload inventory data
        const inventoryResponse = await warehouseApi.getInventory();
        if (inventoryResponse.success) {
          setInventoryItems(inventoryResponse.data || []);
        }
        
        setShowEditModal(false);
        setSelectedItem(null);
        setEditFormData({
          itemNumber: '',
          itemName: '',
          receivedQty: '',
          issuedQty: '',
          availableQty: '',
          minQuantity: '',
          purchaseValue: '',
          deliveryDate: '',
          supplierName: '',
          beneficiaryFacility: '',
          notes: ''
        });
      }
    } catch (error: any) {
      toast({
        title: "خطأ في التحديث",
        description: error.message || "فشل في تحديث البيانات",
        variant: "destructive",
      });
    } finally {
      setLoadingAction(false);
    }
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoadingAction(true);
      
      const response = await warehouseApi.createWithdrawalOrder(withdrawFormData);
      
      if (response.success) {
        toast({
          title: "تم بنجاح",
          description: "تم إنشاء أمر الصرف بنجاح",
        });
        
        setShowWithdrawForm(false);
        setSelectedItem(null);
        setWithdrawFormData({
          itemNumber: '',
          itemName: '',
          beneficiaryFacility: '',
          requestStatus: 'مفتوح تحت الاجراء',
          withdrawQty: '',
          withdrawDate: '',
          recipientName: '',
          recipientContact: '',
          notes: ''
        });
      }
    } catch (error: any) {
      toast({
        title: "خطأ في الحفظ",
        description: error.message || "فشل في إنشاء أمر الصرف",
        variant: "destructive",
      });
    } finally {
      setLoadingAction(false);
    }
  };

  const handleWithdrawClick = (item?: any) => {
    if (item) {
      setSelectedItem(item);
      setWithdrawFormData(prev => ({
        ...prev,
        itemNumber: item.itemNumber,
        itemName: item.itemName
      }));
    }
    setShowWithdrawForm(true);
  };

  const handleViewClick = (item: any) => {
    setSelectedItem(item);
    setShowViewModal(true);
  };

  const handleEditClick = (item: any) => {
    setSelectedItem(item);
    setEditFormData({
      itemNumber: item.itemNumber || '',
      itemName: item.itemName || '',
      receivedQty: item.receivedQty?.toString() || '0',
      issuedQty: item.issuedQty?.toString() || '0',
      availableQty: item.availableQty?.toString() || '0',
      minQuantity: item.minQuantity?.toString() || '0',
      purchaseValue: item.purchaseValue?.toString() || '0',
      deliveryDate: item.deliveryDate || '',
      supplierName: item.supplierName || '',
      beneficiaryFacility: item.beneficiaryFacility || '',
      notes: item.notes || ''
    });
    setShowEditModal(true);
  };

  const handleExportToExcel = () => {
    exportToExcel(filteredItems, 'قائمة_المستودع');
    toast({
      title: "تم التصدير",
      description: "تم تصدير البيانات إلى ملف Excel بنجاح",
    });
  };

  const handleExportToPDF = () => {
    exportToPDF(filteredItems, 'قائمة_المستودع');
    toast({
      title: "تم التصدير",
      description: "تم تصدير البيانات إلى ملف PDF بنجاح",
    });
  };

  const handleDeleteItem = async () => {
  if (!itemToDelete) return;
  
  try {
    setLoadingAction(true);
    const response = await warehouseApi.deleteInventoryItem(itemToDelete.id);
    
    if (response.success) {
      toast({
        title: "تم الحذف",
        description: "تم حذف الصنف بنجاح",
      });
      
      // Reload inventory data
      const inventoryResponse = await warehouseApi.getInventory();
      if (inventoryResponse.success) {
        setInventoryItems(inventoryResponse.data || []);
      }
      
      setShowDeleteModal(false);
      setItemToDelete(null);
    }
  } catch (error: any) {
    toast({
      title: "خطأ في الحذف",
      description: error.message || "فشل في حذف الصنف",
      variant: "destructive",
    });
  } finally {
    setLoadingAction(false);
  }
};
  
  return (
    <div className="space-y-6">
      <div className="text-right">
        <h1 className="text-3xl font-bold text-foreground">إدارة المستودع</h1>
        <p className="text-muted-foreground mt-2">إدارة المخزون والأصناف</p>
      </div>

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="البحث في الأصناف..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-10 py-2 border border-input rounded-md text-right"
          />
        </div>
        <button 
          onClick={() => setShowAddForm(true)}
          className="admin-btn-success flex items-center gap-2"
        >
          <Plus size={16} />
          إضافة صنف جديد
        </button>
        <button 
          onClick={() => setShowWithdrawForm(true)}
          className="admin-btn-info flex items-center gap-2"
        >
          <ShoppingCart size={16} />
          <span className="hidden sm:inline">أوامر الصرف</span>
          <span className="sm:hidden">صرف</span>
        </button>
      </div>

      {/* Inventory Stats */}
      <div className="responsive-grid">
        <div className="stat-card">
          <div className="stat-number">{inventoryItems.length}</div>
          <div className="stat-label">إجمالي الأصناف</div>
        </div>
        <div className="stat-card">
          <div className="stat-number text-danger">
            {inventoryItems.filter(item => item.availableQty <= item.minQuantity).length}
          </div>
          <div className="stat-label">مخزون منخفض</div>
        </div>
        <div className="stat-card">
          <div className="stat-number text-success">
            {inventoryItems.reduce((sum, item) => sum + (item.availableQty || 0), 0)}
          </div>
          <div className="stat-label">إجمالي الكمية المتاحة</div>
        </div>
        <div className="stat-card">
          <div className="stat-number text-info">
            {inventoryItems.reduce((sum, item) => sum + (item.purchaseValue || 0), 0)} ريال
          </div>
          <div className="stat-label">إجمالي قيمة المخزون</div>
        </div>
      </div>

      {/* Inventory Items - Enhanced Mobile View */}
      <div className="admin-card">
        <div className="admin-header flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2>الأصناف المتوفرة ({filteredItems.length})</h2>
          <div className="flex gap-2">
            <button 
              onClick={handleExportToExcel}
              className="admin-btn-success text-xs flex items-center gap-1"
            >
              <FileText size={14} />
              Excel
            </button>
            <button 
              onClick={handleExportToPDF}
              className="admin-btn-danger text-xs flex items-center gap-1"
            >
              <Download size={14} />
              PDF
            </button>
          </div>
        </div>
        
        {/* Desktop Table View */}
        <div className="hidden lg:block p-4">
          <div className="responsive-table">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-right">
                  <th className="p-3">رقم الصنف</th>
                  <th className="p-3">اسم الصنف</th>
                  <th className="p-3">الكمية المستلمة</th>
                  <th className="p-3">الكمية المصروفة</th>
                  <th className="p-3">الكمية المتاحة</th>
                  <th className="p-3">الحد الأدنى</th>
                  <th className="p-3">الشركة الموردة</th>
                  <th className="p-3">الحالة</th>
                  <th className="p-3">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id} className="border-b border-border text-right hover:bg-accent">
                    <td className="p-3 font-medium">{item.itemNumber}</td>
                    <td className="p-3">{item.itemName}</td>
                    <td className="p-3">{item.receivedQty}</td>
                    <td className="p-3">{item.issuedQty}</td>
                    <td className="p-3 font-medium">{item.availableQty}</td>
                    <td className="p-3">{item.minQuantity}</td>
                    <td className="p-3">{item.supplierName}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        item.availableQty <= item.minQuantity 
                          ? 'bg-danger text-danger-foreground' 
                          : 'bg-success text-success-foreground'
                      }`}>
                        {item.availableQty <= item.minQuantity ? 'مخزون منخفض' : 'متوفر'}
                      </span>
                    </td>
                    <td className="p-2">
                      <div className="flex gap-1 justify-center">
                        <button 
                          onClick={() => handleViewClick(item)}
                          className="p-1.5 text-info hover:bg-info/10 rounded" 
                          title="عرض"
                        >
                          <Eye size={14} />
                        </button>
                        <button 
                          onClick={() => handleEditClick(item)}
                          className="p-1.5 text-warning hover:bg-warning/10 rounded" 
                          title="تعديل"
                        >
                          <Edit size={14} />
                        </button>
                        <button 
                          onClick={() => handleWithdrawClick(item)}
                          className="p-1.5 text-primary hover:bg-primary/10 rounded" 
                          title="أمر صرف"
                        >
                          <ShoppingCart size={14} />
                        </button>
                        <button 
                          onClick={() => {
                          setItemToDelete(item);
                          setShowDeleteModal(true);
                           }}
                          className="p-1.5 text-danger hover:bg-danger/10 rounded" 
                          title="حذف"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden p-4 space-y-4">
          {filteredItems.map((item) => (
            <div key={item.id} className="border border-border rounded-lg p-4 bg-card">
              <div className="flex justify-between items-start mb-3">
                <div className="text-right flex-1">
                  <h3 className="font-medium text-base">{item.itemName}</h3>
                  <p className="text-sm text-muted-foreground">رقم الصنف: {item.itemNumber}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  item.availableQty <= item.minQuantity 
                    ? 'bg-danger text-danger-foreground' 
                    : 'bg-success text-success-foreground'
                }`}>
                  {item.availableQty <= item.minQuantity ? 'مخزون منخفض' : 'متوفر'}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                <div className="text-right">
                  <span className="text-muted-foreground">الكمية المتاحة:</span>
                  <span className="font-medium mr-2">{item.availableQty}</span>
                </div>
                <div className="text-right">
                  <span className="text-muted-foreground">الحد الأدنى:</span>
                  <span className="font-medium mr-2">{item.minQuantity}</span>
                </div>
                <div className="text-right">
                  <span className="text-muted-foreground">مستلم:</span>
                  <span className="font-medium mr-2">{item.receivedQty}</span>
                </div>
                <div className="text-right">
                  <span className="text-muted-foreground">مصروف:</span>
                  <span className="font-medium mr-2">{item.issuedQty}</span>
                </div>
              </div>
              
              <div className="text-sm text-muted-foreground mb-3 text-right">
                الشركة الموردة: {item.supplierName}
              </div>
              
              <div className="flex gap-2 justify-end">
                <button 
                  onClick={() => handleViewClick(item)}
                  className="admin-btn-info text-xs flex items-center gap-1"
                >
                  <Eye size={12} />
                  عرض
                </button>
                <button 
                  onClick={() => handleEditClick(item)}
                  className="admin-btn-warning text-xs flex items-center gap-1"
                >
                  <Edit size={12} />
                  تعديل
                </button>
                <button 
                  onClick={() => handleWithdrawClick(item)}
                  className="admin-btn-primary text-xs flex items-center gap-1"
                >
                  <ShoppingCart size={12} />
                  صرف
                </button>
                <button 
                  onClick={() => {
  setItemToDelete(item);
  setShowDeleteModal(true);
}}
                  className="admin-btn-danger text-xs flex items-center gap-1"
                >
                  <Trash2 size={12} />
                  حذف
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Item Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="admin-header flex justify-between items-center">
              <h2>إضافة صنف جديد</h2>
              <button 
                onClick={() => setShowAddForm(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddSubmit} className="p-6 space-y-6">
              {/* Item Information */}
              <div className="admin-card">
                <div className="admin-header">
                  <h3>معلومات الصنف</h3>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-right">رقم الصنف *</label>
                      <input
                        type="text"
                        value={addFormData.itemNumber}
                        onChange={(e) => handleAddInputChange('itemNumber', e.target.value)}
                        className="w-full p-2 border border-input rounded-md text-right text-sm"
                        placeholder="رقم الصنف"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-right">اسم الصنف *</label>
                      <input
                        type="text"
                        value={addFormData.itemName}
                        onChange={(e) => handleAddInputChange('itemName', e.target.value)}
                        className="w-full p-2 border border-input rounded-md text-right text-sm"
                        placeholder="اسم الصنف"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Quantity Information */}
              <div className="admin-card">
                <div className="admin-header">
                  <h3>معلومات الكمية</h3>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-right">الكمية المستلمة *</label>
                      <input
                        type="number"
                        value={addFormData.receivedQty}
                        onChange={(e) => handleAddInputChange('receivedQty', e.target.value)}
                        className="w-full p-2 border border-input rounded-md text-right text-sm"
                        placeholder="0"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-right">الكمية المصروفة</label>
                      <input
                        type="number"
                        value={addFormData.issuedQty}
                        onChange={(e) => handleAddInputChange('issuedQty', e.target.value)}
                        className="w-full p-2 border border-input rounded-md text-right text-sm"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-right">الكمية المتاحة (تلقائي)</label>
                      <input
                        type="number"
                        value={addFormData.availableQty}
                        className="w-full p-2 border border-input rounded-md text-right text-sm bg-gray-100"
                        placeholder="يحسب تلقائياً"
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-right">كمية الحد الأدنى *</label>
                      <input
                        type="number"
                        value={addFormData.minQuantity}
                        onChange={(e) => handleAddInputChange('minQuantity', e.target.value)}
                        className="w-full p-2 border border-input rounded-md text-right text-sm"
                        placeholder="الحد الأدنى"
                        required
                      />
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2 text-right">
                    * سيتم تنبيهك عند وصول المخزون إلى الحد الأدنى
                  </div>
                </div>
              </div>

              {/* Financial and Supplier Information */}
              <div className="admin-card">
                <div className="admin-header">
                  <h3>المعلومات المالية والموردين</h3>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-right">قيمة الشراء (ريال) *</label>
                      <input
                        type="number"
                        step="0.01"
                        value={addFormData.purchaseValue}
                        onChange={(e) => handleAddInputChange('purchaseValue', e.target.value)}
                        className="w-full p-2 border border-input rounded-md text-right text-sm"
                        placeholder="0.00"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-right">تاريخ التوريد/التسليم *</label>
                      <input
                        type="date"
                        value={addFormData.deliveryDate}
                        onChange={(e) => handleAddInputChange('deliveryDate', e.target.value)}
                        className="w-full p-2 border border-input rounded-md text-right text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-right">اسم الشركة الموردة *</label>
                      <input
                        type="text"
                        value={addFormData.supplierName}
                        onChange={(e) => handleAddInputChange('supplierName', e.target.value)}
                        className="w-full p-2 border border-input rounded-md text-right text-sm"
                        placeholder="اسم الشركة"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-right">الجهة المستفيدة/المنشأة الطالبة</label>
                      <select
                        value={addFormData.beneficiaryFacility}
                        onChange={(e) => handleAddInputChange('beneficiaryFacility', e.target.value)}
                        className="w-full p-2 border border-input rounded-md text-right text-sm"
                      >
                        <option value="">اختر المنشأة</option>
                        {facilities.map(facility => (
                          <option key={facility.id} value={facility.name}>{facility.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="admin-card">
                <div className="admin-header">
                  <h3>ملاحظات</h3>
                </div>
                <div className="p-4">
                  <textarea
                    value={addFormData.notes}
                    onChange={(e) => handleAddInputChange('notes', e.target.value)}
                    className="w-full p-2 border border-input rounded-md text-right text-sm"
                    rows={3}
                    placeholder="ملاحظات إضافية (اختياري)..."
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-start">
                <button
                  type="submit"
                  className="admin-btn-success flex items-center gap-2 px-4 py-2"
                >
                  <Save size={16} />
                  حفظ الصنف
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="admin-btn-secondary flex items-center gap-2 px-4 py-2"
                >
                  <X size={16} />
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Withdraw Order Modal */}
      {showWithdrawForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="admin-header flex justify-between items-center">
              <h2>أمر صرف - {selectedItem?.itemName}</h2>
              <button 
                onClick={() => setShowWithdrawForm(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleWithdrawSubmit} className="p-6 space-y-6">
              {/* Item Information */}
              <div className="admin-card">
                <div className="admin-header">
                  <h3>معلومات الصنف</h3>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-right">رقم الصنف</label>
                      <input
                        type="text"
                        value={withdrawFormData.itemNumber}
                        className="w-full p-2 border border-input rounded-md text-right text-sm bg-gray-100"
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-right">اسم الصنف</label>
                      <input
                        type="text"
                        value={withdrawFormData.itemName}
                        className="w-full p-2 border border-input rounded-md text-right text-sm bg-gray-100"
                        readOnly
                      />
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-info">
                    الكمية المتاحة: {selectedItem?.availableQty || 0}
                  </div>
                </div>
              </div>

              {/* Withdraw Information */}
              <div className="admin-card">
                <div className="admin-header">
                  <h3>معلومات الصرف</h3>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-right">الجهة المستفيدة/المنشأة *</label>
                      <select
                        value={withdrawFormData.beneficiaryFacility}
                        onChange={(e) => handleWithdrawInputChange('beneficiaryFacility', e.target.value)}
                        className="w-full p-2 border border-input rounded-md text-right text-sm"
                        required
                      >
                        <option value="">اختر المنشأة</option>
                        {facilities.map(facility => (
                          <option key={facility.id} value={facility.name}>{facility.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-right">حالة الطلب *</label>
                      <select
                        value={withdrawFormData.requestStatus}
                        onChange={(e) => handleWithdrawInputChange('requestStatus', e.target.value)}
                        className="w-full p-2 border border-input rounded-md text-right text-sm"
                        required
                      >
                        <option value="مفتوح تحت الاجراء">مفتوح تحت الاجراء</option>
                        <option value="تم الصرف">تم الصرف</option>
                        <option value="مرفوض">مرفوض</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-right">الكمية المصروفة *</label>
                      <input
                        type="number"
                        value={withdrawFormData.withdrawQty}
                        onChange={(e) => handleWithdrawInputChange('withdrawQty', e.target.value)}
                        className="w-full p-2 border border-input rounded-md text-right text-sm"
                        placeholder="الكمية"
                        max={selectedItem?.availableQty || 0}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-right">تاريخ الصرف *</label>
                      <input
                        type="date"
                        value={withdrawFormData.withdrawDate}
                        onChange={(e) => handleWithdrawInputChange('withdrawDate', e.target.value)}
                        className="w-full p-2 border border-input rounded-md text-right text-sm"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Recipient Information */}
              <div className="admin-card">
                <div className="admin-header">
                  <h3>معلومات المستلم</h3>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-right">اسم المستلم *</label>
                      <input
                        type="text"
                        value={withdrawFormData.recipientName}
                        onChange={(e) => handleWithdrawInputChange('recipientName', e.target.value)}
                        className="w-full p-2 border border-input rounded-md text-right text-sm"
                        placeholder="اسم المستلم"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-right">رقم التواصل *</label>
                      <input
                        type="text"
                        value={withdrawFormData.recipientContact}
                        onChange={(e) => handleWithdrawInputChange('recipientContact', e.target.value)}
                        className="w-full p-2 border border-input rounded-md text-right text-sm"
                        placeholder="رقم الهاتف"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
           

              {/* Notes */}
              <div className="admin-card">
                <div className="admin-header">
                  <h3>ملاحظات</h3>
                </div>
                <div className="p-4">
                  <textarea
                    value={withdrawFormData.notes}
                    onChange={(e) => handleWithdrawInputChange('notes', e.target.value)}
                    className="w-full p-2 border border-input rounded-md text-right text-sm"
                    rows={3}
                    placeholder="ملاحظات إضافية..."
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-start">
                <button
                  type="submit"
                  className="admin-btn-success flex items-center gap-2 px-4 py-2"
                >
                  <Save size={16} />
                  حفظ أمر الصرف
                </button>
                <button
                  type="button"
                  onClick={() => setShowWithdrawForm(false)}
                  className="admin-btn-secondary flex items-center gap-2 px-4 py-2"
                >
                  <X size={16} />
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Item Modal */}
      {showViewModal && selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="admin-header flex justify-between items-center">
              <h2>عرض تفاصيل الصنف</h2>
              <button 
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedItem(null);
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="admin-card">
                  <div className="admin-header">
                    <h3>معلومات أساسية</h3>
                  </div>
                  <div className="p-4 space-y-3 text-right">
                    <div><span className="font-medium">رقم الصنف:</span> {selectedItem.itemNumber}</div>
                    <div><span className="font-medium">اسم الصنف:</span> {selectedItem.itemName}</div>
                    <div><span className="font-medium">الشركة الموردة:</span> {selectedItem.supplierName}</div>
                  </div>
                </div>
                
                <div className="admin-card">
                  <div className="admin-header">
                    <h3>الكميات</h3>
                  </div>
                  <div className="p-4 space-y-3 text-right">
                    <div><span className="font-medium">الكمية المستلمة:</span> {selectedItem.receivedQty}</div>
                    <div><span className="font-medium">الكمية المصروفة:</span> {selectedItem.issuedQty}</div>
                    <div><span className="font-medium">الكمية المتاحة:</span> {selectedItem.availableQty}</div>
                    <div><span className="font-medium">الحد الأدنى:</span> {selectedItem.minQuantity}</div>
                  </div>
                </div>
                
                <div className="admin-card">
                  <div className="admin-header">
                    <h3>معلومات مالية</h3>
                  </div>
                  <div className="p-4 space-y-3 text-right">
                    <div><span className="font-medium">قيمة الشراء:</span> {selectedItem.purchaseValue} ريال</div>
                    <div><span className="font-medium">الجهة المستفيدة:</span> {selectedItem.beneficiaryFacility}</div>
                    <div><span className="font-medium">تاريخ التوريد:</span> {selectedItem.deliveryDate || 'غير محدد'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="admin-header flex justify-between items-center">
              <h2>تعديل الصنف - {selectedItem?.itemName}</h2>
              <button 
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedItem(null);
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="p-6 space-y-6">
              {/* Item Information */}
              <div className="admin-card">
                <div className="admin-header">
                  <h3>معلومات الصنف</h3>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-right">رقم الصنف *</label>
                      <input
                        type="text"
                        value={editFormData.itemNumber}
                        onChange={(e) => handleEditInputChange('itemNumber', e.target.value)}
                        className="w-full p-2 border border-input rounded-md text-right text-sm"
                        placeholder="رقم الصنف"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-right">اسم الصنف *</label>
                      <input
                        type="text"
                        value={editFormData.itemName}
                        onChange={(e) => handleEditInputChange('itemName', e.target.value)}
                        className="w-full p-2 border border-input rounded-md text-right text-sm"
                        placeholder="اسم الصنف"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Quantity Information */}
              <div className="admin-card">
                <div className="admin-header">
                  <h3>معلومات الكمية</h3>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-right">الكمية المستلمة *</label>
                      <input
                        type="number"
                        value={editFormData.receivedQty}
                        onChange={(e) => handleEditInputChange('receivedQty', e.target.value)}
                        className="w-full p-2 border border-input rounded-md text-right text-sm"
                        placeholder="0"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-right">الكمية المصروفة</label>
                      <input
                        type="number"
                        value={editFormData.issuedQty}
                        onChange={(e) => handleEditInputChange('issuedQty', e.target.value)}
                        className="w-full p-2 border border-input rounded-md text-right text-sm"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-right">الكمية المتاحة (تلقائي)</label>
                      <input
                        type="number"
                        value={editFormData.availableQty}
                        className="w-full p-2 border border-input rounded-md text-right text-sm bg-gray-100"
                        placeholder="يحسب تلقائياً"
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-right">كمية الحد الأدنى *</label>
                      <input
                        type="number"
                        value={editFormData.minQuantity}
                        onChange={(e) => handleEditInputChange('minQuantity', e.target.value)}
                        className="w-full p-2 border border-input rounded-md text-right text-sm"
                        placeholder="الحد الأدنى"
                        required
                      />
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2 text-right">
                    * سيتم تنبيهك عند وصول المخزون إلى الحد الأدنى
                  </div>
                </div>
              </div>

              {/* Financial and Supplier Information */}
              <div className="admin-card">
                <div className="admin-header">
                  <h3>المعلومات المالية والموردين</h3>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-right">قيمة الشراء (ريال) *</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editFormData.purchaseValue}
                        onChange={(e) => handleEditInputChange('purchaseValue', e.target.value)}
                        className="w-full p-2 border border-input rounded-md text-right text-sm"
                        placeholder="0.00"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-right">تاريخ التوريد/التسليم *</label>
                      <input
                        type="date"
                        value={editFormData.deliveryDate}
                        onChange={(e) => handleEditInputChange('deliveryDate', e.target.value)}
                        className="w-full p-2 border border-input rounded-md text-right text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-right">اسم الشركة الموردة *</label>
                      <input
                        type="text"
                        value={editFormData.supplierName}
                        onChange={(e) => handleEditInputChange('supplierName', e.target.value)}
                        className="w-full p-2 border border-input rounded-md text-right text-sm"
                        placeholder="اسم الشركة"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-right">الجهة المستفيدة/المنشأة الطالبة</label>
                      <select
                        value={editFormData.beneficiaryFacility}
                        onChange={(e) => handleEditInputChange('beneficiaryFacility', e.target.value)}
                        className="w-full p-2 border border-input rounded-md text-right text-sm"
                      >
                        <option value="">اختر المنشأة</option>
                        {facilities.map(facility => (
                          <option key={facility.id} value={facility.name}>{facility.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="admin-card">
                <div className="admin-header">
                  <h3>ملاحظات</h3>
                </div>
                <div className="p-4">
                  <textarea
                    value={editFormData.notes}
                    onChange={(e) => handleEditInputChange('notes', e.target.value)}
                    className="w-full p-2 border border-input rounded-md text-right text-sm"
                    rows={3}
                    placeholder="ملاحظات إضافية (اختياري)..."
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-start">
                <button
                  type="submit"
                  disabled={loadingAction}
                  className="admin-btn-success flex items-center gap-2 px-4 py-2"
                >
                  {loadingAction ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  حفظ التعديلات
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedItem(null);
                  }}
                  className="admin-btn-secondary flex items-center gap-2 px-4 py-2"
                >
                  <X size={16} />
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
         {/* Delete Confirmation Modal */}
{showDeleteModal && itemToDelete && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
    <div className="bg-background rounded-lg w-full max-w-md">
      <div className="admin-header flex justify-between items-center">
        <h2>تأكيد الحذف</h2>
        <button 
          onClick={() => {
            setShowDeleteModal(false);
            setItemToDelete(null);
          }}
          className="text-muted-foreground hover:text-foreground"
        >
          <X size={20} />
        </button>
      </div>
      
      <div className="p-6">
        <div className="text-center mb-6">
          <div className="mx-auto w-12 h-12 bg-danger/10 rounded-full flex items-center justify-center mb-4">
            <Trash2 className="w-6 h-6 text-danger" />
          </div>
          <h3 className="text-lg font-medium mb-2">هل أنت متأكد من الحذف؟</h3>
          <p className="text-muted-foreground text-sm">
            سيتم حذف الصنف "{itemToDelete.itemName}" نهائياً ولن يمكن استرجاعه.
          </p>
        </div>
        
        <div className="flex gap-3 justify-center">
          <button
            onClick={handleDeleteItem}
            disabled={loadingAction}
            className="admin-btn-danger flex items-center gap-2 px-4 py-2"
          >
            {loadingAction ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Trash2 size={16} />
            )}
            تأكيد الحذف
          </button>
          <button
            onClick={() => {
              setShowDeleteModal(false);
              setItemToDelete(null);
            }}
            className="admin-btn-secondary flex items-center gap-2 px-4 py-2"
          >
            <X size={16} />
            إلغاء
          </button>
        </div>
      </div>
    </div>
  </div>
)}
    </div>
  );
}
