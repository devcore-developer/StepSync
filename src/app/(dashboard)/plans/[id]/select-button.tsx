'use client';
import { useRouter } from 'next/navigation';

export default function SelectButton({ slug }: { slug: string }) {
  const router = useRouter();
  return (
    <button 
      onClick={() => router.push(`/plans/${slug}/setup`)} 
      className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
    >
      Select This Plan
    </button>
  );
}