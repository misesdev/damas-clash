import { NostrEvent } from "../services/nostr/types/NostrEvent"

export const distinctEvent = (events: NostrEvent[]) => {
  return events.filter((event, index, self) => {
    return index == self.findIndex(x => x.id == event.id)
  })
}

export function bytesToHex(bytes: Uint8Array): string {
  if (bytes.length <= 0)
    throw new Error("The byte array is empty!")
  let hexValue: string = ""
  bytes.forEach(byte => {
    let hexNumber = byte.toString(16)
    if (hexNumber.length == 1)
    hexNumber = "0" + hexNumber
    hexValue += hexNumber
  })
  return hexValue
}

export function hexToBytes(hex: string, hexadecimal: boolean = true): Uint8Array {
  if(hex.length <= 0)
    throw new Error("hex value is empty")
  if (hexadecimal && hex.length % 2 !== 0)
  throw new Error("Invalid hex value!")
  let bytes = new Uint8Array(hexadecimal ? hex.length / 2 : hex.length)
  for (let i = 0; i <= hex.length; i += hexadecimal ? 2 : 1) 
  {
    if (hexadecimal)
      bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16)
    else
      bytes[i] = hex.charCodeAt(i)
  }
  return bytes;
}

export function formatSats(value: number, locale: Locale) {
  return `${new Intl.NumberFormat(locale).format(value)}`;
}

export type Locale = "pt"|"en"
