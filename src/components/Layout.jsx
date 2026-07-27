import MobileProgressBar from './MobileProgressBar';

export default function Layout({ sidebar, center, panel, mobileProgress }) {
  return (
    <div className="layout">
      <aside className="layout-sidebar">{sidebar}</aside>
      <main className="layout-center">
        <div className="center-card">{center}</div>
      </main>
      <aside className="layout-panel">
        <div className="panel-card">{panel}</div>
      </aside>
      {mobileProgress && (
        <div className="layout-mobile-progress">{mobileProgress}</div>
      )}
    </div>
  );
}
