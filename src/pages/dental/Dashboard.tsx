import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Clock, CheckCircle, XCircle, AlertTriangle, DollarSign, TrendingUp, Loader2, FileX } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { dentalContractsApi } from '@/lib/api';

export default function DentalDashboard() {
  // State management
  const [originalDashboardData, setOriginalDashboardData] = useState({
    total: 0,
    new: 0,
    approved: 0,
    contracted: 0,
    delivered: 0,
    rejected: 0,
    totalValue: 0
  });
  const [dashboardData, setDashboardData] = useState({
    total: 0,
    new: 0,
    approved: 0,
    contracted: 0,
    delivered: 0,
    rejected: 0,
    totalValue: 0
  });
  const [statusData, setStatusData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [topSuppliers, setTopSuppliers] = useState([]);
  const [topClinics, setTopClinics] = useState([]);
  const [allData, setAllData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [suppliersLoading, setSuppliersLoading] = useState(true);
  const [clinicsLoading, setClinicsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filter states
  const [selectedClinic, setSelectedClinic] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('');

  // Calculate filtered statistics
  const calculateFilteredStats = (data) => {
    const stats = {
      total: data.length,
      new: data.filter(item => item.status === 'جديد').length,
      approved: data.filter(item => item.status === 'موافق عليه').length,
      contracted: data.filter(item => item.status === 'تم التعاقد').length,
      delivered: data.filter(item => item.status === 'تم التسليم').length,
      rejected: data.filter(item => item.status === 'مرفوض').length,
      totalValue: data.reduce((sum, item) => sum + (item.value || 0), 0)
    };
    return stats;
  };

  // Load dashboard data
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await dentalContractsApi.getDashboardData();
      
      if (response.success && response.data) {
        setOriginalDashboardData(response.data);
        setDashboardData(response.data);
        
        // Update status data for pie chart
        const newStatusData = [
          { name: 'جديد', value: response.data.new, color: '#3b82f6' },
          { name: 'موافق عليه', value: response.data.approved, color: '#f59e0b' },
          { name: 'تم التعاقد', value: response.data.contracted, color: '#8b5cf6' },
          { name: 'تم التسليم', value: response.data.delivered, color: '#10b981' },
          { name: 'مرفوض', value: response.data.rejected, color: '#ef4444' }
        ];
        setStatusData(newStatusData);
        
        // If monthly data is included in dashboard response
        if (response.data.monthlyData) {
          setMonthlyData(response.data.monthlyData);
        }
      }
    } catch (err) {
      setError(err.message || 'فشل في تحميل بيانات لوحة التحكم');
      console.error('Dashboard data loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load contracts data
  const loadContractsData = async () => {
    try {
      const response = await dentalContractsApi.getContracts();
      
      if (response.success && response.data) {
        setAllData(response.data);
        setFilteredData(response.data);
      }
    } catch (err) {
      console.error('Contracts data loading error:', err);
    }
  };

  // Load top suppliers
  const loadTopSuppliers = async () => {
    try {
      setSuppliersLoading(true);
      const response = await dentalContractsApi.getTopSuppliers();
      
      if (response.success && response.data) {
        setTopSuppliers(response.data);
      }
    } catch (err) {
      console.error('Top suppliers loading error:', err);
    } finally {
      setSuppliersLoading(false);
    }
  };

  // Load top clinics
  const loadTopClinics = async () => {
    try {
      setClinicsLoading(true);
      const response = await dentalContractsApi.getTopClinics();
      
      if (response.success && response.data) {
        setTopClinics(response.data);
      }
    } catch (err) {
      console.error('Top clinics loading error:', err);
    } finally {
      setClinicsLoading(false);
    }
  };

  // Initial data loading
  useEffect(() => {
    const loadAllData = async () => {
      await Promise.all([
        loadDashboardData(),
        loadContractsData(),
        loadTopSuppliers(),
        loadTopClinics()
      ]);
    };
    
    loadAllData();
  }, []);

  // Real-time filtering with useEffect - FIXED VERSION
  useEffect(() => {
    let filtered = [...allData];

    if (selectedClinic && selectedClinic !== "all") {
      filtered = filtered.filter(item => 
        item.clinic?.toLowerCase().includes(selectedClinic.toLowerCase()) ||
        item.beneficiary?.toLowerCase().includes(selectedClinic.toLowerCase())
      );
    }

    if (selectedEquipment) {
      filtered = filtered.filter(item => 
        item.itemNumber?.toLowerCase().includes(selectedEquipment.toLowerCase()) ||
        item.itemName?.toLowerCase().includes(selectedEquipment.toLowerCase())
      );
    }

if (selectedSupplier && selectedSupplier !== "all") {
  filtered = filtered.filter(item => 
        item.supplier?.toLowerCase().includes(selectedSupplier.toLowerCase())
      );
    }

    setFilteredData(filtered);
    
    // Update dashboard stats based on filtered data
    const filteredStats = calculateFilteredStats(filtered);
    setDashboardData(filteredStats);

    // Update status data based on filtered results
    const newStatusData = [
      { name: 'جديد', value: filteredStats.new, color: '#3b82f6' },
      { name: 'موافق عليه', value: filteredStats.approved, color: '#f59e0b' },
      { name: 'تم التعاقد', value: filteredStats.contracted, color: '#8b5cf6' },
      { name: 'تم التسليم', value: filteredStats.delivered, color: '#10b981' },
      { name: 'مرفوض', value: filteredStats.rejected, color: '#ef4444' }
    ];
    setStatusData(newStatusData);

  }, [selectedClinic, selectedEquipment, selectedSupplier, allData]);

  const clearFilters = () => {
    setSelectedClinic('');
    setSelectedEquipment('');
    setSelectedSupplier('');
    // Reset to original dashboard data instead of reloading
    setDashboardData(originalDashboardData);
    setFilteredData(allData);
    
    // Reset status data to original
    const originalStatusData = [
      { name: 'جديد', value: originalDashboardData.new, color: '#3b82f6' },
      { name: 'موافق عليه', value: originalDashboardData.approved, color: '#f59e0b' },
      { name: 'تم التعاقد', value: originalDashboardData.contracted, color: '#8b5cf6' },
      { name: 'تم التسليم', value: originalDashboardData.delivered, color: '#10b981' },
      { name: 'مرفوض', value: originalDashboardData.rejected, color: '#ef4444' }
    ];
    setStatusData(originalStatusData);
  };

  const refreshData = async () => {
    await Promise.all([
      loadDashboardData(),
      loadContractsData(),
      loadTopSuppliers(),
      loadTopClinics()
    ]);
  };

  // Get unique values for dropdown options from the actual data
  const uniqueClinics = [...new Set(allData
    .map(item => item.clinic)
    .filter(clinic => clinic && clinic.trim() !== '')
  )].sort();
  
  const uniqueSuppliers = [...new Set(allData
    .map(item => item.supplier)
    .filter(supplier => supplier && supplier.trim() !== '')
  )].sort();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-gray-600">جاري تحميل بيانات لوحة التحكم...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <FileX className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-700 mb-2">خطأ في تحميل البيانات</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={refreshData} className="w-full">
              <Loader2 className="h-4 w-4 mr-2" />
              إعادة المحاولة
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-lg p-6 text-white">
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8" />
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-right">لوحة تحكم عقود الأسنان</h1>
            <p className="text-purple-100 mt-1 text-right">إدارة شاملة لعقود معدات طب الأسنان</p>
          </div>
          <Button 
            variant="secondary" 
            onClick={refreshData}
            className="bg-white/20 hover:bg-white/30 text-white border-white/30"
          >
            <Loader2 className="h-4 w-4 mr-2" />
            تحديث البيانات
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-right">فلاتر البحث</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select value={selectedClinic} onValueChange={setSelectedClinic}>
              <SelectTrigger>
                <SelectValue placeholder="اختر العيادة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع العيادات</SelectItem>
                {uniqueClinics.map((clinic) => (
                  <SelectItem key={clinic} value={clinic}>{clinic}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              placeholder="رقم أو اسم المعدة"
              value={selectedEquipment}
              onChange={(e) => setSelectedEquipment(e.target.value)}
            />

            <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
              <SelectTrigger>
                <SelectValue placeholder="اختر الشركة الموردة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الموردين</SelectItem>
                {uniqueSuppliers.map((supplier) => (
                  <SelectItem key={supplier} value={supplier}>{supplier}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button variant="outline" onClick={clearFilters} className="w-full">
                مسح الفلاتر
              </Button>
            </div>
          </div>
          
          {/* Filter Results Summary */}
          {(selectedClinic || selectedEquipment || selectedSupplier) && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800 text-right">
                عرض {filteredData.length} من أصل {allData.length} عقد
                {selectedClinic && <span className="block">العيادة: {selectedClinic}</span>}
                {selectedEquipment && <span className="block">المعدة: {selectedEquipment}</span>}
                {selectedSupplier && <span className="block">المورد: {selectedSupplier}</span>}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-right">
                <p className="text-sm font-medium text-purple-600">إجمالي العقود</p>
                <p className="text-2xl font-bold text-purple-800">{dashboardData.total}</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-right">
                <p className="text-sm font-medium text-yellow-600">عقود جديدة</p>
                <p className="text-2xl font-bold text-yellow-800">{dashboardData.new}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-right">
                <p className="text-sm font-medium text-green-600">تم التسليم</p>
                <p className="text-2xl font-bold text-green-800">{dashboardData.delivered}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-indigo-50 border-indigo-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-right">
                <p className="text-sm font-medium text-indigo-600">القيمة الإجمالية</p>
                <p className="text-xl font-bold text-indigo-800">{dashboardData.totalValue?.toLocaleString()}</p>
                <p className="text-xs text-indigo-600">ريال سعودي</p>
              </div>
              <DollarSign className="h-8 w-8 text-indigo-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="text-center">
              <Clock className="h-6 w-6 text-blue-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-blue-600">جديد</p>
              <p className="text-xl font-bold text-blue-800">{dashboardData.new}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4">
            <div className="text-center">
              <AlertTriangle className="h-6 w-6 text-yellow-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-yellow-600">موافق عليه</p>
              <p className="text-xl font-bold text-yellow-800">{dashboardData.approved}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4">
            <div className="text-center">
              <TrendingUp className="h-6 w-6 text-purple-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-purple-600">تم التعاقد</p>
              <p className="text-xl font-bold text-purple-800">{dashboardData.contracted}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="text-center">
              <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-green-600">تم التسليم</p>
              <p className="text-xl font-bold text-green-800">{dashboardData.delivered}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4">
            <div className="text-center">
              <XCircle className="h-6 w-6 text-red-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-red-600">مرفوض</p>
              <p className="text-xl font-bold text-red-800">{dashboardData.rejected}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-right">توزيع حالة العقود</CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px]">
                <p className="text-gray-500">لا توجد بيانات لعرضها</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="text-right">اتجاه العقود الشهرية</CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="contracts" fill="#8b5cf6" name="عدد العقود" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px]">
                <p className="text-gray-500">لا توجد بيانات شهرية لعرضها</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Suppliers and Clinics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Suppliers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-right">أفضل الشركات الموردة</CardTitle>
          </CardHeader>
          <CardContent>
            {suppliersLoading ? (
              <div className="flex items-center justify-center h-[200px]">
                <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
              </div>
            ) : topSuppliers.length > 0 ? (
              <div className="space-y-4">
                {topSuppliers.map((supplier, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="text-right">
                      <p className="font-medium">{supplier.name}</p>
                      <div className="text-sm text-gray-600">
                        <p>{supplier.contracts} عقد</p>
                        <p>{supplier.value?.toLocaleString()} ريال</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-purple-600" />
                      <span className="font-bold text-purple-600">#{index + 1}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">لا توجد بيانات موردين</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Clinics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-right">أكثر العيادات نشاطاً</CardTitle>
          </CardHeader>
          <CardContent>
            {clinicsLoading ? (
              <div className="flex items-center justify-center h-[200px]">
                <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
              </div>
            ) : topClinics.length > 0 ? (
              <div className="space-y-4">
                {topClinics.map((clinic, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="text-right">
                      <p className="font-medium">{clinic.name}</p>
                      <div className="text-sm text-gray-600">
                        <p>{clinic.contracts} عقد</p>
                        <p>{clinic.value?.toLocaleString()} ريال</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-purple-600" />
                      <span className="font-bold text-purple-600">#{index + 1}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">لا توجد بيانات عيادات</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filtered Data Table */}
      {filteredData.length > 0 && (selectedClinic || selectedEquipment || selectedSupplier) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-right">نتائج الفلترة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 p-2 text-right">رقم المعدة</th>
                    <th className="border border-gray-300 p-2 text-right">اسم المعدة</th>
                    <th className="border border-gray-300 p-2 text-right">العيادة</th>
                    <th className="border border-gray-300 p-2 text-right">المورد</th>
                    <th className="border border-gray-300 p-2 text-right">الحالة</th>
                    <th className="border border-gray-300 p-2 text-right">القيمة</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="border border-gray-300 p-2">{item.itemNumber}</td>
                      <td className="border border-gray-300 p-2">{item.itemName}</td>
                      <td className="border border-gray-300 p-2">{item.clinic}</td>
                      <td className="border border-gray-300 p-2">{item.supplier}</td>
                      <td className="border border-gray-300 p-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          item.status === 'جديد' ? 'bg-blue-100 text-blue-800' :
                          item.status === 'موافق عليه' ? 'bg-yellow-100 text-yellow-800' :
                          item.status === 'تم التعاقد' ? 'bg-purple-100 text-purple-800' :
                          item.status === 'تم التسليم' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="border border-gray-300 p-2">{item.value?.toLocaleString()} ريال</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
