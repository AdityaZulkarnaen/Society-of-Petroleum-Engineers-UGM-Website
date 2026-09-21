import Image from "next/image";
import Link from "next/link";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about" },
  { label: "Cabinet", href: "/#cabinet" },
  { label: "Events", href: "/#event" },
  { label: "APECX", href: "/#apecx" },
];

const PROGRAM_LINKS = [
  { label: "Membership", href: "#" },
  { label: "Mentorship", href: "#" },
  { label: "Workshops", href: "#" },
  { label: "Research", href: "#" },
  { label: "Field Trips", href: "#" },
];

const CONTACT_ITEMS = [
  {
    icon: "/footer/contact-phone.svg",
    text: "08123456789",
    alt: "Phone",
  },
  {
    icon: "/footer/contact-location.svg",
    text: "Faculty of Engineering\nUGM, Sleman, Yogyakarta 55281",
    alt: "Location",
  },
  {
    icon: "/footer/contact-email.svg",
    text: "speugmscboards@gmail.com",
    alt: "Email",
  },
];

const SOCIAL_LINKS = [
  {
    href: "mailto:speugmscboards@gmail.com",
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
    <footer className="footer">
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
        <div className="footer__links-group">
          <h4 className="footer__links-title">Contact</h4>
          <ul className="footer__contact-list">
            {CONTACT_ITEMS.map((item) => (
              <li key={item.alt} className="footer__contact-item">
                <div className="footer__contact-icon">
                  <Image src={item.icon} alt={item.alt} width={36} height={36} />
                </div>
                <span className="footer__contact-text">
                  {item.text.split("\n").map((line, i) => (
                    <span key={i}>
                      {line}
                      {i < item.text.split("\n").length - 1 && <br />}
                    </span>
                  ))}
                </span>
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
