import Image from "next/image";
import Link from "next/link";
import { site } from "@/lib/site";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about" },
  { label: "Cabinet", href: "/coming-soon/cabinet" },
  { label: "Events", href: "/#event" },
  { label: "APECX", href: "/#flagship-program" },
];

const PROGRAM_LINKS = [
  { label: "Membership", href: "/join" },
  { label: "Mentorship", href: "/coming-soon/mentorship" },
  { label: "Workshops", href: "/coming-soon/workshops" },
  { label: "Research", href: "/coming-soon/research" },
  { label: "Company Visits", href: "/coming-soon/company-visits" },
];

type ContactItem = { icon: string; alt: string } & (
  | { people: readonly { name: string; number: string; whatsapp: string }[] }
  | { text: string; href: string | null }
);

const CONTACT_ITEMS: readonly ContactItem[] = [
  {
    icon: "/footer/contact-phone.svg",
    alt: "Phone",
    people: [
      { name: "Andra", number: "+62 819-4435-0253", whatsapp: "https://wa.me/6281944350253" },
      { name: "Ana", number: "+62 895-6393-14478", whatsapp: "https://wa.me/62895639314478" },
    ],
  },
  {
    icon: "/footer/contact-location.svg",
    alt: "Location",
    text: "Faculty of Engineering\nUGM, Sleman, Yogyakarta 55281",
    href: null,
  },
  {
    icon: "/footer/contact-email.svg",
    alt: "Email",
    text: site.email,
    href: `mailto:${site.email}`,
  },
];

const SOCIAL_LINKS = [
  {
    href: `mailto:${site.email}`,
    icon: "/footer/icon-email.svg",
    alt: "Email",
  },
  {
    href: "https://www.tiktok.com/@spe.ugm.sc",
    icon: "/footer/icon-tiktok.svg",
    alt: "TikTok",
  },
  {
    href: "https://www.linkedin.com/company/speugmsc/",
    icon: "/footer/icon-linkedin.svg",
    alt: "LinkedIn",
  },
  {
    href: "https://www.instagram.com/speugmsc/",
    icon: "/footer/icon-instagram.svg",
    alt: "Instagram",
  },
];

export function SiteFooter() {
  return (
    <footer id="contact" className="footer scroll-mt-28">
      {/* Top Bar: Logo + Social Icons */}
      <div className="footer__topbar">
        <div className="footer__brand">
          <div className="footer__logo">
            <Image
              src="/footer/logo-spe.png"
              alt="SPE UGM SC Logo"
              width={52}
              height={44}
              className="footer__logo-img"
            />
          </div>
          <span className="footer__brand-name">SPE UGM Student Chapter</span>
        </div>
        <div className="footer__socials">
          {SOCIAL_LINKS.map((s) => (
            <a
              key={s.alt}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              className="footer__social-btn"
              aria-label={s.alt}
            >
              <Image src={s.icon} alt={s.alt} width={18} height={18} />
            </a>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="footer__divider" />

      {/* Main Content */}
      <div className="footer__content">
        {/* Description */}
        <div className="footer__description">
          <p>
            Engineering Indonesia&apos;s energy future through excellence in
            education, research, and global collaboration since 1974.
          </p>
        </div>

        {/* Navigation */}
        <div className="footer__links-group">
          <h4 className="footer__links-title">Navigation</h4>
          <ul className="footer__links-list">
            {NAV_LINKS.map((link) => (
              <li key={link.label}>
                <Link href={link.href} className="footer__link">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Programs */}
        <div className="footer__links-group">
          <h4 className="footer__links-title">Programs</h4>
          <ul className="footer__links-list">
            {PROGRAM_LINKS.map((link) => (
              <li key={link.label}>
                <Link href={link.href} className="footer__link">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div className="footer__links-group max-sm:col-span-2">
          <h4 className="footer__links-title">Contact</h4>
          <ul className="footer__contact-list">
            {CONTACT_ITEMS.map((item) => (
              <li key={item.alt} className="footer__contact-item">
                <div className="footer__contact-icon">
                  <Image src={item.icon} alt={item.alt} width={36} height={36} />
                </div>
                <div className="footer__contact-text">
                  {"people" in item ? (
                    <div className="flex flex-col">
                      {item.people.map((person) => (
                        <div key={person.name}>
                          <a
                            href={person.whatsapp}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline"
                            aria-label={`Message ${person.name} on WhatsApp at ${person.number} (opens in a new tab)`}
                          >
                            {person.name}: {person.number}
                          </a>
                        </div>
                      ))}
                    </div>
                  ) : item.href ? (
                    <a href={item.href} className="hover:underline">{item.text}</a>
                  ) : item.text.split("\n").map((line, i) => (
                    <span key={i}>
                      {line}
                      {i < item.text.split("\n").length - 1 && <br />}
                    </span>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom: Copyright + Watermark */}
      <div className="footer__bottom">
        <div className="footer__bottom-divider" />
        <p className="footer__copyright">
          © 2026 SPE UGM Student Chapter · Universitas Gadjah Mada
        </p>
        <div className="footer__watermark" aria-hidden="true">
          SPE UGM SC
        </div>
        <div className="footer__glow" />
      </div>
    </footer>
  );
}
