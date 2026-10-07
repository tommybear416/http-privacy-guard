import { GuardError } from './error.mjs';

const ACTIONS = new Set(['read', 'download', 'update', 'delete']);
const identifier = value => typeof value === 'string' && value.length > 0 && value.length <= 300 && value === value.trim();
const deny = () => { throw new GuardError('resource_access_denied', 404); };
function instant(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(value)) return NaN;
  const ms = Date.parse(value);
  return Number.isFinite(ms) && new Date(ms).toISOString().slice(0, 19) === value.slice(0, 19) ? ms : NaN;
}

/** Subject, resource and grants MUST be loaded from trusted session/database state. */
export function authorizeResource(subject, resource, {action, now = Date.now(), ownerActions = ['read', 'download']} = {}) {
  if (!ACTIONS.has(action) || !Number.isSafeInteger(now) || now < 0 || !Array.isArray(ownerActions) || ownerActions.some(a => !ACTIONS.has(a))) {
    throw new GuardError('invalid_access_policy', 500);
  }
  if (subject?.verified !== true || !identifier(subject?.id) || !identifier(subject?.tenantId) ||
      !identifier(resource?.id) || !identifier(resource?.tenantId) || !identifier(resource?.ownerId) ||
      subject.tenantId !== resource.tenantId) deny();
  let authority;
  if (subject.id === resource.ownerId && ownerActions.includes(action)) authority = 'owner';
  else {
    if (!Array.isArray(subject.grants)) deny();
    const granted = subject.grants.some(grant => grant && grant.resourceId === resource.id &&
      grant.tenantId === resource.tenantId && Array.isArray(grant.actions) &&
      grant.actions.every(a => ACTIONS.has(a)) && grant.actions.includes(action) && instant(grant.expiresAt) > now);
    if (!granted) deny();
    authority = 'grant';
  }
  return Object.freeze({subjectId: subject.id, resourceId: resource.id, tenantId: resource.tenantId, action, authority});
}
