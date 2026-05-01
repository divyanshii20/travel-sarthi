import { describe, it, expect } from 'vitest';
import {
  registerSchema, loginSchema, refreshTokenSchema,
  forgotPasswordSchema, resetPasswordSchema, changePasswordSchema,
  verifyEmailSchema, verifyTotpSchema, disableTotpSchema,
  googleCallbackSchema,
} from './auth.schema';

describe('registerSchema', () => {
  const valid = { email: 'a@b.com', password: 'Secret1!', displayName: 'Riya' };

  it('accepts a valid payload', () => {
    expect(() => registerSchema.parse(valid)).not.toThrow();
  });

  it('lowercases the email', () => {
    const out = registerSchema.parse({ ...valid, email: 'RIYA@EXAMPLE.COM' });
    expect(out.email).toBe('riya@example.com');
  });

  it('trims displayName', () => {
    const out = registerSchema.parse({ ...valid, displayName: '  Riya  ' });
    expect(out.displayName).toBe('Riya');
  });

  it('rejects invalid emails', () => {
    expect(() => registerSchema.parse({ ...valid, email: 'no-at-sign' })).toThrow();
    expect(() => registerSchema.parse({ ...valid, email: '' })).toThrow();
    expect(() => registerSchema.parse({ ...valid, email: 'a@' })).toThrow();
  });

  it('rejects passwords shorter than 8 chars', () => {
    expect(() => registerSchema.parse({ ...valid, password: 'Ab1!' })).toThrow(/at least 8/);
  });

  it('rejects passwords without uppercase', () => {
    expect(() => registerSchema.parse({ ...valid, password: 'secret1!' })).toThrow(/uppercase/);
  });

  it('rejects passwords without numbers', () => {
    expect(() => registerSchema.parse({ ...valid, password: 'Secret!!' })).toThrow(/number/);
  });

  it('rejects passwords without special chars', () => {
    expect(() => registerSchema.parse({ ...valid, password: 'Secret11' })).toThrow(/special/);
  });

  it('rejects displayName shorter than 2 chars', () => {
    expect(() => registerSchema.parse({ ...valid, displayName: 'A' })).toThrow(/at least 2/);
  });

  it('rejects displayName longer than 100 chars', () => {
    expect(() => registerSchema.parse({ ...valid, displayName: 'x'.repeat(101) })).toThrow();
  });
});

describe('loginSchema', () => {
  it('accepts a valid payload', () => {
    expect(() => loginSchema.parse({ email: 'a@b.com', password: 'x' })).not.toThrow();
  });

  it('lowercases email', () => {
    const out = loginSchema.parse({ email: 'A@B.COM', password: 'x' });
    expect(out.email).toBe('a@b.com');
  });

  it('rejects empty password', () => {
    expect(() => loginSchema.parse({ email: 'a@b.com', password: '' })).toThrow();
  });

  it('accepts an optional 6-digit totpCode', () => {
    expect(() => loginSchema.parse({ email: 'a@b.com', password: 'x', totpCode: '123456' })).not.toThrow();
  });

  it('rejects non-6-digit totpCode', () => {
    expect(() => loginSchema.parse({ email: 'a@b.com', password: 'x', totpCode: '12345' })).toThrow();
    expect(() => loginSchema.parse({ email: 'a@b.com', password: 'x', totpCode: '1234567' })).toThrow();
  });
});

describe('refreshTokenSchema', () => {
  it('accepts a non-empty token', () => {
    expect(() => refreshTokenSchema.parse({ refreshToken: 'abc' })).not.toThrow();
  });
  it('rejects empty token', () => {
    expect(() => refreshTokenSchema.parse({ refreshToken: '' })).toThrow();
  });
  it('rejects missing token', () => {
    expect(() => refreshTokenSchema.parse({})).toThrow();
  });
});

describe('forgotPasswordSchema', () => {
  it('accepts a valid email', () => {
    expect(() => forgotPasswordSchema.parse({ email: 'a@b.com' })).not.toThrow();
  });
  it('rejects invalid email', () => {
    expect(() => forgotPasswordSchema.parse({ email: 'nope' })).toThrow();
  });
});

describe('resetPasswordSchema', () => {
  it('accepts valid token + strong password', () => {
    expect(() => resetPasswordSchema.parse({ token: 't', newPassword: 'Secret1!' })).not.toThrow();
  });
  it('rejects weak password', () => {
    expect(() => resetPasswordSchema.parse({ token: 't', newPassword: 'weak' })).toThrow();
  });
  it('rejects empty token', () => {
    expect(() => resetPasswordSchema.parse({ token: '', newPassword: 'Secret1!' })).toThrow();
  });
});

describe('changePasswordSchema', () => {
  it('accepts current + strong new password', () => {
    expect(() => changePasswordSchema.parse({ currentPassword: 'old', newPassword: 'Secret1!' })).not.toThrow();
  });
  it('rejects empty current password', () => {
    expect(() => changePasswordSchema.parse({ currentPassword: '', newPassword: 'Secret1!' })).toThrow();
  });
});

describe('verifyEmailSchema', () => {
  it('accepts a non-empty token', () => {
    expect(() => verifyEmailSchema.parse({ token: 'abc' })).not.toThrow();
  });
  it('rejects empty token', () => {
    expect(() => verifyEmailSchema.parse({ token: '' })).toThrow();
  });
});

describe('verifyTotpSchema', () => {
  it('accepts a 6-digit numeric code', () => {
    expect(() => verifyTotpSchema.parse({ code: '123456' })).not.toThrow();
  });
  it('rejects non-numeric code', () => {
    expect(() => verifyTotpSchema.parse({ code: 'abcdef' })).toThrow();
  });
  it('rejects 5-digit code', () => {
    expect(() => verifyTotpSchema.parse({ code: '12345' })).toThrow();
  });
});

describe('disableTotpSchema', () => {
  it('accepts password + 6-digit code', () => {
    expect(() => disableTotpSchema.parse({ password: 'pw', code: '123456' })).not.toThrow();
  });
  it('rejects empty password', () => {
    expect(() => disableTotpSchema.parse({ password: '', code: '123456' })).toThrow();
  });
});

describe('googleCallbackSchema', () => {
  it('requires both code and state', () => {
    expect(() => googleCallbackSchema.parse({ code: 'c', state: 's' })).not.toThrow();
    expect(() => googleCallbackSchema.parse({ code: 'c' })).toThrow();
    expect(() => googleCallbackSchema.parse({ state: 's' })).toThrow();
  });
});
