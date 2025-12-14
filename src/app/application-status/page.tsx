
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function ApplicationStatusRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/onboarding');
  }, [router]);

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background text-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="mt-4 text-muted-foreground">Redirecting to onboarding...</p>
    </div>
  );
}
