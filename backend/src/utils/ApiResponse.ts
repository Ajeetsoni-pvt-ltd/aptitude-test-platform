// backend/src/utils/ApiResponse.ts
// ─────────────────────────────────────────────────────────────
// ApiResponse: Standardized HTTP response format
// Kyun: Poore project mein consistent response structure rahega
// Frontend React app ko ek hi format handle karna padega
// ─────────────────────────────────────────────────────────────

// ─── Response Interface ────────────────────────────────────────
// TypeScript interface: define karta hai response ka shape
interface IApiResponse<T> {
  success: boolean;     // true = OK, false = Error
  message: string;      // Human-readable message
  data: T | null;       // Actual data (generic type T)
}

// ─── Success Response Helper ───────────────────────────────────
// Successful responses ke liye — 2xx status codes
export const successResponse = <T>(
  message: string,
  data: T | null = null
): IApiResponse<T> => ({
  success: true,
  message,
  data,
});

// ─── Error Response Helper ─────────────────────────────────────
// Failed responses ke liye — 4xx / 5xx status codes
export const errorResponse = (
  message: string
): IApiResponse<null> => ({
  success: false,
  message,
  data: null,
});

// Usage Example (Controllers mein aise use karenge):
// res.status(200).json(successResponse('Login successful', { token, user }));
// res.status(400).json(errorResponse('Invalid email or password'));
