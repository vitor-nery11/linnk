/**
 * Cliente HTTP REST & Integração Supabase Auth (Seção 4 e Seção 8 do MVP)
 * Preparado para consumir os endpoints do backend NestJS (/server) na Fase 2.
 */

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export interface ApiRequestOptions extends RequestInit {
  accessToken?: string;
}

export async function apiRequest<T>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const { accessToken, headers, ...rest } = options;

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message || `Erro HTTP ${response.status}`);
  }

  return response.json() as Promise<T>;
}
