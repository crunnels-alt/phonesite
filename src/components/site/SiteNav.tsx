'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/cn';
import { PHONE_NUMBER, SECTIONS, sectionByDigit } from '@/lib/sections';

const isActive = (pathname: string, href: string) =>
  href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);

export function SiteNav() {
  const pathname = usePathname();
  const router = useRouter();

  // Number keys mirror the phone keypad.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (target.closest('input, textarea, select, [contenteditable="true"]')) return;
      const section = sectionByDigit(event.key);
      if (section) router.push(section.href);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [router]);

  return (
    <nav className="flex flex-wrap items-baseline gap-x-9 gap-y-2 px-4 py-6 text-[15px] text-ink-3 sm:px-[5%]">
      {SECTIONS.map((section) => (
        <Link
          key={section.id}
          href={section.href}
          aria-current={isActive(pathname, section.href) ? 'page' : undefined}
          className={cn('hover:text-ink', isActive(pathname, section.href) && 'text-ink')}
        >
          <sup className="mr-[3px] text-[9px]">{section.digit}</sup>
          {section.label}
        </Link>
      ))}
      <span className="grow" />
      <a href={`tel:${PHONE_NUMBER.replace(/\s/g, '')}`} className="text-[13px] hover:text-ink">
        {PHONE_NUMBER}
      </a>
    </nav>
  );
}
