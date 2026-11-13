import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mweorjucjmhxrzpsemkf.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13ZW9yanVjam1oeHJ6cHNlbWtmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ1MjI3NDcsImV4cCI6MjExMDA5ODc0N30.J4C8LdtNftKQYPfbnC_h3tB4IIq5uMn0kYw1YnSv3Cs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  }
});

// ==========================================
// CONFIGURACIÓN ANUAL (Metas, Hábitos, Tareas)
// ==========================================
export async function fetchUserConfig(userId, year) {
  try {
    const id = `${userId}_year_${year}`;
    const { data, error } = await supabase
      .from('user_configs')
      .select('config')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.warn('Supabase fetchUserConfig error:', error.message);
      return null;
    }
    return data?.config || null;
  } catch (err) {
    console.warn('Error en fetchUserConfig:', err);
    return null;
  }
}

export async function saveUserConfig(userId, year, config) {
  try {
    const id = `${userId}_year_${year}`;
    const cleanConfig = {
      ...config,
      monthlyGoals: (config.monthlyGoals || []).map(({ images, ...rest }) => rest),
      yearlyGoals: (config.yearlyGoals || []).map(({ images, ...rest }) => rest),
    };

    const { error } = await supabase
      .from('user_configs')
      .upsert({
        id,
        user_id: userId,
        year: parseInt(year, 10),
        config: cleanConfig,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

    if (error) {
      console.warn('Supabase saveUserConfig error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Error en saveUserConfig:', err);
    return false;
  }
}

// ==========================================
// CHECKS Y EXCEPCIONES DIARIAS
// ==========================================
export async function fetchUserChecks(userId, year) {
  try {
    const id = `${userId}_year_${year}`;
    const { data, error } = await supabase
      .from('user_checks')
      .select('checks, exceptions')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.warn('Supabase fetchUserChecks error:', error.message);
      return null;
    }
    return {
      checks: data?.checks || {},
      exceptions: data?.exceptions || {}
    };
  } catch (err) {
    console.warn('Error en fetchUserChecks:', err);
    return null;
  }
}

export async function saveUserChecks(userId, year, checks, exceptions) {
  try {
    const id = `${userId}_year_${year}`;
    const { error } = await supabase
      .from('user_checks')
      .upsert({
        id,
        user_id: userId,
        year: parseInt(year, 10),
        checks: checks || {},
        exceptions: exceptions || {},
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

    if (error) {
      console.warn('Supabase saveUserChecks error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Error en saveUserChecks:', err);
    return false;
  }
}

// ==========================================
// IMÁGENES (Perfil, Visión y Metas)
// ==========================================
export async function fetchUserImages(userId) {
  try {
    const { data, error } = await supabase
      .from('user_images')
      .select('profile_pic, images, goal_images')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.warn('Supabase fetchUserImages error:', error.message);
      return null;
    }
    return {
      profilePic: data?.profile_pic || '',
      images: data?.images || [],
      goalImages: data?.goal_images || {}
    };
  } catch (err) {
    console.warn('Error en fetchUserImages:', err);
    return null;
  }
}

export async function saveUserImages(userId, profilePic, images) {
  try {
    const { error } = await supabase
      .from('user_images')
      .upsert({
        user_id: userId,
        profile_pic: profilePic || '',
        images: images || [],
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (error) {
      console.warn('Supabase saveUserImages error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Error en saveUserImages:', err);
    return false;
  }
}

export async function saveGoalImages(userId, goalImages) {
  try {
    const { error } = await supabase
      .from('user_images')
      .upsert({
        user_id: userId,
        goal_images: goalImages || {},
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (error) {
      console.warn('Supabase saveGoalImages error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Error en saveGoalImages:', err);
    return false;
  }
}

// ==========================================
// USUARIOS AUTORIZADOS (Whitelist)
// ==========================================
export async function fetchAllowedUsers() {
  try {
    const { data, error } = await supabase
      .from('allowed_users')
      .select('*');

    if (error) {
      console.warn('Supabase fetchAllowedUsers error:', error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.warn('Error en fetchAllowedUsers:', err);
    return [];
  }
}

export async function saveAllowedUser(user) {
  try {
    const { error } = await supabase
      .from('allowed_users')
      .upsert({
        email: user.email.toLowerCase().trim(),
        name: user.name || 'Socio Élite',
        role: user.role || 'guest',
        expires_at: user.expiresAt || null,
        created_at: new Date().toISOString()
      }, { onConflict: 'email' });

    if (error) {
      console.warn('Supabase saveAllowedUser error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Error en saveAllowedUser:', err);
    return false;
  }
}

export async function deleteAllowedUser(email) {
  try {
    const { error } = await supabase
      .from('allowed_users')
      .delete()
      .eq('email', email.toLowerCase().trim());

    if (error) {
      console.warn('Supabase deleteAllowedUser error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Error en deleteAllowedUser:', err);
    return false;
  }
}

// ==========================================
// SESIÓN DE USUARIO
// ==========================================
export async function syncUserSession(sessionData) {
  try {
    if (!sessionData || !sessionData.uid) return false;
    const { error } = await supabase
      .from('user_sessions')
      .upsert({
        user_id: sessionData.uid,
        email: sessionData.email || '',
        name: sessionData.name || '',
        role: sessionData.role || 'guest',
        last_login: sessionData.lastLogin || Date.now(),
        is_logged_in: !!sessionData.isLoggedIn,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (error) {
      console.warn('Supabase syncUserSession error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Error en syncUserSession:', err);
    return false;
  }
}

// ==========================================
// AUTENTICACIÓN CON EMAIL & PASSWORD
// ==========================================
export async function signUpWithEmail(email, password, name) {
  try {
    const cleanEmail = email.toLowerCase().trim();
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          full_name: name || 'Socio Élite'
        }
      }
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, user: data.user, session: data.session };
  } catch (err) {
    return { success: false, error: err.message || 'Error al registrar usuario' };
  }
}

export async function signInWithEmail(email, password) {
  try {
    const cleanEmail = email.toLowerCase().trim();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, user: data.user, session: data.session };
  } catch (err) {
    return { success: false, error: err.message || 'Error al iniciar sesión' };
  }
}

export async function signOutUser() {
  try {
    await supabase.auth.signOut();
    return true;
  } catch (err) {
    console.warn('Error cerrando sesión en Supabase:', err);
    return false;
  }
}

