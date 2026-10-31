import { Alert, Platform } from 'react-native';

/**
 * Universal deletion confirmation warning.
 * Prompts the user before deleting any bill, payment, or ledger entry.
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

  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.confirm) {
      const confirmed = window.confirm(`⚠️ WARNING: ${title}\n\n${message}`);
      if (confirmed) {
        onConfirm();
      }
      return;
    }
  }

  Alert.alert(
    `⚠️ ${title}`,
    message,
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete Permanently',
        style: 'destructive',
        onPress: onConfirm,
      },
    ],
    { cancelable: true }
  );
}
