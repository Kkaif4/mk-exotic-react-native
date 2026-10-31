export interface WarningModalConfig {
  title: string;
  message: string;
  details?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning';
  requireWrittenConfirmation?: boolean;
  confirmationKeyword?: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

type ModalListener = (config: WarningModalConfig | null) => void;

let activeListener: ModalListener | null = null;

export function registerWarningModalListener(listener: ModalListener): () => void {
  activeListener = listener;
  return () => {
    if (activeListener === listener) {
      activeListener = null;
    }
  };
}

export function showWarningPopup(config: WarningModalConfig): void {
  if (activeListener) {
    activeListener(config);
    return;
  }
  // Fallback for headless testing environments without UI mounted
  config.onConfirm();
}

export function hideWarningPopup(): void {
  if (activeListener) {
    activeListener(null);
  }
}

/**
 * Universal deletion confirmation warning.
 * Triggers the styled WarningModal before deleting any bill, payment, or ledger entry.
 */
export function confirmDelete(
  itemType: 'bill' | 'payment' | 'ledger entry',
  onConfirm: () => void,
  details?: string
): void {
  const title = `Delete ${itemType.charAt(0).toUpperCase() + itemType.slice(1)}`;
  const message = details
    ? `Are you sure you want to permanently delete this ${itemType} (${details})? This action cannot be undone and will recalculate balances.`
    : `Are you sure you want to permanently delete this ${itemType}? This action cannot be undone and will recalculate balances.`;

  showWarningPopup({
    title,
    message,
    details,
    confirmText: 'Delete Permanently',
    cancelText: 'Cancel',
    variant: 'danger',
    onConfirm,
  });
}
