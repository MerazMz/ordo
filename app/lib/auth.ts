import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'ordo-super-secret-key-change-me-123456789'
);

export interface JWTPayload {
  userId: string;
  email: string;
  name: string;
  role: 'student' | 'shopkeeper' | 'admin';
  shopId?: string;
}

/**
 * Sign a JWT token with user credentials payload.
 */
export async function signJWT(payload: JWTPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

/**
 * Verify an incoming JWT token and extract its payload.
 */
export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JWTPayload;
  } catch (error) {
    return null;
  }
}
