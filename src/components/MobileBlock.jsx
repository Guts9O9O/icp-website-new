import { getSite } from '../lib/api';
import { useData } from '../lib/useData';
import { useSeo } from '../lib/seo';
import LottieMark, { artAspect } from './chrome/LottieMark';

// Shown instead of the site on phones (client requirement: desktop/tablet only).
export default function MobileBlock() {
  useSeo({ noindex: true });
  const { data: site } = useData(getSite);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-icp-slate px-8 text-center font-brand text-icp-mist">
      <img src="/images/Cover Page.jpg.png" alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-icp-slate/70" />
      <div className="absolute inset-y-0 left-0 w-2 bg-icp-red" />
      <div className="absolute inset-y-0 right-0 w-2 bg-icp-mist" />

      <div className="relative">
        {/* The logo artwork already contains the wordmark. */}
        <LottieMark
          mark="logo"
          mode="intro"
          className="mx-auto"
          style={{ width: '260px', height: `${260 / artAspect('logo')}px` }}
        />
        <h1 className="sr-only">iConcepts + Partners</h1>
        <p className="mx-auto mt-6 max-w-[300px] text-[15px] leading-relaxed text-icp-mist/90">
          This website is designed for larger screens. Please visit us on a tablet or desktop.
        </p>
        {site && (
          <p className="mt-8 text-[14px] leading-loose text-icp-mist/80">
            <a href={`tel:${site.phone.replace(/\s+/g, '')}`} className="block">{site.phone}</a>
            <a href={`mailto:${site.email}`} className="block">{site.email}</a>
          </p>
        )}
      </div>

      <p className="absolute bottom-6 text-[11px] text-icp-mist/60">2026 iConcepts+Partners. All Rights Reserved</p>
    </div>
  );
}
