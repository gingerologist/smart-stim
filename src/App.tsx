import { BleClient } from '@capacitor-community/bluetooth-le'

import React, { useState, useEffect, useReducer } from 'react'
import { Redirect, Route } from 'react-router-dom'
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react'
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

import { type AppAction, type ScannedDevice, type SelectedDevice } from './types/appTypes'

import Home from './pages/Home'
import Devices from './pages/Devices'

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

enum ScanStateEnum {
  STARTING,
  STARTED,
  STOPPING,
  STOPPED,
}

interface AppState {
  scan: ScanStateEnum
  scanned: ScannedDevice[]
}

function reducer (state: AppState, action: AppAction): AppState {
  const { scan, scanned } = state
  switch (action.type) {
    case 'START_SCAN':
      if (scan !== ScanStateEnum.STOPPED) {
        return state
      } else {
        return { ...state, scan: ScanStateEnum.STARTING, scanned: [] }
      }
    case 'SCAN_STARTED':
      return { ...state, scan: ScanStateEnum.STARTED }
    case 'STOP_SCAN':
      if (scan !== ScanStateEnum.STARTED) {
        return state
      } else {
        return { ...state, scan: ScanStateEnum.STOPPING }
      }
    case 'SCAN_STOPPED':
      return { ...state, scan: ScanStateEnum.STOPPED }
    case 'SCAN_RESULT':
      if (scan !== ScanStateEnum.STARTED) {
        return state
      } else {
        const { id, name, rssi } = action
        const index = scanned.findIndex(x => x.id === id)
        if (index < 0) {
          return {
            ...state,
            scanned: [...scanned, { id, name, rssi }]
          }
        } else {
          return {
            ...state,
            scanned: [
              ...scanned.slice(0, index),
              { id, name, rssi },
              ...scanned.slice(index + 1)
            ]
          }
        }
      }
    default:
      break
  }
  return state
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

const initState = {
  scan: ScanStateEnum.STOPPED,
  scanned: []
}

const App: React.FC = () => {
  const [state, dispatch] = useReducer(reducer, initState)
  const { scan, scanned } = state

  useEffect(() => {
    switch (scan) {
      case ScanStateEnum.STARTING: {
        BleClient.requestLEScan({ allowDuplicates: true }, result => {
          dispatch({
            type: 'SCAN_RESULT',
            id: result.device.deviceId,
            name: result.device.name,
            rssi: result.rssi
          })
        }).then(() => { dispatch({ type: 'SCAN_STARTED' }) })
          .catch(() => { dispatch({ type: 'START_SCAN_FAILED' }) })
        break
      }
      case ScanStateEnum.STOPPING: {
        BleClient.stopLEScan()
          .then(() => { dispatch({ type: 'SCAN_STOPPED' }) })
          .catch(() => { dispatch({ type: 'STOP_SCAN_FAILED' }) })
        break
      }
      default:
        break
    }
  }, [scan])

  return (
    <IonApp>
      <IonReactRouter>
        <IonRouterOutlet>
          <Route exact path='/home'>
            <Home dispatch={ dispatch } />
          </Route>
          <Route exact path='/devices'>
            <Devices />
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
