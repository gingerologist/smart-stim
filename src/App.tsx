import { BleClient, BleServices, numbersToDataView, type BleService, dataViewToHexString } from '@capacitor-community/bluetooth-le'

import React, { useState, useEffect, useRef, useReducer } from 'react'
import { Redirect, Route } from 'react-router-dom'
import { IonApp, IonRouterOutlet, setupIonicReact, IonLoading } from '@ionic/react'
import { IonReactRouter } from '@ionic/react-router'

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css'

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css'
import '@ionic/react/css/structure.css'
import '@ionic/react/css/typography.css'

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css'
import '@ionic/react/css/float-elements.css'
import '@ionic/react/css/text-alignment.css'
import '@ionic/react/css/text-transformation.css'
import '@ionic/react/css/flex-utils.css'
import '@ionic/react/css/display.css'

/* Theme variables */
import './theme/variables.css'

import { type SelectedDevice, type SelectAction, type DeviceConfig } from './types/appTypes'

import Home from './pages/Home'
import Devices from './pages/Devices'
import Settings from './pages/Settings'

// import { menuController } from '@ionic/core/components'

async function bleInit (): Promise<void> {
  await BleClient.initialize({ androidNeverForLocation: true })
  const devices = await BleClient.getConnectedDevices([])
  for (const d of devices.filter(({ name }) => name === 'HowlandStim')) {
    console.log(`disconnecting ${d.deviceId}`)
    await BleClient.disconnect(d.deviceId)
  }
}

await bleInit()

setupIonicReact()

function reducer (selected: SelectedDevice, action: SelectAction): SelectedDevice {
  console.log('action', action)
  switch (action.type) {
    case 'CONNECT':
      return { id: action.id, connect: 'CONNECTING' }

    case 'CONNECTED':
      if (selected !== null) {
        return { id: selected.id, connect: 'CONNECTED' }
      }
      break
    case 'CONNECT_FAILED':
      if (selected !== null) {
        return { id: selected.id, connect: 'DISCONNECTED' }
      }
      break
    case 'DISCONNECT':
      if (selected !== null) {
        if (selected.connect === 'CONNECTING') {
          return { id: selected.id, connect: 'DISCONNECTING' }
        } else {
          return { id: selected.id, connect: 'DISCONNECTING', config: selected.config }
        }
      }
      break
    case 'DISCONNECTED':
      if (selected !== null) {
        if (selected.connect === 'CONNECTED' || selected.connect === 'DISCONNECTING') {
          return { id: selected.id, connect: 'DISCONNECTED', config: selected.config }
        }
      }
      break
    default:
      break
  }
  return selected
}

/**
 * hierarchical (hirel) or parallel?
 *
 * scan is 'local' to scan view
 * (nullable) selected device is persistent to all view, though it may not be connected. it is only set in scan view.
 * connect: connecting (scan view), connected (both), disconnecting (scan view), disconnected (both)
 *
 *
 */
const delay = async (ms: number): Promise<void> => { await new Promise(resolve => setTimeout(resolve, ms)) }

const BLE_NUS_SVC_UUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e'
const BLE_NUS_RXD_UUID = '6e400002-b5a3-f393-e0a9-e50e24dcca9e'
const BLE_NUS_TXD_UUID = '6e400003-b5a3-f393-e0a9-e50e24dcca9e'

const App: React.FC = () => {
  const [selected, dispatch] = useReducer(reducer, null)
  const [allowZeroPulse, setAllowZeroPulse] = useState<boolean>(true)
  const [config, setConfig] = useState<DeviceConfig>()

  const onDisconnect = (id: string): void => {
    dispatch({ type: 'DISCONNECTED' })
  }

  const onNotify = (value: DataView): void => {
    if (value.byteLength === 24) {
      const counter = value.getUint16(0, true) // TODO
      const numOfPulses = value.getUint16(4, true)
      const config = {
        timeout: value.getUint16(2, true),
        numOfPulses,
        pulseWidth: value.getUint16(6, true),
        pulseInterval: value.getUint16(8, true),
        mid: value.getUint16(10, true),
        recycle: value.getUint16(12, true),
        tail: value.getUint16(14, true),
        current: [
          value.getInt8(16),
          value.getInt8(17),
          value.getInt8(18),
          value.getInt8(19),
          value.getInt8(20),
          value.getInt8(21),
          value.getInt8(22),
          value.getInt8(23)
        ]
      }

      setConfig(config)
      console.log(config)
    }
  }

  const updateConfig = (config: DeviceConfig): void => {
    if (selected === null) return
    if (selected.connect !== 'CONNECTED') return

    const buffer = new ArrayBuffer(24)
    const view = new DataView(buffer)
    view.setUint16(0, 2, true)
    view.setUint16(2, config.timeout, true)
    view.setUint16(4, config.numOfPulses, true)
    view.setUint16(6, config.pulseWidth, true)
    view.setUint16(8, config.pulseInterval, true)
    view.setUint16(10, config.mid, true)
    view.setUint16(12, config.recycle, true)
    view.setUint16(14, config.tail, true)
    view.setInt8(16, config.current[0])
    view.setInt8(17, config.current[1])
    view.setInt8(18, config.current[2])
    view.setInt8(19, config.current[3])
    view.setInt8(20, config.current[4])
    view.setInt8(21, config.current[5])
    view.setInt8(22, config.current[6])
    view.setInt8(23, config.current[7])

    BleClient.write(selected.id, BLE_NUS_SVC_UUID, BLE_NUS_RXD_UUID, view)
      .then(() => {})
      .catch(e => {})
  }

  const connect = async (id: string): Promise<void> => {
    try {
      await BleClient.connect(id, onDisconnect)
      let services: BleService[]

      for (;;) {
        services = await BleClient.getServices(id)
        if (services.length > 0) break
        await delay(200)
      }

      const uartSvc = services.find(svc => svc.uuid === BLE_NUS_SVC_UUID)
      if (uartSvc === undefined) {
        throw new Error('uart service not found')
      }

      await BleClient.startNotifications(id, BLE_NUS_SVC_UUID, BLE_NUS_TXD_UUID, onNotify)
      // await BleClient.write(id, BLE_NUS_SVC_UUID, BLE_NUS_RXD_UUID,
      //   numbersToDataView([
      //     0x02, 0x00,
      //     0x00, 0x00,
      //     0x01, 0x00,
      //     0x32, 0x00,
      //     0x00, 0x00,
      //     0x00, 0x00,
      //     0xc8, 0x00,
      //     0x00, 0x00,
      //     0x00, 0x00, 0x0A, 0xf6, 0x00, 0x00, 0x00, 0x00
      //   ]))
      await BleClient.write(id, BLE_NUS_SVC_UUID, BLE_NUS_RXD_UUID, numbersToDataView([0]))
    } catch (e) {
      console.log(e)
      await BleClient.disconnect(id)
      throw e
    }
  }

  useEffect(() => {
    if (selected?.connect === 'CONNECTING') {
      connect(selected.id)
        .then(() => { dispatch({ type: 'CONNECTED' }) })
        .catch(e => { dispatch({ type: 'CONNECT_FAILED' }) })
    } else if (selected?.connect === 'DISCONNECTING') {
      BleClient.disconnect(selected.id)
        .then(() => {})
        .catch(e => {})
        .finally(() => {
          // dispatch({ type: 'DISCONNECTED' })
        })
    }
  }, [selected])

  const onDeviceSelect = (id: string): void => {
    dispatch({ type: 'CONNECT', id })
  }

  const disconnect = (): void => { dispatch({ type: 'DISCONNECT' }) }

  return (
    <IonApp>
      <IonReactRouter>
        <IonRouterOutlet>
          <IonLoading message='connecting' isOpen={selected?.connect === 'CONNECTING'} />
          <Route exact path='/home'>
            <Home
              allowZeroPulse={allowZeroPulse}
              selected={selected}
              config={config}
              disconnect={disconnect}
              setAllowZeroPulse={(mode: boolean) => { setAllowZeroPulse(mode) }}
              updateConfig={updateConfig}
            />
          </Route>
          <Route exact path='/devices'>
            <Devices selected={selected} selectDispatch={dispatch} select={onDeviceSelect} />
          </Route>
          <Route exact path='/settings'>
            <Settings allowZeroPulse={allowZeroPulse} setAllowZeroPulse={(mode: boolean) => { setAllowZeroPulse(mode) }}/>
          </Route>
          <Route exact path='/'>
            <Redirect to='/home' />
          </Route>
        </IonRouterOutlet>
      </IonReactRouter>
    </IonApp>
  )
}

export default App
