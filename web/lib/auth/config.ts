/**
 * Auth-related deployment toggles.
 *
 * Build/deploy-time behavior: set CHORUS_SIGN_UP_ENABLED=1 to allow new
 * account creation. Any other value (or unset) disables sign-up.
 */
export function isSignUpEnabled() {
  return process.env.CHORUS_SIGN_UP_ENABLED === '1';
}
