"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useModal } from "@/components/dashboard/modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";

type Recipe = {
  id: string; name: string; code: string; description: string | null; targetYield: number;
  outputProduct: { name: string; sku: string };
  ingredients: { id: string; percentage: number; rawMaterial: { name: string; code: string; unit: string } }[];
};

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const { openModal } = useModal();

  async function fetchRecipes() {
    const res = await fetch("/api/production/recipes");
    const json = await res.json();
    setRecipes(json.data || []);
  }

  useEffect(() => { fetchRecipes(); }, []);

  return (
    <>
      <PageHeader title="Blend Recipes" description="Define tea blending formulas with ingredient ratios">
        <Button size="sm" onClick={() => openModal({ title: "Create Blend Recipe", size: "lg", content: <RecipeForm onSuccess={fetchRecipes} /> })}>New Recipe</Button>
      </PageHeader>

      {recipes.length === 0 ? (
        <p className="text-center text-muted-foreground py-10">No recipes defined yet.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {recipes.map((recipe) => (
            <Card key={recipe.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{recipe.name}</CardTitle>
                  <Badge variant="outline" className="font-mono">{recipe.code}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">Output: {recipe.outputProduct.name} • Target Yield: {Number(recipe.targetYield)}%</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {recipe.ingredients.map((ing) => (
                    <div key={ing.id} className="flex items-center justify-between text-sm">
                      <span>{ing.rawMaterial.name} <span className="text-muted-foreground">({ing.rawMaterial.code})</span></span>
                      <Badge variant="secondary">{Number(ing.percentage)}%</Badge>
                    </div>
                  ))}
                </div>
                {/* Visual bar */}
                <div className="flex h-3 rounded-full overflow-hidden mt-3">
                  {recipe.ingredients.map((ing, i) => (
                    <div key={ing.id} style={{ width: `${Number(ing.percentage)}%` }} className={`${["bg-green-500", "bg-blue-500", "bg-amber-500", "bg-purple-500", "bg-pink-500"][i % 5]}`} />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

function RecipeForm({ onSuccess }: { onSuccess: () => void }) {
  const [error, setError] = useState("");
  const [products, setProducts] = useState<{ id: string; name: string }[]>([]);
  const [materials, setMaterials] = useState<{ id: string; name: string }[]>([]);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [productId, setProductId] = useState("");
  const [targetYield, setTargetYield] = useState(95);
  const [ingredients, setIngredients] = useState<{ rawMaterialId: string; percentage: number }[]>([{ rawMaterialId: "", percentage: 0 }]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/inventory/products").then((r) => r.json()),
      fetch("/api/production/raw-materials").then((r) => r.json()),
    ]).then(([p, m]) => {
      setProducts((p.data || []).map((x: any) => ({ id: x.id, name: x.name })));
      setMaterials((m.data || []).map((x: any) => ({ id: x.id, name: `${x.name} (${x.code})` })));
    });
  }, []);

  const totalPct = ingredients.reduce((sum, i) => sum + i.percentage, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const res = await fetch("/api/production/recipes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, code, outputProductId: productId, targetYield, ingredients }),
    });
    const json = await res.json();
    setSubmitting(false);
    if (!res.ok) { setError(json.error); return; }
    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2"><Label>Recipe Name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div className="space-y-2"><Label>Code *</Label><Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="e.g. BLD-PREM-001" /></div>
        <div className="space-y-2">
          <Label>Output Product *</Label>
          <Select onValueChange={setProductId}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select>
        </div>
        <div className="space-y-2"><Label>Target Yield (%)</Label><Input type="number" value={targetYield} onChange={(e) => setTargetYield(Number(e.target.value))} /></div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Ingredients <span className={totalPct === 100 ? "text-green-600" : "text-destructive"}>({totalPct}%)</span></Label>
          <Button type="button" variant="outline" size="sm" onClick={() => setIngredients([...ingredients, { rawMaterialId: "", percentage: 0 }])}><Plus className="h-3 w-3 mr-1" /> Add</Button>
        </div>
        {ingredients.map((ing, i) => (
          <div key={i} className="flex gap-2 items-center">
            <Select value={ing.rawMaterialId} onValueChange={(v) => { const u = [...ingredients]; u[i].rawMaterialId = v; setIngredients(u); }}>
              <SelectTrigger className="h-8 text-xs flex-1"><SelectValue placeholder="Material" /></SelectTrigger>
              <SelectContent>{materials.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
            </Select>
            <Input type="number" step="0.1" className="w-20 h-8 text-xs" value={ing.percentage || ""} onChange={(e) => { const u = [...ingredients]; u[i].percentage = Number(e.target.value); setIngredients(u); }} placeholder="%" />
            {ingredients.length > 1 && <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setIngredients(ingredients.filter((_, idx) => idx !== i))}><Trash2 className="h-3 w-3" /></Button>}
          </div>
        ))}
      </div>

      <Button type="submit" disabled={submitting || totalPct !== 100} className="w-full">
        {submitting ? "Creating..." : "Create Recipe"}
      </Button>
    </form>
  );
}
