"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";

type AlertItem = {
  id: string;
  productName: string;
  sku: string;
  warehouseName: string;
  quantity: number;
  minStock: number;
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);

  useEffect(() => {
    fetch("/api/inventory/alerts")
      .then((r) => r.json())
      .then((json) => setAlerts(json.data || []));
  }, []);

  function getSeverity(qty: number, min: number) {
    const ratio = qty / min;
    if (ratio === 0) return { label: "Out of Stock", variant: "destructive" as const };
    if (ratio <= 0.25) return { label: "Critical", variant: "destructive" as const };
    if (ratio <= 0.5) return { label: "Low", variant: "outline" as const };
    return { label: "Warning", variant: "secondary" as const };
  }

  return (
    <>
      <PageHeader title="Low Stock Alerts" description={`${alerts.length} items below minimum stock level`} />

      {alerts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-3">
              <AlertTriangle className="h-6 w-6 text-green-600" />
            </div>
            <p className="font-medium">All stock levels are healthy</p>
            <p className="text-sm text-muted-foreground">No items below minimum threshold</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {alerts.map((item) => {
            const severity = getSeverity(Number(item.quantity), Number(item.minStock));
            const percentage = Math.round((Number(item.quantity) / Number(item.minStock)) * 100);
            return (
              <Card key={item.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{item.productName}</p>
                      <span className="text-xs text-muted-foreground font-mono">{item.sku}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{item.warehouseName}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm">
                      <span className="font-semibold text-destructive">{Number(item.quantity)}</span>
                      <span className="text-muted-foreground"> / {Number(item.minStock)} kg</span>
                    </p>
                    <div className="w-24 h-2 rounded-full bg-secondary mt-1 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-destructive transition-all"
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                  <Badge variant={severity.variant}>{severity.label}</Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
