let store: Record<string, string> = {};

export const ACCESSIBLE = {
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WhenUnlockedThisDeviceOnly',
};

export const setGenericPassword = jest.fn(
  (_username: string, password: string, options?: {service?: string}) => {
    store[options?.service ?? '__default'] = password;
    return Promise.resolve(true);
  },
);

export const getGenericPassword = jest.fn(
  (options?: {service?: string}) => {
    const value = store[options?.service ?? '__default'];
    if (!value) return Promise.resolve(false);
    return Promise.resolve({username: 'session', password: value});
  },
);

export const resetGenericPassword = jest.fn(
  (options?: {service?: string}) => {
    delete store[options?.service ?? '__default'];
    return Promise.resolve(true);
  },
);

// reset between tests
export const __resetStore = () => { store = {}; };
