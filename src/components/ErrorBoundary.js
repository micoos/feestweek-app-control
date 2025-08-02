import React from 'react';
import { AlertTriangle } from 'lucide-react';

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
      error,
      errorInfo
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={styles.container}>
          <div style={styles.content}>
            <AlertTriangle size={48} color="#f44336" />
            <h2 style={styles.title}>Oops! Something went wrong</h2>
            <p style={styles.message}>
              The application encountered an unexpected error. 
              Please try refreshing the page.
            </p>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details style={styles.details}>
                <summary style={styles.summary}>Error details (development only)</summary>
                <pre style={styles.errorText}>
                  {this.state.error.toString()}
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
            
            <button onClick={this.handleReset} style={styles.button}>
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '20px',
    backgroundColor: '#f5f5f5'
  },
  content: {
    textAlign: 'center',
    maxWidth: '600px',
    padding: '40px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    margin: '20px 0 10px',
    color: '#333'
  },
  message: {
    fontSize: '16px',
    color: '#666',
    marginBottom: '30px',
    lineHeight: '1.5'
  },
  button: {
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: '500',
    color: 'white',
    backgroundColor: '#2196F3',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  details: {
    width: '100%',
    marginBottom: '20px',
    textAlign: 'left'
  },
  summary: {
    cursor: 'pointer',
    padding: '10px',
    backgroundColor: '#f5f5f5',
    borderRadius: '4px',
    marginBottom: '10px'
  },
  errorText: {
    backgroundColor: '#f5f5f5',
    padding: '15px',
    borderRadius: '4px',
    overflow: 'auto',
    fontSize: '12px',
    lineHeight: '1.5',
    fontFamily: 'monospace'
  }
};

export default ErrorBoundary;