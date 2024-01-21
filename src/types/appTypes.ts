export enum AppActionEnum {
  START_SCAN,
  START_SCAN_FAILED,
  STOP_SCAN,
  STOP_SCAN_FAILED,
  SCAN_RESULT,
  SCAN_STARTED,
  SCAN_STOPPED,
}

export interface ScannedDevice {
  id: string
  name?: string
  rssi?: number
}

export type AppAction =
  | { type: AppActionEnum.START_SCAN }
  | { type: AppActionEnum.START_SCAN_FAILED }
  | { type: AppActionEnum.STOP_SCAN }
  | { type: AppActionEnum.STOP_SCAN_FAILED }
  | { type: AppActionEnum.SCAN_RESULT, id: string, name?: string, rssi?: number }
  | { type: AppActionEnum.SCAN_STARTED }
  | { type: AppActionEnum.SCAN_STOPPED }
