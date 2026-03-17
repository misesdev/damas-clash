/**
 * Jest global setup — runs after the test framework is installed.
 *
 * Suppresses known-benign React Native act() warnings that originate from the
 * Animated API scheduling value updates outside React's act() boundary. These
 * updates come from animation loops (pulsing dots, loaders) whose timers fire
 * asynchronously and cannot be easily wrapped in act() without mocking the
 * entire Animated system or enabling fake timers (which breaks other tests).
 *
 * All other console.error messages are forwarded unchanged.
 */

const originalConsoleError = console.error.bind(console);

console.error = (...args: Parameters<typeof console.error>) => {
  // React passes the format string as args[0] ("An update to %s inside a test was not
  // wrapped in act...") and the component name as args[1] ("Animated(Text)").
  // We must check both arguments, not a single joined string.
  const fmt = typeof args[0] === 'string' ? args[0] : '';
  const component = typeof args[1] === 'string' ? args[1] : '';

  // Suppress only Animated(Text) / Animated(View) / Animated(Image) act() warnings.
  if (
    fmt.includes('not wrapped in act') &&
    component.startsWith('Animated(')
  ) {
    return;
  }

  originalConsoleError(...args);
};
