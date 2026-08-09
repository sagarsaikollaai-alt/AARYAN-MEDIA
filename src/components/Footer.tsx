import React, { useState } from 'react';
import { Mail, Youtube, Instagram, Shield, FileText, RotateCcw, Package } from 'lucide-react';
import { LegalModal } from './LegalModal';

export const Footer = () => {
  const [activeModal, setActiveModal] = useState<'privacy' | 'terms' | 'refund' | 'delivery' | null>(null);

  return (
    <>
      <footer className="bg-[#0A0A0A] text-white border-t border-white/[0.08] mt-20">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          
          {/* Top Section */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-10 md:gap-12 mb-12 md:mb-16">
            
            {/* Left Column: Logo & Tagline */}
            <div className="flex flex-col items-start gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#D7FF2F] flex items-center justify-center font-extrabold text-black text-lg">
                  AM
                </div>
                <span className="font-bold text-xl tracking-tight text-white">
                  Aaryan Media
                </span>
              </div>
              <p className="text-zinc-400 text-sm leading-relaxed max-w-[400px]">
                Premium video editing mastery and cohort program for ambitious creators and editors in telugu.
              </p>
            </div>

            {/* Right Column: Contact & Socials */}
            <div className="flex flex-col items-start gap-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Contact Us
              </h3>
              <a 
                href="mailto:contact@aaryanmedia.com" 
                className="flex items-center gap-2 text-zinc-400 hover:text-[#D7FF2F] transition-colors text-sm"
              >
                <Mail className="w-4 h-4" />
                <span>contact@aaryanmedia.com</span>
              </a>
              
              <div className="flex items-center gap-3 mt-2">
                <a 
                  href="https://www.youtube.com/@sagarsaikolla" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white/[0.04] border border-white/[0.1] hover:bg-[#D7FF2F] hover:border-[#D7FF2F] hover:text-black text-white transition-all duration-200 flex items-center justify-center"
                  aria-label="YouTube"
                >
                  <Youtube className="w-4 h-4" />
                </a>
                <a 
                  href="https://www.instagram.com/sagarsai.kolla/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white/[0.04] border border-white/[0.1] hover:bg-[#D7FF2F] hover:border-[#D7FF2F] hover:text-black text-white transition-all duration-200 flex items-center justify-center"
                  aria-label="Instagram"
                >
                  <Instagram className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

          {/* Divider Line */}
          <div className="border-t border-white/[0.08]"></div>

          {/* Bottom Section: Copyright & Links */}
          {/* Added flex-wrap to ensure links wrap nicely on mobile if they get crowded */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mt-8 text-center md:text-left">
            <p className="text-zinc-500 text-xs">
              © 2026 Aaryan Media. All rights reserved.
            </p>
            <div className="flex flex-wrap justify-center md:justify-end items-center gap-x-4 gap-y-2 md:gap-x-6">
              <button onClick={() => setActiveModal('privacy')} className="text-zinc-500 hover:text-white transition-colors text-xs">Privacy Policy</button>
              <button onClick={() => setActiveModal('terms')} className="text-zinc-500 hover:text-white transition-colors text-xs">Terms & Conditions</button>
              <button onClick={() => setActiveModal('refund')} className="text-zinc-500 hover:text-white transition-colors text-xs">Refund Policy</button>
              <button onClick={() => setActiveModal('delivery')} className="text-zinc-500 hover:text-white transition-colors text-xs">Delivery Policy</button>
            </div>
          </div>
        </div>
      </footer>

      {/* PRIVACY POLICY MODAL */}
      <LegalModal 
        isOpen={activeModal === 'privacy'} 
        onClose={() => setActiveModal(null)} 
        title="Privacy Policy"
        icon={<Shield className="w-5 h-5" />}
      >
        <p className="italic text-zinc-400">Last updated: August 2026</p>
        <p>At Aaryan Media, accessible from aaryanmedia.co, protecting the privacy of our visitors and students is a core priority. This policy explains what information we collect and how we use it.</p>
        
        <div>
          <h3 className="font-bold text-white mb-1.5">Information We Collect</h3>
          <p>When you enroll in our video editing cohort or courses, we collect personal details such as your name, email address, phone number, and payment verification details necessary to provide access to course materials and community support.</p>
        </div>

        <div>
          <h3 className="font-bold text-white mb-1.5">How We Use Your Information</h3>
          <p>We use the information collected to operate and maintain our courses, deliver updates, notify you of upcoming live Q&A sessions, and provide ongoing student support.</p>
        </div>

        <div>
          <h3 className="font-bold text-white mb-1.5">Data Security</h3>
          <p>Your information is encrypted and stored securely. We do not sell, trade, or rent students' personal information to third parties. Payment processing is handled securely by our payment gateway partner (Razorpay), and we do not store your full credit/debit card details on our servers.</p>
        </div>
        
        <div>
          <h3 className="font-bold text-white mb-1.5">Contact Us</h3>
          <p>If you have any questions about this Privacy Policy, please contact us at contact@aaryanmedia.com.</p>
        </div>
      </LegalModal>

      {/* TERMS & CONDITIONS MODAL */}
      <LegalModal 
        isOpen={activeModal === 'terms'} 
        onClose={() => setActiveModal(null)} 
        title="Terms & Conditions"
        icon={<FileText className="w-5 h-5" />}
      >
        <p className="italic text-zinc-400">Last updated: August 2026</p>
        <p>Welcome to Aaryan Media! These terms outline the rules governing use of our website and educational services.</p>
        
        <div>
          <h3 className="font-bold text-white mb-1.5">1. Educational Content Access</h3>
          <p>By enrolling in our program, you are granted a non-exclusive, non-transferable license to access course videos, assets, templates, and live mentorship sessions for personal learning only. Access is granted electronically through your user account.</p>
        </div>

        <div>
          <h3 className="font-bold text-white mb-1.5">2. Intellectual Property</h3>
          <p>All course material, video tutorials, presets, and project files provided during the program are the intellectual property of Aaryan Media. Redistribution, resale, or sharing of login credentials is strictly prohibited.</p>
        </div>

        <div>
          <h3 className="font-bold text-white mb-1.5">3. Code of Conduct</h3>
          <p>Students agree to maintain respect and professional courtesy within community Discord groups and live classes.</p>
        </div>

        <div>
          <h3 className="font-bold text-white mb-1.5">4. Account Security</h3>
          <p>You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</p>
        </div>
      </LegalModal>

      {/* REFUND & CANCELLATION POLICY MODAL */}
      <LegalModal 
        isOpen={activeModal === 'refund'} 
        onClose={() => setActiveModal(null)} 
        title="Refund & Cancellation"
        icon={<RotateCcw className="w-5 h-5" />}
      >
        <p className="italic text-zinc-400">Last updated: August 2026</p>
        
        <div>
          <h3 className="font-bold text-white mb-1.5">Digital Product Nature</h3>
          <p>Due to the digital nature of our educational products and courses, all sales are generally considered final. Once a course is purchased and access is granted to the digital materials, we do not offer refunds or cancellations.</p>
        </div>

        <div>
          <h3 className="font-bold text-white mb-1.5">Technical Support</h3>
          <p>If you experience any technical issues accessing your course materials, please contact our support team at contact@aaryanmedia.com. We are committed to resolving any access issues promptly to ensure you receive the educational content you paid for.</p>
        </div>

        <div>
          <h3 className="font-bold text-white mb-1.5">Payment Disputes</h3>
          <p>If you believe you have been charged in error, please contact us within 7 days of the transaction date with your payment details so we can investigate the matter.</p>
        </div>
      </LegalModal>

      {/* DIGITAL DELIVERY / SHIPPING POLICY MODAL */}
      <LegalModal 
        isOpen={activeModal === 'delivery'} 
        onClose={() => setActiveModal(null)} 
        title="Digital Delivery Policy"
        icon={<Package className="w-5 h-5" />}
      >
        <p className="italic text-zinc-400">Last updated: August 2026</p>
        
        <div>
          <h3 className="font-bold text-white mb-1.5">Electronic Delivery</h3>
          <p>Aaryan Media provides digital educational products. All courses are delivered electronically through your user account on our website.</p>
        </div>

        <div>
          <h3 className="font-bold text-white mb-1.5">Access Timeline</h3>
          <p>Upon successful payment verification, you will receive immediate access to the enrolled course materials, including video lessons, templates, and community access (if applicable). No physical goods will be shipped to your physical address.</p>
        </div>

        <div>
          <h3 className="font-bold text-white mb-1.5">Access Duration</h3>
          <p>Unless otherwise specified on the course purchase page, students receive lifetime access to the purchased digital course materials.</p>
        </div>

        <div>
          <h3 className="font-bold text-white mb-1.5">Support</h3>
          <p>If you do not receive access to your digital materials within 24 hours of successful payment, please contact us at contact@aaryanmedia.com.</p>
        </div>
      </LegalModal>
    </>
  );
};