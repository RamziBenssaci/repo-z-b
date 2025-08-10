import { useState, useEffect } from 'react';
import { Search, Filter, Eye, X, Save } from 'lucide-react';
import { directPurchaseApi, reportsApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { mockFacilities } from '@/data/mockData';

export default function TrackOrders() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [facilityFilter, setFacilityFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');

  // Available status options for approved orders
  const statusOptions = [
    { value: 'موافق عليه', label: 'موافق عليه' },
    { value: 'تم التعاقد', label: 'تم التعاقد' },
    { value: 'تم التسليم', label: 'تم التسليم' },
    { value: 'مرفوض', label: 'مرفوض' }
  ];

  useEffect(() => {
    loadOrders();
    loadFacilities();
  }, []);

  // React-based filtering (fast, client-side as requested)
  useEffect(() => {
    let filtered = orders;

    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.item_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter) {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    if (facilityFilter) {
      filtered = filtered.filter(order => order.beneficiary_facility === facilityFilter);
    }

    setFilteredOrders(filtered);
  }, [orders, searchTerm, statusFilter, facilityFilter]);

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      const response = await directPurchaseApi.getOrders();
      if (response.success) {
        setOrders(response.data);
      }
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "فشل في جلب طلبات الشراء",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadFacilities = async () => {
    try {
      const response = await reportsApi.getFacilities();
      if (response.success) {
        setFacilities(response.data);
      }
    } catch (error) {
      setFacilities(mockFacilities);
    }
  };

  const handleShowOrder = (order: any) => {
    setSelectedOrder(order);
    setSelectedStatus(order.status);
    setShowOrderModal(true);
  };

  const handleStatusUpdate = async () => {
    if (!selectedOrder || !selectedStatus || selectedStatus === selectedOrder.status) {
      return;
    }

    try {
      setIsUpdatingStatus(true);
      
      // Use updateOrder with the full order data but only change the status
      const updatedOrderData = {
        ...selectedOrder,
        status: selectedStatus
      };
      
      const response = await directPurchaseApi.updateOrder(selectedOrder.id, updatedOrderData);

      if (response.success) {
        // Update the order in the local state
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order.id === selectedOrder.id 
              ? { ...order, status: selectedStatus }
              : order
          )
        );

        // Update the selected order
        setSelectedOrder(prev => ({ ...prev, status: selectedStatus }));

        toast({
          title: "تم بنجاح",
          description: "تم تحديث حالة الطلب بنجاح",
          variant: "default",
        });
      }
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "فشل في تحديث حالة الطلب",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const closeModal = () => {
    setSelectedOrder(null);
    setSelectedStatus('');
    setShowOrderModal(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'جديد': return 'bg-blue-100 text-blue-800';
      case 'موافق عليه': return 'bg-green-100 text-green-800';
      case 'تم التعاقد': return 'bg-purple-100 text-purple-800';
      case 'تم التسليم': return 'bg-emerald-100 text-emerald-800';
      case 'مرفوض': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-right">
        <h1 className="text-3xl font-bold text-foreground">متابعة طلبات الشراء المباشر</h1>
        <p className="text-muted-foreground mt-2">تتبع ومراقبة حالة جميع طلبات الشراء المباشر</p>
      </div>

      <div className="admin-card">
        <div className="admin-header">
          <h2>متابعة مسار الطلبات</h2>
        </div>
        <div className="p-6">
          {/* Search and Filter Controls */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="البحث في الطلبات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-2 border border-input rounded-md text-right"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full p-2 border border-input rounded-md text-right"
            >
              <option value="">جميع الحالات</option>
              <option value="جديد">جديد</option>
              <option value="موافق عليه">موافق عليه</option>
              <option value="تم التعاقد">تم التعاقد</option>
              <option value="تم التسليم">تم التسليم</option>
              <option value="مرفوض">مرفوض</option>
            </select>
            <select
              value={facilityFilter}
              onChange={(e) => setFacilityFilter(e.target.value)}
              className="w-full p-2 border border-input rounded-md text-right"
            >
              <option value="">جميع الجهات</option>
              {facilities.map(facility => (
                <option key={facility.id} value={facility.name}>{facility.name}</option>
              ))}
            </select>
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('');
                setFacilityFilter('');
              }}
              className="admin-btn-secondary flex items-center gap-2 px-4 py-2"
            >
              <Filter size={16} />
              مسح الفلاتر
            </button>
          </div>

          {/* Orders Table */}
          <div className="responsive-table">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-2">جاري تحميل الطلبات...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">لا توجد طلبات شراء</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-right">
                    <th className="p-3">رقم الطلب</th>
                    <th className="p-3 mobile-hidden">تاريخ الطلب</th>
                    <th className="p-3">اسم الصنف</th>
                    <th className="p-3 mobile-hidden">الجهة المستفيدة</th>
                    <th className="p-3 mobile-hidden">الكمية</th>
                    <th className="p-3">الحالة</th>
                    <th className="p-3 mobile-hidden">التكلفة</th>
                    <th className="p-3">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="border-b border-border text-right hover:bg-muted/50">
                      <td className="p-3 font-medium">{order.order_number || order.id}</td>
                      <td className="p-3 mobile-hidden">{order.order_date}</td>
                      <td className="p-3">{order.item_name}</td>
                      <td className="p-3 mobile-hidden">{order.beneficiary_facility}</td>
                      <td className="p-3 mobile-hidden">{order.quantity}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="p-3 mobile-hidden">
                        {order.total_cost ? `${order.total_cost} ريال` : '-'}
                      </td>
                      <td className="p-3">
                        <button 
                          onClick={() => handleShowOrder(order)}
                          className="admin-btn-primary text-xs px-2 py-1 flex items-center gap-1"
                        >
                          <Eye size={12} />
                          عرض
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Order Details Modal */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
              <h3 className="text-xl font-bold text-right">تفاصيل الطلب</h3>
            </div>
            
            <div className="p-6 space-y-4 text-right">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    رقم الطلب
                  </label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                    {selectedOrder.order_number || selectedOrder.id}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    تاريخ الطلب
                  </label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                    {selectedOrder.order_date || '-'}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    اسم الصنف
                  </label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                    {selectedOrder.item_name}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    الجهة المستفيدة
                  </label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                    {selectedOrder.beneficiary_facility}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    الكمية
                  </label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                    {selectedOrder.quantity}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    الحالة
                  </label>
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="flex-1 p-2 border border-input rounded-md text-right text-sm"
                      disabled={isUpdatingStatus}
                    >
                      {statusOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {selectedStatus !== selectedOrder.status && (
                      <button
                        onClick={handleStatusUpdate}
                        disabled={isUpdatingStatus}
                        className="admin-btn-primary text-xs px-2 py-2 flex items-center gap-1 disabled:opacity-50"
                      >
                        {isUpdatingStatus ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                        ) : (
                          <Save size={12} />
                        )}
                        حفظ
                      </button>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    التكلفة الإجمالية
                  </label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                    {selectedOrder.total_cost ? `${selectedOrder.total_cost} ريال` : '-'}
                  </p>
                </div>
                
                {selectedOrder.supplier_name && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      اسم المورد
                    </label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                      {selectedOrder.supplier_name}
                    </p>
                  </div>
                )}
              </div>
              
              {selectedOrder.notes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ملاحظات
                  </label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded">
                    {selectedOrder.notes}
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-2 p-6 border-t">
              <button
                onClick={closeModal}
                className="admin-btn-secondary px-4 py-2"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
