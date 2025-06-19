'use client';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  text?: string;
}

export default function LoadingSpinner({ 
  size = 'medium', 
  color = '#2185d0',
  text = 'Loading...'
}: LoadingSpinnerProps) {
  const sizeMap = {
    small: '24px',
    medium: '32px',
    large: '48px'
  };

  const spinnerSize = sizeMap[size];

  return (
    <div style={{
      position: 'fixed',
      top: '80px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '8px',
      background: 'rgba(255, 255, 255, 0.95)',
      padding: '12px 20px',
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      backdropFilter: 'blur(8px)',
      border: '1px solid rgba(255, 255, 255, 0.2)'
    }}>
      <div
        style={{
          width: spinnerSize,
          height: spinnerSize,
          border: `3px solid rgba(33, 133, 208, 0.2)`,
          borderTop: `3px solid ${color}`,
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }}
      />
      {text && (
        <div style={{
          fontSize: '14px',
          color: '#666',
          fontWeight: '500',
          textAlign: 'center'
        }}>
          {text}
        </div>
      )}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
} 