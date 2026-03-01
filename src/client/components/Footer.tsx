import { Link } from '@tanstack/react-router';
import { memo } from 'react';

export default memo(function Footer() {
  return (
    <footer className="footer footer-center bg-base-200/20 text-neutral-content rounded-sm p-4 gap-4 shrink-0 self-stretch">
      <aside>
        <p className="font-semibold">
          Logic Pad -{' '}
          {String(import.meta.env.VITE_PACKAGE_VERSION).substring(0, 7)}
        </p>
        <p>
          Copyright © {new Date().getFullYear()} -{' '}
          <a
            className="link link-hover"
            href="https://github.com/logic-pad/logic-pad"
            target="_blank"
            rel="noreferrer"
          >
            See LICENSE for details
          </a>
        </p>
        <nav className="grid grid-flow-col gap-8">
          <Link to="/rules" className="link link-hover">
            Rules
          </Link>
          <Link to="/terms" className="link link-hover">
            Terms
          </Link>
          <Link to="/privacy-policy" className="link link-hover">
            Privacy policy
          </Link>
          <a
            className="link link-hover"
            href="https://github.com/logic-pad"
            target="_blank"
            rel="noreferrer"
          >
            Source code
          </a>
          <a
            className="link link-hover"
            href="mailto:logic-pad@googlegroups.com"
          >
            Email
          </a>
        </nav>
      </aside>
    </footer>
  );
});
