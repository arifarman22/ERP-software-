"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Trash2, Plus } from "lucide-react";

type Dealer = { id: string; companyName: string; dealerCode: string };
type Product = { id: string; name: string; sku: string; basePrice: number };
type InventoryItem = { id: string; productId: string; quantity: number; costPerUnit: number; warehouse: { name: string } };

type OrderItem = {
  productId: string;
  inventoryItemId: string;
  quantity: number;
  unitPrice: number;
};

export default function NewSalePage() {
  const router = useRouter();
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [dealerId, setDealerId] = useState("");
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<OrderItem[]>([{ productId: "", inventoryItemId: "", quantity: 0, unitPrice: 0 }]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/inventory/products").then((r) => r.json()),
      fetch("/api/inventory/warehouses").then((r) => r.json()),
      fetch("/api/inventory").then((r) => r.json()),
    ]).then(([p, _w, inv]) => {
      setProducts(p.data || []);
      setInventory((inv.data || []).map((i: any) => ({ ...i, quantity: Number(i.quantity), costPerUnit: Number(i.costPerUnit) })));
    });
    // Fetch dealers
    fetch("/api/sales?_dealers=1").catch(() => {});
    // Simple dealer fetch via a dedicated endpoint or inline
    fetch("/api/inventory/products").then((r) => r.json()).then(() => {
      // Use a mock for now — in production, fetch from /api/dealers
    });
  }, []);

  // For demo, load dealers from a simple fetch
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/dealers");
        if (res.ok) { const json = await res.json(); setDealers(json.data || []); }
      } catch { /* dealers endpoint may not exist yet */ }
    })();
  }, []);

  function addItem() {
    setItems([...items, { productId: "", inventoryItemId: "", quantity: 0, unitPrice: 0 }]);
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index));
  }

  function updateItem(index: number, field: keyof OrderItem, value: string | number) {
    const updated = [...items];
    (updated[index] as any)[field] = value;

    // Auto-fill price when product selected
    if (field === "productId") {
      const product = products.find((p) => p.id === value);
      if (product) updated[index].unitPrice = Number(product.basePrice);
    }

    setItems(updated);
  }

  const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const netAmount = totalAmount - discount;

  async function handleSubmit() {
    setError("");
    if (!dealerId) { setError("Select a dealer"); return; }
    if (items.some((i) => !i.productId || !i.inventoryItemId || i.quantity <= 0)) {
      setError("Complete all item fields"); return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dealerId, discount, notes, items }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error); return; }
      router.push("/sales");
    } catch {
      setError("Failed to create order");
    } finally {
      setSubmitting(false);
    }
  }

  function getAvailableInventory(productId: string) {
    return inventory.filter((i) => i.productId === productId && i.quantity > 0);
  }

  return (
    <>
      <PageHeader title="Create Sale Order" description="Add items and assign to a dealer" />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {error && <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">{error}</div>}

          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Dealer *</Label>
                  <Select onValueChange={setDealerId}>
                    <SelectTrigger><SelectValue placeholder="Select dealer" /></SelectTrigger>
                    <SelectContent>
                      {dealers.map((d) => <SelectItem key={d.id} value={d.id}>{d.companyName} ({d.dealerCode})</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Discount (₹)</Label>
                  <Input type="number" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional order notes" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Order Items</Label>
                <Button variant="outline" size="sm" onClick={addItem}><Plus className="h-3 w-3 mr-1" /> Add Item</Button>
              </div>

              {items.map((item, index) => (
                <div key={index} className="grid gap-3 md:grid-cols-5 items-end p-3 rounded-lg border bg-muted/30">
                  <div className="space-y-1">
                    <Label className="text-xs">Product</Label>
                    <Select value={item.productId} onValueChange={(v) => updateItem(index, "productId", v)}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Product" /></SelectTrigger>
                      <SelectContent>
                        {products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Warehouse/Batch</Label>
                    <Select value={item.inventoryItemId} onValueChange={(v) => updateItem(index, "inventoryItemId", v)}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Source" /></SelectTrigger>
                      <SelectContent>
                        {getAvailableInventory(item.productId).map((inv) => (
                          <SelectItem key={inv.id} value={inv.id}>{inv.warehouse.name} ({inv.quantity} kg)</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Qty (kg)</Label>
                    <Input type="number" step="0.01" className="h-8 text-xs" value={item.quantity || ""} onChange={(e) => updateItem(index, "quantity", Number(e.target.value))} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Price/kg (₹)</Label>
                    <Input type="number" step="0.01" className="h-8 text-xs" value={item.unitPrice || ""} onChange={(e) => updateItem(index, "unitPrice", Number(e.target.value))} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">₹{(item.quantity * item.unitPrice).toLocaleString()}</span>
                    {items.length > 1 && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeItem(index)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div>
          <Card className="sticky top-20">
            <CardContent className="p-4 space-y-3">
              <h3 className="font-semibold">Order Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>₹{totalAmount.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span>-₹{discount.toLocaleString()}</span></div>
                <div className="flex justify-between border-t pt-2 font-semibold text-base"><span>Net Total</span><span>₹{netAmount.toLocaleString()}</span></div>
                <p className="text-xs text-muted-foreground">Tax will be calculated on invoice generation</p>
              </div>
              <Button className="w-full" onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Creating..." : "Create Order"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
