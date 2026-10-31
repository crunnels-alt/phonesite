import type { Metadata } from 'next';
import { ContactForm } from '@/components/ContactForm';
import { PHONE_NUMBER } from '@/lib/sections';

export const metadata: Metadata = { title: 'About · Connor Runnels' };

const LINKS = [
  { label: 'connorrunnels@gmail.com', href: 'mailto:connorrunnels@gmail.com' },
  { label: 'Instagram', href: 'https://instagram.com/crunnels_' },
  { label: 'GitHub', href: 'https://github.com/crunnels-alt' },
];

export default function AboutPage() {
  return (
    <main className="grid grid-cols-1 gap-16 px-4 py-16 sm:px-[5%] md:grid-cols-12 md:gap-x-6 md:py-24">
      <div className="flex flex-col gap-6 md:col-span-5 md:col-start-2">
        <h1 className="text-[44px] leading-[1.05] tracking-[-0.02em]">Connor Runnels</h1>
        <p className="text-[19px] leading-normal text-ink-2">Digital practitioner working across media. Based in San Francisco.</p>
        <p className="text-[19px] leading-normal text-ink-2">Call {PHONE_NUMBER} and press digits to move around this site.</p>
        <ul className="mt-4 flex flex-col gap-1.5 text-[15px]">
          {LINKS.map(({ label, href }) => (
            <li key={href}>
              <a href={href} className="hover:text-ink-2" {...(href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
                {label}
              </a>
            </li>
          ))}
        </ul>
      </div>
      <div className="md:col-span-4 md:col-start-8 md:mt-40 md:self-end">
        <ContactForm />
      </div>
    </main>
  );
}
