import { useState, useEffect } from 'react';
import { Search, Filter, Download, Eye, Edit, Trash2, Printer, X, Save, Loader2, AlertTriangle, FileText } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { reportsApi } from '@/lib/api';
import { exportToExcel, exportToPDF } from '@/utils/exportUtils';

export default function ReportsList() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFacility, setSelectedFacility] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [editingReport, setEditingReport] = useState<any>(null);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  
  // New states for custom modals
  const [deleteConfirmReport, setDeleteConfirmReport] = useState<any>(null);
  const [viewingReport, setViewingReport] = useState<any>(null);

  const [editFormData, setEditFormData] = useState({
    title: '',
    type: '',
    description: '',
    status: '',
    severity: '',
    location: '',
    reporter_name: '',
    notes: ''
  });

  // Load reports on component mount
  useEffect(() => {
    const loadReports = async () => {
      try {
        const response = await reportsApi.getReports();
        if (response.success) {
          setReports(response.data || []);
        } else {
          toast({
            title: "خطأ في تحميل البلاغات",
            description: response.message,
            variant: "destructive"
          });
        }
      } catch (error: any) {
        toast({
          title: "خطأ في تحميل البلاغات",
          description: error.message || "فشل في تحميل قائمة البلاغات",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, [toast]);

  // Filter reports based on search and filters (client-side)
  const filteredReports = reports.filter(report => {
    return (
      (searchTerm === '' || 
       report.facility?.name?.includes(searchTerm) || 
       report.description?.includes(searchTerm) ||
       report.id?.includes(searchTerm)) &&
      (selectedFacility === '' || report.facility?.name === selectedFacility) &&
      (selectedCategory === '' || report.type === selectedCategory) &&
      (selectedStatus === '' || report.status === selectedStatus)
    );
  });

  // Get unique values for filters
  const facilities = [...new Set(reports.map(r => r.facility?.name).filter(Boolean))];
  const categories = [...new Set(reports.map(r => r.type).filter(Boolean))];
  const statuses = [...new Set(reports.map(r => r.status).filter(Boolean))];

  const handleEditClick = (report: any) => {
    setEditingReport(report);
    setEditFormData({
      title: report.title || '',
      type: report.type || '',
      description: report.description || '',
      status: report.status || '',
      severity: report.severity || '',
      location: report.location || '',
      reporter_name: report.reporter_name || '',
      notes: report.notes || ''
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateLoading(true);

    try {
      const response = await reportsApi.updateReport(editingReport.id, editFormData);
      
      if (response.success) {
        toast({
          title: "تم تحديث البلاغ بنجاح",
          description: "تم حفظ التغييرات على البلاغ",
        });

        // Update local state
        setReports(prev => 
          prev.map(report => 
            report.id === editingReport.id 
              ? { ...report, ...editFormData }
              : report
          )
        );
        
        setEditingReport(null);
      } else {
        toast({
          title: "خطأ في تحديث البلاغ",
          description: response.message,
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "خطأ في تحديث البلاغ",
        description: error.message || "فشل في تحديث البلاغ",
        variant: "destructive"
      });
    } finally {
      setUpdateLoading(false);
    }
  };

  // Updated delete function to use custom modal
  const handleDeleteClick = (report: any) => {
    setDeleteConfirmReport(report);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmReport) return;

    setDeleteLoading(deleteConfirmReport.id);

    try {
      const response = await reportsApi.deleteReport(deleteConfirmReport.id);
      
      if (response.success) {
        toast({
          title: "تم حذف البلاغ بنجاح",
          description: "تم حذف البلاغ من النظام",
        });

        // Remove from local state
        setReports(prev => prev.filter(report => report.id !== deleteConfirmReport.id));
        setDeleteConfirmReport(null);
      } else {
        toast({
          title: "خطأ في حذف البلاغ",
          description: response.message,
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "خطأ في حذف البلاغ",
        description: error.message || "فشل في حذف البلاغ",
        variant: "destructive"
      });
    } finally {
      setDeleteLoading(null);
    }
  };

  // New view function
  const handleViewClick = (report: any) => {
    setViewingReport(report);
  };

  const handleEditInputChange = (field: string, value: string) => {
    setEditFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePrintReport = (report: any) => {
    const printContent = `
      <div style="direction: rtl; font-family: Arial, sans-serif; padding: 20px;">
        <h2>تقرير بلاغ - ${report.id}</h2>
        <hr>
        <p><strong>رقم البلاغ:</strong> ${report.id}</p>
        <p><strong>المنشأة:</strong> ${report.facility?.name || 'غير محدد'}</p>
        <p><strong>العنوان:</strong> ${report.title}</p>
        <p><strong>النوع:</strong> ${report.type}</p>
        <p><strong>تاريخ البلاغ:</strong> ${report.created_at}</p>
        <p><strong>الحالة:</strong> ${report.status}</p>
        <p><strong>وصف المشكلة:</strong> ${report.description || 'غير محدد'}</p>
      </div>
    `;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleExportExcel = () => {
    try {
      const exportData = filteredReports.map(report => ({
        'رقم البلاغ': report.id,
        'المنشأة': report.facility?.name || '',
        'العنوان': report.title,
        'النوع': report.type,
        'الحالة': report.status,
        'تاريخ البلاغ': report.created_at,
        'الوصف': report.description
      }));
      
      exportToExcel(exportData, 'قائمة_البلاغات');
      toast({
        title: "تم تصدير البيانات بنجاح",
        description: "تم تصدير البلاغات إلى ملف Excel",
      });
    } catch (error) {
      toast({
        title: "خطأ في التصدير",
        description: "فشل في تصدير البيانات",
        variant: "destructive"
      });
    }
  };

  const handleExportPDF = () => {
    try {
      const exportData = filteredReports.map(report => ({
        id: report.id,
        facilityName: report.facility?.name || '',
        category: report.type,
        deviceType: report.title,
        status: report.status,
        reportDate: report.created_at
      }));
      
      exportToPDF(exportData, 'قائمة_البلاغات');
      toast({
        title: "تم تصدير البيانات بنجاح",
        description: "تم تصدير البلاغات إلى ملف PDF",
      });
    } catch (error) {
      toast({
        title: "خطأ في التصدير",
        description: "فشل في تصدير البيانات",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="mr-3">جاري تحميل البلاغات...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-right">
        <h1 className="text-3xl font-bold text-foreground">قائمة البلاغات</h1>
        <p className="text-muted-foreground mt-2">عرض وإدارة جميع البلاغات المستلمة</p>
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
                placeholder="البحث في البلاغات..."
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
              <option value="">جميع المنشآت</option>
              {facilities.map(facility => (
                <option key={facility} value={facility}>{facility}</option>
              ))}
            </select>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full p-2 border border-input rounded-md text-right"
            >
              <option value="">جميع الأنواع</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full p-2 border border-input rounded-md text-right"
            >
              <option value="">جميع الحالات</option>
              {statuses.map(status => (
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

      {/* Reports Table */}
      <div className="admin-card">
        <div className="admin-header">
          <h2>البلاغات ({filteredReports.length})</h2>
        </div>
        <div className="p-4">
          <div className="responsive-table">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-right">
                  <th className="p-3">رقم البلاغ</th>
                  <th className="p-3 mobile-hidden">المنشأة</th>
                  <th className="p-3">العنوان</th>
                  <th className="p-3 mobile-hidden">النوع</th>
                  <th className="p-3 mobile-hidden">التاريخ</th>
                  <th className="p-3">الحالة</th>
                  <th className="p-3">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((report) => (
                  <tr key={report.id} className="border-b border-border text-right hover:bg-accent">
                    <td className="p-3 font-medium">{report.id}</td>
                    <td className="p-3 mobile-hidden">{report.facility?.name || 'غير محدد'}</td>
                    <td className="p-3">{report.title}</td>
                    <td className="p-3 mobile-hidden">{report.type}</td>
                    <td className="p-3 mobile-hidden">{new Date(report.created_at).toLocaleDateString('ar-SA')}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        report.status === 'مفتوح' ? 'bg-warning text-warning-foreground' :
                        report.status === 'مغلق' ? 'bg-success text-success-foreground' :
                        'bg-danger text-danger-foreground'
                      }`}>
                        {report.status}
                      </span>
                    </td>
                    <td className="p-2">
                      <div className="flex gap-1 justify-center">
                        <button 
                          onClick={() => handleViewClick(report)}
                          className="p-1.5 text-info hover:bg-info/10 rounded" 
                          title="عرض"
                        >
                          <Eye size={14} />
                        </button>
                        <button 
                          onClick={() => handleEditClick(report)}
                          className="p-1.5 text-warning hover:bg-warning/10 rounded" 
                          title="تعديل"
                        >
                          <Edit size={14} />
                        </button>
                        <button 
                          onClick={() => handlePrintReport(report)}
                          className="p-1.5 text-primary hover:bg-primary/10 rounded mobile-hidden" 
                          title="طباعة"
                        >
                          <Printer size={14} />
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(report)}
                          disabled={deleteLoading === report.id}
                          className="p-1.5 text-danger hover:bg-danger/10 rounded mobile-hidden" 
                          title="حذف"
                        >
                          {deleteLoading === report.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Trash2 size={14} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredReports.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد بلاغات تطابق معايير البحث
            </div>
          )}
        </div>
      </div>

      {/* View Details Modal */}
      {viewingReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="admin-header flex justify-between items-center bg-blue-50 dark:bg-blue-950/20">
              <h2 className="flex items-center gap-2">
                <FileText size={20} />
                تفاصيل البلاغ رقم {viewingReport.id}
              </h2>
              <button 
                onClick={() => setViewingReport(null)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Basic Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">رقم البلاغ</label>
                  <p className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md font-mono">{viewingReport.id}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">المنشأة</label>
                  <p className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">{viewingReport.facility?.name || 'غير محدد'}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">النوع</label>
                  <p className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">{viewingReport.type}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">الحالة</label>
                  <div className="p-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      viewingReport.status === 'مفتوح' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                      viewingReport.status === 'مغلق' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                      'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                    }`}>
                      {viewingReport.status}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">تاريخ البلاغ</label>
                  <p className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">{new Date(viewingReport.created_at).toLocaleDateString('ar-SA', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">مستوى الخطورة</label>
                  <div className="p-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      viewingReport.severity === 'low' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
                      viewingReport.severity === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                      viewingReport.severity === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400' :
                      'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                    }`}>
                      {viewingReport.severity === 'low' ? 'منخفض' :
                       viewingReport.severity === 'medium' ? 'متوسط' :
                       viewingReport.severity === 'high' ? 'عالي' : 'حرج'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600">العنوان</label>
                <p className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md text-lg">{viewingReport.title}</p>
              </div>

              {/* Description */}
              {viewingReport.description && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">وصف المشكلة</label>
                  <p className="p-4 bg-gray-50 dark:bg-gray-800 rounded-md leading-relaxed min-h-[100px]">{viewingReport.description}</p>
                </div>
              )}

              {/* Location */}
              {viewingReport.location && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">الموقع</label>
                  <p className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">{viewingReport.location}</p>
                </div>
              )}

              {/* Reporter */}
              {viewingReport.reporter_name && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">المبلغ</label>
                  <p className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">{viewingReport.reporter_name}</p>
                </div>
              )}

              {/* Notes */}
              {viewingReport.notes && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">ملاحظات</label>
                  <p className="p-4 bg-gray-50 dark:bg-gray-800 rounded-md leading-relaxed">{viewingReport.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  onClick={() => handlePrintReport(viewingReport)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                >
                  <Printer size={16} />
                  طباعة
                </button>
                <button
                  onClick={() => {
                    setViewingReport(null);
                    handleEditClick(viewingReport);
                  }}
                  className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 flex items-center gap-2"
                >
                  <Edit size={16} />
                  تعديل
                </button>
                <button
                  onClick={() => setViewingReport(null)}
                  className="px-4 py-2 border border-input rounded-md hover:bg-accent"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg w-full max-w-md shadow-2xl">
            <div className="admin-header flex justify-between items-center bg-red-50 dark:bg-red-950/20">
              <h2 className="flex items-center gap-2 text-red-700 dark:text-red-400">
                <AlertTriangle size={20} />
                تأكيد الحذف
              </h2>
              <button 
                onClick={() => setDeleteConfirmReport(null)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto">
                  <Trash2 size={32} className="text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-semibold">هل أنت متأكد من حذف هذا البلاغ؟</h3>
                <p className="text-muted-foreground">
                  سيتم حذف البلاغ رقم <strong>{deleteConfirmReport.id}</strong> نهائياً من النظام ولا يمكن استرداده.
                </p>
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md text-right">
                  <p><strong>العنوان:</strong> {deleteConfirmReport.title}</p>
                  <p><strong>المنشأة:</strong> {deleteConfirmReport.facility?.name || 'غير محدد'}</p>
                  <p><strong>النوع:</strong> {deleteConfirmReport.type}</p>
                </div>
              </div>

              <div className="flex justify-center gap-3 pt-4">
                <button
                  onClick={() => setDeleteConfirmReport(null)}
                  className="px-6 py-2 border border-input rounded-md hover:bg-accent transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={deleteLoading === deleteConfirmReport.id}
                  className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-2 transition-colors"
                >
                  {deleteLoading === deleteConfirmReport.id ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      جاري الحذف...
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} />
                      حذف نهائي
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="admin-header flex justify-between items-center">
              <h2>تعديل البلاغ رقم {editingReport.id}</h2>
              <button 
                onClick={() => setEditingReport(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-right">العنوان</label>
                  <input
                    type="text"
                    value={editFormData.title}
                    onChange={(e) => handleEditInputChange('title', e.target.value)}
                    className="w-full p-2 border border-input rounded-md text-right"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-right">النوع</label>
                  <input
                    type="text"
                    value={editFormData.type}
                    onChange={(e) => handleEditInputChange('type', e.target.value)}
                    className="w-full p-2 border border-input rounded-md text-right"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-right">الحالة</label>
                  <select
                    value={editFormData.status}
                    onChange={(e) => handleEditInputChange('status', e.target.value)}
                    className="w-full p-2 border border-input rounded-md text-right"
                  >
                    <option value="مفتوح">مفتوح</option>
                    <option value="مغلق">مغلق</option>
                    <option value="مكهن">مكهن</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-right">مستوى الخطورة</label>
                  <select
                    value={editFormData.severity}
                    onChange={(e) => handleEditInputChange('severity', e.target.value)}
                    className="w-full p-2 border border-input rounded-md text-right"
                  >
                    <option value="low">منخفض</option>
                    <option value="medium">متوسط</option>
                    <option value="high">عالي</option>
                    <option value="critical">حرج</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-right">الوصف</label>
                <textarea
                  value={editFormData.description}
                  onChange={(e) => handleEditInputChange('description', e.target.value)}
                  className="w-full p-2 border border-input rounded-md text-right"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingReport(null)}
                  className="px-4 py-2 border border-input rounded-md hover:bg-accent"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={updateLoading}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 flex items-center gap-2"
                >
                  {updateLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      جاري الحفظ...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      حفظ
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
