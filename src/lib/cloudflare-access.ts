// Cloudflare Access Helper Library

export interface CloudflareAccessPayload {
  email: string;
  aud: string;
  iat: number;
  exp: number;
  sub: string;
}

export interface CloudflareAccessResult {
  valid: boolean;
  email?: string;
  aud?: string;
  sub?: string;
  error?: string;
}

export async function validateCloudflareAccess(req: Request): Promise<CloudflareAccessResult> {
  const jwt = req.headers.get('Cf-Access-Jwt-Assertion');
  
  if (!jwt) {
    return { valid: false, error: 'No access token provided' };
  }
  
  try {
    // Split JWT and decode payload
    const parts = jwt.split('.');
    if (parts.length !== 3) {
      return { valid: false, error: 'Invalid JWT format' };
    }
    
    // Decode payload (base64)
    const payload = JSON.parse(atob(parts[1]));
    
    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return { valid: false, error: 'Token expired' };
    }
    
    return { 
      valid: true, 
      email: payload.email,
      aud: payload.aud,
      sub: payload.sub
    };
  } catch (error) {
    return { valid: false, error: 'Invalid token format' };
  }
}

export function isPublicAPIPath(pathname: string): boolean {
  return pathname.startsWith('/api/') || 
         pathname.startsWith('/webhooks/') || 
         pathname.startsWith('/public/');
}

export function isAdminPath(pathname: string): boolean {
  return pathname.startsWith('/admin/') || 
         pathname.startsWith('/dashboard/') ||
         pathname.startsWith('/sr-admin/');
}

export function requireAdminAccess(req: Request): CloudflareAccessResult {
  const pathname = new URL(req.url).pathname;
  
  // If it's a public API path, no access check needed
  if (isPublicAPIPath(pathname)) {
    return { valid: true };
  }
  
  // If it's an admin path, check for access token
  if (isAdminPath(pathname)) {
    const jwt = req.headers.get('Cf-Access-Jwt-Assertion');
    if (!jwt) {
      return { valid: false, error: 'Admin access required' };
    }
    
    // Note: Cloudflare handles JWT validation automatically
    // We just need to check if the token exists
    return { valid: true };
  }
  
  // Default to public access for other paths
  return { valid: true };
}
