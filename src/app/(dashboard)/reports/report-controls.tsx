"use client";

import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Download, FileText } from "lucide-react";

type ReportControlsProps = {
  period: string;
  onPeriodChange: (p: string) => void;
  reportType: string;
};

export function ReportControls({ period, onPeriodChange, reportType }: ReportControlsProps) {
  function exportCSV() {
    window.open(`/api/reports/export?type=${reportType}&format=csv&period=${period}`, "_blank");
  }
  function exportPDF() {
    window.open(`/api/reports/export?type=${reportType}&format=pdf&period=${period}`, "_blank");
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={period} onValueChange={onPeriodChange}>
        <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="7d">Last 7 days</SelectItem>
          <SelectItem value="30d">Last 30 days</SelectItem>
          <SelectItem value="90d">Last 90 days</SelectItem>
          <SelectItem value="1y">Last year</SelectItem>
        </SelectContent>
      </Select>
      <Button variant="outline" size="sm" onClick={exportCSV}><Download className="h-4 w-4 mr-1" /> Excel</Button>
      <Button variant="outline" size="sm" onClick={exportPDF}><FileText className="h-4 w-4 mr-1" /> PDF</Button>
    </div>
  );
}
