export type Action = 'read' | 'download' | 'update' | 'delete';
export interface Grant { resourceId: string; tenantId: string; actions: Action[]; expiresAt: string; }
export interface Subject { id: string; tenantId: string; verified: boolean; grants?: Grant[]; }
export interface Resource { id: string; tenantId: string; ownerId: string; }
export interface AccessPolicy { action: Action; now?: number; ownerActions?: Action[]; }
export interface Decision { readonly subjectId: string; readonly resourceId: string; readonly tenantId: string; readonly action: Action; readonly authority: 'owner' | 'grant'; }
export interface ResponsePolicy { visibility?: 'private' | 'public'; csp?: string; url?: string | URL; hstsMaxAge?: number; }
export declare class GuardError extends Error { readonly code: string; readonly status: number; constructor(code: string, status?: number); }
export declare const DEFAULT_CSP: string;
export declare function assertSameOrigin(request: Request, expectedOrigin: string): void;
export declare function guardMutation(request: Request, expectedOrigin: string): void;
export declare function hardenResponseHeaders(input?: HeadersInit, policy?: ResponsePolicy): Headers;
export declare function preventPrivateCaching(input?: HeadersInit): Headers;
export declare function authorizeResource(subject: Subject | null, resource: Resource, policy: AccessPolicy): Decision;
