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

export interface DeviceConfig {
  timeout: number
  numOfPulses: number
  pulseWidth: number
  pulseInterval: number
  mid: number
  recycle: number
  tail: number
  current: number[]
}

export type SelectedDevice =
  | null
  | { id: string, connect: 'CONNECTING' }
  //  | { id: string, connect: 'CONNECT_FAILED' }
  | { id: string, connect: 'CONNECTED', config?: DeviceConfig }
  | { id: string, connect: 'DISCONNECTING', config?: DeviceConfig }
  | { id: string, connect: 'DISCONNECTED', config?: DeviceConfig }

export type SelectAction =
  | { type: 'CONNECT', id: string }
  | { type: 'CONNECT_FAILED' }
  | { type: 'CONNECTED' }
  | { type: 'DISCONNECT' }
  | { type: 'DISCONNECTED' }
  | { type: 'CONFIG_UPDATE', config: DeviceConfig }

export type AppAction =
  | { type: 'START_SCAN' }
  | { type: 'START_SCAN_FAILED' }
  | { type: 'STOP_SCAN' }
  | { type: 'STOP_SCAN_FAILED' }
  | { type: 'SCAN_RESULT', id: string, name?: string, rssi?: number }
  | { type: 'SCAN_STARTED' }
  | { type: 'SCAN_STOPPED' }
