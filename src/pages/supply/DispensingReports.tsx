
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Calendar, FileText, Filter, Printer, TrendingUp, Package, Users, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { warehouseApi, reportsApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';


export default function DispensingReports() {
  const [selectedFacility, setSelectedFacility] = useState('جميع المنشآت');
  const [dispensingData, setDispensingData] = useState<any[]>([]);
  const [dispensingOperations, setDispensingOperations] = useState<any[]>([]);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Filter data based on selected facility
  const filteredData = selectedFacility === 'جميع المنشآت' 
    ? dispensingOperations 
    : dispensingOperations.filter(item => item.facility === selectedFacility);

  const filteredChartData = selectedFacility === 'جميع المنشآت' 
    ? dashboardData?.chartData || [] 
    : dashboardData?.chartData?.filter((item: any) => item.facility === selectedFacility) || [];

  const filteredFacilityData = selectedFacility === 'جميع المنشآت' 
    ? dashboardData?.facilityData || [] 
    : dashboardData?.facilityData?.filter((item: any) => item.name === selectedFacility) || [];

  const filteredTrendData = selectedFacility === 'جميع المنشآت' 
    ? dashboardData?.trendData || [] 
    : dashboardData?.trendData?.filter((item: any) => item.facility === selectedFacility) || [];

  const totalDispensingValue = filteredData.reduce((sum, item) => sum + (item.totalValue || item.total_value || 0), 0);
  const totalItems = filteredData.reduce((sum, item) => sum + (item.items || item.items_count || 0), 0);
  const avgPerDispensing = totalDispensingValue / filteredData.length || 0;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [dispensingResponse, operationsResponse, facilitiesResponse] = await Promise.all([
          warehouseApi.getDispensingData(),
          warehouseApi.getDispensingOperations(),
          reportsApi.getFacilities()
        ]);

        if (dispensingResponse.success) {
          setDispensingData(dispensingResponse.data);
          setDashboardData(dispensingResponse.data);
        }

        if (operationsResponse.success) {
          setDispensingOperations(operationsResponse.data);
        }

        if (facilitiesResponse.success) {
          setFacilities([{ id: 'all', name: 'جميع المنشآت' }, ...facilitiesResponse.data]);
        }
      } catch (error: any) {
        console.error('Error fetching dispensing data:', error);
        toast({
          title: "خطأ",
          description: error.message || "فشل في تحميل بيانات تقارير الصرف",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  const handlePrint = (item: any) => {
    const printContent = `
      <div style="direction: rtl; font-family: Arial, sans-serif; padding: 20px;">
        <h2>تقرير صرف - ${item.id}</h2>
        <hr>
        <p><strong>التاريخ:</strong> ${item.date}</p>
        <p><strong>المنشأة:</strong> ${item.facility}</p>
        <p><strong>عدد الأصناف:</strong> ${item.items}</p>
        <p><strong>القيمة الإجمالية:</strong> ${item.totalValue.toLocaleString()} ريال</p>
        <p><strong>مقدم الطلب:</strong> ${item.requestedBy}</p>
        <p><strong>الحالة:</strong> ${item.status}</p>
        <p><strong>الفئة:</strong> ${item.category}</p>
      </div>
    `;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 rounded-lg p-4 sm:p-6 text-primary-foreground shadow-lg print:hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="text-right">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2">تقارير الصرف</h1>
            <p className="text-primary-foreground/90 text-sm sm:text-base">عرض وإدارة تقارير عمليات الصرف للمنشآت</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="print:hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-right flex items-center gap-2 text-sm sm:text-base">
            <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
            فلترة التقارير
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-medium mb-2 block text-right">الجهة المستفيدة/المنشأة</label>
              <Select value={selectedFacility} onValueChange={setSelectedFacility}>
                <SelectTrigger className="text-right">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {facilities.map((facility) => (
                    <SelectItem key={facility.id || facility} value={facility.name || facility}>
                      {facility.name || facility}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button className="flex-1">
                <FileText className="w-4 h-4 ml-2" />
                تطبيق الفلتر
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="text-right">
                <p className="text-blue-100 text-xs sm:text-sm font-medium">إجمالي قيمة الصرف</p>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold">{totalDispensingValue.toLocaleString()}</p>
                <p className="text-xs text-blue-100">ريال</p>
              </div>
              <div className="bg-white/20 p-2 sm:p-3 rounded-full">
                <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="text-right">
                <p className="text-green-100 text-xs sm:text-sm font-medium">إجمالي الأصناف المصروفة</p>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold">{totalItems}</p>
              </div>
              <div className="bg-white/20 p-2 sm:p-3 rounded-full">
                <Package className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="text-right">
                <p className="text-purple-100 text-xs sm:text-sm font-medium">عدد عمليات الصرف</p>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold">{filteredData.length}</p>
              </div>
              <div className="bg-white/20 p-2 sm:p-3 rounded-full">
                <FileText className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="text-right">
                <p className="text-orange-100 text-xs sm:text-sm font-medium">متوسط قيمة الصرف</p>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold">{avgPerDispensing.toFixed(0)}</p>
                <p className="text-xs text-orange-100">ريال</p>
              </div>
              <div className="bg-white/20 p-2 sm:p-3 rounded-full">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm sm:text-base">اتجاه الصرف الشهري</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] sm:h-[250px] md:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filteredChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={10} />
                  <YAxis fontSize={10} />
                  <Tooltip formatter={(value) => [`${value} ريال`, 'القيمة']} />
                  <Bar dataKey="value" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm sm:text-base">توزيع الصرف حسب المنشأة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] sm:h-[250px] md:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={filteredFacilityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={70}
                  dataKey="value"
                >
                  {filteredFacilityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || '#3b82f6'} />
                  ))}
                </Pie>
                  <Tooltip formatter={(value) => [`${value}%`, 'النسبة']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trend Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm sm:text-base">مقارنة الاتجاهات - الصرف مقابل الطلبات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] sm:h-[250px] md:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={filteredTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" fontSize={10} />
                <YAxis fontSize={10} />
                <Tooltip />
                <Line type="monotone" dataKey="dispensing" stroke="hsl(var(--primary))" strokeWidth={2} name="عمليات الصرف" />
                <Line type="monotone" dataKey="requests" stroke="hsl(var(--secondary))" strokeWidth={2} name="الطلبات" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Dispensing Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm sm:text-base">تفاصيل عمليات الصرف</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right text-xs sm:text-sm whitespace-nowrap">رقم العملية</TableHead>
                  <TableHead className="text-right text-xs sm:text-sm whitespace-nowrap">التاريخ</TableHead>
                  <TableHead className="text-right text-xs sm:text-sm whitespace-nowrap">المنشأة</TableHead>
                  <TableHead className="text-right text-xs sm:text-sm whitespace-nowrap">عدد الأصناف</TableHead>
                  <TableHead className="text-right text-xs sm:text-sm whitespace-nowrap">القيمة الإجمالية</TableHead>
                  <TableHead className="text-right text-xs sm:text-sm whitespace-nowrap">مقدم الطلب</TableHead>
                  <TableHead className="text-right text-xs sm:text-sm whitespace-nowrap">الحالة</TableHead>
                  <TableHead className="text-right text-xs sm:text-sm whitespace-nowrap">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center p-4">
                      جاري تحميل البيانات...
                    </TableCell>
                  </TableRow>
                ) : filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center p-4">
                      لا توجد بيانات متاحة
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((item) => (
                    <TableRow key={item.id} className="hover:bg-muted/30">
                      <TableCell className="font-medium text-xs sm:text-sm whitespace-nowrap">{item.id}</TableCell>
                      <TableCell className="text-xs sm:text-sm whitespace-nowrap">{item.date || item.created_at}</TableCell>
                      <TableCell className="text-xs sm:text-sm">{item.facility}</TableCell>
                      <TableCell className="text-xs sm:text-sm">{item.items || item.items_count}</TableCell>
                      <TableCell className="text-xs sm:text-sm whitespace-nowrap">{(item.totalValue || item.total_value || 0).toLocaleString()} ريال</TableCell>
                      <TableCell className="text-xs sm:text-sm">{item.requestedBy || item.requested_by}</TableCell>
                      <TableCell>
                        <Badge variant={item.status === 'مكتمل' ? 'default' : 'secondary'} className="text-xs whitespace-nowrap">
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm">{item.category}</TableCell>
                      <TableCell>
                        <Button 
                          onClick={() => handlePrint(item)} 
                          variant="outline" 
                          size="sm"
                          className="text-xs"
                        >
                          <Printer className="w-3 h-3 ml-1" />
                          طباعة
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
