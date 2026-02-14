/**
 * @jest-environment node
 */

describe('isSignUpEnabled', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('returns true when CHORUS_SIGN_UP_ENABLED=1', async () => {
    process.env.CHORUS_SIGN_UP_ENABLED = '1';
    const { isSignUpEnabled } = await import('../config');

    expect(isSignUpEnabled()).toBe(true);
  });

  it('returns false when CHORUS_SIGN_UP_ENABLED is unset', async () => {
    delete process.env.CHORUS_SIGN_UP_ENABLED;
    const { isSignUpEnabled } = await import('../config');

    expect(isSignUpEnabled()).toBe(false);
  });

  it('returns false for other values', async () => {
    process.env.CHORUS_SIGN_UP_ENABLED = '0';
    const { isSignUpEnabled } = await import('../config');

    expect(isSignUpEnabled()).toBe(false);
  });
});
