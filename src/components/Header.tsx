import { Link } from '@tanstack/react-router'

import { useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  Home,
  Menu,
  Moon,
  Network,
  SquareFunction,
  StickyNote,
  Sun,
  X,
} from 'lucide-react'

import { useTheme } from './ThemeContext'

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const [groupedExpanded, setGroupedExpanded] = useState<
    Record<string, boolean>
  >({})
  const { theme, setTheme } = useTheme()

  const linkBase =
    'flex items-center gap-3 p-3 rounded-lg transition-colors mb-2 text-slate-800 dark:text-white hover:bg-slate-200/80 dark:hover:bg-gray-800'
  const linkActive = `${linkBase} bg-cyan-100 dark:bg-cyan-600 text-cyan-900 dark:text-white hover:bg-cyan-200/90 dark:hover:bg-cyan-700`
  const linkSplitActive =
    'flex-1 flex items-center gap-3 p-3 rounded-lg transition-colors mb-2 text-slate-800 dark:text-white hover:bg-slate-200/80 dark:hover:bg-gray-800 bg-cyan-100 dark:bg-cyan-600 text-cyan-900 dark:text-white hover:bg-cyan-200/90 dark:hover:bg-cyan-700'

  return (
    <>
      <header className="p-4 flex items-center gap-3 bg-slate-100/95 dark:bg-gray-800 text-slate-900 dark:text-white border-b border-slate-200/80 dark:border-gray-700/50 shadow-sm dark:shadow-lg">
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 hover:bg-slate-200/90 dark:hover:bg-gray-700 rounded-lg transition-colors"
          aria-label="Open menu"
        >
          <Menu size={24} />
        </button>
        <h1 className="text-xl font-semibold">
          <Link to="/" className="block">
            <img
              src="/tanstack-word-logo-white.svg"
              alt="TanStack Logo"
              className="h-10 w-auto brightness-0 dark:brightness-100 dark:invert-0"
            />
          </Link>
        </h1>
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2.5 rounded-xl border border-slate-300/80 dark:border-slate-600 bg-white/70 dark:bg-gray-800/80 hover:border-cyan-500/50 hover:shadow-md hover:shadow-cyan-500/10 dark:hover:shadow-cyan-400/5 transition-all"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          >
            {theme === 'dark' ? <Sun size={20} className="text-amber-300" /> : <Moon size={20} className="text-indigo-600" />}
          </button>
        </div>
      </header>

      <aside
        className={`fixed top-0 left-0 h-full w-80 bg-white text-slate-900 dark:bg-gray-900 dark:text-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col border-r border-slate-200 dark:border-gray-800 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-gray-700">
          <h2 className="text-xl font-bold">Navigation</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <Link
            to="/"
            onClick={() => setIsOpen(false)}
            className={linkBase}
            activeProps={{ className: linkActive }}
          >
            <Home size={20} />
            <span className="font-medium">Home</span>
          </Link>

          {/* Demo Links Start */}

          <Link
            to="/demo/start/server-funcs"
            onClick={() => setIsOpen(false)}
            className={linkBase}
            activeProps={{ className: linkActive }}
          >
            <SquareFunction size={20} />
            <span className="font-medium">Start - Server Functions</span>
          </Link>

          <Link
            to="/demo/start/api-request"
            onClick={() => setIsOpen(false)}
            className={linkBase}
            activeProps={{ className: linkActive }}
          >
            <Network size={20} />
            <span className="font-medium">Start - API Request</span>
          </Link>

          <div className="flex flex-row justify-between">
            <Link
              to="/demo/start/ssr"
              onClick={() => setIsOpen(false)}
              className="flex-1 flex items-center gap-3 p-3 rounded-lg hover:bg-slate-200/80 dark:hover:bg-gray-800 transition-colors mb-2 text-slate-800 dark:text-white"
              activeProps={{ className: linkSplitActive }}
            >
              <StickyNote size={20} />
              <span className="font-medium">Start - SSR Demos</span>
            </Link>
            <button
              className="p-2 hover:bg-slate-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              onClick={() =>
                setGroupedExpanded((prev) => ({
                  ...prev,
                  StartSSRDemo: !prev.StartSSRDemo,
                }))
              }
            >
              {groupedExpanded.StartSSRDemo ? (
                <ChevronDown size={20} />
              ) : (
                <ChevronRight size={20} />
              )}
            </button>
          </div>
          {groupedExpanded.StartSSRDemo && (
            <div className="flex flex-col ml-4">
              <Link
                to="/demo/start/ssr/spa-mode"
                onClick={() => setIsOpen(false)}
                className={linkBase}
                activeProps={{ className: linkActive }}
              >
                <StickyNote size={20} />
                <span className="font-medium">SPA Mode</span>
              </Link>

              <Link
                to="/demo/start/ssr/full-ssr"
                onClick={() => setIsOpen(false)}
                className={linkBase}
                activeProps={{ className: linkActive }}
              >
                <StickyNote size={20} />
                <span className="font-medium">Full SSR</span>
              </Link>

              <Link
                to="/demo/start/ssr/data-only"
                onClick={() => setIsOpen(false)}
                className={linkBase}
                activeProps={{ className: linkActive }}
              >
                <StickyNote size={20} />
                <span className="font-medium">Data Only</span>
              </Link>
            </div>
          )}

          {/* Demo Links End */}
        </nav>
      </aside>
    </>
  )
}
