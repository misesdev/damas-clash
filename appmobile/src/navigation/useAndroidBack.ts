import {useEffect, useRef} from 'react';
import {BackHandler} from 'react-native';

/**
 * Intercepts the Android hardware back button.
 * The handler must return `true` to consume the event (prevent default exit).
 * Uses a ref internally so the latest handler is always called — no stale
 * closure risk even when the handler function changes on every render.
 */
export function useAndroidBack(onBack: () => boolean) {
  const ref = useRef(onBack);

  // Keep ref current on every render without re-registering the listener.
  useEffect(() => {
    ref.current = onBack;
  });

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () =>
      ref.current(),
    );
    return () => sub.remove();
  }, []);
}
