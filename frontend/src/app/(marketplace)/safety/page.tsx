import React from 'react';
import Link from 'next/link';
import { MapPin, ArrowLeft, Sun, CheckCircle, ShieldAlert, Eye, UserCheck } from 'lucide-react';

export default function MeetupSafetyPage() {
  const safeLandmarks = [
    {
      name: "Central Library Foyer",
      desc: "High foot-traffic, campus security present, well-lit indoor atrium.",
    },
    {
      name: "Student Activity Center (SAC)",
      desc: "Open seating, active daytime student presence, central campus location.",
    },
    {
      name: "Campus Dining Hall / Cafeteria",
      desc: "Public tables, CCTV coverage, ideal for daytime item inspections.",
    },
    {
      name: "Sports Complex Gate & Reception",
      desc: "Easily accessible, daytime surveillance, prominent campus landmark.",
    },
  ];

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
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-serif font-bold text-[#1F2421]">Campus Meetup Safety</h1>
            <p className="text-sm text-[#7D8A7D]">Best Practices for Safe In-Person Exchanges</p>
          </div>
        </div>

        <div className="space-y-8">
          <section className="bg-[#EBF3EB] p-6 rounded-2xl border border-[#D5E5D5]">
            <h2 className="text-base font-semibold text-[#1F3D22] mb-3 flex items-center gap-2">
              <Sun className="w-5 h-5 text-[#2F5233]" />
              The Golden Rule: Public, Well-Lit Campus Locations Only
            </h2>
            <p className="text-xs text-[#2A472E] leading-relaxed">
              Never agree to meet off-campus, in secluded areas, private hostel rooms, or late at night.
              Always schedule your meetup at approved daytime campus landmarks where other students and staff are present.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-serif font-bold text-[#1F2421] mb-4">Recommended Campus Landmarks</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {safeLandmarks.map((loc, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-[#EBE5DA] bg-[#FAF8F5]">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="w-4 h-4 text-[#2F5233]" />
                    <h4 className="font-semibold text-sm text-[#1F2421]">{loc.name}</h4>
                  </div>
                  <p className="text-xs text-[#6B756B]">{loc.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-lg font-serif font-bold text-[#1F2421] mb-3">Buyer & Seller Checklist</h3>
            <div className="space-y-3 text-xs text-[#3E4A3E]">
              <div className="flex items-start gap-2">
                <Eye className="w-4 h-4 text-[#2F5233] mt-0.5 shrink-0" />
                <span><strong>Inspect Thoroughly First</strong>: Power on electronics, check textbook pages, and verify equipment condition before payment.</span>
              </div>
              <div className="flex items-start gap-2">
                <UserCheck className="w-4 h-4 text-[#2F5233] mt-0.5 shrink-0" />
                <span><strong>Confirm Student Identity</strong>: Verify that the person at the meetup matches their on-platform student profile name.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-[#2F5233] mt-0.5 shrink-0" />
                <span><strong>Direct Cash or Instant UPI</strong>: Pay exact cash or scan the seller&apos;s direct UPI QR code only after you have verified the item in your hands.</span>
              </div>
              <div className="flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-[#B88718] mt-0.5 shrink-0" />
                <span><strong>Report Suspicious Requests</strong>: If any user asks for advance payments, courier deliveries, or off-campus meetups, report them immediately.</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

