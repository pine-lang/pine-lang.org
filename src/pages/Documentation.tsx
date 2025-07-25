import React, { useEffect, useState, useCallback, Suspense, useRef } from 'react';
import { useColorPalette } from '../contexts/ColorPaletteContext';
import { motion, AnimatePresence } from 'framer-motion';
import documentationComponents from './documentation';
import LoadingIndicator from '../components/LoadingIndicator';

const SECTIONS = Object.keys(documentationComponents).map(key => {
  const id = key
    .replace(/([A-Z])/g, '-$1')
    .toLowerCase()
    .replace(/^-/, '');
  const label = key.replace(/([A-Z])/g, ' $1').trim();
  return {
    id,
    label,
    component: documentationComponents[key as keyof typeof documentationComponents]
  };
});

const Documentation: React.FC = () => {
  const palette = useColorPalette();
  const [activeSection, setActiveSection] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const intersectionObserverRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const targetId = window.location.hash.substring(1) || SECTIONS[0]?.id;
    if (!targetId) return;

    const observer = new MutationObserver(() => {
      const element = document.getElementById(targetId);
      if (element) {
        if (window.location.hash) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
        setActiveSection(targetId);
        observer.disconnect();
      }
    });

    if (contentRef.current) {
        observer.observe(contentRef.current, {
            childList: true,
            subtree: true,
        });
    }

    // Fallback check in case the content is already in the DOM
    const element = document.getElementById(targetId);
    if (element) {
        if (window.location.hash) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
        setActiveSection(targetId);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  // Handle section link clicks
  const handleSectionClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    e.preventDefault();
    const section = document.getElementById(sectionId);

    if (section) {
      // Disconnect any existing observer
      if (intersectionObserverRef.current) {
        intersectionObserverRef.current.disconnect();
      }

      section.scrollIntoView({
        behavior: 'smooth'
      });
      window.history.pushState(null, '', `#${sectionId}`);

      // Create a new observer to watch for the section to scroll into view
      intersectionObserverRef.current = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveSection(sectionId);
            // Once it's visible, we don't need to watch it anymore
            intersectionObserverRef.current?.disconnect();
          }
        },
        {
          // Adjust rootMargin to account for the sticky navbar
          rootMargin: '-100px 0px -50% 0px',
          threshold: 0,
        }
      );
      
      intersectionObserverRef.current.observe(section);
    }
  }, []);

  const MobileHeader = () => (
    <div 
      className="fixed top-[var(--navbar-height)] left-0 right-0 z-40 md:hidden"
      style={{
        backgroundColor: palette.background,
        backdropFilter: 'blur(8px)',
        borderBottom: `1px solid ${palette.accent}20`
      }}
    >
      <div className="flex items-center justify-between px-4 py-3">
        <h1 className="text-lg font-semibold" style={{ color: palette.primary }}>
          {SECTIONS.find(s => s.id === activeSection)?.label}
        </h1>
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="flex items-center px-3 py-1.5 rounded-lg transition-colors duration-200"
          style={{ 
            backgroundColor: `${palette.accent}10`,
            color: palette.accent
          }}
        >
          <svg 
            className="w-5 h-5" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </div>
    </div>
  );

  const Sidebar = ({ isMobile = false }) => (
    <div 
      className={`${
        isMobile 
          ? 'fixed inset-0 bg-black/50 z-50 flex items-start justify-end'
          : 'fixed left-0 top-[var(--navbar-height)] bottom-0 w-72 z-40 hidden md:block'
      }`}
      onClick={isMobile ? () => setIsMobileMenuOpen(false) : undefined}
    >
      <motion.div
        initial={isMobile ? { x: 300 } : undefined}
        animate={isMobile ? { x: 0 } : undefined}
        exit={isMobile ? { x: 300 } : undefined}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className={`${
          isMobile 
            ? 'w-[85%] max-w-sm h-full overflow-auto'
            : 'h-full w-full overflow-y-auto'
        }`}
        style={{ 
          backgroundColor: isMobile ? palette.background : `${palette.background}aa`,
          backdropFilter: 'blur(8px)',
          borderLeft: isMobile ? `1px solid ${palette.accent}20` : 'none',
          borderRight: isMobile ? 'none' : `1px solid ${palette.accent}20`,
        }}
        onClick={isMobile ? e => e.stopPropagation() : undefined}
      >
        {isMobile && (
          <div 
            className="sticky top-0 flex items-center justify-between p-4 border-b"
            style={{ borderColor: `${palette.accent}20` }}
          >
            <h2 className="text-lg font-semibold" style={{ color: palette.primary }}>
              Navigation
            </h2>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-1 rounded-lg hover:bg-black/5"
              style={{ color: palette.secondary }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <nav className="p-4 space-y-0.5">
          {SECTIONS.map(({ id, label }) => (
            <a
              key={id}
              href={`#${id}`}
              onClick={(e) => {
                handleSectionClick(e, id);
                if (isMobile) setIsMobileMenuOpen(false);
              }}
              className={`
                block py-2 px-3 rounded-md transition-all duration-200 
                text-[15px] leading-relaxed hover:bg-black/5
                ${activeSection === id ? 'bg-black/5 shadow-sm' : ''}
              `}
              style={{ 
                color: activeSection === id ? palette.primary : palette.secondary,
                ...(activeSection === id && {
                  transform: 'translateX(2px)',
                  fontWeight: 500
                })
              }}
            >
              {label}
            </a>
          ))}
        </nav>
      </motion.div>
    </div>
  );

  const activeLabel = SECTIONS.find(s => s.id === activeSection)?.label || 'Docs';

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-pine-50">
      <title>Pine Lang - {activeLabel}</title>
      <meta
        name="description"
        content="Explore the official Pine Lang documentation. Learn the syntax, features, and best practices for using Pine Lang to write clear and efficient database queries."
      />
      <meta property="og:title" content="Pine Lang - Documentation" />
      <meta property="og:description" content="Explore the official Pine Lang documentation and learn how to write clear, efficient database queries." />
      <meta property="og:type" content="article" />
      <meta property="og:url" content="https://pine-lang.org/docs" />
      <meta property="og:image" content="https://pine-lang.org/pine-social-preview.svg" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Pine Lang - Documentation" />
      <meta name="twitter:description" content="Explore the official Pine Lang documentation and learn how to write clear, efficient database queries." />
      <meta name="twitter:image" content="https://pine-lang.org/pine-social-preview.svg" />
      {/* Mobile Header */}
      <MobileHeader />

      {/* Sidebar for desktop */}
      <Sidebar />

      {/* Mobile menu */}
      <AnimatePresence>
        {isMobileMenuOpen && <Sidebar isMobile />}
      </AnimatePresence>

      {/* Main Content */}
      <main className="pt-[calc(var(--navbar-height)+4rem)] md:pt-0 md:pl-72">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
          <div>
            <div className="max-w-none" ref={contentRef}>
              <style>
                {`
                  section[id] {
                    scroll-margin-top: 100px;
                  }
                  section[id] h2 {
                    scroll-margin-top: 100px;
                  }
                  /* Style inline code blocks */
                  code:not(pre code) {
                    background-color: ${palette.accent}10;
                    color: ${palette.accent};
                    padding: 0.2em 0.4em;
                    border-radius: 0.25em;
                    font-size: 0.875em;
                    font-weight: 500;
                    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
                    white-space: nowrap;
                  }
                  /* Remove any pseudo-elements that might be adding backticks */
                  code:not(pre code)::before,
                  code:not(pre code)::after {
                    content: none !important;
                  }
                  /* Style code blocks within pre tags */
                  pre {
                    background-color: ${palette.accent}10;
                    border-radius: 0.5em;
                    padding: 1em;
                    margin: 1em 0;
                    overflow-x: auto;
                  }
                  pre code {
                    color: ${palette.primary};
                    padding: 0;
                    background: none;
                    font-size: 0.875em;
                    line-height: 1.7;
                  }
                  pre code::before,
                  pre code::after {
                    content: none !important;
                  }
                `}
              </style>
              
              <Suspense fallback={<LoadingIndicator text="Loading docs..." />}>
                {SECTIONS.map(({ id, component: Component }) => (
                  <Component key={id} />
                ))}
              </Suspense>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Documentation; 