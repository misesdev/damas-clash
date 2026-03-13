import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'lightning_address';

export const saveLightningAddress = (address: string) => AsyncStorage.setItem(KEY, address);
export const loadLightningAddress = () => AsyncStorage.getItem(KEY);
export const clearLightningAddress = () => AsyncStorage.removeItem(KEY);
