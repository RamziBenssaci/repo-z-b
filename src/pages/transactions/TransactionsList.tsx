import { useState, useEffect } from 'react';
import { Search, Filter, Download, Eye, Edit, Trash2, Printer, Loader2, X, AlertTriangle } from 'lucide-react';
import { transactionsApi, reportsApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface Transaction {
  id: string;
  transactionNumber: string;
  receiveDate: string;
  subject: string;
  type: string;
  senderEntity: string;
  transferredTo: string;
  status: string;
  notes?: string;
}

interface Facility {
  id: number;
  name: string;
}

export default function TransactionsList() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [transactionTypes, setTransactionTypes] = useState<string[]>([]);
  const [transactionStatuses, setTransactionStatuses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFacility, setSelectedFacility] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  
  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Transaction>>({});
  const [isUpdating, setIsUpdating] = useState(false);
  
  const { toast } = useToast();

  // Fetch all data on component mount
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [
        transactionsResponse,
        facilitiesResponse,
        typesResponse,
        statusesResponse
      ] = await Promise.all([
        transactionsApi.getTransactions().catch(error => ({
          success: false,
          data: [],
          message: error.message
        })),
        reportsApi.getFacilities().catch(error => ({
          success: false,
          data: [],
          message: error.message
        })),
        transactionsApi.getTransactionTypes().catch(error => ({
          success: false,
          data: [],
          message: error.message
        })),
        transactionsApi.getTransactionStatuses().catch(error => ({
          success: false,
          data: [],
          message: error.message
        }))
      ]);

      if (transactionsResponse.success && transactionsResponse.data) {
        setTransactions(transactionsResponse.data);
      } else {
        setTransactions([]);
        toast({
          title: "تعذر تحميل المعاملات",
          description: transactionsResponse.message || "فشل في تحميل بيانات المعاملات",
          variant: "destructive"
        });
      }

      if (facilitiesResponse.success && facilitiesResponse.data) {
        setFacilities(facilitiesResponse.data);
      }

      if (typesResponse.success && typesResponse.data) {
        setTransactionTypes(typesResponse.data);
      } else {
        setTransactionTypes([
          'طلب صيانة',
          'طلب توريد',
          'طلب خدمة',
          'شكوى',
          'استفسار',
          'طلب تطوير'
        ]);
      }

      if (statusesResponse.success && statusesResponse.data) {
        setTransactionStatuses(statusesResponse.data);
      } else {
        setTransactionStatuses([
          'مفتوح تحت الاجراء',
          'منجز',
          'مرفوض'
        ]);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      setTransactions([]);
      setFacilities([]);
      setTransactionTypes([]);
      setTransactionStatuses([]);
      toast({
        title: "خطأ في الاتصال",
        description: "فشل في الاتصال بالخادم",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Client-side filtering
  const filteredTransactions = transactions.filter(transaction => {
    return (
      (searchTerm === '' || 
       transaction.subject.includes(searchTerm) || 
       transaction.transactionNumber.includes(searchTerm) ||
       transaction.senderEntity.includes(searchTerm)) &&
      (selectedFacility === '' || transaction.transferredTo === selectedFacility) &&
      (selectedType === '' || transaction.type === selectedType) &&
      (selectedStatus === '' || transaction.status === selectedStatus)
    );
  });

  // Modal handlers
  const openDeleteModal = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowDeleteModal(true);
  };

  const openViewModal = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowViewModal(true);
  };

  const openEditModal = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setEditFormData({
      transactionNumber: transaction.transactionNumber,
      receiveDate: transaction.receiveDate,
      subject: transaction.subject,
      type: transaction.type,
      senderEntity: transaction.senderEntity,
      transferredTo: transaction.transferredTo,
      status: transaction.status,
      notes: transaction.notes || ''
    });
    setShowEditModal(true);
  };

  const closeAllModals = () => {
    setShowDeleteModal(false);
    setShowViewModal(false);
    setShowEditModal(false);
    setSelectedTransaction(null);
    setEditFormData({});
  };

  const handleDeleteTransaction = async () => {
    if (!selectedTransaction) return;

    try {
      const response = await transactionsApi.deleteTransaction(selectedTransaction.id);
      if (response.success) {
        setTransactions(prev => prev.filter(t => t.id !== selectedTransaction.id));
        toast({
          title: "تم حذف المعاملة",
          description: "تم حذف المعاملة بنجاح",
        });
        closeAllModals();
      } else {
        toast({
          title: "خطأ في الحذف",
          description: response.message || "فشل في حذف المعاملة",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "خطأ في الاتصال",
        description: error.message || "فشل في الاتصال بالخادم",
        variant: "destructive"
      });
    }
  };

  const handleUpdateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTransaction) return;

    try {
      setIsUpdating(true);
      const response = await transactionsApi.updateTransaction(selectedTransaction.id, editFormData);
      
      if (response.success) {
        // Update the transaction in the local state
        setTransactions(prev => prev.map(t => 
          t.id === selectedTransaction.id 
            ? { ...t, ...editFormData } as Transaction
            : t
        ));
        
        toast({
          title: "تم تحديث المعاملة",
          description: "تم تحديث المعاملة بنجاح",
        });
        closeAllModals();
      } else {
        toast({
          title: "خطأ في التحديث",
          description: response.message || "فشل في تحديث المعاملة",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "خطأ في الاتصال",
        description: error.message || "فشل في الاتصال بالخادم",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredTransactions.map(transaction => ({
      'رقم المعاملة': transaction.transactionNumber,
      'تاريخ الاستلام': transaction.receiveDate,
      'موضوع المعاملة': transaction.subject,
      'النوع': transaction.type,
      'الجهة المرسلة': transaction.senderEntity,
      'المحولة إلى': transaction.transferredTo,
      'الحالة': transaction.status,
      'الملاحظات': transaction.notes || ''
    })));
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'المعاملات');
    XLSX.writeFile(wb, 'المعاملات_الإدارية.xlsx');
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    // Add Arabic font support
    doc.setFont('helvetica');
    doc.setFontSize(16);
    doc.text('تقرير المعاملات الإدارية', 105, 20, { align: 'center' });
    
    // Prepare data for table
    const tableData = filteredTransactions.map(transaction => [
      transaction.transactionNumber,
      transaction.receiveDate,
      transaction.subject,
      transaction.type,
      transaction.senderEntity,
      transaction.transferredTo,
      transaction.status
    ]);
    
    // Add table
    (doc as any).autoTable({
      head: [['رقم المعاملة', 'تاريخ الاستلام', 'الموضوع', 'النوع', 'الجهة المرسلة', 'المحولة إلى', 'الحالة']],
      body: tableData,
      startY: 30,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [66, 139, 202] }
    });
    
    doc.save('المعاملات_الإدارية.pdf');
  };

  const handlePrintTransaction = (transaction: Transaction) => {
    const printContent = `
      <div style="direction: rtl; font-family: Arial, sans-serif; padding: 20px;">
        <h2>تقرير معاملة إدارية - ${transaction.transactionNumber}</h2>
        <hr>
        <p><strong>رقم المعاملة:</strong> ${transaction.transactionNumber}</p>
        <p><strong>تاريخ الاستلام:</strong> ${transaction.receiveDate}</p>
        <p><strong>موضوع المعاملة:</strong> ${transaction.subject}</p>
        <p><strong>النوع:</strong> ${transaction.type}</p>
        <p><strong>الجهة المرسلة:</strong> ${transaction.senderEntity}</p>
        <p><strong>المحولة إلى:</strong> ${transaction.transferredTo}</p>
        <p><strong>الحالة:</strong> ${transaction.status}</p>
        <p><strong>الملاحظات:</strong> ${transaction.notes || 'لا توجد ملاحظات'}</p>
      </div>
    `;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">جاري تحميل المعاملات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-right">
        <h1 className="text-3xl font-bold text-foreground">قائمة المعاملات الإدارية</h1>
        <p className="text-muted-foreground mt-2">عرض وإدارة جميع المعاملات الإدارية</p>
      </div>

      {/* Filters */}
      <div className="admin-card">
        <div className="admin-header">
          <h2>البحث والتصفية</h2>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="البحث في المعاملات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-4 pr-10 py-2 border border-input rounded-md text-right"
              />
            </div>

            {/* Facility Filter */}
            <select
              value={selectedFacility}
              onChange={(e) => setSelectedFacility(e.target.value)}
              className="w-full p-2 border border-input rounded-md text-right"
            >
              <option value="">جميع الجهات</option>
              {facilities.map(facility => (
                <option key={facility.id} value={facility.name}>{facility.name}</option>
              ))}
            </select>

            {/* Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full p-2 border border-input rounded-md text-right"
            >
              <option value="">جميع الأنواع</option>
              {transactionTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full p-2 border border-input rounded-md text-right"
            >
              <option value="">جميع الحالات</option>
              {transactionStatuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-2 mt-4">
            <button 
              onClick={handleExportExcel}
              className="admin-btn-success flex items-center justify-center gap-2 text-sm"
            >
              <Download size={14} />
              <span className="hidden sm:inline">تصدير Excel</span>
              <span className="sm:hidden">Excel</span>
            </button>
            <button 
              onClick={handleExportPDF}
              className="admin-btn-info flex items-center justify-center gap-2 text-sm"
            >
              <Download size={14} />
              <span className="hidden sm:inline">تصدير PDF</span>
              <span className="sm:hidden">PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="admin-card">
        <div className="admin-header">
          <h2>المعاملات ({filteredTransactions.length})</h2>
        </div>
        <div className="p-4">
          <div className="responsive-table">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-right">
                  <th className="p-3">رقم المعاملة</th>
                  <th className="p-3 mobile-hidden">تاريخ الاستلام</th>
                  <th className="p-3">موضوع المعاملة</th>
                  <th className="p-3 mobile-hidden">النوع</th>
                  <th className="p-3 mobile-hidden">الجهة المرسلة</th>
                  <th className="p-3 mobile-hidden">المحولة إلى</th>
                  <th className="p-3">الحالة</th>
                  <th className="p-3">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b border-border text-right hover:bg-accent">
                    <td className="p-3 font-medium">{transaction.transactionNumber}</td>
                    <td className="p-3 mobile-hidden">{transaction.receiveDate}</td>
                    <td className="p-3">{transaction.subject}</td>
                    <td className="p-3 mobile-hidden">{transaction.type}</td>
                    <td className="p-3 mobile-hidden">{transaction.senderEntity}</td>
                    <td className="p-3 mobile-hidden">{transaction.transferredTo}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        transaction.status === 'مفتوح تحت الاجراء' ? 'bg-warning text-warning-foreground' :
                        transaction.status === 'منجز' ? 'bg-success text-success-foreground' :
                        'bg-danger text-danger-foreground'
                      }`}>
                        {transaction.status}
                      </span>
                    </td>
                    <td className="p-2">
                      <div className="flex gap-1 justify-center">
                        <button 
                          onClick={() => openViewModal(transaction)}
                          className="p-1.5 text-info hover:bg-info/10 rounded" 
                          title="عرض"
                        >
                          <Eye size={14} />
                        </button>
                        <button 
                          onClick={() => openEditModal(transaction)}
                          className="p-1.5 text-warning hover:bg-warning/10 rounded" 
                          title="تعديل"
                        >
                          <Edit size={14} />
                        </button>
                        <button 
                          onClick={() => handlePrintTransaction(transaction)}
                          className="p-1.5 text-primary hover:bg-primary/10 rounded mobile-hidden" 
                          title="طباعة"
                        >
                          <Printer size={14} />
                        </button>
                        <button 
                          onClick={() => openDeleteModal(transaction)}
                          className="p-1.5 text-danger hover:bg-danger/10 rounded mobile-hidden" 
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
          
          {filteredTransactions.length === 0 && !loading && (
            <div className="text-center py-8 text-muted-foreground">
              {transactions.length === 0 ? 
                "لا توجد معاملات في النظام" : 
                "لا توجد معاملات تطابق معايير البحث"
              }
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" dir="rtl">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">تأكيد الحذف</h3>
              </div>
            </div>
            <div className="mb-6">
              <p className="text-gray-700">
                هل أنت متأكد من حذف المعاملة رقم <strong>{selectedTransaction.transactionNumber}</strong>؟
              </p>
              <p className="text-gray-600 text-sm mt-2">
                لا يمكن التراجع عن هذا الإجراء.
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={closeAllModals}
                className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handleDeleteTransaction}
                className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
              >
                حذف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {showViewModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" dir="rtl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">تفاصيل المعاملة</h3>
              <button
                onClick={closeAllModals}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    رقم المعاملة
                  </label>
                  <p className="text-gray-900 bg-gray-50 p-2 rounded">
                    {selectedTransaction.transactionNumber}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    تاريخ الاستلام
                  </label>
                  <p className="text-gray-900 bg-gray-50 p-2 rounded">
                    {selectedTransaction.receiveDate}
                  </p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  موضوع المعاملة
                </label>
                <p className="text-gray-900 bg-gray-50 p-2 rounded">
                  {selectedTransaction.subject}
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    النوع
                  </label>
                  <p className="text-gray-900 bg-gray-50 p-2 rounded">
                    {selectedTransaction.type}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    الحالة
                  </label>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                    selectedTransaction.status === 'مفتوح تحت الاجراء' ? 'bg-warning text-warning-foreground' :
                    selectedTransaction.status === 'منجز' ? 'bg-success text-success-foreground' :
                    'bg-danger text-danger-foreground'
                  }`}>
                    {selectedTransaction.status}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    الجهة المرسلة
                  </label>
                  <p className="text-gray-900 bg-gray-50 p-2 rounded">
                    {selectedTransaction.senderEntity}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    المحولة إلى
                  </label>
                  <p className="text-gray-900 bg-gray-50 p-2 rounded">
                    {selectedTransaction.transferredTo}
                  </p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  الملاحظات
                </label>
                <p className="text-gray-900 bg-gray-50 p-2 rounded min-h-[60px]">
                  {selectedTransaction.notes || 'لا توجد ملاحظات'}
                </p>
              </div>
            </div>
            
            <div className="flex justify-end mt-6">
              <button
                onClick={closeAllModals}
                className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" dir="rtl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">تعديل المعاملة</h3>
              <button
                onClick={closeAllModals}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleUpdateTransaction} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    رقم المعاملة
                  </label>
                  <input
                    type="text"
                    value={editFormData.transactionNumber || ''}
                    onChange={(e) => setEditFormData(prev => ({
                      ...prev,
                      transactionNumber: e.target.value
                    }))}
                    className="w-full p-2 border border-gray-300 rounded-md text-right"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    تاريخ الاستلام
                  </label>
                  <input
                    type="date"
                    value={editFormData.receiveDate || ''}
                    onChange={(e) => setEditFormData(prev => ({
                      ...prev,
                      receiveDate: e.target.value
                    }))}
                    className="w-full p-2 border border-gray-300 rounded-md text-right"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  موضوع المعاملة
                </label>
                <input
                  type="text"
                  value={editFormData.subject || ''}
                  onChange={(e) => setEditFormData(prev => ({
                    ...prev,
                    subject: e.target.value
                  }))}
                  className="w-full p-2 border border-gray-300 rounded-md text-right"
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    النوع
                  </label>
                  <select
                    value={editFormData.type || ''}
                    onChange={(e) => setEditFormData(prev => ({
                      ...prev,
                      type: e.target.value
                    }))}
                    className="w-full p-2 border border-gray-300 rounded-md text-right"
                    required
                  >
                    <option value="">اختر النوع</option>
                    {transactionTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    الحالة
                  </label>
                  <select
                    value={editFormData.status || ''}
                    onChange={(e) => setEditFormData(prev => ({
                      ...prev,
                      status: e.target.value
                    }))}
                    className="w-full p-2 border border-gray-300 rounded-md text-right"
                    required
                  >
                    <option value="">اختر الحالة</option>
                    {transactionStatuses.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    الجهة المرسلة
                  </label>
                <select
  value={editFormData.senderEntity || ''}
  onChange={(e) => setEditFormData(prev => ({
    ...prev,
    senderEntity: e.target.value
  }))}
  className="w-full p-2 border border-gray-300 rounded-md text-right"
  required
>
  <option value="">اختر الجهة</option>
  {facilities.map(facility => (
    <option key={facility.id} value={facility.name}>{facility.name}</option>
  ))}
</select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    المحولة إلى
                  </label>
                  <select
                    value={editFormData.transferredTo || ''}
                    onChange={(e) => setEditFormData(prev => ({
                      ...prev,
                      transferredTo: e.target.value
                    }))}
                    className="w-full p-2 border border-gray-300 rounded-md text-right"
                    required
                  >
                    <option value="">اختر الجهة</option>
                    {facilities.map(facility => (
                      <option key={facility.id} value={facility.name}>{facility.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  الملاحظات
                </label>
                <textarea
                  value={editFormData.notes || ''}
                  onChange={(e) => setEditFormData(prev => ({
                    ...prev,
                    notes: e.target.value
                  }))}
                  className="w-full p-2 border border-gray-300 rounded-md text-right"
                  rows={4}
                  placeholder="أدخل الملاحظات (اختياري)"
                />
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeAllModals}
                  className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
                  disabled={isUpdating}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors flex items-center gap-2"
                  disabled={isUpdating}
                >
                  {isUpdating && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isUpdating ? 'جاري التحديث...' : 'حفظ التغييرات'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
