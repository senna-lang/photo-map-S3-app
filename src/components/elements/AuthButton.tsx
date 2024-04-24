'use client';
import {
  Session,
  createClientComponentClient,
} from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { Button } from '../ui/button';

const AuthButton = ({ session }: { session: Session | null }) => {
  const router = useRouter();
  const supabase = createClientComponentClient();

  const handleSignIn = async () => {
    supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: 'http://localhost:3000/auth/callback',
      },
    });
  };
  const handleSignOut = async () => {
    supabase.auth.signOut();
    router.refresh();
  };
  return (
    <div className=" flex gap-3">
      {session ? (
        <Button onClick={handleSignOut}>サインアウト</Button>
      ) : (
        <Button onClick={handleSignIn}>サインイン</Button>
      )}
    </div>
  );
};

export default AuthButton;
