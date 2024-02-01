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

import type { SelectedDevice, SelectAction } from './types/appTypes'

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
        return { id: selected.id, connect: 'DISCONNECTING' }
      }
      break
    case 'DISCONNECTED':
      if (selected !== null) {
        return { id: selected.id, connect: 'DISCONNECTED' }
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

const App: React.FC = () => {
  const [selected, dispatch] = useReducer(reducer, null)
  const [testMode, setTestMode] = useState<boolean>(false)

  return (
    <IonApp>
      <IonReactRouter>
        <IonRouterOutlet>
          <Route exact path='/home'>
            <Home testMode={testMode} selected={selected}/>
          </Route>
          <Route exact path='/devices'>
            <Devices selected={selected} selectDispatch={dispatch} />
          </Route>
          <Route exact path='/settings'>
            <Settings testMode={testMode} setTestMode={(mode: boolean) => { setTestMode(mode) }}/>
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
