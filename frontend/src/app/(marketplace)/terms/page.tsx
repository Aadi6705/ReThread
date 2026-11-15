import React from 'react';
import Link from 'next/link';
import { FileText, ArrowLeft, AlertTriangle, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-[#FDFBF7] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white border border-[#EBE5DA] rounded-2xl p-8 sm:p-12 shadow-sm">
        <Link
          href="/"
          className="inline-flex items-center text-sm font-medium text-[#5A6E5A] hover:text-[#2F5233] mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to ReThread Campus
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-[#E8F0E8] flex items-center justify-center text-[#2F5233]">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-serif font-bold text-[#1F2421]">Terms of Service</h1>
            <p className="text-sm text-[#7D8A7D]">Rules of Engagement for Campus Thrift & Exchanges</p>
          </div>
        </div>

        <div className="prose prose-emerald max-w-none text-[#3E4A3E] space-y-6 text-sm leading-relaxed">
          <section className="bg-[#FFF9EB] p-5 rounded-xl border border-[#F5E6BE]">
            <h2 className="text-base font-semibold text-[#8C6D1F] mb-1 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-[#B88718]" />
              Core Principle: Strict Offline Transactions Only
            </h2>
            <p className="text-xs text-[#6B551E]">
              ReThread operates strictly as a discovery and intent-coordination catalog for students.
              <strong> There are no online payments, no escrow accounts, and no shipping or delivery services. </strong>
              All exchanges must take place in person on campus. Any user requesting remote bank transfers or wire payments prior to physical meetup should be reported immediately.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-serif font-bold text-[#1F2421] mb-2">1. Eligibility</h3>
            <p className="text-xs">
              To list or request items on ReThread, you must possess active access to an official student or institutional email account.
              You agree to provide accurate information and to conduct yourself with integrity and respect toward fellow students.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-serif font-bold text-[#1F2421] mb-2">2. Prohibited Items</h3>
            <p className="text-xs">
              Listing any of the following items will lead to immediate account suspension:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs">
              <li>Academic dishonesty materials (stolen examination keys, unauthorized test materials).</li>
              <li>Prescription drugs, medications, alcohol, nicotine, or controlled substances.</li>
              <li>Weapons, hazardous chemicals, or contraband.</li>
              <li>Counterfeit electronics or pirated intellectual property.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-serif font-bold text-[#1F2421] mb-2">3. Dual-Confirmation Handover Protocol</h3>
            <p className="text-xs">
              Listings marked as reserved require both the buyer and seller to independently click
              &ldquo;Confirm Handover&rdquo; before an item is marked as sold. Inspection of physical items must occur during the meetup prior to transferring cash or completing UPI payments.
            </p>
          </section>

          <section className="border-t border-[#EBE5DA] pt-6">
            <p className="text-xs text-[#7D8A7D]">
              Last updated: November 2026. For questions regarding our Terms, contact legal@rethread.in.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

