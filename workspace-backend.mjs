/**
 * Server-backed authentication and owner-scoped workspace storage.
 * Only the publishable key is embedded in the browser; never include service keys.
 */
import { createClient } from '@supabase/supabase-js';

const url = 'https://afelbznpwltuebmqmqbh.supabase.co';
const publishableKey = 'sb_publishable_J548-tZcZAxnUF4HD-VPEA_Gepy26Ec';
const supabase = createClient(url, publishableKey, {
  auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true },
});

export async function signIn(email, password) {
  const result = await supabase.auth.signInWithPassword({ email, password });
  if (result.error) throw result.error;
  return result.data.user;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function authenticationState() {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return { status: 'signed-out' };
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (error) throw error;
  return {
    status: data.currentLevel === 'aal2' ? 'ready' : 'mfa-required',
    user: userData.user,
  };
}

export async function enrollTotp() {
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp', friendlyName: 'growth-story-workspace',
  });
  if (error) throw error;
  return { factorId: data.id, secret: data.totp.secret, qrCode: data.totp.qr_code };
}

export async function verifyTotp(factorId, code) {
  const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
  if (challengeError) throw challengeError;
  const { error } = await supabase.auth.mfa.verify({
    factorId, challengeId: challenge.id, code,
  });
  if (error) throw error;
  return authenticationState();
}

export async function availableTotpFactor() {
  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error) throw error;
  return data.totp.find(factor => factor.status === 'verified')?.id ?? null;
}

export async function loadWorkspace() {
  const state = await authenticationState();
  if (state.status !== 'ready') throw new Error('需要完成双重验证');
  const { data, error } = await supabase.from('workspace_state')
    .select('payload,updated_at').eq('user_id', state.user.id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function saveWorkspace(payload) {
  const state = await authenticationState();
  if (state.status !== 'ready') throw new Error('需要完成双重验证');
  const { error } = await supabase.from('workspace_state').upsert({
    user_id: state.user.id, payload, updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });
  if (error) throw error;
}
