import { useState, useEffect } from 'react';
import { AlertCircle, Clock, CheckCircle, XCircle, TrendingDown, Loader2 } from 'lucide-react';
import StatCard from '@/components/StatCard';
import { transactionsApi, reportsApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

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

interface DashboardData {
  transactions: Transaction[];
  statistics: {
    total: number;
    pending: number;
    completed: number;
    rejected: number;
    overdue: number;
  };
  facilityBreakdown: Array<{
    facility: string;
    total: number;
    pending: number;
    completed: number;
    rejected: number;
  }>;
  statusBreakdown: Array<{
    status: string;
    count: number;
  }>;
  completionRate: number;
}

export default function TransactionsDashboard() {
  const [selectedFacility, setSelectedFacility] = useState('');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [transactionStatuses, setTransactionStatuses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [facilitiesLoading, setFacilitiesLoading] = useState(true);
  const { toast } = useToast();

  // Fetch dashboard data and facilities on component mount
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setFacilitiesLoading(true);

      const [dashboardResponse, facilitiesResponse, statusesResponse] = await Promise.all([
        transactionsApi.getDashboardData().catch(error => ({
          success: false,
          data: null,
          message: error.message
        })),
        reportsApi.getFacilities().catch(error => ({
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

      if (dashboardResponse.success && dashboardResponse.data) {
        setDashboardData(dashboardResponse.data);
      } else {
        setDashboardData(null);
        toast({
          title: "تعذر تحميل بيانات لوحة التحكم",
          description: dashboardResponse.message || "فشل في تحميل بيانات المعاملات",
          variant: "destructive"
        });
      }

      if (facilitiesResponse.success && facilitiesResponse.data) {
        setFacilities(facilitiesResponse.data);
      } else {
        setFacilities([]);
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
      console.error('Error fetching dashboard data:', error);
      setDashboardData(null);
      setFacilities([]);
      setTransactionStatuses([]);
      toast({
        title: "خطأ في الاتصال",
        description: "فشل في الاتصال بالخادم",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setFacilitiesLoading(false);
    }
  };

  // Client-side filtering
  const filteredData = dashboardData && dashboardData.transactions ? {
    ...dashboardData,
    transactions: dashboardData.transactions.filter(transaction => {
      return selectedFacility === '' || transaction.transferredTo === selectedFacility;
    })
  } : null;

  // Recalculate statistics based on filtered data
  const getFilteredStats = () => {
    if (!filteredData || !filteredData.transactions) return { total: 0, pending: 0, completed: 0, rejected: 0, overdue: 0, completionRate: 0 };
    
    const transactions = filteredData.transactions;
    const total = transactions.length;
    const pending = transactions.filter(t => t.status === 'مفتوح تحت الاجراء').length;
    const completed = transactions.filter(t => t.status === 'منجز').length;
    const rejected = transactions.filter(t => t.status === 'مرفوض').length;
    
    // Calculate overdue (more than 21 days)
    const today = new Date();
    const overdue = transactions.filter(transaction => {
      const receiveDate = new Date(transaction.receiveDate);
      const daysDiff = Math.floor((today.getTime() - receiveDate.getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff > 21 && transaction.status === 'مفتوح تحت الاجراء';
    }).length;
    
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return { total, pending, completed, rejected, overdue, completionRate };
  };

  const stats = getFilteredStats();

  return (
    <div className="space-y-6">
      <div className="text-right">
        <h1 className="text-3xl font-bold text-foreground">لوحة تحكم المعاملات الإدارية</h1>
        <p className="text-muted-foreground mt-2">إحصائيات ومعدلات الإنجاز للمعاملات</p>
      </div>

      {/* Filters */}
      <div className="admin-card">
        <div className="admin-header"><h2>التصفية</h2></div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
              value={selectedFacility}
              onChange={(e) => setSelectedFacility(e.target.value)}
              className="w-full p-2 border border-input rounded-md text-right"
              disabled={facilitiesLoading}
            >
              <option value="">
                {facilitiesLoading ? "جاري تحميل الجهات..." : "جميع الجهات"}
              </option>
              {facilities.map(facility => (
                <option key={facility.id} value={facility.name}>{facility.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Statistics */}
      <div className="responsive-grid">
        {loading ? (
          <div className="col-span-full">
            <div className="admin-card">
              <div className="p-4 text-center">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                <p className="text-muted-foreground">جاري تحميل الإحصائيات...</p>
              </div>
            </div>
          </div>
        ) : !dashboardData ? (
          <div className="col-span-full">
            <div className="admin-card">
              <div className="p-4 text-center">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground">تعذر تحميل الإحصائيات</p>
                <button 
                  onClick={fetchAllData}
                  className="admin-btn-primary mt-2 text-sm"
                >
                  إعادة المحاولة
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <StatCard
              title="إجمالي المعاملات"
              value={stats.total}
              icon={AlertCircle}
              color="primary"
            />
            <StatCard
              title="تحت الإجراء"
              value={stats.pending}
              icon={Clock}
              color="warning"
            />
            <StatCard
              title="المعاملات المنجزة"
              value={stats.completed}
              icon={CheckCircle}
              color="success"
            />
            <StatCard
              title="المعاملات المرفوضة"
              value={stats.rejected}
              icon={XCircle}
              color="danger"
            />
          </>
        )}
      </div>

      {/* Overdue Transactions Alert */}
      <div className="admin-card">
        <div className="admin-header bg-danger text-danger-foreground">
          <h2>المعاملات المتأخرة</h2>
        </div>
        <div className="p-4">
          {loading ? (
            <div className="text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              <p className="text-muted-foreground">جاري تحميل بيانات المعاملات المتأخرة...</p>
            </div>
          ) : !dashboardData ? (
            <div className="text-center">
              <p className="text-muted-foreground">تعذر تحميل بيانات المعاملات المتأخرة</p>
            </div>
          ) : (
            <div className="text-center">
              <div className="text-4xl font-bold text-danger mb-2">
                {stats.overdue}
              </div>
              <div className="text-muted-foreground">
                معاملة متأخرة (أكثر من 3 أسابيع)
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="admin-card">
        <div className="admin-header"><h2>توزيع المعاملات حسب الحالة</h2></div>
        <div className="p-4">
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              <p className="text-muted-foreground">جاري تحميل توزيع المعاملات...</p>
            </div>
          ) : !dashboardData ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">تعذر تحميل توزيع المعاملات</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {transactionStatuses.map(status => {
                const statusCount = filteredData?.transactions.filter(t => t.status === status).length || 0;
                return (
                  <div key={status} className="stat-card">
                    <div className="stat-number">{statusCount}</div>
                    <div className="stat-label">{status}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Facility Breakdown */}
      <div className="admin-card">
        <div className="admin-header"><h2>توزيع المعاملات حسب الجهات</h2></div>
        <div className="p-4">
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              <p className="text-muted-foreground">جاري تحميل توزيع الجهات...</p>
            </div>
          ) : !dashboardData ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">تعذر تحميل توزيع الجهات</p>
            </div>
          ) : (
            <>
              <div className="responsive-table">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-right">
                      <th className="p-3">الجهة</th>
                      <th className="p-3">إجمالي المعاملات</th>
                      <th className="p-3">تحت الإجراء</th>
                      <th className="p-3">منجز</th>
                      <th className="p-3">مرفوض</th>
                    </tr>
                  </thead>
                  <tbody>
                     {facilities.map(facility => {
                      const facilityTransactions = dashboardData?.transactions?.filter(t => t.transferredTo === facility.name) || [];
                      const pending = facilityTransactions.filter(t => t.status === 'مفتوح تحت الاجراء').length;
                      const completed = facilityTransactions.filter(t => t.status === 'منجز').length;
                      const rejected = facilityTransactions.filter(t => t.status === 'مرفوض').length;
                      
                      return (
                        <tr key={facility.id} className="border-b border-border text-right">
                          <td className="p-3 font-medium">{facility.name}</td>
                          <td className="p-3">{facilityTransactions.length}</td>
                          <td className="p-3 text-warning">{pending}</td>
                          <td className="p-3 text-success">{completed}</td>
                          <td className="p-3 text-danger">{rejected}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {facilities.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  لا توجد جهات متاحة
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Completion Rate */}
      <div className="admin-card">
        <div className="admin-header"><h2>معدل الإنجاز</h2></div>
        <div className="p-4">
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              <p className="text-muted-foreground">جاري تحميل معدل الإنجاز...</p>
            </div>
          ) : !dashboardData ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">تعذر تحميل معدل الإنجاز</p>
            </div>
          ) : (
            <div className="text-center">
              <div className="text-4xl font-bold text-success">
                {stats.completionRate}%
              </div>
              <div className="text-muted-foreground">معدل إنجاز المعاملات الإدارية</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}