import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        this.setState({
            error: error,
            errorInfo: errorInfo
        });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'var(--bg-primary)',
                    padding: '2rem'
                }}>
                    <div className="card" style={{ maxWidth: '600px', padding: '2rem' }}>
                        <h1 style={{ color: '#ef4444', marginBottom: '1rem' }}>⚠️ Something went wrong</h1>
                        <p style={{ marginBottom: '1rem', color: '#94a3b8' }}>
                            The application encountered an error. Please try refreshing the page.
                        </p>

                        <details style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                            <summary style={{ cursor: 'pointer', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                                Error Details (for debugging)
                            </summary>
                            <pre style={{
                                fontSize: '0.85rem',
                                color: '#ef4444',
                                overflow: 'auto',
                                marginTop: '0.5rem'
                            }}>
                                {this.state.error && this.state.error.toString()}
                                {'\n\n'}
                                {this.state.errorInfo && this.state.errorInfo.componentStack}
                            </pre>
                        </details>

                        <button
                            onClick={() => window.location.reload()}
                            className="btn"
                            style={{ marginTop: '1.5rem', background: '#ef4444' }}
                        >
                            Reload Page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
