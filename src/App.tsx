/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import { exportBrochureToPdf } from './utils/pdfExport';
import {
  Check,
  CheckSquare,
  Copy,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Layers,
  Link2,
  Loader2,
  Lock,
  MapPin,
  Phone,
  Printer,
  QrCode,
  RotateCcw,
  Search,
  ShieldAlert,
  Square,
  Wifi,
  X,
  ZoomIn,
} from 'lucide-react';
import {
  AI_CREDENTIALS_13,
  CONFIDENTIALITY_STATEMENT,
  CONNECTION_TEST_PROTOCOL,
  DAILY_SCHEDULE,
  DOCUMENT_META,
  EXECUTIVE_LETTER,
  EXTRACTED_ASSETS,
  OFFICIAL_CERTIFICATES,
  PM_CREDENTIALS,
  PROTOCOL_CLAUSES,
  PROTOCOL_INTRO,
} from './data/protocolData';
import { RedesignedBrochurePages } from './components/RedesignedBrochurePages';

type ViewMode = 'interactive' | 'brochure';
type CredentialFilter = 'all' | 'ai' | 'pm';
type ProtocolCategoryFilter =
  | 'all'
  | 'hardware'
  | 'participants'
  | 'classroom'
  | 'hospitality'
  | 'legal';

interface LightboxState {
  src: string;
  title: string;
}

const CHECKLIST_STORAGE_KEY = 'owj_cpmai_protocol_checklist_v1';
const CONN_STEPS_STORAGE_KEY = 'owj_cpmai_conn_steps_v1';
const DIGITAL_URL_STORAGE_KEY = 'owj_cpmai_digital_url_daneshmand_v1';
const DEFAULT_PUBLIC_APP_URL = 'https://owjbc.github.io/owj-cpmai-daneshmand/';

function getAutoDetectedPublicUrl(): string {
  if (typeof window === 'undefined') return DEFAULT_PUBLIC_APP_URL;
  const { origin, pathname, hostname } = window.location;
  // In AI Studio preview or localhost, use the permanent GitHub Pages URL
  if (
    hostname.startsWith('ais-dev-') ||
    hostname.startsWith('ais-pre-') ||
    hostname === 'localhost' ||
    hostname === '127.0.0.1'
  ) {
    return DEFAULT_PUBLIC_APP_URL;
  }
  // On GitHub Pages, Vercel, or custom domain (owjbc.com), automatically use the live URL
  return `${origin}${pathname}`;
}

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('interactive');
  const [credFilter, setCredFilter] = useState<CredentialFilter>('all');
  const [credSearch, setCredSearch] = useState('');
  const [protocolCategory, setProtocolCategory] = useState<ProtocolCategoryFilter>('all');
  const [lightbox, setLightbox] = useState<LightboxState | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportProgress, setExportProgress] = useState('');
  const [showUrlConfig, setShowUrlConfig] = useState<boolean>(false);
  const [isAdminUnlocked, setIsAdminUnlocked] = useState<boolean>(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState<string>('');
  const [adminPasswordError, setAdminPasswordError] = useState<string>('');
  const [digitalUrl, setDigitalUrl] = useState<string>(() => {
    try {
      return localStorage.getItem(DIGITAL_URL_STORAGE_KEY) || getAutoDetectedPublicUrl();
    } catch {
      return getAutoDetectedPublicUrl();
    }
  });
  const [digitalQrDataUrl, setDigitalQrDataUrl] = useState<string>('');
  const [copiedUrl, setCopiedUrl] = useState(false);

  const handleAdminPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = adminPasswordInput.trim();
    if (
      trimmed === '.Kbka@222' ||
      trimmed === 'Kbka@222' ||
      trimmed === 'Kbka@222.'
    ) {
      setIsAdminUnlocked(true);
      setAdminPasswordError('');
      setAdminPasswordInput('');
    } else {
      setAdminPasswordError('رمز عبور واردشده صحیح نیست.');
    }
  };

  const [checkedIds, setCheckedIds] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(CHECKLIST_STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [connChecks, setConnChecks] = useState<Record<number, boolean>>(() => {
    try {
      const saved = localStorage.getItem(CONN_STEPS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : { 0: false, 1: false, 2: false };
    } catch {
      return { 0: false, 1: false, 2: false };
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(checkedIds));
    } catch {
      // Ignore storage errors
    }
  }, [checkedIds]);

  useEffect(() => {
    try {
      localStorage.setItem(CONN_STEPS_STORAGE_KEY, JSON.stringify(connChecks));
    } catch {
      // Ignore storage errors
    }
  }, [connChecks]);

  useEffect(() => {
    const cleanUrl = digitalUrl.trim() || DEFAULT_PUBLIC_APP_URL;
    try {
      localStorage.setItem(DIGITAL_URL_STORAGE_KEY, cleanUrl);
    } catch {
      // Ignore storage errors
    }
    QRCode.toDataURL(cleanUrl, {
      width: 280,
      margin: 1,
      color: {
        dark: '#0F172A',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
    })
      .then((url) => setDigitalQrDataUrl(url))
      .catch(() => {});
  }, [digitalUrl]);

  const handleCopyDigitalUrl = () => {
    navigator.clipboard?.writeText(digitalUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const toggleChecklist = (id: string) => {
    setCheckedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const toggleConnCheck = (idx: number) => {
    setConnChecks((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const checkAllClauses = () => {
    const all: Record<string, boolean> = {};
    PROTOCOL_CLAUSES.forEach((c) => {
      all[c.id] = true;
    });
    setCheckedIds(all);
  };

  const resetChecklist = () => {
    setCheckedIds({});
  };

  const completedCount = useMemo(
    () => PROTOCOL_CLAUSES.filter((c) => checkedIds[c.id]).length,
    [checkedIds]
  );

  const allConnVerified = Boolean(connChecks[0] && connChecks[1] && connChecks[2]);

  const filteredCredentials = useMemo(() => {
    const combined = [
      ...AI_CREDENTIALS_13.map((item) => ({ ...item, groupLabel: 'هوش مصنوعی و CPMAI' })),
      ...PM_CREDENTIALS.map((item) => ({ ...item, groupLabel: 'مدیریت پروژه بین‌الملل' })),
    ];
    return combined.filter((item) => {
      const matchesTab =
        credFilter === 'all' ||
        (credFilter === 'ai' && item.category === 'ai') ||
        (credFilter === 'pm' && item.category === 'pm');
      const q = credSearch.trim().toLowerCase();
      const matchesQuery =
        !q ||
        item.titleFa.toLowerCase().includes(q) ||
        (item.code && item.code.toLowerCase().includes(q)) ||
        item.organizationFa.toLowerCase().includes(q);
      return matchesTab && matchesQuery;
    });
  }, [credFilter, credSearch]);

  const filteredClauses = useMemo(() => {
    if (protocolCategory === 'all') return PROTOCOL_CLAUSES;
    return PROTOCOL_CLAUSES.filter((c) => c.category === protocolCategory);
  }, [protocolCategory]);

  const handlePrint = async () => {
    if (isExportingPdf) return;
    setIsExportingPdf(true);
    setExportProgress('در حال آماده‌سازی صفحات...');

    try {
      if (viewMode !== 'brochure') {
        setViewMode('brochure');
        await new Promise((resolve) => setTimeout(resolve, 400));
      } else {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      const pageElements = Array.from(
        document.querySelectorAll<HTMLElement>('main .print-page')
      );

      if (pageElements.length === 0) {
        window.print();
        return;
      }

      await exportBrochureToPdf(pageElements, (msg) => setExportProgress(msg));
    } catch (err) {
      console.error('PDF export error:', err);
      window.print();
    } finally {
      setIsExportingPdf(false);
      setExportProgress('');
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F8] bg-tech-grid text-[#0F172A] flex flex-col">
      {/* ==================== INDUSTRIAL CORPORATE HEADER ==================== */}
      <header className="no-print sticky top-0 z-40 shadow-md">
        <div className="bg-[#0B192C] text-white px-6 lg:px-12 py-3 flex items-center justify-between gap-6 border-b border-white/10">
          {/* Right Zone (in RTL): OWJ Business Council Logo */}
          <a
            href="#top"
            onClick={() => setViewMode('interactive')}
            className="flex items-center gap-4 shrink-0 group"
          >
            <img
              src={EXTRACTED_ASSETS.owjLogoWhite}
              alt="OWJ Business Council - مشاوران مدیریت کسب و کار اوج"
              referrerPolicy="no-referrer"
              className="h-10 sm:h-12 w-auto object-contain transition-transform group-hover:scale-[1.02]"
            />
          </a>

          {/* Center Zone: Navigation Links */}
          <nav className="hidden xl:flex items-center gap-7 text-xs font-bold text-slate-200">
            <a
              href="#instructor"
              onClick={() => setViewMode('interactive')}
              className="hover:text-[#008B99] transition-colors whitespace-nowrap shrink-0"
            >
              مدرس و گواهینامه‌ها
            </a>
            <a
              href="#protocol"
              onClick={() => setViewMode('interactive')}
              className="hover:text-[#008B99] transition-colors whitespace-nowrap shrink-0"
            >
              پروتکل تجهیزات
            </a>
            <a
              href="#connection-test"
              onClick={() => setViewMode('interactive')}
              className="hover:text-[#008B99] transition-colors whitespace-nowrap shrink-0"
            >
              تست اتصال پیش از کلاس
            </a>
            <a
              href="#schedule"
              onClick={() => setViewMode('interactive')}
              className="hover:text-[#008B99] transition-colors whitespace-nowrap shrink-0"
            >
              زمان‌بندی و مقررات
            </a>
            <button
              type="button"
              onClick={() => setViewMode(viewMode === 'brochure' ? 'interactive' : 'brochure')}
              className={`hover:text-[#008B99] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                viewMode === 'brochure' ? 'text-[#008B99] font-black underline underline-offset-8' : ''
              }`}
            >
              کاتالوگ چاپی (۸ صفحه)
            </button>
          </nav>

          {/* Left Zone (in RTL): AJA Logo + PDF Export CTA */}
          <div className="flex items-center gap-4 shrink-0">
            <button
              type="button"
              onClick={handlePrint}
              disabled={isExportingPdf}
              className="px-4 py-2 text-xs font-bold text-white bg-[#008B99] hover:bg-[#007682] disabled:opacity-75 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 cursor-pointer shadow-sm"
            >
              {isExportingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{exportProgress || 'در حال ساخت PDF...'}</span>
                </>
              ) : (
                <>
                  <Printer className="w-3.5 h-3.5" />
                  <span>دانلود PDF کاتالوگ A4</span>
                </>
              )}
            </button>

            <div className="hidden sm:block h-7 w-px bg-white/20" />

            <a
              href="#instructor"
              onClick={() => setViewMode('interactive')}
              className="shrink-0 flex items-center group"
              title="ابوالفضل جعفری اصل — مدرس دوره"
            >
              <img
                src={EXTRACTED_ASSETS.ajaLogoWhite}
                alt="Abolfazl Jafari Asl - ابوالفضل جعفری اصل"
                referrerPolicy="no-referrer"
                className="h-9 sm:h-11 w-auto object-contain transition-transform group-hover:scale-[1.02]"
              />
            </a>
          </div>
        </div>

        {/* Process-Cyan Technical Ribbon */}
        <div className="h-1.5 w-full bg-[#008B99]" />
      </header>

      {/* ==================== WORKSPACE MODE BAR ==================== */}
      <div id="top" className="no-print bg-[#071322] text-white border-b border-white/10">
        <div className="max-w-[1320px] mx-auto px-6 lg:px-10 py-2.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 text-xs text-slate-300">
            <span className="font-bold text-white">{DOCUMENT_META.title}</span>
            <span aria-hidden="true" className="text-[#008B99]">·</span>
            <span>{DOCUMENT_META.organization}</span>
            <span aria-hidden="true" className="text-[#008B99]">·</span>
            <span className="text-[#38BDF8] font-bold">{DOCUMENT_META.clientProject}</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 p-1 bg-white/10 rounded-lg">
              <button
                type="button"
                onClick={() => setViewMode('interactive')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'interactive'
                    ? 'bg-white text-[#0B192C] shadow-sm font-bold'
                    : 'text-slate-200 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>نمای وب تعاملی و چک‌لیست اجرایی</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('brochure')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'brochure'
                    ? 'bg-white text-[#0B192C] shadow-sm font-bold'
                    : 'text-slate-200 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>نمای کاتالوگ ۸ صفحه‌ای (آماده چاپ A4)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== CONDITIONAL VIEW: 8-PAGE BROCHURE MODE ==================== */}
      {viewMode === 'brochure' ? (
        <main className="flex-1 py-10 px-4 sm:px-6 lg:px-10">
          <div className="no-print max-w-[850px] mx-auto mb-8 bg-white border border-slate-300 rounded-2xl p-5 space-y-4 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-1 bg-[#008B99]" />
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-base font-black text-[#0B192C]">
                  پیش‌نمایش کاتالوگ رسمی ۸ صفحه‌ای (استاندارد چاپ A4)
                </h2>
                <p className="text-xs text-slate-600 font-medium">
                  در فایل PDF خروجی، کد QR روی جلد و تمامی لینک‌های ارتباطی و سامانه‌ها به صورت مستقیم قابل کلیک و اسکن هستند.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handlePrint}
                  disabled={isExportingPdf}
                  className="px-4 py-2.5 text-xs font-bold text-white bg-[#008B99] hover:bg-[#007682] disabled:opacity-75 rounded-xl transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  {isExportingPdf ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>{exportProgress || 'در حال ساخت PDF...'}</span>
                    </>
                  ) : (
                    <>
                      <Printer className="w-3.5 h-3.5" />
                      <span>دانلود مستقیم PDF کاتالوگ A4</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('interactive')}
                  className="px-3 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  بازگشت به نمای تعاملی
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowUrlConfig((prev) => !prev);
                    setAdminPasswordError('');
                  }}
                  title="تنظیمات آدرس QR کد (محافظت‌شده با رمز عبور)"
                  className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
                    showUrlConfig
                      ? 'bg-[#0B192C] text-white border-[#0B192C]'
                      : 'bg-slate-50 text-slate-400 hover:text-slate-700 border-slate-200'
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Password-Protected Digital URL & QR Code Configurator */}
            {showUrlConfig && !isAdminUnlocked && (
              <form
                onSubmit={handleAdminPasswordSubmit}
                className="bg-[#F8FAFC] border border-slate-200/90 rounded-xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-slate-100"
              >
                <div className="flex items-center gap-2 text-xs font-bold text-[#1D4760]">
                  <Lock className="w-4 h-4 text-[#0284C7] shrink-0" />
                  <span>جهت دسترسی به تنظیمات لینک و QR کد، رمز عبور مدیریت را وارد نمایید:</span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    dir="ltr"
                    autoFocus
                    value={adminPasswordInput}
                    onChange={(e) => {
                      setAdminPasswordInput(e.target.value);
                      if (adminPasswordError) setAdminPasswordError('');
                    }}
                    placeholder="Password..."
                    className="w-44 px-3 py-1.5 text-xs font-latin bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#0284C7] text-slate-800"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#1D4760] hover:bg-[#0B253A] rounded-lg transition-colors cursor-pointer shrink-0"
                  >
                    تأیید
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowUrlConfig(false);
                      setAdminPasswordError('');
                      setAdminPasswordInput('');
                    }}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
                    title="بستن"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {adminPasswordError && (
                  <p className="w-full text-[11px] font-semibold text-red-600">
                    {adminPasswordError}
                  </p>
                )}
              </form>
            )}

            {showUrlConfig && isAdminUnlocked && (
              <div className="bg-[#F8FAFC] border border-slate-200/90 rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pt-4 border-t border-slate-100">
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="text-xs font-extrabold text-[#1D4760] flex items-center gap-1.5">
                      <QrCode className="w-4 h-4 text-[#0284C7]" />
                      <span>آدرس اینترنتی (URL) نسخه دیجیتال جهت درج در QR کد روی جلد و هایپرلینک‌های PDF:</span>
                    </label>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          localStorage.removeItem(DIGITAL_URL_STORAGE_KEY);
                          setDigitalUrl(getAutoDetectedPublicUrl());
                        }}
                        className="text-[11px] font-semibold text-[#0284C7] hover:underline cursor-pointer"
                      >
                        تشخیص خودکار آدرس دامنه
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAdminUnlocked(false);
                          setShowUrlConfig(false);
                        }}
                        className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                      >
                        <Lock className="w-3 h-3" />
                        <span>قفل کردن پنل</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Link2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="url"
                        dir="ltr"
                        value={digitalUrl}
                        onChange={(e) => setDigitalUrl(e.target.value)}
                        placeholder="https://your-username.github.io/cpmai-protocol/"
                        className="w-full pl-9 pr-3 py-2 text-xs font-latin bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#0284C7] text-slate-800"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyDigitalUrl}
                      className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedUrl ? 'کپی شد!' : 'کپی لینک'}</span>
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    این پنل با رمز عبور محافظت شده و برای مخاطبان قابل مشاهده نیست. همچنین سامانه به صورت خودکار آدرس هر دامنه‌ای که روی آن منتشر شود را تشخیص می‌دهد.
                  </p>
                </div>

                {digitalQrDataUrl && (
                  <div className="shrink-0 flex items-center gap-3 bg-white p-2.5 rounded-xl border border-slate-200 self-center">
                    <img
                      src={digitalQrDataUrl}
                      alt="QR Code"
                      className="w-16 h-16 object-contain"
                    />
                    <div className="space-y-1 text-right">
                      <span className="text-[11px] font-bold text-[#1D4760] block">
                        پیش‌نمایش QR جلد
                      </span>
                      <a
                        href={digitalQrDataUrl}
                        download="OWJ-CPMAI-Digital-QR.png"
                        className="text-[11px] font-semibold text-[#0284C7] hover:underline flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" />
                        <span>دانلود تصویر QR</span>
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <RedesignedBrochurePages
            onSelectImage={(src, title) => setLightbox({ src, title })}
            digitalUrl={digitalUrl.trim() || getAutoDetectedPublicUrl()}
            digitalQrDataUrl={digitalQrDataUrl}
          />
        </main>
      ) : (
        /* ==================== INTERACTIVE WEB REDESIGN VIEW ==================== */
        <>
          <main className="no-print flex-1">
            {/* 1. HERO SECTION (PAGE 1 REDESIGNED) */}
            <section className="relative bg-white border-b border-slate-200/90 overflow-hidden">
              <div className="max-w-[1320px] mx-auto px-6 lg:px-10 py-12 lg:py-16">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
                  {/* Right Column in RTL: Editorial Typography & Core Identity */}
                  <div className="lg:col-span-7 flex flex-col justify-between space-y-8">
                    <div className="space-y-6">
                      {/* Unboxed Metadata Line + Crisp Navy OWJ Logo */}
                      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-200">
                        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                          <span className="text-[#0284C7] font-bold">پروتکل رسمی آموزش سازمانی</span>
                          <span aria-hidden="true">·</span>
                          <span>دپارتمان کوچینگ اوج</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-latin">PMI-CPMAI / CPMAI v7</span>
                        </div>

                        <img
                          src={EXTRACTED_ASSETS.owjLogoNavy}
                          alt="لوگوی مشاوران مدیریت کسب و کار اوج"
                          referrerPolicy="no-referrer"
                          className="h-11 w-auto object-contain"
                        />
                      </div>

                      <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E0F7FA] border border-[#008B99]/30 text-[#007682] text-xs font-bold">
                          <span className="w-2 h-2 rounded-full bg-[#008B99] animate-pulse" />
                          <span>سلسله کارگاه‌های آموزشی تربیت متخصص حرفه‌ای راهبری هوش مصنوعی</span>
                        </div>
                        <h1
                          className="text-3xl sm:text-4xl lg:text-[44px] font-black text-[#0B192C] leading-[1.25] tracking-tight"
                          style={{ textWrap: 'balance' }}
                        >
                          {DOCUMENT_META.title}
                        </h1>
                        <p className="text-xl sm:text-2xl font-bold text-slate-700">
                          {DOCUMENT_META.organization}
                        </p>
                      </div>

                      {/* Target Client Highlight Card */}
                      <div className="bg-white border-2 border-[#008B99]/30 rounded-2xl p-6 space-y-3 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-1 bg-[#008B99]" />
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs font-bold text-slate-500">
                            تهیه و تدوین اختصاصی جهت اجرا در مجموعه معظم:
                          </span>
                          <span className="text-xs font-mono-num font-bold text-[#008B99] bg-[#E0F7FA] px-2.5 py-0.5 rounded-md border border-[#008B99]/20">
                            ۹ بند اجرایی · ۲۳ گواهینامه بین‌المللی مدرس
                          </span>
                        </div>
                        <div className="space-y-1">
                          <div className="text-2xl sm:text-3xl font-black text-[#008B99] tracking-tight">
                            {DOCUMENT_META.clientProject}
                          </div>
                          <div className="text-xs sm:text-sm font-bold text-slate-700">
                            {DOCUMENT_META.clientSubtitle}
                          </div>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed text-justify">
                          این سند شامل معرفی سوابق و گواهینامه‌های ۱۳گانه هوش مصنوعی مدرس دوره، ابلاغیه دپارتمان کوچینگ، استانداردهای فنی سالن، مشخصات سیستم شرکت‌کنندگان، پوستر تست اتصال پیش از کلاس، جدول زمان‌بندی و ضوابط حفظ حقوق مالکیت معنوی ویژه هلدینگ پایا سامان پارس و مؤسسه تحقیق و توسعه دانشمند است.
                        </p>
                      </div>
                    </div>

                    {/* Action Row & Preserved Contact Strip */}
                    <div className="space-y-6 pt-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <a
                          href="#protocol"
                          className="px-5 py-3 text-xs sm:text-sm font-bold text-white bg-[#0B192C] hover:bg-[#008B99] rounded-xl transition-colors whitespace-nowrap shrink-0 shadow-sm"
                        >
                          بررسی الزامات و چک‌لیست آماده‌سازی سالن
                        </a>
                        <a
                          href="#connection-test"
                          className="px-5 py-3 text-xs sm:text-sm font-bold text-white bg-[#059669] hover:bg-[#047857] rounded-xl transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 shadow-sm"
                        >
                          <Wifi className="w-4 h-4" />
                          <span>پروتکل تست اتصال پیش از کلاس</span>
                        </a>
                        <button
                          type="button"
                          onClick={() => setViewMode('brochure')}
                          className="px-5 py-3 text-xs sm:text-sm font-bold text-[#0B192C] bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-xs"
                        >
                          مشاهده کاتالوگ چاپی
                        </button>
                      </div>

                      {/* Preserved Original Contact Strip Image from Page 1 */}
                      <div className="pt-4 border-t border-slate-200">
                        <img
                          src={EXTRACTED_ASSETS.contactStrip}
                          alt="اطلاعات تماس مشاوران مدیریت کسب و کار اوج"
                          referrerPolicy="no-referrer"
                          className="w-full max-w-2xl h-auto object-contain"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Left Column in RTL: Full Uncropped Cover Artwork */}
                  <div className="lg:col-span-5 flex items-center justify-center">
                    <div
                      onClick={() =>
                        setLightbox({
                          src: EXTRACTED_ASSETS.coverFull,
                          title: 'طرح روی جلد سند پروتکل اجرایی — مؤسسه تحقیق و توسعه دانشمند',
                        })
                      }
                      className="relative w-full max-w-[460px] aspect-[1648/2381] rounded-2xl overflow-hidden border border-slate-300 shadow-xl group cursor-pointer bg-white"
                    >
                      <img
                        src={EXTRACTED_ASSETS.coverFull}
                        alt="پروتکل برگزاری بوت کمپ آموزشی CPMAI - مؤسسه تحقیق و توسعه دانشمند"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.01]"
                      />

                      {/* Bottom 29.5% Cover Typography, QR Code & Contact Strip */}
                      <div className="absolute inset-x-0 bottom-0 h-[29.5%] px-5 pb-3.5 pt-2 flex flex-col justify-between text-right bg-white border-t border-[#008B99]">
                        <div className="flex items-center justify-between gap-3">
                          <div className="space-y-1 flex-1">
                            <p className="text-xs sm:text-sm font-black text-[#0F172A] leading-snug">
                              {DOCUMENT_META.title}
                            </p>
                            <p className="text-sm sm:text-base font-black text-[#0F172A] leading-snug">
                              {DOCUMENT_META.organization}
                            </p>
                            <div className="w-full h-[2px] bg-[#008B99] my-1" />
                            <p className="text-sm sm:text-base font-extrabold text-[#008B99]">
                              {DOCUMENT_META.clientProject}
                            </p>
                          </div>

                          {digitalQrDataUrl && (
                            <div className="shrink-0 bg-white/95 border border-[#008B99] rounded-xl p-1.5 shadow-sm flex flex-col items-center text-center">
                              <img
                                src={digitalQrDataUrl}
                                alt="QR نسخه دیجیتال"
                                className="w-14 h-14 object-contain"
                              />
                              <span className="text-[8.5px] font-extrabold text-[#0B192C] mt-0.5">
                                نسخه دیجیتال
                              </span>
                            </div>
                          )}
                        </div>

                        <img
                          src={EXTRACTED_ASSETS.contactStrip}
                          alt="اطلاعات تماس مشاوران مدیریت کسب و کار اوج"
                          referrerPolicy="no-referrer"
                          className="w-full h-auto object-contain"
                        />
                      </div>

                      <div className="absolute top-3 left-3 bg-[#0B192C]/85 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ZoomIn className="w-3.5 h-3.5 text-[#38BDF8]" />
                        <span>بزرگ‌نمایی طرح کامل جلد</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Full-Width 4-Column Key Summary Strip Below Hero Split */}
                <div className="mt-10 pt-8 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-5 rounded-xl bg-white border border-slate-200/90 shadow-xs space-y-1 hover:border-[#008B99]/40 transition-colors">
                    <span className="text-xs font-medium text-slate-500 block">مدرس دوره</span>
                    <strong className="text-base font-black text-[#0B192C] block">
                      {DOCUMENT_META.instructorName}
                    </strong>
                    <span className="text-xs font-bold text-[#008B99] block">
                      مدیرعامل مشاوران مدیریت کسب و کار اوج
                    </span>
                  </div>

                  <div className="p-5 rounded-xl bg-white border border-slate-200/90 shadow-xs space-y-1 hover:border-[#008B99]/40 transition-colors">
                    <span className="text-xs font-medium text-slate-500 block">مرجع استاندارد آموزشی</span>
                    <strong className="text-base font-black text-[#0B192C] font-latin block">
                      PMI-CPMAI & CPMAI v7
                    </strong>
                    <span className="text-xs text-slate-600 block">
                      دارنده هر ۱۳ گواهینامه هوش مصنوعی PMI و Cognilytica
                    </span>
                  </div>

                  <div className="p-5 rounded-xl bg-white border border-slate-200/90 shadow-xs space-y-1 hover:border-[#008B99]/40 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-500">ساعات برگزاری جلسات</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="برنامه قطعی" />
                    </div>
                    <strong className="text-sm font-black text-[#0B192C] font-mono-num block">
                      چهارشنبه ۱۴-۱۸ · پنج‌شنبه ۸-۱۲
                    </strong>
                    <span className="text-xs text-slate-600 block">
                      پذیرایی میان‌وعده در زمان استراحت میان‌کلاسی
                    </span>
                  </div>

                  <div className="p-5 rounded-xl bg-white border border-slate-200/90 shadow-xs space-y-2 hover:border-[#008B99]/40 transition-colors">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-500">پیشرفت آماده‌سازی سالن</span>
                      <span className="font-mono-num font-bold text-[#008B99]">
                        {Math.round((completedCount / PROTOCOL_CLAUSES.length) * 100)}%
                      </span>
                    </div>
                    <strong className="text-base font-black text-[#008B99] font-mono-num block">
                      {completedCount} از {PROTOCOL_CLAUSES.length} بند اجرایی
                    </strong>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-[#008B99] h-full transition-all duration-300 rounded-full"
                        style={{ width: `${(completedCount / PROTOCOL_CLAUSES.length) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 2. OFFICIAL EXECUTIVE FOREWORD (PAGE 4 CONTENT) */}
            <section id="letter" className="py-14 lg:py-20 px-6 lg:px-10 max-w-[1320px] mx-auto">
              <div className="bg-white rounded-2xl border border-slate-300/80 shadow-xs p-8 sm:p-12 lg:p-14 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-1 bg-[#008B99]" />
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  <div className="lg:col-span-4 space-y-3 border-b lg:border-b-0 lg:border-l border-slate-200 pb-6 lg:pb-0 lg:pl-8">
                    <div className="text-xs font-bold text-[#008B99]">
                      صفحه ۴ سند · مکاتبه رسمی با کارفرما
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black text-[#0B192C] leading-tight">
                      ابلاغیه اجرای کامل پروتکل کارگاه‌های آموزشی CPMAI
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      صادرشده توسط {EXECUTIVE_LETTER.department} {EXECUTIVE_LETTER.company} خطاب به واحد مجری و ناظر کارگاه‌های آموزشی در {DOCUMENT_META.clientProject}
                    </p>
                  </div>

                  <div className="lg:col-span-8 space-y-6">
                    <div className="text-base font-bold text-[#0B192C]">
                      {EXECUTIVE_LETTER.invocation}
                    </div>
                    <p className="text-base sm:text-lg leading-[2.2] text-slate-800 text-justify font-medium">
                      {EXECUTIVE_LETTER.body}
                    </p>
                    <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
                      <div className="text-xs text-slate-500">
                        سند اختصاصی جهت بهره‌برداری در واحد آموزش و فناوری اطلاعات کارفرما
                      </div>
                      <div className="text-left">
                        <span className="text-xs text-slate-500 block">
                          {EXECUTIVE_LETTER.signOff}
                        </span>
                        <span className="text-sm font-extrabold text-[#008B99] block">
                          {EXECUTIVE_LETTER.department}
                        </span>
                        <span className="text-xs font-bold text-[#0B192C] block">
                          {EXECUTIVE_LETTER.company}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 3. INSTRUCTOR PROFILE, 23 CREDENTIALS & OFFICIAL PMI CERTIFICATES (PAGES 2 & 3) */}
            <section
              id="instructor"
              className="py-14 lg:py-20 bg-white border-y border-slate-200/90"
            >
              <div className="max-w-[1320px] mx-auto px-6 lg:px-10 space-y-12">
                {/* Instructor Hero Banner */}
                <div className="rounded-2xl overflow-hidden bg-gradient-to-l from-[#0B192C] via-[#0E2A47] to-[#123A60] text-white shadow-lg border border-[#0B192C]">
                  <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
                    {/* Right Column: Instructor Bio & QR Code */}
                    <div className="lg:col-span-7 p-8 sm:p-10 lg:p-12 flex flex-col justify-between space-y-6">
                      <div className="space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/15 pb-5">
                          <div className="flex items-center gap-4">
                            <img
                              src={EXTRACTED_ASSETS.owjLogoWhite}
                              alt="OWJ Business Council"
                              referrerPolicy="no-referrer"
                              className="h-12 w-auto object-contain"
                            />
                            <div className="h-8 w-px bg-white/20" />
                            <span className="text-xs sm:text-sm font-semibold text-[#38BDF8]">
                              مدرس دوره:
                            </span>
                          </div>
                          <img
                            src={EXTRACTED_ASSETS.ajaLogoWhite}
                            alt="AJA Abolfazl Jafari Asl"
                            referrerPolicy="no-referrer"
                            className="h-11 w-auto object-contain"
                          />
                        </div>

                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
                          {DOCUMENT_META.instructorName}
                        </h2>
                        <p className="text-lg sm:text-xl font-bold text-[#38BDF8]">
                          {DOCUMENT_META.instructorRole}
                        </p>
                        <p className="text-sm sm:text-base leading-relaxed text-slate-200 max-w-2xl">
                          {DOCUMENT_META.instructorDistinction}
                        </p>
                      </div>

                      {/* Preserved QR Code Card */}
                      <div className="pt-4 border-t border-white/15 flex flex-wrap items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                          <div
                            onClick={() =>
                              setLightbox({
                                src: EXTRACTED_ASSETS.qrCode,
                                title: 'کد QR رسمی ابوالفضل جعفری اصل',
                              })
                            }
                            className="bg-white p-2.5 rounded-xl shadow-md cursor-pointer hover:scale-105 transition-transform shrink-0"
                          >
                            <img
                              src={EXTRACTED_ASSETS.qrCode}
                              alt="QR Code Abolfazl Jafari Asl"
                              referrerPolicy="no-referrer"
                              className="w-20 h-20 object-contain"
                            />
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-bold text-white">
                              کد QR ارتباطی و استعلام مدارک مدرس
                            </p>
                            <p className="text-xs text-slate-300">
                              برای مشاهده تصویر کامل کد QR روی آن کلیک نمایید
                            </p>
                            <p className="text-xs font-latin text-[#38BDF8]">
                              (PMI-CPMAI) · (CPMAI v7) · (PMI)
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Left Column: Preserved Instructor Portrait Banner */}
                    <div className="lg:col-span-5 relative flex items-center justify-center p-6 lg:p-8 bg-black/20">
                      <div
                        onClick={() =>
                          setLightbox({
                            src: EXTRACTED_ASSETS.instructorBanner,
                            title:
                              'ابوالفضل جعفری اصل — مدیرعامل شرکت مشاوران مدیریت کسب و کار اوج',
                          })
                        }
                        className="relative w-full max-w-[420px] rounded-2xl overflow-hidden border border-white/20 shadow-xl cursor-pointer group bg-[#071322]"
                      >
                        <img
                          src={EXTRACTED_ASSETS.instructorBanner}
                          alt={DOCUMENT_META.instructorName}
                          referrerPolicy="no-referrer"
                          className="w-full h-[360px] object-cover masked-instructor-banner transition-transform duration-300 group-hover:scale-[1.02]"
                          style={{ objectPosition: '18% center' }}
                        />
                        <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white text-[11px] px-2.5 py-1 rounded-md flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5 text-[#38BDF8]" />
                          <span>مشاهده پرتره اصلی</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Preserved 4 Accrediting Institution Logos Strip (PMI, AXELOS, IPMA, IranPMA) */}
                <div className="bg-[#F8FAFC] border border-slate-200 rounded-2xl p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-1">
                      <h3 className="text-sm font-extrabold text-[#0B253A]">
                        نهادهای بین‌المللی و ملی صادرکننده گواهینامه‌های مدرس
                      </h3>
                      <p className="text-xs text-slate-500">
                        موسسه مدیریت پروژه آمریکا (PMI) · موسسه AXELOS انگلستان · انجمن جهانی مدیریت پروژه (IPMA) · انجمن مدیریت پروژه ایران (IranPMA)
                      </p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 items-center justify-items-center bg-white px-6 py-4 rounded-xl border border-slate-200/80 shrink-0">
                      <img
                        src={EXTRACTED_ASSETS.pmiLogo}
                        alt="PMI Project Management Institute"
                        referrerPolicy="no-referrer"
                        onClick={() =>
                          setLightbox({
                            src: EXTRACTED_ASSETS.pmiLogo,
                            title: 'Project Management Institute (PMI)',
                          })
                        }
                        className="h-11 w-auto object-contain cursor-pointer hover:opacity-80 transition-opacity"
                      />
                      <img
                        src={EXTRACTED_ASSETS.axelosLogo}
                        alt="AXELOS Global Best Practice"
                        referrerPolicy="no-referrer"
                        onClick={() =>
                          setLightbox({
                            src: EXTRACTED_ASSETS.axelosLogo,
                            title: 'AXELOS Global Best Practice',
                          })
                        }
                        className="h-9 w-auto object-contain cursor-pointer hover:opacity-80 transition-opacity"
                      />
                      <img
                        src={EXTRACTED_ASSETS.ipmaLogo}
                        alt="IPMA International Project Management Association"
                        referrerPolicy="no-referrer"
                        onClick={() =>
                          setLightbox({
                            src: EXTRACTED_ASSETS.ipmaLogo,
                            title: 'International Project Management Association (IPMA)',
                          })
                        }
                        className="h-11 w-auto object-contain cursor-pointer hover:opacity-80 transition-opacity"
                      />
                      <img
                        src={EXTRACTED_ASSETS.iranPmaLogo}
                        alt="IranPMA انجمن مدیریت پروژه ایران"
                        referrerPolicy="no-referrer"
                        onClick={() =>
                          setLightbox({
                            src: EXTRACTED_ASSETS.iranPmaLogo,
                            title: 'انجمن مدیریت پروژه ایران (IranPMA)',
                          })
                        }
                        className="h-12 w-auto object-contain cursor-pointer hover:opacity-80 transition-opacity"
                      />
                    </div>
                  </div>
                </div>

                {/* Official PMI Certificates Showcase */}
                <div className="space-y-5">
                  <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-4">
                    <div>
                      <span className="text-xs font-bold text-[#008B99] block">
                        اسناد رسمی پیوست‌شده در صفحه ۳ کاتالوگ
                      </span>
                      <h3 className="text-xl sm:text-2xl font-black text-[#0B192C] mt-1">
                        تصاویر گواهینامه‌های رسمی PMI آمریکا (CPMAI v7 و PMI-CPMAI)
                      </h3>
                    </div>
                    <span className="text-xs text-slate-500">
                      برای بررسی جزئیات، امضاها و شماره گواهینامه روی هر تصویر کلیک کنید
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {OFFICIAL_CERTIFICATES.map((cert) => (
                      <div
                        key={cert.id}
                        onClick={() => setLightbox({ src: cert.image, title: cert.titleFa })}
                        className="group cursor-pointer rounded-2xl border border-slate-300/80 bg-white p-5 hover:border-[#008B99] transition-all flex flex-col justify-between space-y-4 shadow-xs"
                      >
                        <div className="relative rounded-xl overflow-hidden bg-slate-50 border border-slate-200 p-2">
                          <img
                            src={cert.image}
                            alt={cert.titleEn}
                            referrerPolicy="no-referrer"
                            className="w-full h-64 sm:h-72 object-contain mx-auto transition-transform duration-300 group-hover:scale-[1.02]"
                          />
                          <div className="absolute top-3 left-3 bg-[#0B192C]/85 text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <ZoomIn className="w-3.5 h-3.5 text-[#38BDF8]" />
                            <span>بزرگ‌نمایی گواهینامه</span>
                          </div>
                        </div>

                        <div className="space-y-1.5 px-1">
                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <span className="font-latin font-bold text-[#008B99]">
                              {cert.titleEn}
                            </span>
                            <span className="font-mono-num font-semibold">
                              Certification No: {cert.certNumber}
                            </span>
                          </div>
                          <h4 className="text-base font-black text-[#0B192C]">{cert.titleFa}</h4>
                          <p className="text-xs text-slate-500 font-latin">
                            Issued by {cert.issuer} · Grant Date: {cert.grantDate}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Interactive Filterable 23 Credentials Directory (13 AI Certs + 10 PM Certs) */}
                <div className="space-y-6 pt-4">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-5">
                    <div className="space-y-1">
                      <h3 className="text-xl sm:text-2xl font-black text-[#0B192C]">
                        فهرست کامل گواهینامه‌های ۱۳گانه هوش مصنوعی و ۱۰ مدرک مدیریت پروژه
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600">
                        تمامی عناوین مندرج در صفحات ۲ و ۳ سند اصلی به صورت کامل و بدون هیچ‌گونه حذفیات
                      </p>
                    </div>

                    {/* Interactive Segmented Filter Control + Search */}
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200">
                        <button
                          type="button"
                          onClick={() => setCredFilter('all')}
                          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                            credFilter === 'all'
                              ? 'bg-[#0B192C] text-white shadow-xs font-bold'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          همه موارد (۲۳)
                        </button>
                        <button
                          type="button"
                          onClick={() => setCredFilter('ai')}
                          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                            credFilter === 'ai'
                              ? 'bg-[#008B99] text-white shadow-xs font-bold'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          گواهینامه‌های ۱۳گانه هوش مصنوعی (۱۳)
                        </button>
                        <button
                          type="button"
                          onClick={() => setCredFilter('pm')}
                          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                            credFilter === 'pm'
                              ? 'bg-[#0B192C] text-white shadow-xs font-bold'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          مدارک مدیریت پروژه (۱۰)
                        </button>
                      </div>

                      <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          value={credSearch}
                          onChange={(e) => setCredSearch(e.target.value)}
                          placeholder="جستجو در گواهینامه‌ها..."
                          className="pr-9 pl-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#008B99] w-52 text-slate-800"
                        />
                      </div>
                    </div>
                  </div>

                  {filteredCredentials.length === 0 ? (
                    <div className="p-10 text-center bg-white rounded-xl border border-slate-300 space-y-2">
                      <p className="text-sm font-semibold text-slate-700">
                        موردی مطابق با عبارت جستجوشده یافت نشد.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setCredFilter('all');
                          setCredSearch('');
                        }}
                        className="text-xs font-bold text-[#008B99] hover:underline cursor-pointer"
                      >
                        نمایش مجدد تمامی ۲۳ گواهینامه
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {filteredCredentials.map((cred) => {
                        const isAi = cred.category === 'ai';
                        return (
                          <div
                            key={cred.id}
                            className={`p-4 rounded-xl bg-white border flex flex-col justify-between gap-2.5 transition-all shadow-xs ${
                              isAi
                                ? 'border-slate-300 hover:border-[#008B99]'
                                : 'border-slate-300 hover:border-[#0B192C]'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <span
                                className={`text-xs font-mono-num font-bold px-2 py-0.5 rounded-md mt-0.5 shrink-0 ${
                                  isAi
                                    ? 'bg-[#E0F7FA] text-[#008B99] border border-[#008B99]/30'
                                    : 'bg-slate-100 text-[#0B192C] border border-slate-300'
                                }`}
                              >
                                {cred.index}
                              </span>
                              <p className="text-sm font-bold text-[#0B192C] leading-snug">
                                {cred.titleFa}
                              </p>
                            </div>
                            <div className="pr-10 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                              <span className="font-medium text-slate-600">
                                {cred.groupLabel} · {cred.organizationFa}
                              </span>
                              <span className="font-latin font-bold text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                                {cred.code}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* 4. HALL PREPARATION, SYSTEM SPECS & INTERACTIVE CHECKLIST (PAGE 5 & 6 CLAUSES) */}
            <section
              id="protocol"
              className="py-14 lg:py-20 max-w-[1320px] mx-auto px-6 lg:px-10 space-y-10"
            >
              {/* Section Heading + Intro Text */}
              <div className="bg-[#0B192C] text-white rounded-2xl p-8 sm:p-10 space-y-5 border border-[#0B192C] shadow-md relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-1.5 bg-[#008B99]" />
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-bold text-[#38BDF8]">
                    <span>صفحات ۵ و ۶ سند · دستورالعمل اجرایی و چک‌لیست تحویل سالن</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono-num text-slate-300">
                      وضعیت تکمیل: {completedCount} از {PROTOCOL_CLAUSES.length} مورد
                    </span>
                    <span className="text-xs font-mono-num font-bold text-[#38BDF8] bg-white/10 px-2.5 py-1 rounded-md">
                      {Math.round((completedCount / PROTOCOL_CLAUSES.length) * 100)}%
                    </span>
                  </div>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black">
                  الزامات آماده‌سازی سالن، تجهیزات فنی و سیستم‌های شرکت‌کنندگان
                </h2>
                <p className="text-sm sm:text-base text-slate-200 leading-relaxed max-w-4xl text-justify">
                  {PROTOCOL_INTRO}
                </p>

                {/* Progress bar */}
                <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-[#008B99] h-full transition-all duration-300 rounded-full"
                    style={{ width: `${(completedCount / PROTOCOL_CLAUSES.length) * 100}%` }}
                  />
                </div>

                {/* Filter & Checklist Action Controls */}
                <div className="pt-4 border-t border-white/15 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-1.5 p-1 bg-white/10 rounded-lg">
                    {(
                      [
                        { id: 'all', label: `همه بندها (${PROTOCOL_CLAUSES.length})` },
                        { id: 'hardware', label: 'لپ‌تاپ مدرس و تصویر' },
                        { id: 'participants', label: 'سیستم شرکت‌کنندگان' },
                        { id: 'classroom', label: 'وایت‌برد و پک آموزشی' },
                        { id: 'hospitality', label: 'آب معدنی و پذیرایی' },
                        { id: 'legal', label: 'مالکیت معنوی و ضبط' },
                      ] as const
                    ).map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setProtocolCategory(tab.id)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          protocolCategory === tab.id
                            ? 'bg-[#008B99] text-white font-bold shadow-xs'
                            : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={checkAllClauses}
                      className="px-3.5 py-1.5 text-xs font-bold bg-[#008B99] hover:bg-[#007682] text-white rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <CheckSquare className="w-3.5 h-3.5" />
                      <span>تایید همه موارد</span>
                    </button>
                    <button
                      type="button"
                      onClick={resetChecklist}
                      className="px-3.5 py-1.5 text-xs font-medium bg-white/10 hover:bg-white/20 text-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>بازنشانی چک‌لیست</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Protocol Clauses Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredClauses.map((clause) => {
                  const isChecked = !!checkedIds[clause.id];
                  return (
                    <div
                      key={clause.id}
                      className={`rounded-2xl border p-6 sm:p-7 flex flex-col justify-between space-y-5 transition-all bg-white shadow-xs ${
                        isChecked
                          ? 'border-emerald-500/80 bg-emerald-50/15'
                          : 'border-slate-300/80 hover:border-slate-400'
                      }`}
                    >
                      <div className="space-y-4">
                        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3.5">
                          <div>
                            <span className="text-xs font-mono-num font-bold text-[#008B99] block">
                              بند اجرایی {clause.index}
                            </span>
                            <h3 className="text-lg font-black text-[#0B192C] mt-0.5">
                              {clause.title}
                            </h3>
                          </div>

                          <button
                            type="button"
                            onClick={() => toggleChecklist(clause.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                              isChecked
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {isChecked ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>آماده و بررسی شد</span>
                              </>
                            ) : (
                              <>
                                <Square className="w-3.5 h-3.5" />
                                <span>ثبت در چک‌لیست</span>
                              </>
                            )}
                          </button>
                        </div>

                        <p className="text-sm text-slate-700 leading-[1.95] text-justify font-medium">
                          {clause.leadText}
                        </p>

                        {clause.bullets && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                            {clause.bullets.map((bullet, idx) => (
                              <div
                                key={idx}
                                className="px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-[#0B192C] flex items-center gap-2"
                              >
                                <span className="text-[#008B99] font-black text-sm">•</span>
                                <span>{bullet}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {clause.highlightNote && (
                          <div className="p-4 rounded-xl bg-amber-50 border border-amber-300/80 text-xs font-bold text-amber-950 leading-relaxed">
                            {clause.highlightNote}
                          </div>
                        )}
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                        <span>شاخص کنترل اجرایی: {clause.checklistLabel}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* 5. PRE-CLASS CONNECTION TEST POSTER & INTERACTIVE PROTOCOL SECTION */}
            <section id="connection-test" className="py-14 lg:py-20 max-w-[1320px] mx-auto px-6 lg:px-10">
              <div className="rounded-2xl overflow-hidden bg-[#0B192C] text-white border border-[#0B192C] shadow-xl relative">
                <div className="absolute top-0 right-0 w-44 h-1.5 bg-[#008B99]" />
                <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
                  {/* Right Column in RTL: Interactive 3-Step Connection Readiness Guide */}
                  <div className="lg:col-span-7 p-8 sm:p-10 lg:p-12 flex flex-col justify-between space-y-8">
                    <div className="space-y-5">
                      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
                        <div className="flex items-center gap-2.5 text-xs font-bold text-[#38BDF8]">
                          <Wifi className="w-4 h-4 text-[#008B99]" />
                          <span>{CONNECTION_TEST_PROTOCOL.kicker}</span>
                          <span className="text-slate-500">·</span>
                          <span className="text-slate-300">ویژه تمامی شرکت‌کنندگان بوت‌کمپ</span>
                        </div>

                        <a
                          href={EXTRACTED_ASSETS.connectionTestPoster}
                          download="CPMAI-PreClass-Connection-Test-Poster.png"
                          className="px-3.5 py-1.5 text-xs font-bold bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
                        >
                          <Download className="w-3.5 h-3.5 text-[#38BDF8]" />
                          <span>دانلود پوستر اطلاع‌رسانی</span>
                        </a>
                      </div>

                      <div className="space-y-3">
                        <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-black leading-tight text-white">
                          قبل از کلاس، <span className="text-[#38BDF8]">اتصالت</span> را تست کن
                        </h2>
                        <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl text-justify">
                          {CONNECTION_TEST_PROTOCOL.subheadline}
                        </p>
                      </div>

                      {/* 3 Steps Grid matching the Poster */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                        {CONNECTION_TEST_PROTOCOL.steps.map((step) => (
                          <div
                            key={step.num}
                            className="rounded-2xl bg-[#13243C] border border-white/10 p-5 space-y-3 flex flex-col justify-between"
                          >
                            <div className="flex items-center justify-between">
                              <h3 className="text-base font-black text-white">{step.title}</h3>
                              <span className="text-2xl font-black text-amber-400 font-mono-num">
                                {step.num}
                              </span>
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed font-medium">
                              {step.description}
                            </p>
                          </div>
                        ))}
                      </div>

                      {/* White Action Box matching the Poster */}
                      <div className="rounded-2xl bg-white text-[#0B192C] p-6 sm:p-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-md border border-slate-200">
                        <div className="space-y-4 flex-1">
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="text-xl font-black text-[#0B192C]">
                              {CONNECTION_TEST_PROTOCOL.ctaTitle}
                            </h3>
                            <a
                              href={CONNECTION_TEST_PROTOCOL.testUrlFull}
                              target="_blank"
                              rel="noreferrer"
                              className="px-4 py-1.5 rounded-lg bg-[#0B192C] hover:bg-slate-800 text-[#38BDF8] font-latin text-sm font-bold inline-flex items-center gap-1.5 transition-colors shadow-xs"
                            >
                              <span>{CONNECTION_TEST_PROTOCOL.testUrl}</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>

                          <div className="space-y-2">
                            {CONNECTION_TEST_PROTOCOL.checkItems.map((item, idx) => {
                              const checked = !!connChecks[idx];
                              return (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => toggleConnCheck(idx)}
                                  className="w-full text-right flex items-center gap-2.5 text-sm font-bold text-slate-800 hover:text-[#008B99] transition-colors cursor-pointer"
                                >
                                  <span
                                    className={`w-5 h-5 rounded-full flex items-center justify-center text-xs transition-colors shrink-0 font-bold ${
                                      checked
                                        ? 'bg-[#008B99] text-white'
                                        : 'bg-slate-100 text-slate-400 border border-slate-300'
                                    }`}
                                  >
                                    ✓
                                  </span>
                                  <span>{item}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="shrink-0 flex flex-col items-center gap-2 self-center">
                          <button
                            type="button"
                            onClick={() => {
                              setConnChecks({ 0: true, 1: true, 2: true });
                              setCheckedIds((prev) => ({
                                ...prev,
                                'clause-connection-test': true,
                              }));
                            }}
                            className={`px-5 py-3 rounded-full text-xs sm:text-sm font-black transition-all cursor-pointer whitespace-nowrap shadow-sm ${
                              allConnVerified
                                ? 'bg-[#008B99] text-white shadow-md'
                                : 'bg-[#008B99] hover:bg-[#007682] text-white'
                            }`}
                          >
                            {allConnVerified
                              ? 'اتصال تایید شد ✅ آماده حضور در کلاس!'
                              : CONNECTION_TEST_PROTOCOL.badgeText}
                          </button>
                          <span className="text-[11px] text-slate-500 font-medium">
                            برای ثبت وضعیت آمادگی کلیک کنید
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Footer Warning Note */}
                    <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs sm:text-sm text-slate-300">
                      <p className="font-semibold">
                        این تست را <span className="text-[#38BDF8] font-bold">پیش از شروع دوره</span> انجام بده؛ وقت کلاس برای یادگیری است، نه عیب‌یابی اتصال.
                      </p>
                    </div>
                  </div>

                  {/* Left Column in RTL: Full Embedded Poster Image */}
                  <div className="lg:col-span-5 bg-[#060E18] p-6 sm:p-8 flex flex-col items-center justify-center border-t lg:border-t-0 lg:border-r border-white/10">
                    <div
                      onClick={() =>
                        setLightbox({
                          src: EXTRACTED_ASSETS.connectionTestPoster,
                          title: 'پوستر رسمی پروتکل شروع دوره — قبل از کلاس، اتصالت را تست کن',
                        })
                      }
                      className="relative w-full max-w-[390px] rounded-2xl overflow-hidden border border-white/15 shadow-2xl cursor-pointer group"
                    >
                      <img
                        src={EXTRACTED_ASSETS.connectionTestPoster}
                        alt="پروتکل شروع دوره - قبل از کلاس اتصالت را تست کن"
                        referrerPolicy="no-referrer"
                        className="w-full h-auto object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                      />
                      <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                        <ZoomIn className="w-3.5 h-3.5 text-[#38BDF8]" />
                        <span>بزرگ‌نمایی پوستر</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 6. DAILY TIMELINE & INTELLECTUAL PROPERTY / CONFIDENTIALITY (PAGE 6) */}
            <section
              id="schedule"
              className="py-14 lg:py-20 bg-white border-y border-slate-200/90"
            >
              <div className="max-w-[1320px] mx-auto px-6 lg:px-10 space-y-12">
                {/* Daily Bootcamp Timeline */}
                <div className="space-y-6">
                  <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-4">
                    <div>
                      <span className="text-xs font-bold text-[#008B99] block">
                        جدول زمان‌بندی رسمی برگزاری بوت‌کمپ
                      </span>
                      <h2 className="text-2xl sm:text-3xl font-black text-[#0B192C] mt-1">
                        برنامه هفتگی کلاس‌ها و پذیرایی میان‌وعده
                      </h2>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">
                      پذیرایی میان‌وعده صرفاً در زمان استراحت میان‌کلاسی در فضای پیش‌بینی‌شده انجام می‌پذیرد
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {DAILY_SCHEDULE.map((slot, i) => (
                      <div
                        key={slot.id}
                        className="rounded-2xl border border-slate-300/80 bg-white p-6 sm:p-7 flex flex-col justify-between space-y-4 shadow-xs hover:border-[#008B99] transition-colors"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <span className="font-bold">جلسه ۰{i + 1}</span>
                            <span className="font-mono-num text-[#008B99] font-bold">
                              ساعت رسمی
                            </span>
                          </div>
                          <div className="text-3xl font-black text-[#0B192C] font-mono-num">
                            {slot.timeRange}
                          </div>
                          <h3 className="text-lg font-black text-slate-800">
                            {slot.title}
                          </h3>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed pt-3 border-t border-slate-100 font-medium">
                          {slot.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Intellectual Property & Confidentiality Banner */}
                <div className="rounded-2xl bg-[#0B192C] text-white p-8 sm:p-10 lg:p-12 border border-[#0B192C] shadow-md relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-36 h-1.5 bg-[#D97706]" />
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                    {/* Preserved Copyright Shield Image */}
                    <div className="lg:col-span-3 flex flex-col items-center text-center space-y-3">
                      <div
                        onClick={() =>
                          setLightbox({
                            src: EXTRACTED_ASSETS.copyrightShield,
                            title:
                              'نشان صیانت از حقوق مالکیت مادی و معنوی شرکت مشاوران مدیریت کسب و کار اوج',
                          })
                        }
                        className="cursor-pointer hover:scale-105 transition-transform"
                      >
                        <img
                          src={EXTRACTED_ASSETS.copyrightShield}
                          alt="حفظ حقوق مالکیت معنوی شرکت اوج"
                          referrerPolicy="no-referrer"
                          className="w-36 h-36 object-contain masked-ip-shield mx-auto"
                        />
                      </div>
                      <span className="text-xs text-[#38BDF8] font-bold">
                        حفاظت از دارایی‌های فکری اوج
                      </span>
                    </div>

                    {/* Verbatim IP & Confidentiality Text */}
                    <div className="lg:col-span-9 space-y-5">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-amber-400 font-bold">
                        <ShieldAlert className="w-4 h-4 text-amber-400" />
                        <span>حفظ حقوق مالکیت معنوی و عدم افشای محتوای اختصاصی</span>
                      </div>

                      <p className="text-sm sm:text-base leading-[2.05] text-slate-100 text-justify font-medium">
                        به منظور حفظ حقوق مالکیت معنوی متعلق به شرکت اوج، ضروری است در فرآیند آماده‌سازی سالن و تجهیزات مورد استفاده، کلیه الزامات و تمهیدات لازم جهت صیانت از محتوای آموزشی و سایر دارایی‌های فکری متعلق به شرکت مشاوران مدیریت کسب و کار اوج و مدرسین متبوع آن رعایت و اجرا گردد.
                      </p>

                      <div className="bg-amber-500/15 border border-amber-400/40 rounded-xl px-5 py-3.5 text-xs sm:text-sm font-black text-amber-200">
                        * توجه: خواهشمند است، از هرگونه ضبط صدای مدرسین در طول برگزاری دوره اکیداً خودداری شود.
                      </div>

                      <div className="pt-4 border-t border-white/15 space-y-2 text-xs sm:text-sm text-slate-300 leading-relaxed text-justify font-normal">
                        <p>{CONFIDENTIALITY_STATEMENT.body}</p>
                        <p className="font-bold text-white pt-1">
                          {CONFIDENTIALITY_STATEMENT.closing}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 7. LOCATION MAP, BACK COVER & CONTACT DIRECTORY (PAGE 7) */}
            <section className="py-14 lg:py-20 max-w-[1320px] mx-auto px-6 lg:px-10 space-y-12">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                {/* Right Column: Contact Details & Offices */}
                <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-300/80 p-8 flex flex-col justify-between space-y-8 shadow-xs">
                  <div className="space-y-6">
                    <div className="space-y-2 border-b border-slate-200 pb-5">
                      <span className="text-xs font-bold text-[#008B99] block">
                        صفحه آخر سند · اطلاعات تماس و دفاتر مرکزی
                      </span>
                      <h2 className="text-2xl font-black text-[#0B192C]">
                        {DOCUMENT_META.organization}
                      </h2>
                      <p className="text-xs font-latin text-slate-500 font-semibold">
                        {DOCUMENT_META.organizationEn} · {DOCUMENT_META.website}
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                        <div className="flex items-center gap-2 text-xs font-bold text-[#008B99]">
                          <MapPin className="w-4 h-4" />
                          <span>دفتر مرکزی تهران</span>
                        </div>
                        <p className="text-sm font-bold text-[#0B192C]">
                          {DOCUMENT_META.addresses.tehran}
                        </p>
                        <p className="text-xs font-mono-num font-semibold text-slate-600" dir="ltr">
                          {DOCUMENT_META.phones.tehran}
                        </p>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                        <div className="flex items-center gap-2 text-xs font-bold text-[#008B99]">
                          <MapPin className="w-4 h-4" />
                          <span>دفتر مرکزی تبریز</span>
                        </div>
                        <p className="text-sm font-bold text-[#0B192C]">
                          {DOCUMENT_META.addresses.tabriz}
                        </p>
                        <p className="text-xs font-mono-num font-semibold text-slate-600" dir="ltr">
                          {DOCUMENT_META.phones.tabriz}
                        </p>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-bold text-[#0B192C]">
                          <Phone className="w-4 h-4 text-[#008B99]" />
                          <span>درگاه رسمی اینترنتی</span>
                        </div>
                        <a
                          href={`https://${DOCUMENT_META.website}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-latin font-bold text-[#008B99] hover:underline"
                        >
                          {DOCUMENT_META.website}
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Preserved Contact Strip Image */}
                  <div className="pt-4 border-t border-slate-200">
                    <img
                      src={EXTRACTED_ASSETS.contactStrip}
                      alt="اطلاعات تماس مشاوران مدیریت کسب و کار اوج"
                      referrerPolicy="no-referrer"
                      className="w-full h-auto object-contain"
                    />
                  </div>
                </div>

                {/* Left Column: Preserved Back Cover & Tajrish Map */}
                <div className="lg:col-span-7 flex flex-col gap-6">
                  <div
                    onClick={() =>
                      setLightbox({
                        src: EXTRACTED_ASSETS.backCoverMap,
                        title:
                          'نقشه موقعیت دفتر میدان تجریش و طرح پشت جلد — مشاوران مدیریت کسب و کار اوج',
                      })
                    }
                    className="relative flex-1 min-h-[360px] rounded-2xl overflow-hidden border border-slate-300 shadow-xs cursor-pointer group bg-white flex flex-col justify-between"
                  >
                    <img
                      src={EXTRACTED_ASSETS.backCoverMap}
                      alt="نقشه میدان تجریش - مشاوران مدیریت کسب و کار اوج"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      style={{ objectPosition: 'center 88%' }}
                    />
                    <div className="absolute top-4 left-4 bg-[#0B192C]/85 backdrop-blur-sm text-white text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5">
                      <ZoomIn className="w-3.5 h-3.5 text-[#38BDF8]" />
                      <span>مشاهده کامل پوستر پشت جلد و نقشه</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </main>

          {/* Hidden in screen, visible when printing directly from Interactive Mode */}
          <div className="hidden print:block">
            <RedesignedBrochurePages
              digitalUrl={digitalUrl.trim() || DEFAULT_PUBLIC_APP_URL}
              digitalQrDataUrl={digitalQrDataUrl}
            />
          </div>
        </>
      )}

      {/* ==================== PICTURE 8 STYLE ANGLED GEOMETRIC FOOTER ==================== */}
      <footer className="no-print bg-white pt-6 select-none">
        <div className="relative h-24 w-full flex items-end overflow-hidden">
          {/* Right side in RTL: Deep Teal-Navy Bar (#1D4760) */}
          <div className="w-full h-14 bg-[#1D4760] flex items-center justify-between px-6 lg:px-12 text-xs text-slate-200">
            <div className="flex flex-wrap items-center gap-4">
              <img
                src={EXTRACTED_ASSETS.owjLogoWhite}
                alt="OWJ Business Council"
                referrerPolicy="no-referrer"
                className="h-9 w-auto object-contain"
              />
              <span className="text-[#37A3DC]">·</span>
              <span className="font-semibold text-white">
                تمامی حقوق مادی و معنوی متعلق به {DOCUMENT_META.organization} می‌باشد.
              </span>
              <span className="text-[#37A3DC] hidden md:inline">·</span>
              <span className="text-[#7DD3FC] font-bold hidden md:inline">
                {DOCUMENT_META.clientProject}
              </span>
            </div>
          </div>

          {/* Left side in RTL: Geometric Angled Cyan Trapezoid + Parallel Diagonal Stripe from Picture8 */}
          <div className="absolute left-0 bottom-0 h-24 w-80 sm:w-96 pointer-events-none">
            <svg
              viewBox="0 0 380 96"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full"
              preserveAspectRatio="none"
            >
              {/* White separator gap */}
              <polygon points="0,0 290,0 358,96 0,96" fill="#FFFFFF" />
              {/* Parallel secondary diagonal stripe */}
              <polygon points="292,40 326,40 366,96 332,96" fill="#2E8BC0" />
              {/* Main cyan trapezoid (#37A3DC) */}
              <polygon points="0,0 280,0 344,96 0,96" fill="#37A3DC" />
            </svg>
            <div className="absolute inset-y-0 left-8 sm:left-14 flex items-center gap-4">
              <img
                src={EXTRACTED_ASSETS.ajaLogoWhite}
                alt="Abolfazl Jafari Asl"
                referrerPolicy="no-referrer"
                className="h-9 sm:h-10 w-auto object-contain"
              />
            </div>
          </div>
        </div>
      </footer>

      {/* ==================== IMAGE LIGHTBOX MODAL ==================== */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          className="no-print fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200"
          >
            <div className="px-6 py-4 bg-[#0B253A] text-white flex items-center justify-between">
              <h3 className="text-sm font-bold truncate">{lightbox.title}</h3>
              <button
                type="button"
                onClick={() => setLightbox(null)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                aria-label="بستن"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 bg-slate-900/95 flex-1 overflow-auto flex items-center justify-center">
              <img
                src={lightbox.src}
                alt={lightbox.title}
                referrerPolicy="no-referrer"
                className="max-w-full max-h-[72vh] object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
