'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push('/admin/dashboard');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-gray-900">Redirecting...</h1>
        <p className="mt-2 text-sm text-gray-500">Taking you to the admin dashboard</p>
      </div>
    </div>
  );
}