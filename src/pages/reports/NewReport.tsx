import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileText, Calendar, User, Building2, CheckCircle, Info, Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { reportsApi } from '@/lib/api';

const reportTypes = [
  { value: 'عدوى مكتسبة من المستشفى', label: 'عدوى مكتسبة من المستشفى' },
  { value: 'خطأ دوائي', label: 'خطأ دوائي' },
  { value: 'سقوط مريض', label: 'سقوط مريض' },
  { value: 'عطل في المعدات', label: 'عطل في المعدات' },
  { value: 'خطأ في الإجراء', label: 'خطأ في الإجراء' },
  { value: 'أخرى', label: 'أخرى' }
];

const severityLevels = [
  { value: 'low', label: 'منخفض', color: 'bg-green-100 text-green-800' },
  { value: 'medium', label: 'متوسط', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'high', label: 'عالي', color: 'bg-red-100 text-red-800' },
  { value: 'critical', label: 'حرج', color: 'bg-red-600 text-white' }
];

export default function NewReport() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [facilitiesLoading, setFacilitiesLoading] = useState(true);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    type: '',
    description: '',
    location: '',
    severity: '',
    reporterName: '',
    reporterPosition: '',
    reporterDepartment: '',
    incidentDate: '',
    incidentTime: '',
    witnessName: '',
    witnessContact: '',
    immediateAction: '',
    additionalNotes: ''
  });

  const [selectedFacility, setSelectedFacility] = useState('');

  // Load facilities on component mount
  useEffect(() => {
    const loadFacilities = async () => {
      try {
        const response = await reportsApi.getFacilities();
        if (response.success) {
          setFacilities(response.data || []);
        } else {
          toast({
            title: "خطأ في تحميل المنشآت",
            description: response.message,
            variant: "destructive"
          });
        }
      } catch (error: any) {
        toast({
          title: "خطأ في تحميل المنشآت",
          description: error.message || "فشل في تحميل قائمة المنشآت",
          variant: "destructive"
        });
      } finally {
        setFacilitiesLoading(false);
      }
    };

    loadFacilities();
  }, [toast]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.type || !formData.description || !selectedFacility) {
      toast({
        title: "خطأ في البيانات",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const reportData = {
        facility_id: selectedFacility,
        title: formData.title,
        type: formData.type,
        description: formData.description,
        location: formData.location,
        severity: formData.severity,
        reporter_name: formData.reporterName,
        reporter_position: formData.reporterPosition,
        reporter_department: formData.reporterDepartment,
        incident_date: formData.incidentDate,
        incident_time: formData.incidentTime,
        witness_name: formData.witnessName,
        witness_contact: formData.witnessContact,
        immediate_action: formData.immediateAction,
        additional_notes: formData.additionalNotes
      };

      const response = await reportsApi.createReport(reportData);

      if (response.success) {
        toast({
          title: "تم إنشاء البلاغ بنجاح",
          description: "سيتم مراجعة البلاغ من قبل الفريق المختص",
        });

        // Reset form
        setFormData({
          title: '',
          type: '',
          description: '',
          location: '',
          severity: '',
          reporterName: '',
          reporterPosition: '',
          reporterDepartment: '',
          incidentDate: '',
          incidentTime: '',
          witnessName: '',
          witnessContact: '',
          immediateAction: '',
          additionalNotes: ''
        });
        setSelectedFacility('');
      } else {
        toast({
          title: "خطأ في إنشاء البلاغ",
          description: response.message,
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "خطأ في إنشاء البلاغ",
        description: error.message || "فشل في إرسال البلاغ",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background rounded-lg p-6 border border-primary/20">
        <div className="text-right">
          <h1 className="text-3xl font-bold text-primary mb-2">إنشاء بلاغ جديد</h1>
          <p className="text-muted-foreground">
            قم بتعبئة النموذج أدناه لإنشاء بلاغ حادثة أو مشكلة في المنشأة الصحية
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-right">
              <FileText className="h-5 w-5" />
              المعلومات الأساسية
            </CardTitle>
            <CardDescription className="text-right">
              معلومات عامة حول البلاغ والحادثة
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="facility">المنشأة الصحية *</Label>
              {facilitiesLoading ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="mr-2">جاري تحميل المنشآت...</span>
                </div>
              ) : (
                <Select value={selectedFacility} onValueChange={setSelectedFacility}>
                  <SelectTrigger className="text-right">
                    <SelectValue placeholder="اختر المنشأة الصحية" />
                  </SelectTrigger>
                  <SelectContent>
                    {facilities.map((facility) => (
                      <SelectItem key={facility.id} value={facility.id.toString()}>
                        {facility.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <Alert className="bg-blue-50 border-blue-200">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-right text-blue-800">
                <strong>ملاحظة:</strong> سيتم تعبئة رمز المنشأة ومعلومات التواصل ومعلومات المدير تلقائياً بناءً على اختيارك للمنشأة أعلاه
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">عنوان البلاغ *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="عنوان مختصر للبلاغ"
                  className="text-right"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">نوع البلاغ *</Label>
                <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                  <SelectTrigger className="text-right">
                    <SelectValue placeholder="اختر نوع البلاغ" />
                  </SelectTrigger>
                  <SelectContent>
                    {reportTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">موقع الحادثة</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="قسم، غرفة، أو موقع محدد"
                  className="text-right"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="severity">مستوى الخطورة</Label>
                <Select value={formData.severity} onValueChange={(value) => handleInputChange('severity', value)}>
                  <SelectTrigger className="text-right">
                    <SelectValue placeholder="اختر مستوى الخطورة" />
                  </SelectTrigger>
                  <SelectContent>
                    {severityLevels.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        <div className="flex items-center gap-2">
                          <Badge className={level.color}>{level.label}</Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">وصف الحادثة *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="وصف مفصل للحادثة أو المشكلة المبلغ عنها..."
                className="text-right min-h-[120px]"
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Reporter Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-right">
              <User className="h-5 w-5" />
              معلومات المبلغ
            </CardTitle>
            <CardDescription className="text-right">
              معلومات الشخص الذي يقوم بالإبلاغ
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reporterName">اسم المبلغ</Label>
                <Input
                  id="reporterName"
                  value={formData.reporterName}
                  onChange={(e) => handleInputChange('reporterName', e.target.value)}
                  placeholder="الاسم الكامل للمبلغ"
                  className="text-right"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reporterPosition">المنصب/الوظيفة</Label>
                <Input
                  id="reporterPosition"
                  value={formData.reporterPosition}
                  onChange={(e) => handleInputChange('reporterPosition', e.target.value)}
                  placeholder="المنصب أو الوظيفة"
                  className="text-right"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reporterDepartment">القسم/الإدارة</Label>
              <Input
                id="reporterDepartment"
                value={formData.reporterDepartment}
                onChange={(e) => handleInputChange('reporterDepartment', e.target.value)}
                placeholder="القسم أو الإدارة التي يعمل بها المبلغ"
                className="text-right"
              />
            </div>
          </CardContent>
        </Card>

        {/* Incident Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-right">
              <Calendar className="h-5 w-5" />
              تفاصيل الحادثة
            </CardTitle>
            <CardDescription className="text-right">
              معلومات زمنية وإضافية حول الحادثة
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="incidentDate">تاريخ الحادثة</Label>
                <Input
                  id="incidentDate"
                  type="date"
                  value={formData.incidentDate}
                  onChange={(e) => handleInputChange('incidentDate', e.target.value)}
                  className="text-right"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="incidentTime">وقت الحادثة</Label>
                <Input
                  id="incidentTime"
                  type="time"
                  value={formData.incidentTime}
                  onChange={(e) => handleInputChange('incidentTime', e.target.value)}
                  className="text-right"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="witnessName">اسم الشاهد (إن وجد)</Label>
                <Input
                  id="witnessName"
                  value={formData.witnessName}
                  onChange={(e) => handleInputChange('witnessName', e.target.value)}
                  placeholder="اسم شاهد على الحادثة"
                  className="text-right"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="witnessContact">رقم التواصل للشاهد</Label>
                <Input
                  id="witnessContact"
                  value={formData.witnessContact}
                  onChange={(e) => handleInputChange('witnessContact', e.target.value)}
                  placeholder="رقم جوال أو هاتف للتواصل"
                  className="text-right"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="immediateAction">الإجراء المتخذ فوراً</Label>
              <Textarea
                id="immediateAction"
                value={formData.immediateAction}
                onChange={(e) => handleInputChange('immediateAction', e.target.value)}
                placeholder="وصف أي إجراءات تم اتخاذها فور وقوع الحادثة..."
                className="text-right"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="additionalNotes">ملاحظات إضافية</Label>
              <Textarea
                id="additionalNotes"
                value={formData.additionalNotes}
                onChange={(e) => handleInputChange('additionalNotes', e.target.value)}
                placeholder="أي معلومات أو ملاحظات إضافية مهمة..."
                className="text-right"
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => window.history.back()}>
            إلغاء
          </Button>
          <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                جاري الإرسال...
              </>
            ) : (
              <>
                <CheckCircle className="ml-2 h-4 w-4" />
                إرسال البلاغ
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
