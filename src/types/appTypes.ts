// export enum AppActionEnum {
//   START_SCAN,
//   START_SCAN_FAILED,
//   STOP_SCAN,
//   STOP_SCAN_FAILED,
//   SCAN_RESULT,
//   SCAN_STARTED,
//   SCAN_STOPPED,
// }

export interface ScannedDevice {
  id: string
  name?: string
  rssi?: number
}

export type SelectedDevice =
  | null
  | { id: string, connect: 'CONNECTING' }
  | { id: string, connect: 'CONNECT_FAILED' }
  | { id: string, connect: 'CONNECTED' }
  | { id: string, connect: 'DISCONNECTING' }
  | { id: string, connect: 'DISCONNECTED' }

export type SelectAction =
  | { type: 'CONNECT', id: string }
  | { type: 'CONNECT_FAILED' }
  | { type: 'CONNECTED' }
  | { type: 'DISCONNECT' }
  | { type: 'DISCONNECTED' }

export type AppAction =
  | { type: 'START_SCAN' }
  | { type: 'START_SCAN_FAILED' }
  | { type: 'STOP_SCAN' }
  | { type: 'STOP_SCAN_FAILED' }
  | { type: 'SCAN_RESULT', id: string, name?: string, rssi?: number }
  | { type: 'SCAN_STARTED' }
  | { type: 'SCAN_STOPPED' }
