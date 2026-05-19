import { NextResponse } from "next/server";
import { ZodError } from "zod";

export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function errorResponse(error: unknown, status = 500) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { success: false, error: error.errors[0].message },
      { status: 400 }
    );
  }
  const message = error instanceof Error ? error.message : "Internal server error";
  return NextResponse.json({ success: false, error: message }, { status });
}
