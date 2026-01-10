/**
 * GlobalToast Component
 *
 * Renders transient toast notifications from the toast store.
 * Used for notifications that don't need to persist in the notification center.
 */

import React from 'react';
import { X, CheckCircle, Info, AlertTriangle, AlertCircle } from 'lucide-react';
import { useToastStore } from '@/stores/toastStore';
import './GlobalToast.css';

const iconMap = {
  success: CheckCircle,
  info: Info,
  warning: AlertTriangle,
  error: AlertCircle,
};

export const GlobalToast: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="global-toast-container" role="region" aria-label="Notifications">
      {toasts.map((toast) => {
        const Icon = iconMap[toast.type];
        return (
          <div
            key={toast.id}
            className={`global-toast global-toast--${toast.type}`}
            role="alert"
          >
            <Icon className="global-toast__icon" size={20} />
            <span className="global-toast__message">{toast.message}</span>
            <button
              className="global-toast__close"
              onClick={() => removeToast(toast.id)}
              aria-label="Dismiss notification"
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default GlobalToast;
