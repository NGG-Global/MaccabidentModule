import { Component, type ReactNode } from 'react';
import { ui } from '../content';

interface Props {
  onError: (message: string) => void;
  children: ReactNode;
}

/** Last line of defence: a render failure shows a recoverable message instead of a blank page. */
export class ErrorBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    this.props.onError(error.message);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="mx-auto max-w-xl space-y-3 p-6" role="alert">
        <h1 className="text-2xl font-bold">{ui.error.title}</h1>
        <p>{ui.error.body}</p>
        <button
          type="button"
          className="min-h-11 rounded-lg bg-brand-600 px-5 font-semibold text-white"
          onClick={() => window.location.reload()}
        >
          {ui.error.reload}
        </button>
      </main>
    );
  }
}
