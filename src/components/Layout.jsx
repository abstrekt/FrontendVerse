import { useEffect, useState } from 'react';
import MobileProgressBar from './MobileProgressBar';
import MobileDrawer from './MobileDrawer';
import Icon from './Icon';
import { useMediaQuery } from '../hooks/useMediaQuery';

const MOBILE_QUERY = '(max-width: 860px)';

const DRAWERS = {
  panel: { id: 'mobile-drawer-panel', side: 'left', title: 'Filters and options' },
  nav: { id: 'mobile-drawer-nav', side: 'right', title: 'Sections and progress' },
};

export default function Layout({
  sidebar,
  center,
  panel,
  mobileProgress,
  sidebarCollapsed,
  panelCollapsed,
  onToggleSidebar,
  onTogglePanel,
}) {
  const isMobile = useMediaQuery(MOBILE_QUERY);
  const [openDrawer, setOpenDrawer] = useState(null);

  // Growing past the breakpoint puts the columns back; a drawer left open
  // would otherwise trap focus over a layout that no longer needs it.
  useEffect(() => {
    if (!isMobile) setOpenDrawer(null);
  }, [isMobile]);

  const drawer = openDrawer ? DRAWERS[openDrawer] : null;

  return (
    <div className={`layout${sidebarCollapsed ? ' sidebar-collapsed' : ''}${panelCollapsed ? ' panel-collapsed' : ''}`}>
      <a className="skip-link" href="#main-content">Skip to content</a>

      {/* The side columns are rendered *or* drawered, never both: the panel
          components own local state (search text, status filter, expanded
          sections) and two mounted copies would drift apart. */}
      {!isMobile && (
        <aside className="layout-panel" aria-label="Filters and options">
          <button
            type="button"
            className="layout-collapse-btn panel-collapse-btn"
            onClick={onTogglePanel}
            title={panelCollapsed ? 'Expand panel' : 'Collapse panel'}
            aria-label={panelCollapsed ? 'Expand panel' : 'Collapse panel'}
            aria-expanded={!panelCollapsed}
          >
            <span className="chevron">
              <Icon name={panelCollapsed ? 'chevron-right' : 'chevron-left'} size={14} />
            </span>
          </button>
          <div className="panel-card">{panel}</div>
        </aside>
      )}

      <main className="layout-center" id="main-content" tabIndex={-1}>
        <div className="center-card">{center}</div>
      </main>

      {!isMobile && (
        <aside className="layout-sidebar" aria-label="Sections and progress">
          {sidebar}
          <button
            type="button"
            className="layout-collapse-btn sidebar-collapse-btn"
            onClick={onToggleSidebar}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!sidebarCollapsed}
          >
            <span className="chevron">
              <Icon name={sidebarCollapsed ? 'chevron-left' : 'chevron-right'} size={14} />
            </span>
          </button>
        </aside>
      )}

      {isMobile && mobileProgress && (
        <div className="layout-mobile-progress">
          <div className="mobile-drawer-triggers">
            <button
              type="button"
              className="mobile-drawer-trigger"
              onClick={() => setOpenDrawer('nav')}
              aria-haspopup="dialog"
              aria-expanded={openDrawer === 'nav'}
              aria-controls={DRAWERS.nav.id}
            >
              <Icon name="menu" size={17} />
              <span className="sr-only">Sections and progress</span>
            </button>
          </div>

          {mobileProgress}

          <div className="mobile-drawer-triggers">
            <button
              type="button"
              className="mobile-drawer-trigger"
              onClick={() => setOpenDrawer('panel')}
              aria-haspopup="dialog"
              aria-expanded={openDrawer === 'panel'}
              aria-controls={DRAWERS.panel.id}
            >
              <Icon name="sliders" size={17} />
              <span className="sr-only">Filters and options</span>
            </button>
          </div>
        </div>
      )}

      {isMobile && drawer && (
        <MobileDrawer
          open
          id={drawer.id}
          side={drawer.side}
          title={drawer.title}
          onClose={() => setOpenDrawer(null)}
        >
          {openDrawer === 'panel' ? panel : sidebar}
        </MobileDrawer>
      )}
    </div>
  );
}
