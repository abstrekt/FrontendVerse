import { useEffect, useState } from 'react';
import MobileDrawer from './MobileDrawer';
import Icon from './Icon';
import ColumnResizer from './ColumnResizer';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { useColumnWidths, COLUMN_DEFAULTS } from '../hooks/useColumnWidths';

const MOBILE_QUERY = '(max-width: 860px)';

const DRAWERS = {
  panel: { id: 'mobile-drawer-panel', side: 'left', title: 'Filters and options' },
  nav: { id: 'mobile-drawer-nav', side: 'left', title: 'Sections and progress' },
};

/**
 * The app shell.
 *
 * Desktop is a grid: a full-height nav rail, then a body split into the
 * top bar and a two-column row (contextual panel + content). Both side
 * columns are draggable and collapsible; widths persist per-browser and are
 * clamped to the viewport (see hooks/useColumnWidths.js).
 *
 * Below the mobile breakpoint both become drawers — rendered *or* drawered,
 * never both, because the panel components own local state (search text,
 * status filter, expanded sections) and two mounted copies would drift
 * apart. Resizing is desktop-only: there is no pointer to drag with and no
 * room to spare.
 */
export default function Layout({
  sidebar,
  topbar,
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
  const { widths, bounds, setWidth } = useColumnWidths();

  // Growing past the breakpoint puts the columns back; a drawer left open
  // would otherwise trap focus over a layout that no longer needs it.
  useEffect(() => {
    if (!isMobile) setOpenDrawer(null);
  }, [isMobile]);

  const drawer = openDrawer ? DRAWERS[openDrawer] : null;

  return (
    <div
      className={`layout${sidebarCollapsed ? ' sidebar-collapsed' : ''}${
        panelCollapsed ? ' panel-collapsed' : ''
      }${isMobile ? ' is-mobile' : ''}${panel ? '' : ' no-panel'}`}
    >
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>

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
            <Icon name={sidebarCollapsed ? 'chevron-right' : 'chevron-left'} size={13} />
          </button>

          {!sidebarCollapsed && (
            <ColumnResizer
              label="Resize the sections rail"
              cssVar="--nav-width"
              value={widths.nav}
              min={bounds.nav.min}
              max={bounds.nav.max}
              defaultValue={COLUMN_DEFAULTS.nav}
              onCommit={(next) => setWidth('nav', next)}
            />
          )}
        </aside>
      )}

      <div className="layout-body">
        {isMobile ? (
          <div className="mobile-topbar">
            <button
              type="button"
              className="icon-btn"
              onClick={() => setOpenDrawer('nav')}
              aria-haspopup="dialog"
              aria-expanded={openDrawer === 'nav'}
              aria-controls={DRAWERS.nav.id}
            >
              <Icon name="menu" size={18} />
              <span className="sr-only">Sections and progress</span>
            </button>

            <div className="mobile-topbar-slot">{topbar}</div>

            {panel && (
              <button
                type="button"
                className="icon-btn"
                onClick={() => setOpenDrawer('panel')}
                aria-haspopup="dialog"
                aria-expanded={openDrawer === 'panel'}
                aria-controls={DRAWERS.panel.id}
              >
                <Icon name="sliders" size={18} />
                <span className="sr-only">Filters and options</span>
              </button>
            )}
          </div>
        ) : (
          topbar
        )}

        <div className="layout-columns">
          {!isMobile && panel && (
            <aside className="layout-panel" aria-label="Filters and options">
              <div className="panel-card">{panel}</div>
              <button
                type="button"
                className="layout-collapse-btn panel-collapse-btn"
                onClick={onTogglePanel}
                title={panelCollapsed ? 'Expand panel' : 'Collapse panel'}
                aria-label={panelCollapsed ? 'Expand panel' : 'Collapse panel'}
                aria-expanded={!panelCollapsed}
              >
                <Icon name={panelCollapsed ? 'chevron-right' : 'chevron-left'} size={13} />
              </button>

              {!panelCollapsed && (
                <ColumnResizer
                  label="Resize the filters panel"
                  cssVar="--panel-width"
                  value={widths.panel}
                  min={bounds.panel.min}
                  max={bounds.panel.max}
                  defaultValue={COLUMN_DEFAULTS.panel}
                  onCommit={(next) => setWidth('panel', next)}
                />
              )}
            </aside>
          )}

          <main className="layout-center" id="main-content" tabIndex={-1}>
            <div className="center-card">{center}</div>
          </main>
        </div>

        {isMobile && mobileProgress && (
          <div className="layout-mobile-progress">{mobileProgress}</div>
        )}
      </div>

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
