"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ScanLine, Search } from "lucide-react";

type ProductResult = {
  id: string;
  name: string;
  sku: string;
  category: string;
  basePrice: number;
  inventoryItems: { quantity: number; warehouse: { name: string } }[];
};

export function BarcodeScanner() {
  const [barcode, setBarcode] = useState("");
  const [result, setResult] = useState<ProductResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus for hardware scanner input
  useEffect(() => { inputRef.current?.focus(); }, []);

  // Listen for rapid keystrokes (hardware barcode scanner behavior)
  useEffect(() => {
    let buffer = "";
    let timeout: NodeJS.Timeout;

    function handleKeyPress(e: KeyboardEvent) {
      if (document.activeElement !== inputRef.current) return;
      if (e.key === "Enter" && buffer.length >= 8) {
        setBarcode(buffer);
        handleLookup(buffer);
        buffer = "";
        return;
      }
      buffer += e.key;
      clearTimeout(timeout);
      timeout = setTimeout(() => { buffer = ""; }, 100);
    }

    window.addEventListener("keypress", handleKeyPress);
    return () => window.removeEventListener("keypress", handleKeyPress);
  }, []);

  async function handleLookup(code?: string) {
    const searchCode = code || barcode;
    if (!searchCode) return;
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch(`/api/inventory/barcode?code=${encodeURIComponent(searchCode)}`);
      const json = await res.json();
      if (!res.ok) { setError(json.error || "Not found"); return; }
      setResult(json.data);
    } catch {
      setError("Lookup failed");
    } finally {
      setLoading(false);
    }
  }

  const totalStock = result?.inventoryItems.reduce((sum, i) => sum + Number(i.quantity), 0) ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 p-4 rounded-lg border-2 border-dashed border-primary/30 bg-primary/5">
        <ScanLine className="h-5 w-5 text-primary animate-pulse" />
        <p className="text-sm text-muted-foreground">Scan barcode or enter SKU manually</p>
      </div>

      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            ref={inputRef}
            value={barcode}
            onChange={(e) => setBarcode(e.target.value.toUpperCase())}
            placeholder="Scan or type barcode/SKU..."
            onKeyDown={(e) => e.key === "Enter" && handleLookup()}
            className="font-mono"
          />
        </div>
        <Button onClick={() => handleLookup()} disabled={loading || !barcode}>
          <Search className="h-4 w-4" />
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {result && (
        <div className="space-y-3 p-4 rounded-lg border bg-card">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-lg">{result.name}</h3>
              <p className="text-sm text-muted-foreground font-mono">{result.sku}</p>
            </div>
            <Badge>{result.category}</Badge>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <Label className="text-muted-foreground">Base Price</Label>
              <p className="font-medium">₹{Number(result.basePrice).toFixed(2)}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Total Stock</Label>
              <p className="font-medium">{totalStock.toFixed(1)} kg</p>
            </div>
          </div>

          {result.inventoryItems.length > 0 && (
            <div className="space-y-1">
              <Label className="text-muted-foreground">Stock by Warehouse</Label>
              {result.inventoryItems.map((item, i) => (
                <div key={i} className="flex justify-between text-sm py-1 border-b last:border-0">
                  <span>{item.warehouse.name}</span>
                  <span className="font-medium">{Number(item.quantity).toFixed(1)} kg</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
