import React from 'react';
import { X, Info, Mail, Globe, Key } from 'lucide-react';
import './shared-dialog.css';
import { version } from '../../../package.json';

interface AboutDialogProps {
  isOpen: boolean;
  onClose: () => void;
  licenseKey?: string;
}

export const AboutDialog: React.FC<AboutDialogProps> = ({
  isOpen,
  onClose,
  licenseKey
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="dialog-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000
      }}
    >
      <div
        className="dialog-container"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '420px',
          margin: 'auto',
          animation: 'dialogSlideIn 0.2s ease-out'
        }}
      >
        <div className="dialog-header">
          <div className="dialog-title">
            <Info className="title-icon" />
            <span>About</span>
          </div>
          <button className="close-button" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="dialog-content">
          {/* App Info */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            {/* Logo */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: '1rem'
            }}>
              <div style={{
                width: '96px',
                height: '96px',
                borderRadius: '20px',
                background: 'var(--muted)',
                padding: '12px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                border: '2px solid var(--border)'
              }}>
                <img
                  src="/myK9Q-teal-192.png"
                  alt="myK9Q Logo"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain'
                  }}
                />
              </div>
            </div>

            <h2 style={{
              fontSize: '1.75rem',
              fontWeight: 700,
              marginBottom: '0.25rem',
              color: 'var(--foreground)',
              textAlign: 'center',
              margin: '0 auto 0.25rem auto',
              width: '100%'
            }}>
              myK9Q
            </h2>
            <p style={{
              fontSize: '1rem',
              color: 'var(--primary)',
              fontWeight: 600,
              marginBottom: '1rem',
              letterSpacing: '0.05em',
              textAlign: 'center',
              margin: '0 auto 1rem auto',
              width: '100%'
            }}>
              Queue & Qualify
            </p>
            <p style={{
              fontSize: '0.875rem',
              color: 'var(--muted-foreground)',
              marginBottom: '0.5rem',
              textAlign: 'center',
              margin: '0 auto 0.5rem auto',
              width: '100%'
            }}>
              Version {version}
            </p>
          </div>

          {/* License Key Section */}
          {licenseKey && (
            <div style={{
              background: 'var(--muted)',
              padding: '1rem',
              borderRadius: 'var(--token-space-md)',
              marginBottom: '1.5rem'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--token-space-md)',
                marginBottom: 'var(--token-space-md)'
              }}>
                <Key className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
                <span style={{
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: 'var(--muted-foreground)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  License Key
                </span>
              </div>
              <code style={{
                fontSize: '0.75rem',
                color: 'var(--foreground)',
                fontFamily: 'monospace',
                wordBreak: 'break-all',
                display: 'block'
              }}>
                {licenseKey}
              </code>
            </div>
          )}

          {/* Links Section */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--token-space-lg)'
          }}>
            <a
              href="https://myk9t.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--token-space-md)',
                padding: 'var(--token-space-lg)',
                background: 'var(--muted)',
                borderRadius: 'var(--token-space-md)',
                color: 'var(--primary)',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
                fontSize: '0.875rem',
                fontWeight: 500
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--accent)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--muted)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <Globe className="h-5 w-5" />
              <span>Visit myk9t.com</span>
            </a>

            <a
              href="mailto:support@myk9t.com"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--token-space-md)',
                padding: 'var(--token-space-lg)',
                background: 'var(--muted)',
                borderRadius: 'var(--token-space-md)',
                color: 'var(--primary)',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
                fontSize: '0.875rem',
                fontWeight: 500
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--accent)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--muted)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <Mail className="h-5 w-5" />
              <span>support@myk9t.com</span>
            </a>
          </div>

          {/* Copyright */}
          <div style={{
            marginTop: '2rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--border)',
            textAlign: 'center'
          }}>
            <p style={{
              fontSize: '0.75rem',
              color: 'var(--muted-foreground)'
            }}>
              © {new Date().getFullYear()} myK9T. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
