import React from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft, Mail, Lock, FileText, CheckCircle2 } from 'lucide-react';

export default function PrivacyPolicyPage() {
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
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-serif font-bold text-[#1F2421]">Privacy Policy</h1>
            <p className="text-sm text-[#7D8A7D]">Digital Personal Data Protection (DPDP) Act 2023 Compliance</p>
          </div>
        </div>

        <div className="prose prose-emerald max-w-none text-[#3E4A3E] space-y-6 text-sm leading-relaxed">
          <section className="bg-[#F8FAF8] p-5 rounded-xl border border-[#E0EBE0]">
            <h2 className="text-base font-semibold text-[#1F2421] mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[#2F5233]" />
              Campus Identity & Student Verification Notice
            </h2>
            <p className="text-xs text-[#526052]">
              ReThread validates student status exclusively by verifying control of an official university email address
              (ending in <code>.ac.in</code> or authorized college domains). ReThread is an independent peer-to-peer campus platform
              and does not maintain official enrollment verification partnerships with university administrations.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-serif font-bold text-[#1F2421] mb-2">1. Information We Collect</h3>
            <p>
              We collect minimal data necessary to facilitate safe in-person campus exchanges:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs">
              <li><strong>Student Profile</strong>: Your university email address, name, optional profile avatar, and affiliated campus.</li>
              <li><strong>Marketplace Listings</strong>: Item titles, category, descriptions, asking prices (in ₹ INR), and item photographs. All GPS and EXIF camera metadata is automatically stripped prior to image publishing.</li>
              <li><strong>Chat History & Notifications</strong>: On-platform communication related to meetup scheduling and intent confirmation.</li>
              <li><strong>Technical Metadata</strong>: IP address, user-agent, and session cookies for authentication, CSRF defense, and rate-limiting.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-serif font-bold text-[#1F2421] mb-2">2. Offline Cash & UPI Model — Zero Financial Data Collected</h3>
            <p className="text-xs">
              ReThread does <strong>NOT</strong> process, collect, or store credit card numbers, bank account details, or payment credentials.
              All transactions occur strictly offline in-person between students via direct cash or recipient-scanned UPI QR codes during meetup handovers.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-serif font-bold text-[#1F2421] mb-2">3. Data Retention & Deletion Rights</h3>
            <p className="text-xs">
              In accordance with India’s Digital Personal Data Protection (DPDP) Act 2023:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs">
              <li>You may request complete account and data deletion at any time by contacting our campus grievance officer.</li>
              <li>Expired session tokens and deleted messages are permanently purged from active systems.</li>
            </ul>
          </section>

          <section className="border-t border-[#EBE5DA] pt-6">
            <h3 className="text-base font-semibold text-[#1F2421] mb-2 flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#2F5233]" />
              Grievance Officer Contact
            </h3>
            <p className="text-xs text-[#526052]">
              For privacy inquiries, data export, or grievance redressal, contact our designated officer:
              <br />
              <strong className="text-[#1F2421]">Email</strong>: privacy@rethread.in | grievance@rethread.in
              <br />
              <strong className="text-[#1F2421]">Platform</strong>: ReThread Campus Thrift Exchange, India
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

