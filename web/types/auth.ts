// Neon Auth SDK types are not fully stable across versions (and some values
// may be serialized on the wire). Keep these types permissive and model only
// the fields the app actually relies on.

export type DateLike = Date | string;

export interface NeonAuthUser {
  id: string; // UUID
  email: string;
  name?: string | null;
  image?: string | null;
  emailVerified?: boolean;
  createdAt?: DateLike;
  updatedAt?: DateLike;
}

export interface NeonAuthSession {
  user: NeonAuthUser;
  session: {
    id: string;
    userId: string;
    expiresAt: DateLike;
    token?: string;
    ipAddress?: string | null;
    userAgent?: string | null;
  };
}

export interface SessionResponse {
  data: NeonAuthSession | null;
  error?: {
    message: string;
    status: number;
  };
}
