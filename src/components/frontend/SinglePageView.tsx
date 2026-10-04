import React, { useState } from 'react';
import { Page } from '../../types/cms';
import { GutenbergBlockRenderer } from '../common/GutenbergBlockRenderer';
import { ArrowLeft, Edit3, Send, CheckCircle2, Mail, MapPin, Phone } from 'lucide-react';

interface Props {
  page: Page;
  onBack: () => void;
  onEditPage: (page: Page) => void;
}

export const SinglePageView: React.FC<Props> = ({ page, onBack, onEditPage }) => {
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
    setTimeout(() => {
      setFormData({ name: '', email: '', subject: '', message: '' });
      setFormSubmitted(false);
    }, 4000);
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 font-sans">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Home</span>
        </button>
      </div>

      <header className="mb-8 space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
          {page.template} Template
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight font-serif-custom">
          {page.title}
        </h1>
      </header>

      {page.featuredImage && (
        <div className="my-8 rounded-2xl overflow-hidden bg-slate-100 shadow-md border border-slate-200">
          <img src={page.featuredImage} alt={page.title} className="w-full h-auto object-cover max-h-[400px]" />
        </div>
      )}

      {/* Render Gutenberg Blocks if present, or fallback text */}
      {page.blocks && page.blocks.length > 0 ? (
        <div className="py-4">
          <GutenbergBlockRenderer blocks={page.blocks} />
        </div>
      ) : (
        <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed text-base py-4">
          <p>{page.body}</p>
        </div>
      )}

      {/* Interactive Contact Form if Contact Page */}
      {page.slug === 'contact' && (
        <div className="mt-12 pt-8 border-t border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-4 text-xs text-slate-600">
            <h3 className="font-bold text-slate-900 text-base">Editorial Office</h3>
            <p>Our team works globally across edge zones and open source communities.</p>
            <div className="space-y-2 pt-2">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-blue-600 shrink-0" />
                <span>amitsinghpritam@gmail.com</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-600 shrink-0" />
                <span>San Francisco, CA & Global Remote</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-blue-600 shrink-0" />
                <span>GitHub @amitsingh</span>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 bg-slate-50 p-6 rounded-2xl border border-slate-200">
            {formSubmitted ? (
              <div className="p-6 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
                <div>
                  <span className="font-bold text-sm block">Message Dispatched!</span>
                  <span>Thank you for reaching out. An editorial coordinator will reply within 24 hours.</span>
                </div>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Your Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Jane Doe"
                      className="w-full text-xs p-2.5 rounded-xl bg-white border border-slate-200 outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Your Email</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="jane@example.com"
                      className="w-full text-xs p-2.5 rounded-xl bg-white border border-slate-200 outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Subject</label>
                  <input
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="Inquiry regarding Astro & Sveltia CMS"
                    className="w-full text-xs p-2.5 rounded-xl bg-white border border-slate-200 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Message</label>
                  <textarea
                    required
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Tell us about your project or publishing questions..."
                    className="w-full text-xs p-2.5 rounded-xl bg-white border border-slate-200 outline-none focus:border-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-2"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Send Message</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
