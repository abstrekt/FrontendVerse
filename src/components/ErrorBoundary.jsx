import { Component } from 'react';

/** Keys this app owns. Cleared on reset so we never wipe unrelated site data. */
const APP_STORAGE_KEYS = [
  'quiz-theme',
  'quiz-syntax',
  'quiz-progress',
  'quiz-completed',
  'quiz-starred',
  'quiz-starred-filter',
  'quiz-archived',
  'quiz-skipped',
  'quiz-session',
  'quiz-migrations',
  'mcq-queue',
  'mcq-include-completed',
  'output-queue',
  'output-quiz-progress',
  'output-quiz-session',
  'output-quiz-include-completed',
  'coding-queue',
  'coding-quiz-session',
  'coding-include-completed',
  'layout-sidebar-collapsed',
  'layout-panel-collapsed',
  'js-mcq-coding-progress',
  'js-mcq-coding-submissions',
];

function clearAppStorage() {
  for (const key of APP_STORAGE_KEYS) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* storage unavailable — nothing to clear */
    }
  }
}

export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Unhandled error in app tree', error, info);
  }

  handleReset = () => {
    clearAppStorage();
    window.location.reload();
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="crash-screen" role="alert">
        <div className="crash-card">
          <h1 className="crash-title">Something broke</h1>
          <p className="crash-text">
            The app hit an error it could not recover from. This is usually caused by
            saved progress data left over from an older version.
          </p>
          <pre className="crash-detail">{error.message || String(error)}</pre>
          <div className="crash-actions">
            <button type="button" className="crash-btn" onClick={() => window.location.reload()}>
              Reload page
            </button>
            <button type="button" className="crash-btn crash-btn-danger" onClick={this.handleReset}>
              Reset local data
            </button>
          </div>
          <p className="crash-note">
            Resetting clears your saved progress, stars and archived items on this device.
          </p>
        </div>
      </div>
    );
  }
}
