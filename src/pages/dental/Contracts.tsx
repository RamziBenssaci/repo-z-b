import { useState, useEffect } from 'react';
import { Save, Plus, Eye, Edit, Trash2 } from 'lucide-react';
import { mockFacilities } from '@/data/mockData';
import { dentalContractsApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function DentalContracts() {
  const [formData, setFormData] = useState({
    orderDate: '',
    itemNumber: '',
    itemName: '',
    quantity: '',
    beneficiaryFacility: '',
    financialApprovalNumber: '',
    approvalDate: '',
    totalCost: '',
    supplierName: '',
    supplierContact: '',
    status: 'جديد',
    deliveryDate: '',
    actualDeliveryDate: '',
    notes: ''
  });

  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const { toast } = useToast();

  // Fetch contracts on component mount
  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const response = await dentalContractsApi.getContracts();
      
      if (response.success) {
        setContracts(response.data || []);
      } else {
        // Fallback to mock data if API fails
        setContracts([
          {
            id: 'DC001',
            itemName: 'كرسي أسنان متقدم',
            beneficiaryFacility: 'عيادة أسنان الرياض',
            status: 'تم التعاقد',
            totalCost: 25000,
            orderDate: '2025-01-15',
            supplierName: 'شركة الأجهزة الطبية المتقدمة'
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching contracts:', error);
      // Fallback to mock data
      setContracts([
        {
          id: 'DC001',
          itemName: 'كرسي أسنان متقدم',
          beneficiaryFacility: 'عيادة أسنان الرياض',
          status: 'تم التعاقد',
          totalCost: 25000,
          orderDate: '2025-01-15',
          supplierName: 'شركة الأجهزة الطبية المتقدمة'
        }
      ]);
      
      toast({
        title: "تحذير",
        description: "فشل في تحميل العقود من الخادم. سيتم عرض البيانات التجريبية.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const response = await dentalContractsApi.createContract(formData);
      
      if (response.success) {
        toast({
          title: "نجح الإنشاء",
          description: "تم إنشاء عقد الأسنان بنجاح",
        });
        
        // Reset form
        setFormData({
          orderDate: '',
          itemNumber: '',
          itemName: '',
          quantity: '',
          beneficiaryFacility: '',
          financialApprovalNumber: '',
          approvalDate: '',
          totalCost: '',
          supplierName: '',
          supplierContact: '',
          status: 'جديد',
          deliveryDate: '',
          actualDeliveryDate: '',
          notes: ''
        });
        
        // Refresh contracts list
        fetchContracts();
      }
    } catch (error: any) {
      console.error('Error creating contract:', error);
      toast({
        title: "خطأ في الإنشاء",
        description: error.message || "فشل في إنشاء العقد",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewContract = (contract: any) => {
    setSelectedContract(contract);
    setIsViewDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="text-right">
        <h1 className="text-3xl font-bold text-foreground">عقود الأسنان - بلانكت</h1>
        <p className="text-muted-foreground mt-2">إدارة عقود وطلبات أجهزة ومستلزمات الأسنان</p>
      </div>

      <div className="admin-card">
        <div className="admin-header">
          <h2>إنشاء طلب عقد أسنان جديد</h2>
        </div>
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-right">تاريخ الطلب *</label>
                <input
                  type="date"
                  value={formData.orderDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, orderDate: e.target.value }))}
                  className="w-full p-3 border border-input rounded-md text-right"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-right">رقم الصنف *</label>
                <input
                  type="text"
                  value={formData.itemNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, itemNumber: e.target.value }))}
                  className="w-full p-3 border border-input rounded-md text-right"
                  placeholder="رقم صنف الأسنان"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-right">اسم الصنف *</label>
                <input
                  type="text"
                  value={formData.itemName}
                  onChange={(e) => setFormData(prev => ({ ...prev, itemName: e.target.value }))}
                  className="w-full p-3 border border-input rounded-md text-right"
                  placeholder="جهاز أو مستلزم أسنان"
                  required
                />
              </div>
            </div>

            {/* Quantity and Facility */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-right">الكمية *</label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                  className="w-full p-3 border border-input rounded-md text-right"
                  placeholder="الكمية"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-right">عيادة الأسنان المستفيدة *</label>
                <select
                  value={formData.beneficiaryFacility}
                  onChange={(e) => setFormData(prev => ({ ...prev, beneficiaryFacility: e.target.value }))}
                  className="w-full p-3 border border-input rounded-md text-right"
                  required
                >
                  <option value="">اختر عيادة الأسنان</option>
                  {mockFacilities.map(facility => (
                    <option key={facility.id} value={facility.name}>{facility.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Financial Approval */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-right">رقم التعميد المالي</label>
                <input
                  type="text"
                  value={formData.financialApprovalNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, financialApprovalNumber: e.target.value }))}
                  className="w-full p-3 border border-input rounded-md text-right"
                  placeholder="رقم التعميد"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-right">تاريخ التعميد</label>
                <input
                  type="date"
                  value={formData.approvalDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, approvalDate: e.target.value }))}
                  className="w-full p-3 border border-input rounded-md text-right"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-right">التكلفة الإجمالية</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.totalCost}
                  onChange={(e) => setFormData(prev => ({ ...prev, totalCost: e.target.value }))}
                  className="w-full p-3 border border-input rounded-md text-right"
                  placeholder="التكلفة بالريال"
                />
              </div>
            </div>

            {/* Supplier Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-right">شركة أجهزة الأسنان</label>
                <input
                  type="text"
                  value={formData.supplierName}
                  onChange={(e) => setFormData(prev => ({ ...prev, supplierName: e.target.value }))}
                  className="w-full p-3 border border-input rounded-md text-right"
                  placeholder="اسم شركة أجهزة الأسنان"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-right">بيانات التواصل للشركة</label>
                <input
                  type="text"
                  value={formData.supplierContact}
                  onChange={(e) => setFormData(prev => ({ ...prev, supplierContact: e.target.value }))}
                  className="w-full p-3 border border-input rounded-md text-right"
                  placeholder="رقم الهاتف والإيميل"
                />
              </div>
            </div>

            {/* Status and Delivery */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-right">حالة العقد</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full p-3 border border-input rounded-md text-right"
                >
                  <option value="جديد">جديد</option>
                  <option value="موافق عليه">موافق عليه</option>
                  <option value="تم التعاقد">تم التعاقد</option>
                  <option value="تم التسليم">تم التسليم</option>
                  <option value="مرفوض">مرفوض</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-right">تاريخ التسليم المخطط</label>
                <input
                  type="date"
                  value={formData.deliveryDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, deliveryDate: e.target.value }))}
                  className="w-full p-3 border border-input rounded-md text-right"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-right">تاريخ التسليم الفعلي</label>
                <input
                  type="date"
                  value={formData.actualDeliveryDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, actualDeliveryDate: e.target.value }))}
                  className="w-full p-3 border border-input rounded-md text-right"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium mb-2 text-right">ملاحظات</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full p-3 border border-input rounded-md text-right"
                rows={3}
                placeholder="ملاحظات حول العقد أو التركيب..."
              />
            </div>

            <div className="flex justify-start">
              <button 
                type="submit" 
                disabled={loading}
                className="admin-btn-success flex items-center gap-2 px-6 py-3 disabled:opacity-50"
              >
                <Save size={20} />
                {loading ? 'جاري الحفظ...' : 'حفظ عقد الأسنان'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Recent Dental Contracts Table */}
      <div className="admin-card">
        <div className="admin-header">
          <h2>عقود الأسنان الحديثة</h2>
        </div>
        <div className="p-4">
          <div className="responsive-table">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-right">
                  <th className="p-3">رقم العقد</th>
                  <th className="p-3 mobile-hidden">نوع الجهاز</th>
                  <th className="p-3 mobile-hidden">العيادة</th>
                  <th className="p-3">الحالة</th>
                  <th className="p-3 mobile-hidden">التكلفة</th>
                  <th className="p-3">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      جاري تحميل العقود...
                    </td>
                  </tr>
                ) : contracts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      لا توجد عقود أسنان مسجلة
                    </td>
                  </tr>
                ) : (
                  contracts.map((contract, index) => (
                    <tr key={contract.id || index} className="border-b border-border text-right">
                      <td className="p-3 font-medium">{contract.id}</td>
                      <td className="p-3 mobile-hidden">{contract.itemName}</td>
                      <td className="p-3 mobile-hidden">{contract.beneficiaryFacility}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusStyle(contract.status)}`}>
                          {contract.status}
                        </span>
                      </td>
                      <td className="p-3 mobile-hidden">
                        {contract.totalCost ? `${Number(contract.totalCost).toLocaleString()} ريال` : '-'}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => handleViewContract(contract)}
                            className="admin-btn-primary text-xs px-2 py-1 flex items-center gap-1"
                          >
                            <Eye size={12} />
                            عرض
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Contract Details Popup */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-right">تفاصيل عقد الأسنان</DialogTitle>
            <DialogDescription className="text-right">
              عرض تفاصيل العقد رقم: {selectedContract?.id}
            </DialogDescription>
          </DialogHeader>
          
          {selectedContract && (
            <div className="space-y-6 p-4">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-right">
                  <label className="block text-sm font-medium text-muted-foreground mb-1">رقم العقد</label>
                  <p className="font-medium">{selectedContract.id || '-'}</p>
                </div>
                <div className="text-right">
                  <label className="block text-sm font-medium text-muted-foreground mb-1">رقم الصنف</label>
                  <p className="font-medium">{selectedContract.itemNumber || '-'}</p>
                </div>
                <div className="text-right">
                  <label className="block text-sm font-medium text-muted-foreground mb-1">اسم الصنف</label>
                  <p className="font-medium">{selectedContract.itemName || '-'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="text-right">
                  <label className="block text-sm font-medium text-muted-foreground mb-1">الكمية</label>
                  <p className="font-medium">{selectedContract.quantity || '-'}</p>
                </div>
                <div className="text-right">
                  <label className="block text-sm font-medium text-muted-foreground mb-1">العيادة المستفيدة</label>
                  <p className="font-medium">{selectedContract.beneficiaryFacility || '-'}</p>
                </div>
              </div>

              {/* Financial Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-right">
                  <label className="block text-sm font-medium text-muted-foreground mb-1">رقم التعميد المالي</label>
                  <p className="font-medium">{selectedContract.financialApprovalNumber || '-'}</p>
                </div>
                <div className="text-right">
                  <label className="block text-sm font-medium text-muted-foreground mb-1">تاريخ التعميد</label>
                  <p className="font-medium">{selectedContract.approvalDate || '-'}</p>
                </div>
                <div className="text-right">
                  <label className="block text-sm font-medium text-muted-foreground mb-1">التكلفة الإجمالية</label>
                  <p className="font-medium">
                    {selectedContract.totalCost ? `${Number(selectedContract.totalCost).toLocaleString()} ريال` : '-'}
                  </p>
                </div>
              </div>

              {/* Supplier Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="text-right">
                  <label className="block text-sm font-medium text-muted-foreground mb-1">شركة الأجهزة</label>
                  <p className="font-medium">{selectedContract.supplierName || '-'}</p>
                </div>
                <div className="text-right">
                  <label className="block text-sm font-medium text-muted-foreground mb-1">بيانات التواصل</label>
                  <p className="font-medium">{selectedContract.supplierContact || '-'}</p>
                </div>
              </div>

              {/* Status and Delivery */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-right">
                  <label className="block text-sm font-medium text-muted-foreground mb-1">حالة العقد</label>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm ${getStatusStyle(selectedContract.status)}`}>
                    {selectedContract.status || '-'}
                  </span>
                </div>
                <div className="text-right">
                  <label className="block text-sm font-medium text-muted-foreground mb-1">تاريخ التسليم المخطط</label>
                  <p className="font-medium">{selectedContract.deliveryDate || '-'}</p>
                </div>
                <div className="text-right">
                  <label className="block text-sm font-medium text-muted-foreground mb-1">تاريخ التسليم الفعلي</label>
                  <p className="font-medium">{selectedContract.actualDeliveryDate || '-'}</p>
                </div>
              </div>

              {/* Notes */}
              {selectedContract.notes && (
                <div className="text-right">
                  <label className="block text-sm font-medium text-muted-foreground mb-1">ملاحظات</label>
                  <p className="font-medium bg-muted p-3 rounded-md">{selectedContract.notes}</p>
                </div>
              )}

              {/* Timestamps */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                <div className="text-right">
                  <label className="block text-sm font-medium text-muted-foreground mb-1">تاريخ الطلب</label>
                  <p className="font-medium">{selectedContract.orderDate || '-'}</p>
                </div>
                <div className="text-right">
                  <label className="block text-sm font-medium text-muted-foreground mb-1">تاريخ الإنشاء</label>
                  <p className="font-medium">
                    {selectedContract.created_at ? new Date(selectedContract.created_at).toLocaleDateString('ar-SA') : '-'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper function to get status styling
function getStatusStyle(status: string) {
  switch (status) {
    case 'جديد':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'موافق عليه':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'تم التعاقد':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'تم التسليم':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200';
    case 'مرفوض':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
}