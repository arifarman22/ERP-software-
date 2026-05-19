"use client";

import { useForm, type FieldValues, type DefaultValues, type Path } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { type ZodSchema } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type FieldType = "text" | "email" | "password" | "number" | "date" | "textarea" | "select";

type SelectOption = { label: string; value: string };

type FieldConfig<T extends FieldValues> = {
  name: Path<T>;
  label: string;
  type?: FieldType;
  placeholder?: string;
  options?: SelectOption[];
  colSpan?: 1 | 2;
  required?: boolean;
};

type FormShellProps<T extends FieldValues> = {
  schema: ZodSchema<T>;
  defaultValues: DefaultValues<T>;
  fields: FieldConfig<T>[];
  onSubmit: (data: T) => Promise<void>;
  submitLabel?: string;
  isLoading?: boolean;
  error?: string | null;
  columns?: 1 | 2;
  onCancel?: () => void;
};

export function FormShell<T extends FieldValues>({
  schema,
  defaultValues,
  fields,
  onSubmit,
  submitLabel = "Save",
  isLoading,
  error,
  columns = 1,
  onCancel,
}: FormShellProps<T>) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<T>({ resolver: zodResolver(schema), defaultValues });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">{error}</div>
      )}

      <div className={cn("grid gap-4", columns === 2 && "md:grid-cols-2")}>
        {fields.map((field) => (
          <div
            key={String(field.name)}
            className={cn("space-y-2", field.colSpan === 2 && "md:col-span-2")}
          >
            <Label htmlFor={String(field.name)}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>

            {field.type === "textarea" ? (
              <textarea
                id={String(field.name)}
                placeholder={field.placeholder}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                {...register(field.name)}
              />
            ) : field.type === "select" && field.options ? (
              <Select onValueChange={(val) => setValue(field.name, val as any)}>
                <SelectTrigger>
                  <SelectValue placeholder={field.placeholder || `Select ${field.label}`} />
                </SelectTrigger>
                <SelectContent>
                  {field.options.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id={String(field.name)}
                type={field.type || "text"}
                placeholder={field.placeholder}
                {...register(field.name)}
              />
            )}

            {errors[field.name] && (
              <p className="text-xs text-destructive">{errors[field.name]?.message as string}</p>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
