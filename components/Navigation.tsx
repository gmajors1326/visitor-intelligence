'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Navigation.module.css';

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/sessions', label: 'Sessions' },
  { href: '/digests', label: 'Digests' },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className={styles.nav}>
      <ul className={styles.navList}>
        {navItems.map(item => (
          <li key={item.href} className={styles.navItem}>
            <Link
              href={item.href}
              className={`${styles.navLink} ${pathname === item.href ? styles.navLinkActive : ''}`}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
