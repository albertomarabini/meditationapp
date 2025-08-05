// /src/delegates/TimerStateStoreFormErrorHelper.ts

/**
 * Stateless utility for mapping SessionTimer form validation error keys
 * to user-friendly, localized error messages for display in the UI.
 * Used by SessionTimerForm and TimerStateStore.
 */
export class TimerStateStoreFormErrorHelper {
  /**
   * Returns a localized, user-friendly error message for a given error key.
   * Uses the provided i18n translation function if available; otherwise,
   * returns the raw error string.
   *
   * @param errorKey - The key of the field or error (e.g. 'name', 'segmentationSound_uri').
   * @param errors - The current form errors map (Record<string, string>).
   * @param i18n - A translation function (key: string) => string.
   */
  static getErrorMessage(
    errorKey: string,
    errors: Record<string, string>,
    i18n: (key: string) => string
  ): string {
    if (!errors || !errors[errorKey]) return '';
    const errorMsg = errors[errorKey];
    return i18n(errorMsg);
  }
}
