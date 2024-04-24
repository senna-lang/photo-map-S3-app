import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import AuthButton from './AuthButton';

const AuthButtonServer = async () => {
  const supabase = createServerComponentClient({ cookies });
  const {
    data: { session },
  } = await supabase.auth.getSession();
  console.log(session)
  return <AuthButton session={session} />;
};

export default AuthButtonServer;