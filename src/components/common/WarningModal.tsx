import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  useWindowDimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../core/theme';
import {
  WarningModalConfig,
  registerWarningModalListener,
  hideWarningPopup,
} from '../../core/confirm';

export interface WarningModalProps {
  visible: boolean;
  title: string;
  message: string;
  details?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning';
  requireWrittenConfirmation?: boolean;
  confirmationKeyword?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const WarningModal = React.memo(function WarningModal({
  visible,
  title,
  message,
  details,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  requireWrittenConfirmation = false,
  confirmationKeyword = 'DELETE',
  onConfirm,
  onCancel,
}: WarningModalProps) {
  const { width } = useWindowDimensions();
  const [typedKeyword, setTypedKeyword] = useState('');

  // Reset typed keyword when modal opens/closes
  useEffect(() => {
    if (visible) {
      setTypedKeyword('');
    }
  }, [visible]);

  if (!visible) return null;

  const isDanger = variant === 'danger';
  const isKeywordMatching =
    typedKeyword.trim().toUpperCase() === confirmationKeyword.trim().toUpperCase();
  const isConfirmDisabled = requireWrittenConfirmation && !isKeywordMatching;

  const handleConfirm = () => {
    if (isConfirmDisabled) return;
    onConfirm();
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.backdrop}>
        <View style={[styles.modalCard, { maxWidth: Math.min(width - 32, 460) }]}>
          {/* Header with Glowing Warning Icon */}
          <View style={styles.headerRow}>
            <View
              style={[
                styles.iconBubble,
                isDanger ? styles.iconBubbleDanger : styles.iconBubbleWarning,
              ]}
            >
              <Feather
                name={isDanger ? 'alert-triangle' : 'alert-circle'}
                size={22}
                color={isDanger ? colors.danger : colors.warning}
              />
            </View>
            <View style={styles.headerTextCol}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitleBadge}>
                {isDanger ? 'IRREVERSIBLE ACTION' : 'ATTENTION REQUIRED'}
              </Text>
            </View>
          </View>

          {/* Message Content */}
          <Text style={styles.messageText}>{message}</Text>

          {details ? (
            <View style={styles.detailsBox}>
              <Feather name="info" size={13} color={colors.textMuted} />
              <Text style={styles.detailsText}>{details}</Text>
            </View>
          ) : null}

          {/* Written Confirmation Input (if required) */}
          {requireWrittenConfirmation && (
            <View style={styles.writtenConfirmationContainer}>
              <Text style={styles.instructionText}>
                To proceed, type{' '}
                <Text style={styles.keywordHighlight}>{confirmationKeyword}</Text>{' '}
                in the box below:
              </Text>
              <TextInput
                style={[
                  styles.confirmationInput,
                  isKeywordMatching && styles.confirmationInputValid,
                ]}
                placeholder={`Type "${confirmationKeyword}" here`}
                placeholderTextColor={colors.textMuted}
                value={typedKeyword}
                onChangeText={setTypedKeyword}
                autoCapitalize="characters"
                autoCorrect={false}
                autoFocus
              />
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionsRow}>
            <Pressable
              onPress={onCancel}
              style={({ pressed }) => [
                styles.cancelButton,
                pressed && styles.cancelButtonPressed,
              ]}
            >
              <Text style={styles.cancelButtonText}>{cancelText}</Text>
            </Pressable>

            <Pressable
              onPress={handleConfirm}
              disabled={isConfirmDisabled}
              style={({ pressed }) => [
                styles.confirmButton,
                isDanger ? styles.confirmButtonDanger : styles.confirmButtonWarning,
                isConfirmDisabled && styles.confirmButtonDisabled,
                pressed && !isConfirmDisabled && styles.confirmButtonPressed,
              ]}
            >
              <Feather
                name={isDanger ? 'trash-2' : 'check'}
                size={14}
                color="#FFFFFF"
                style={styles.confirmIcon}
              />
              <Text style={styles.confirmButtonText}>{confirmText}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
});

/**
 * Universal container that listens for showWarningPopup / confirmDelete
 * calls across the app and renders the polished WarningModal.
 */
export function WarningModalContainer() {
  const [config, setConfig] = useState<WarningModalConfig | null>(null);

  useEffect(() => {
    return registerWarningModalListener((newConfig) => {
      setConfig(newConfig);
    });
  }, []);

  if (!config) return null;

  return (
    <WarningModal
      visible={true}
      title={config.title}
      message={config.message}
      details={config.details}
      confirmText={config.confirmText}
      cancelText={config.cancelText}
      variant={config.variant}
      requireWrittenConfirmation={config.requireWrittenConfirmation}
      confirmationKeyword={config.confirmationKeyword}
      onConfirm={() => {
        config.onConfirm();
        hideWarningPopup();
      }}
      onCancel={() => {
        if (config.onCancel) config.onCancel();
        hideWarningPopup();
      }}
    />
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(7, 22, 41, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 15,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  iconBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  iconBubbleDanger: {
    backgroundColor: 'rgba(217, 74, 80, 0.14)',
    borderColor: 'rgba(217, 74, 80, 0.35)',
  },
  iconBubbleWarning: {
    backgroundColor: 'rgba(217, 154, 50, 0.14)',
    borderColor: 'rgba(217, 154, 50, 0.35)',
  },
  headerTextCol: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 0.2,
  },
  subtitleBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.danger,
    marginTop: 2,
    letterSpacing: 0.6,
  },
  messageText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  detailsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.appBackground,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
  },
  detailsText: {
    fontSize: 12,
    color: colors.textMuted,
    fontFamily: 'monospace',
    flex: 1,
  },
  writtenConfirmationContainer: {
    backgroundColor: colors.appBackground,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  instructionText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  keywordHighlight: {
    color: colors.danger,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  confirmationInput: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 6,
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    textAlign: 'center',
    fontFamily: 'monospace',
    // @ts-ignore
    outlineStyle: 'none',
  },
  confirmationInputValid: {
    borderColor: colors.danger,
    backgroundColor: 'rgba(217, 74, 80, 0.08)',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 6,
  },
  cancelButton: {
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.elevatedSurface,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonPressed: {
    backgroundColor: colors.hoverSurface,
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 18,
    borderRadius: 8,
    justifyContent: 'center',
  },
  confirmButtonDanger: {
    backgroundColor: colors.danger,
    shadowColor: colors.danger,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 3,
  },
  confirmButtonWarning: {
    backgroundColor: colors.warning,
  },
  confirmButtonDisabled: {
    opacity: 0.35,
  },
  confirmButtonPressed: {
    opacity: 0.85,
  },
  confirmIcon: {
    marginRight: 2,
  },
  confirmButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
