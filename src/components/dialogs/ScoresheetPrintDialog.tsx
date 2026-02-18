/**
 * ScoresheetPrintDialog
 *
 * Lightweight dialog that appears when user clicks a scoresheet print option.
 * Asks the user to choose sort order: Run Order or Armband Order.
 */

import React from 'react';
import { ClipboardList, ArrowUpDown, Hash } from 'lucide-react';
import { DialogContainer } from './DialogContainer';
import './shared-dialog.css';

export interface ScoresheetPrintDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onPrint: (sortOrder: 'run-order' | 'armband') => void;
  title?: string;
}

export const ScoresheetPrintDialog: React.FC<ScoresheetPrintDialogProps> = ({
  isOpen,
  onClose,
  onPrint,
  title,
}) => {
  return (
    <DialogContainer
      isOpen={isOpen}
      onClose={onClose}
      title={title || 'Print Scoresheet'}
      icon={<ClipboardList size={20} />}
      maxWidth="340px"
    >
      <p style={{ margin: '0 0 1rem', fontSize: '14px', color: '#666' }}>
        Sort entries by:
      </p>
      <div className="dialog-actions" style={{ gap: '0.75rem' }}>
        <button
          className="btn btn-primary"
          onClick={() => onPrint('run-order')}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
        >
          <ArrowUpDown size={16} />
          Run Order
        </button>
        <button
          className="btn btn-primary"
          onClick={() => onPrint('armband')}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
        >
          <Hash size={16} />
          Armband Number
        </button>
      </div>
    </DialogContainer>
  );
};
