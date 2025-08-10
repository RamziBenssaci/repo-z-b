import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Building2, Phone, MapPin, Mail, Settings, Plus, Edit, Eye, Search, TrendingUp, Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { facilitiesApi } from "@/lib/api";

interface Facility {
  id: string;
  name: string;
  code: string;
  location: string;
  phone: string;
  email: string;
  manager: string;
  medical_director: string;
  contact: string;
  isActive: boolean;
  address: string;
  description: string;
  sector: string;
  status: string;
  number: string;
  clinics: string[];
}

const mockFacilities: Facility[] = [
  {
    id: '1',
    name: 'مستشفى الملك فهد',
    code: 'KFH001',
    location: 'الرياض - الملز',
    phone: '011-123-4567',
    email: 'info@kfh.health.sa',
    manager: 'د. أحمد السعود',
    medical_director: 'د. محمد العلي',
    contact: '011-123-4567',
    isActive: true,
    address: 'شارع الملك فهد، حي الملز، الرياض 12345',
    description: 'مستشفى متخصص في الطب العام والجراحة',
    sector: 'الرياض',
    status: 'نشطة',
    number: '001',
    clinics: ['عيادة الأسنان العامة', 'عيادة طب الأسنان التخصصية']
  },
  {
    id: '2',
    name: 'مركز الأمير سلطان',
    code: 'PSC002',
    location: 'الرياض - العليا',
    phone: '011-987-6543',
    email: 'contact@psc.health.sa',
    manager: 'د. فاطمة الأحمد',
    medical_director: 'د. سارة الحسن',
    contact: '011-987-6543',
    isActive: true,
    address: 'طريق الملك عبدالعزيز، حي العليا، الرياض 12356',
    description: 'مركز طبي متخصص في أمراض القلب',
    sector: 'الرياض',
    status: 'نشطة',
    number: '002',
    clinics: ['عيادة جراحة الفم والأسنان', 'عيادة تقويم الأسنان']
  },
  {
    id: '3',
    name: 'مستوصف النور',
    code: 'NOR003',
    location: 'الرياض - الدرعية',
    phone: '011-555-0123',
    email: 'info@noor.health.sa',
    manager: 'د. محمد الخالد',
    medical_director: 'د. عبدالله الزهراني',
    contact: '011-555-0123',
    isActive: false,
    address: 'حي الدرعية، الرياض 12367',
    description: 'مستوصف طبي عام - قيد التطوير',
    sector: 'الرياض',
    status: 'غير نشطة',
    number: '003',
    clinics: ['عيادة طب أسنان الأطفال']
  }
];

// Clinic options from dashboard
const clinicOptions = [
  'عيادة الأسنان العامة',
  'عيادة طب الأسنان التخصصية',
  'عيادة جراحة الفم والأسنان',
  'عيادة تقويم الأسنان',
  'عيادة طب أسنان الأطفال'
];

// Sectors from dashboard
const sectors = ['الرياض', 'الزلفي', 'رماح', 'حوطة سدير', 'تمير', 'الغاط', 'المجمعة', 'الأرطاوية'];

export default function FacilityManagement() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    active: 0,
    inactive: 0,
    total: 0,
    activationPercentage: 0
  });
  const { toast } = useToast();

  const [newFacility, setNewFacility] = useState<Omit<Facility, 'id'>>({
    name: '',
    code: '',
    location: '',
    phone: '',
    email: '',
    manager: '',
    medical_director: '',
    contact: '',
    isActive: true,
    address: '',
    description: '',
    sector: '',
    status: 'نشطة',
    number: '',
    clinics: []
  });

  // Load facilities data
  useEffect(() => {
    loadFacilities();
    loadStats();
  }, []);

  const loadFacilities = async () => {
    try {
      setLoading(true);
      const response = await facilitiesApi.getFacilities();
      console.log('API Response:', response);
      if (response.success && response.data) {
        setFacilities(response.data);
      }
    } catch (error) {
      console.error('Error loading facilities:', error);
      // Fallback to mock data
      setFacilities(mockFacilities);
      toast({
        title: "تعذر تحميل بيانات المنشآت",
        description: "سيتم عرض البيانات التجريبية",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await facilitiesApi.getFacilityStats();
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
      // Calculate stats from current facilities
      const active = facilities.filter(f => f.status === 'نشطة').length;
      const total = facilities.length;
      setStats({
        active,
        inactive: total - active,
        total,
        activationPercentage: total > 0 ? Math.round((active / total) * 100) : 0
      });
    }
  };

  const filteredFacilities = facilities.filter(facility =>
    facility.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    facility.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle clinic selection for new facility
  const handleNewFacilityClinicChange = (clinicName: string, checked: boolean) => {
    if (checked) {
      setNewFacility({
        ...newFacility,
        clinics: [...newFacility.clinics, clinicName]
      });
    } else {
      setNewFacility({
        ...newFacility,
        clinics: newFacility.clinics.filter(clinic => clinic !== clinicName)
      });
    }
  };

  // Handle clinic selection for editing facility
  const handleEditFacilityClinicChange = (clinicName: string, checked: boolean) => {
    if (!selectedFacility) return;
    
    if (checked) {
      setSelectedFacility({
        ...selectedFacility,
        clinics: [...selectedFacility.clinics, clinicName]
      });
    } else {
      setSelectedFacility({
        ...selectedFacility,
        clinics: selectedFacility.clinics.filter(clinic => clinic !== clinicName)
      });
    }
  };

  const handleAddFacility = async () => {
    try {
      const response = await facilitiesApi.createFacility(newFacility);
      if (response.success) {
        toast({
          title: "تم إضافة المنشأة بنجاح",
          description: `تم إضافة ${newFacility.name} إلى النظام`,
        });
        setNewFacility({
          name: '', 
          code: '', 
          location: '', 
          phone: '', 
          email: '', 
          manager: '', 
          medical_director: '',
          contact: '',
          isActive: true, 
          address: '', 
          description: '',
          sector: '',
          status: 'نشطة',
          number: '',
          clinics: []
        });
        setShowAddDialog(false);
        loadFacilities();
        loadStats();
      }
    } catch (error) {
      console.error('Error adding facility:', error);
      toast({
        title: "خطأ في إضافة المنشأة",
        description: "حدث خطأ أثناء إضافة المنشأة",
        variant: "destructive",
      });
    }
  };

  const handleUpdateFacility = async () => {
    if (!selectedFacility) return;
    try {
      const response = await facilitiesApi.updateFacility(selectedFacility.id, selectedFacility);
      if (response.success) {
        toast({
          title: "تم تحديث المنشأة بنجاح",
          description: `تم تحديث بيانات ${selectedFacility.name}`,
        });
        setIsEditMode(false);
        loadFacilities();
        loadStats();
      }
    } catch (error) {
      console.error('Error updating facility:', error);
      toast({
        title: "خطأ في تحديث المنشأة",
        description: "حدث خطأ أثناء تحديث المنشأة",
        variant: "destructive",
      });
    }
  };

  const toggleFacilityStatus = async (id: string) => {
    try {
      const response = await facilitiesApi.toggleFacilityStatus(id);
      if (response.success) {
        toast({
          title: "تم تحديث حالة المنشأة",
          description: "تم تغيير حالة المنشأة بنجاح",
        });
        loadFacilities();
        loadStats();
      }
    } catch (error) {
      console.error('Error toggling facility status:', error);
      toast({
        title: "خطأ في تحديث الحالة",
        description: "حدث خطأ أثناء تحديث حالة المنشأة",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background rounded-lg p-6 border border-primary/20">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="text-right">
            <h1 className="text-3xl font-bold text-primary mb-2">إدارة المنشآت</h1>
            <p className="text-muted-foreground">إدارة معلومات المنشآت الطبية والمراكز الصحية</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white shadow-lg">
                  <Plus className="ml-2 h-4 w-4" />
                  إضافة منشأة جديدة
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
                <DialogHeader className="text-right">
                  <DialogTitle>إضافة منشأة جديدة</DialogTitle>
                  <DialogDescription>
                    أدخل معلومات المنشأة الطبية الجديدة
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">اسم المنشأة *</Label>
                      <Input
                        id="name"
                        value={newFacility.name}
                        onChange={(e) => setNewFacility({...newFacility, name: e.target.value})}
                        placeholder="أدخل اسم المنشأة"
                        className="text-right"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="code">رمز المنشأة *</Label>
                      <Input
                        id="code"
                        value={newFacility.code}
                        onChange={(e) => setNewFacility({...newFacility, code: e.target.value})}
                        placeholder="مثال: KFH001"
                        className="text-right"
                      />
                    </div>
                  </div>

                  {/* Contact and Management Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contact">معلومات التواصل</Label>
                      <Input
                        id="contact"
                        value={newFacility.contact}
                        onChange={(e) => setNewFacility({...newFacility, contact: e.target.value})}
                        placeholder="رقم الهاتف أو البريد الإلكتروني"
                        className="text-right"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">رقم الهاتف</Label>
                      <Input
                        id="phone"
                        value={newFacility.phone}
                        onChange={(e) => setNewFacility({...newFacility, phone: e.target.value})}
                        placeholder="011-123-4567"
                        className="text-right"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">البريد الإلكتروني</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newFacility.email}
                        onChange={(e) => setNewFacility({...newFacility, email: e.target.value})}
                        placeholder="info@facility.health.sa"
                        className="text-right"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="manager">المدير</Label>
                      <Input
                        id="manager"
                        value={newFacility.manager}
                        onChange={(e) => setNewFacility({...newFacility, manager: e.target.value})}
                        placeholder="اسم مدير المنشأة"
                        className="text-right"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="medical_director">المدير الطبي</Label>
                      <Input
                        id="medical_director"
                        value={newFacility.medical_director}
                        onChange={(e) => setNewFacility({...newFacility, medical_director: e.target.value})}
                        placeholder="اسم المدير الطبي"
                        className="text-right"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="number">رقم المنشأة</Label>
                      <Input
                        id="number"
                        value={newFacility.number}
                        onChange={(e) => setNewFacility({...newFacility, number: e.target.value})}
                        placeholder="رقم المنشأة"
                        className="text-right"
                      />
                    </div>
                  </div>

                  {/* Location Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="sector">القطاع</Label>
                      <Select value={newFacility.sector} onValueChange={(value) => setNewFacility({...newFacility, sector: value})}>
                        <SelectTrigger className="text-right">
                          <SelectValue placeholder="اختر القطاع" />
                        </SelectTrigger>
                        <SelectContent>
                          {sectors.map((sector) => (
                            <SelectItem key={sector} value={sector}>{sector}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">الموقع</Label>
                      <Input
                        id="location"
                        value={newFacility.location}
                        onChange={(e) => setNewFacility({...newFacility, location: e.target.value})}
                        placeholder="أدخل موقع المنشأة"
                        className="text-right"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">العنوان الكامل</Label>
                    <Textarea
                      id="address"
                      value={newFacility.address}
                      onChange={(e) => setNewFacility({...newFacility, address: e.target.value})}
                      placeholder="أدخل العنوان الكامل للمنشأة"
                      className="text-right"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">الوصف</Label>
                    <Textarea
                      id="description"
                      value={newFacility.description}
                      onChange={(e) => setNewFacility({...newFacility, description: e.target.value})}
                      placeholder="وصف موجز عن المنشأة وتخصصاتها"
                      className="text-right"
                    />
                  </div>

                  {/* Status */}
                  <div className="space-y-2">
                    <Label htmlFor="status">حالة المنشأة</Label>
                    <Select value={newFacility.status} onValueChange={(value) => setNewFacility({...newFacility, status: value})}>
                      <SelectTrigger className="text-right">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="نشطة">نشطة</SelectItem>
                        <SelectItem value="غير نشطة">غير نشطة</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Clinics Selection */}
                  <div className="space-y-3 text-right">
                    <Label className="text-sm">العيادات المتاحة</Label>
                    <div className="border rounded-lg p-4 space-y-3 max-h-48 overflow-y-auto bg-muted/30">
                      {clinicOptions.map((clinic) => (
                        <div key={clinic} className="flex items-center space-x-2 space-x-reverse">
                          <Checkbox
                            id={`new-${clinic}`}
                            checked={newFacility.clinics.includes(clinic)}
                            onCheckedChange={(checked) => handleNewFacilityClinicChange(clinic, checked === true)}
                          />
                          <Label htmlFor={`new-${clinic}`} className="text-sm cursor-pointer">
                            {clinic}
                          </Label>
                        </div>
                      ))}
                    </div>
                    {newFacility.clinics.length > 0 && (
                      <div className="text-xs text-muted-foreground text-right">
                        تم اختيار {newFacility.clinics.length} من العيادات
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Switch
                      id="active"
                      checked={newFacility.isActive}
                      onCheckedChange={(checked) => setNewFacility({...newFacility, isActive: checked})}
                    />
                    <Label htmlFor="active">منشأة نشطة</Label>
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                    إلغاء
                  </Button>
                  <Button onClick={handleAddFacility}>
                    إضافة المنشأة
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="text-right">
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                البحث والفلترة
              </CardTitle>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <Input
                placeholder="البحث بالاسم أو الرمز..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="text-right w-full md:w-80"
              />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Facilities Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="mr-2 text-muted-foreground">جاري تحميل البيانات...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredFacilities.map((facility) => (
          <Card key={facility.id} className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary/30">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="text-right flex-1">
                  <CardTitle className="text-lg mb-1">{facility.name}</CardTitle>
                  <div className="flex items-center gap-2 mb-2">
                <Badge variant={facility.status === 'نشطة' ? "default" : "secondary"}>
  {facility.status}
</Badge>
                    <span className="text-sm text-muted-foreground">{facility.code}</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedFacility(facility);
                      setIsEditMode(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-right">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{facility.location}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-right">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{facility.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-right">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{facility.email}</span>
              </div>
              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground text-right">
                  المدير: {facility.manager}
                </p>
                <p className="text-sm text-muted-foreground text-right">
                  المدير الطبي: {facility.medical_director}
                </p>
                <p className="text-sm text-muted-foreground text-right">
                  القطاع: {facility.sector}
                </p>
                {facility.clinics && facility.clinics.length > 0 && (
                  <div className="text-xs text-muted-foreground text-right mt-1">
                    العيادات: {facility.clinics.length}
                  </div>
                )}
              </div>
              <div className="flex justify-between items-center pt-2">
                <Switch
                  checked={facility.isActive}
                  onCheckedChange={() => toggleFacilityStatus(facility.id)}
                />
              </div>
            </CardContent>
          </Card>
          ))}
        </div>
      )}

      {/* Facility Details Dialog */}
      {selectedFacility && (
        <Dialog open={!!selectedFacility} onOpenChange={() => setSelectedFacility(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
            <DialogHeader className="text-right">
              <DialogTitle>
                {isEditMode ? "تعديل معلومات المنشأة" : "تفاصيل المنشأة"}
              </DialogTitle>
              <DialogDescription>
                {selectedFacility.name} - {selectedFacility.code}
              </DialogDescription>
            </DialogHeader>

            {isEditMode ? (
              // Edit Form - Single page layout identical to Add Form
              <div className="grid gap-4 py-4">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">اسم المنشأة *</Label>
                    <Input
                      id="edit-name"
                      value={selectedFacility.name}
                      onChange={(e) => setSelectedFacility({...selectedFacility, name: e.target.value})}
                      placeholder="أدخل اسم المنشأة"
                      className="text-right"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-code">رمز المنشأة *</Label>
                    <Input
                      id="edit-code"
                      value={selectedFacility.code}
                      onChange={(e) => setSelectedFacility({...selectedFacility, code: e.target.value})}
                      placeholder="مثال: KFH001"
                      className="text-right"
                    />
                  </div>
                </div>

                {/* Contact and Management Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-contact">معلومات التواصل</Label>
                    <Input
                      id="edit-contact"
                      value={selectedFacility.contact}
                      onChange={(e) => setSelectedFacility({...selectedFacility, contact: e.target.value})}
                      placeholder="رقم الهاتف أو البريد الإلكتروني"
                      className="text-right"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-phone">رقم الهاتف</Label>
                    <Input
                      id="edit-phone"
                      value={selectedFacility.phone}
                      onChange={(e) => setSelectedFacility({...selectedFacility, phone: e.target.value})}
                      placeholder="011-123-4567"
                      className="text-right"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-email">البريد الإلكتروني</Label>
                    <Input
                      id="edit-email"
                      type="email"
                      value={selectedFacility.email}
                      onChange={(e) => setSelectedFacility({...selectedFacility, email: e.target.value})}
                      placeholder="info@facility.health.sa"
                      className="text-right"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-manager">المدير</Label>
                    <Input
                      id="edit-manager"
                      value={selectedFacility.manager}
                      onChange={(e) => setSelectedFacility({...selectedFacility, manager: e.target.value})}
                      placeholder="اسم مدير المنشأة"
                      className="text-right"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-medical_director">المدير الطبي</Label>
                    <Input
                      id="edit-medical_director"
                      value={selectedFacility.medical_director}
                      onChange={(e) => setSelectedFacility({...selectedFacility, medical_director: e.target.value})}
                      placeholder="اسم المدير الطبي"
                      className="text-right"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-number">رقم المنشأة</Label>
                    <Input
                      id="edit-number"
                      value={selectedFacility.number}
                      onChange={(e) => setSelectedFacility({...selectedFacility, number: e.target.value})}
                      placeholder="رقم المنشأة"
                      className="text-right"
                    />
                  </div>
                </div>

                {/* Location Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-sector">القطاع</Label>
                    <Select value={selectedFacility.sector} onValueChange={(value) => setSelectedFacility({...selectedFacility, sector: value})}>
                      <SelectTrigger className="text-right">
                        <SelectValue placeholder="اختر القطاع" />
                      </SelectTrigger>
                      <SelectContent>
                        {sectors.map((sector) => (
                          <SelectItem key={sector} value={sector}>{sector}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-location">الموقع</Label>
                    <Input
                      id="edit-location"
                      value={selectedFacility.location}
                      onChange={(e) => setSelectedFacility({...selectedFacility, location: e.target.value})}
                      placeholder="أدخل موقع المنشأة"
                      className="text-right"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-address">العنوان الكامل</Label>
                  <Textarea
                    id="edit-address"
                    value={selectedFacility.address}
                    onChange={(e) => setSelectedFacility({...selectedFacility, address: e.target.value})}
                    placeholder="أدخل العنوان الكامل للمنشأة"
                    className="text-right"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">الوصف</Label>
                  <Textarea
                    id="edit-description"
                    value={selectedFacility.description}
                    onChange={(e) => setSelectedFacility({...selectedFacility, description: e.target.value})}
                    placeholder="وصف موجز عن المنشأة وتخصصاتها"
                    className="text-right"
                  />
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <Label htmlFor="edit-status">حالة المنشأة</Label>
                  <Select value={selectedFacility.status} onValueChange={(value) => setSelectedFacility({...selectedFacility, status: value})}>
                    <SelectTrigger className="text-right">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="نشطة">نشطة</SelectItem>
                      <SelectItem value="غير نشطة">غير نشطة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Clinics Selection */}
                <div className="space-y-3 text-right">
                  <Label className="text-sm">العيادات المتاحة</Label>
                  <div className="border rounded-lg p-4 space-y-3 max-h-48 overflow-y-auto bg-muted/30">
                    {clinicOptions.map((clinic) => (
                      <div key={clinic} className="flex items-center space-x-2 space-x-reverse">
                        <Checkbox
                          id={`edit-${clinic}`}
                          checked={selectedFacility.clinics && selectedFacility.clinics.includes(clinic)}
                          onCheckedChange={(checked) => handleEditFacilityClinicChange(clinic, checked === true)}
                        />
                        <Label htmlFor={`edit-${clinic}`} className="text-sm cursor-pointer">
                          {clinic}
                        </Label>
                      </div>
                    ))}
                  </div>
                  {selectedFacility.clinics && selectedFacility.clinics.length > 0 && (
                    <div className="text-xs text-muted-foreground text-right">
                      تم اختيار {selectedFacility.clinics.length} من العيادات
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // View Mode - Tabbed layout
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">المعلومات الأساسية</TabsTrigger>
                  <TabsTrigger value="contact">معلومات الاتصال</TabsTrigger>
                  <TabsTrigger value="clinics">العيادات</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>اسم المنشأة</Label>
                      <p className="text-right p-2 bg-muted rounded">{selectedFacility.name}</p>
                    </div>
                    <div className="space-y-2">
                      <Label>رمز المنشأة</Label>
                      <p className="text-right p-2 bg-muted rounded">{selectedFacility.code}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>رقم المنشأة</Label>
                      <p className="text-right p-2 bg-muted rounded">{selectedFacility.number}</p>
                    </div>
                    <div className="space-y-2">
                      <Label>القطاع</Label>
                      <p className="text-right p-2 bg-muted rounded">{selectedFacility.sector}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>الموقع</Label>
                    <p className="text-right p-2 bg-muted rounded">{selectedFacility.location}</p>
                  </div>

                  <div className="space-y-2">
                    <Label>العنوان الكامل</Label>
                    <p className="text-right p-2 bg-muted rounded">{selectedFacility.address}</p>
                  </div>
                  <div className="space-y-2">
                    <Label>الوصف</Label>
                    <p className="text-right p-2 bg-muted rounded">{selectedFacility.description}</p>
                  </div>

                  <div className="space-y-2">
                    <Label>حالة المنشأة</Label>
                    <Badge variant={selectedFacility.status === 'نشطة' ? "default" : "secondary"}>
                      {selectedFacility.status}
                    </Badge>
                  </div>
                </TabsContent>

                <TabsContent value="contact" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>رقم الهاتف</Label>
                      <p className="text-right p-2 bg-muted rounded">{selectedFacility.phone}</p>
                    </div>
                    <div className="space-y-2">
                      <Label>البريد الإلكتروني</Label>
                      <p className="text-right p-2 bg-muted rounded">{selectedFacility.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>معلومات التواصل</Label>
                      <p className="text-right p-2 bg-muted rounded">{selectedFacility.contact}</p>
                    </div>
                    <div className="space-y-2">
                      <Label>المدير المسؤول</Label>
                      <p className="text-right p-2 bg-muted rounded">{selectedFacility.manager}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>المدير الطبي</Label>
                    <p className="text-right p-2 bg-muted rounded">{selectedFacility.medical_director}</p>
                  </div>
                </TabsContent>

                <TabsContent value="clinics" className="space-y-4">
                  <div className="space-y-3 text-right">
                    <Label className="text-sm">العيادات المتاحة</Label>
                    <div className="border rounded-lg p-4 bg-muted/30">
                      {selectedFacility.clinics && selectedFacility.clinics.length > 0 ? (
                        <div className="space-y-2">
                          {selectedFacility.clinics.map((clinic, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm">
                              <div className="w-2 h-2 bg-primary rounded-full"></div>
                              <span>{clinic}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-center">لم يتم تحديد عيادات لهذه المنشأة</p>
                      )}
                    </div>
                    {selectedFacility.clinics && selectedFacility.clinics.length > 0 && (
                      <div className="text-xs text-muted-foreground text-right">
                        إجمالي العيادات: {selectedFacility.clinics.length}
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t">
              {isEditMode ? (
                <>
                  <Button variant="outline" onClick={() => setIsEditMode(false)}>
                    إلغاء
                  </Button>
                  <Button onClick={handleUpdateFacility}>
                    حفظ التغييرات
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={() => setSelectedFacility(null)}>
                    إغلاق
                  </Button>
                  <Button onClick={() => setIsEditMode(true)}>
                    تعديل
                  </Button>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-right">
                <p className="text-sm text-green-600">المنشآت النشطة</p>
                <p className="text-2xl font-bold text-green-700">
                  {stats.active}
                </p>
              </div>
              <Building2 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-right">
                <p className="text-sm text-red-600">المنشآت غير النشطة</p>
                <p className="text-2xl font-bold text-red-700">
                  {stats.inactive}
                </p>
              </div>
              <Settings className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-right">
                <p className="text-sm text-blue-600">إجمالي المنشآت</p>
                <p className="text-2xl font-bold text-blue-700">{stats.total}</p>
              </div>
              <Building2 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-right">
                <p className="text-sm text-purple-600">نسبة التفعيل</p>
                <p className="text-2xl font-bold text-purple-700">
                  {stats.activationPercentage}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
