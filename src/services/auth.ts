import { supabase } from '../lib/supabase';
import { PlayerProfile } from '../store/gameStore';

export const USERNAME_REGEX = /^[A-Za-z0-9_]{3,16}$/;

export function nameToEmail(name: string): string {
  return `${name.trim().toLowerCase()}@players.streetrush.app`;
}

export async function checkUsernameAvailable(username: string): Promise<boolean> {
  const clean = username.trim();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username')
    .ilike('username', clean)
    .limit(1);

  if (error) {
    throw new Error('Could not check driver name availability');
  }
  return !data || data.length === 0;
}

export async function signUpDriver(
  username: string,
  password: string
): Promise<PlayerProfile> {
  const cleanName = username.trim();

  if (!USERNAME_REGEX.test(cleanName)) {
    throw new Error(
      'Driver name must be 3–16 characters (letters, numbers, underscore only).'
    );
  }

  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters.');
  }

  const available = await checkUsernameAvailable(cleanName);
  if (!available) {
    throw new Error('That driver name is already taken. Try another one.');
  }

  const email = nameToEmail(cleanName);

  // Use our database RPC to create a confirmed account in auth.users + public.profiles
  // so it works immediately without hitting email confirmation rate limits
  const { error: rpcError } = await supabase.rpc('create_driver_account', {
    p_username: cleanName,
    p_password: password,
  });

  if (rpcError) {
    if (rpcError.message?.toLowerCase().includes('taken')) {
      throw new Error('That driver name is already taken. Try another one.');
    }
    // Fallback to standard signUp if RPC is unavailable
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username: cleanName },
      },
    });
    if (signUpError) {
      if (signUpError.message.toLowerCase().includes('already registered')) {
        throw new Error('That driver name is already taken. Try another one.');
      }
      throw new Error(signUpError.message);
    }
    if (signUpData.user && signUpData.session) {
      return {
        id: signUpData.user.id,
        username: cleanName,
      };
    }
  }

  // Sign in to establish the browser session
  const { data: signInData, error: signInError } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    });

  if (signInError || !signInData.user) {
    throw new Error(signInError?.message || 'Could not sign in after creating account.');
  }

  return {
    id: signInData.user.id,
    username: cleanName,
  };
}

export async function signInDriver(
  username: string,
  password: string
): Promise<PlayerProfile> {
  const cleanName = username.trim();
  if (!cleanName || !password) {
    throw new Error('Name or password is wrong');
  }

  const email = nameToEmail(cleanName);
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    throw new Error('Name or password is wrong');
  }

  const profile = await fetchPlayerProfile(data.user.id, data.user.user_metadata?.username || cleanName);
  return profile;
}

export async function signOutDriver(): Promise<void> {
  await supabase.auth.signOut();
}

export async function fetchPlayerProfile(
  userId: string,
  fallbackName = 'Driver'
): Promise<PlayerProfile> {
  const { data } = await supabase
    .from('profiles')
    .select('id, username')
    .eq('id', userId)
    .maybeSingle();

  return {
    id: userId,
    username: data?.username || fallbackName,
  };
}

export async function changeDriverPassword(
  username: string,
  oldPassword: string,
  newPassword: string
): Promise<void> {
  if (newPassword.length < 6) {
    throw new Error('New password must be at least 6 characters.');
  }

  const email = nameToEmail(username);
  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email,
    password: oldPassword,
  });

  if (verifyError) {
    throw new Error('Current password is incorrect.');
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (updateError) {
    throw new Error(updateError.message || 'Failed to update password.');
  }
}
