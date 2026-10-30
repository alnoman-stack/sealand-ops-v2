// hooks/useUserRole.ts
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export function useUserRole() {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserRole() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (!error && data) {
          setRole(data.role);
        }
      }
      setLoading(false);
    }

    fetchUserRole();
  }, []);

  return {
    role,
    loading,
    isAdmin: role === 'admin',
    isUser: role === 'user',
    isB2B: role === 'b2b',
  };
}