'use client';

import SectionNavigation from '@/components/SectionNavigation';
import ContactForm from '@/components/ContactForm';
import styles from './AboutSection.module.css';

interface AboutSectionProps {
  onSectionChange?: (section: string) => void;
}

export default function AboutSection({ onSectionChange }: AboutSectionProps) {
  return (
    <div className={styles.container}>
      <SectionNavigation
        currentSection="about"
        onSectionChange={onSectionChange}
      />

      <div className={styles.content}>
        {/* Name */}
        <h1 className={styles.name}>
          Connor Runnels
        </h1>

        {/* Subtitle */}
        <p className={`type-serif-italic ${styles.subtitle}`}>
          Digital practitioner working across media
        </p>

        {/* Bio */}
        <p className={styles.bio}>
          Based in San Francisco. Currently exploring the intersections of
          technology, art, and human experience. Call the number below to
          navigate this site by phone.
        </p>

        {/* Divider */}
        <div className={styles.divider} />

        {/* Phone */}
        <div className={`type-sans ${styles.phone}`}>
          (415) 680-9353
        </div>

        {/* Contact Links */}
        <div className={`type-sans ${styles.contactLinks}`}>
          <div>
            <a href="mailto:connorrunnels@gmail.com">
              connorrunnels@gmail.com
            </a>
          </div>
          <div>
            <a href="https://instagram.com/crunnels_" target="_blank" rel="noopener noreferrer">
              Instagram
            </a>
          </div>
          <div>
            <a href="https://github.com/crunnels-alt" target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
          </div>
        </div>

        {/* Divider */}
        <div className={styles.divider} />

        {/* Contact Form */}
        <div className={styles.contactFormSection}>
          <h2 className={`type-serif-italic ${styles.contactFormTitle}`}>
            Send a message
          </h2>
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
