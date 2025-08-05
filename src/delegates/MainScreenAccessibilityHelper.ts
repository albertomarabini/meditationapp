import React from 'react';

/**
 * Helper delegate for assigning accessibility props to MainScreen interactive elements.
 * Ensures DRY, consistent, and localizable accessibility labeling.
 */
export class MainScreenAccessibilityHelper {
  /**
   * Returns standardized accessibility props for an interactive element.
   * @param label - Descriptive, localizable label for screen readers.
   */
  static getAccessibilityProps(label: string): { accessible: true; accessibilityLabel: string } {
    return {
      accessible: true,
      accessibilityLabel: label,
    };
  }

  /**
   * Optionally wraps an element with the proper accessibility props.
   * @param element - JSX element to enhance
   * @param label - Descriptive, localizable label
   */
  static applyAccessibilityToElement<P extends object>(
    element: React.ReactElement<P>,
    label: string
  ): React.ReactElement<P> {
    // TS wants you to go through unknown before Partial<P>
    return React.cloneElement(
      element,
      MainScreenAccessibilityHelper.getAccessibilityProps(label) as unknown as Partial<P>
    );
  }
}
