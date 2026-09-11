/**
 * FINORA System Access & Security Control
 * Controls Demo/Guest Mode availability, Super Admin quick banner visibility, and Master PIN.
 */

export interface SystemAccessControl {
  isGuestModeEnabled: boolean;
  isSuperAdminQuickLoginEnabled: boolean;
  masterPin: string;
  updatedAt?: string;
}

const STORAGE_KEY = 'finora_system_access_control';

const DEFAULT_SETTINGS: SystemAccessControl = {
  isGuestModeEnabled: true,
  // By default, turn OFF public Super Admin quick login banner so general visitors only see standard login
  isSuperAdminQuickLoginEnabled: false,
  masterPin: '2026',
  updatedAt: new Date().toISOString(),
};

export const getSystemAccessControl = (): SystemAccessControl => {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      isGuestModeEnabled: parsed.isGuestModeEnabled ?? DEFAULT_SETTINGS.isGuestModeEnabled,
      isSuperAdminQuickLoginEnabled: parsed.isSuperAdminQuickLoginEnabled ?? DEFAULT_SETTINGS.isSuperAdminQuickLoginEnabled,
      masterPin: parsed.masterPin || DEFAULT_SETTINGS.masterPin,
      updatedAt: parsed.updatedAt || DEFAULT_SETTINGS.updatedAt,
    };
  } catch (err) {
    console.warn('Failed to parse system access control, returning default:', err);
    return DEFAULT_SETTINGS;
  }
};

export const saveSystemAccessControl = (
  updates: Partial<SystemAccessControl>
): SystemAccessControl => {
  const current = getSystemAccessControl();
  const next: SystemAccessControl = {
    ...current,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      // Notify all components in the app about system settings change
      window.dispatchEvent(
        new CustomEvent('finora_system_settings_updated', { detail: next })
      );
    } catch (err) {
      console.error('Failed to save system access control:', err);
    }
  }

  return next;
};
