import MobileProgressBar from './MobileProgressBar';

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
  return (
    <div className={`layout${sidebarCollapsed ? ' sidebar-collapsed' : ''}${panelCollapsed ? ' panel-collapsed' : ''}`}>
      <aside className="layout-sidebar">
        {sidebar}
        <button
          type="button"
          className="layout-collapse-btn sidebar-collapse-btn"
          onClick={onToggleSidebar}
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!sidebarCollapsed}
        >
          <span className="chevron">{sidebarCollapsed ? '\u25B7' : '\u25C1'}</span>
        </button>
      </aside>
      <main className="layout-center">
        <div className="center-card">{center}</div>
      </main>
      <aside className="layout-panel">
        <button
          type="button"
          className="layout-collapse-btn panel-collapse-btn"
          onClick={onTogglePanel}
          title={panelCollapsed ? 'Expand panel' : 'Collapse panel'}
          aria-label={panelCollapsed ? 'Expand panel' : 'Collapse panel'}
          aria-expanded={!panelCollapsed}
        >
          <span className="chevron">{panelCollapsed ? '\u25C1' : '\u25B7'}</span>
        </button>
        <div className="panel-card">{panel}</div>
      </aside>
      {mobileProgress && (
        <div className="layout-mobile-progress">{mobileProgress}</div>
      )}
    </div>
  );
}
