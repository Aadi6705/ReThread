import React from 'react';
import { Header } from '@/components/navigation/Header';

export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-[#f5f3ee]">
      <Header />
      <main className="flex-1">{children}</main>
    </div>
  );
}
