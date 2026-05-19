"use client";

import { Button } from "@/components/ui/button";

export default function InventoryError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20">
      <h2 className="text-xl font-semibold">Failed to load inventory</h2>
      <p className="text-muted-foreground">{error.message}</p>
      <Button onClick={reset}>Retry</Button>
    </div>
  );
}
