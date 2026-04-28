import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  FileText,
  Download,
  FileSpreadsheet,
  BarChart3,
  PieChart,
  TrendingUp,
  Package,
  ShoppingCart,
  DollarSign,
  Users,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import api from '@/services/api';
import toast from 'react-hot-toast';

type ReportType =
  | 'ordenes'
  | 'inventario'
  | 'stock_alertas'
  | 'ventas'
  | 'clientes'
  | 'rentabilidad'
  | 'ventas_categoria'
  | 'comportamiento';

interface ReportOption {
  id: ReportType;
  label: string;
  description: string;
  icon: React.ElementType;
  category: 'operational' | 'management';
}

const reportOptions: ReportOption[] = [
  {
    id: 'ordenes',
    label: 'Reporte de Órdenes',
    description: 'Lista completa de órdenes del período seleccionado',
    icon: ShoppingCart,
    category: 'operational',
  },
  {
    id: 'inventario',
    label: 'Reporte de Inventario',
    description: 'Estado actual del inventario con stock disponible',
    icon: Package,
    category: 'operational',
  },
  {
    id: 'stock_alertas',
    label: 'Alertas de Stock',
    description: 'Productos con stock bajo o agotado',
    icon: AlertTriangle,
    category: 'operational',
  },
  {
    id: 'ventas',
    label: 'Reporte de Ventas',
    description: 'Resumen de ventas por período',
    icon: DollarSign,
    category: 'operational',
  },
  {
    id: 'clientes',
    label: 'Reporte de Clientes',
    description: 'Lista de clientes con historial de compras',
    icon: Users,
    category: 'operational',
  },
  {
    id: 'rentabilidad',
    label: 'Análisis de Rentabilidad',
    description: 'Margen de ganancia por producto y categoría',
    icon: TrendingUp,
    category: 'management',
  },
  {
    id: 'ventas_categoria',
    label: 'Ventas por Categoría',
    description: 'Desglose de ventas por categoría de producto',
    icon: BarChart3,
    category: 'management',
  },
  {
    id: 'comportamiento',
    label: 'Comportamiento del Cliente',
    description: 'Análisis RFM y segmentación de clientes',
    icon: PieChart,
    category: 'management',
  },
];

function generateClientSidePDF(reportType: ReportType, data: any) {
  import('jspdf').then(({ jsPDF }) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(18);
    doc.setTextColor(33, 33, 33);
    doc.text('Reporte', pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Tipo: ${reportType}`, pageWidth / 2, 30, { align: 'center' });
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-MX')}`, pageWidth / 2, 36, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(33, 33, 33);

    let yPos = 50;
    const leftMargin = 20;
    const lineHeight = 8;

    switch (reportType) {
      case 'ordenes':
        doc.text('Número', leftMargin, yPos);
        doc.text('Cliente', leftMargin + 30, yPos);
        doc.text('Total', leftMargin + 80, yPos);
        doc.text('Estado', leftMargin + 110, yPos);
        yPos += lineHeight;

        data?.forEach((orden: any) => {
          doc.text(orden.numero || '', leftMargin, yPos);
          doc.text((orden.cliente || '').substring(0, 25), leftMargin + 30, yPos);
          const totalValue = Number(orden.total) || 0;
          doc.text(`$${totalValue.toFixed(2)}`, leftMargin + 80, yPos);
          doc.text(orden.estado || '', leftMargin + 110, yPos);
          yPos += lineHeight;

          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }
        });
        break;

      case 'inventario':
        doc.text('Producto', leftMargin, yPos);
        doc.text('SKU', leftMargin + 70, yPos);
        doc.text('Stock', leftMargin + 110, yPos);
        doc.text('Estado', leftMargin + 130, yPos);
        yPos += lineHeight;

        data?.forEach((item: any) => {
          doc.text((item.nombre || '').substring(0, 35), leftMargin, yPos);
          doc.text(item.sku || '', leftMargin + 70, yPos);
          doc.text(String(item.stock || 0), leftMargin + 110, yPos);
          doc.text(item.estado || '', leftMargin + 130, yPos);
          yPos += lineHeight;

          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }
        });
        break;

      default:
        doc.text('Reporte generado exitosamente', leftMargin, yPos);
    }

    doc.save(`reporte_${reportType}_${Date.now()}.pdf`);
  });
}

export default function Reportes() {
  const [reportType, setReportType] = useState<ReportType | ''>('');
  const [dateRange, setDateRange] = useState<{ desde: string; hasta: string }>({
    desde: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    hasta: new Date().toISOString().split('T')[0],
  });
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<'operational' | 'management' | 'all'>('all');

  const generateReportMutation = useMutation({
    mutationFn: async () => {
      if (!reportType) throw new Error('Selecciona un tipo de reporte');

      const selectedReport = reportOptions.find((r) => r.id === reportType);
      if (!selectedReport) throw new Error('Reporte no válido');

      const endpoint = `/reportes/${reportType}`;
      const params = dateRange;

      if (selectedReport.category === 'management') {
        const response = await api.get(endpoint, { params });
        return response.data?.data ?? response.data;
      } else {
        const response = await api.get(endpoint, { params });
        return response.data?.data ?? response.data;
      }
    },
    onSuccess: (data) => {
      const selectedReport = reportOptions.find((r) => r.id === reportType);
      if (!selectedReport) return;

      setPreviewData(data);
      setPreviewOpen(true);
      toast.success('Reporte cargado — revisa la vista previa');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al generar el reporte');
    },
  });

  const handleDownload = async (format: 'pdf' | 'preview') => {
    if (!reportType) return;

    if (format === 'pdf') {
      try {
        const selectedReport = reportOptions.find((r) => r.id === reportType);
        if (!selectedReport) return;

        const endpoint = `/reportes/${reportType}/pdf`;
        const response = await api.get(endpoint, {
          params: dateRange,
          responseType: 'blob',
        });

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `reporte_${reportType}_${Date.now()}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        toast.success('PDF descargado exitosamente');
      } catch (error) {
        toast.error('Error al descargar el PDF');
      }
    } else {
      setPreviewOpen(true);
    }
  };

  const filteredReports = reportOptions.filter((r) =>
    selectedCategory === 'all' ? true : r.category === selectedCategory
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reportes</h1>
        <p className="text-muted-foreground">Genera reportes operativos y de gestión</p>
      </div>

      <div className="flex gap-2">
        <Button
          variant={selectedCategory === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedCategory('all')}
        >
          Todos
        </Button>
        <Button
          variant={selectedCategory === 'operational' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedCategory('operational')}
        >
          Operativos
        </Button>
        <Button
          variant={selectedCategory === 'management' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedCategory('management')}
        >
          Gestión
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredReports.map((report) => {
          const Icon = report.icon;
          return (
            <Card
              key={report.id}
              className={`cursor-pointer transition-colors ${
                reportType === report.id ? 'border-primary bg-primary/5' : ''
              }`}
              onClick={() => setReportType(report.id)}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{report.label}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {report.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuración del Reporte</CardTitle>
          <CardDescription>
            Selecciona el tipo de reporte y el período de tiempo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Fecha Desde</label>
              <Input
                type="date"
                value={dateRange.desde}
                onChange={(e) => setDateRange({ ...dateRange, desde: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Fecha Hasta</label>
              <Input
                type="date"
                value={dateRange.hasta}
                onChange={(e) => setDateRange({ ...dateRange, hasta: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Reporte</label>
              <Select
                value={reportType}
                onValueChange={(v) => setReportType(v as ReportType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {filteredReports.map((report) => (
                    <SelectItem key={report.id} value={report.id}>
                      {report.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => generateReportMutation.mutate()}
              disabled={!reportType || generateReportMutation.isPending}
            >
              <FileText className="mr-2 h-4 w-4" />
              {generateReportMutation.isPending ? 'Generando...' : 'Generar Reporte'}
            </Button>
            {previewData && (
              <>
                <Button variant="outline" onClick={() => handleDownload('preview')}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Vista Previa
                </Button>
                <Button variant="outline" onClick={() => handleDownload('pdf')}>
                  <Download className="mr-2 h-4 w-4" />
                  Descargar PDF
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Vista Previa del Reporte</DialogTitle>
            <DialogDescription>
              {reportOptions.find((r) => r.id === reportType)?.label}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            {previewData ? (
              <div className="bg-white dark:bg-gray-900 rounded-lg border p-4">
                {Array.isArray(previewData) && previewData.length > 0 ? (
                  <>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          {Object.keys(previewData[0] || {}).map((key) => (
                            <th key={key} className="text-left py-2 px-3 font-medium capitalize">
                              {key.replace(/_/g, ' ')}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.slice(0, 50).map((row: any, idx: number) => (
                          <tr key={idx} className="border-b hover:bg-muted/30">
                            {Object.values(row).map((val: any, vidx: number) => (
                              <td key={vidx} className="py-2 px-3 text-xs">
                                {typeof val === 'object' && val !== null ? JSON.stringify(val) : String(val ?? '-')}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {previewData.length > 50 && (
                      <p className="text-sm text-muted-foreground text-center py-2">
                        Mostrando 50 de {previewData.length} registros
                      </p>
                    )}
                  </>
                ) : Array.isArray(previewData) && previewData.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No hay datos en este período</p>
                ) : (
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify(previewData, null, 2)}
                  </pre>
                )}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No hay datos para mostrar
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
