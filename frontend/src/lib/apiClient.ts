const API_PROTOCOL = window.location.protocol;
const API_HOST = window.location.hostname;
const API_PORT = import.meta.env.VITE_API_PORT || '8000';
const BASE_URL = `${API_PROTOCOL}//${API_HOST}:${API_PORT}/api/v1`;

function getCsrfToken(): string {
  const match = document.cookie.match(/(^|;)\s*csrf_token\s*=\s*([^;]+)/);
  return (match && match[2]) ? decodeURIComponent(match[2]) : '';
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const isMutating = options.method && !['GET', 'HEAD', 'OPTIONS'].includes(options.method.toUpperCase());
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers as Record<string, string>,
  };

  if (isMutating) {
    const csrf = getCsrfToken();
    if (csrf) headers['X-CSRF-Token'] = csrf;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    credentials: 'include', // Automatically send cookies
    headers,
  });

  // Handle standard JSON or empty 204 bodies gracefully
  let data;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  }

  if (!response.ok) {
    throw {
      status: response.status,
      message: data?.detail || response.statusText,
      data,
    };
  }

  return data as T;
}
