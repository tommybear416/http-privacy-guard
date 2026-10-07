export class GuardError extends Error {
  constructor(code, status = 403) {
    super(code);
    this.name = 'GuardError';
    this.code = code;
    this.status = status;
  }
}
