/**
 * Devices start scan on enter and stop scan on exit.
 *
 * If selected device is connected
 */

import { BleClient } from '@capacitor-community/bluetooth-le'

import React, { useEffect, useState, useRef, useReducer } from 'react'
import type { Dispatch } from 'react'
import {
  IonPage, IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle, IonContent,
  useIonViewDidEnter, useIonViewDidLeave,
  IonList, IonItem, IonLabel, IonBadge // useIonAlert
} from '@ionic/react'
import './Devices.css'

import type { ScannedDevice, SelectAction, SelectedDevice } from '../types/appTypes'

interface ScanState {
  state: 'STARTING' | 'STARTED' | 'STOPPED'
  devices: ScannedDevice[]
  index: number
}

type ScanAction =
  | { type: 'START' }
  | { type: 'START_FAILED' }
  | { type: 'STARTED' }
  | { type: 'RESULT', id: string, name?: string, rssi?: number }
  | { type: 'STOP' }
  | { type: 'EXIT' }
  | { type: 'SELECT', index: number }

function reducer (scanState: ScanState, action: ScanAction): ScanState {
  // TODO state is never read. Should we block some action if state is incorrect?
  const { state, devices, index } = scanState
  switch (action.type) {
    case 'START':
      return { ...scanState, state: 'STARTING' }

    case 'START_FAILED':
      return { ...scanState, state: 'STOPPED' }

    case 'STARTED':
      return { ...scanState, state: 'STARTED' }

    case 'RESULT': {
      // if (state !== 'STARTED') return scanState
      const { id, name, rssi } = action
      const index = devices.findIndex(x => x.id === id)
      if (index < 0) {
        return { ...scanState, devices: [...devices, { id, name, rssi }] }
      } else {
        return {
          ...scanState,
          devices: [
            ...devices.slice(0, index),
            { id, name, rssi },
            ...devices.slice(index + 1)
          ]
        }
      }
    }
    case 'STOP':
      return { ...scanState, state: 'STOPPED' }
    case 'EXIT':
      return { state: 'STOPPED', devices: [], index: -1 }
    case 'SELECT':
      return { ...scanState, index: action.index }
    default:
      return scanState
  }
}

interface DevicesProps {
  selected: SelectedDevice
  select: (id: string) => void
  selectDispatch?: Dispatch<SelectAction>
}

// TODO can we remove this 'global' variable, put it into function component scope?
// let timer: ReturnType<typeof setInterval>

const Devices: React.FC<DevicesProps> = ({ selected, select, selectDispatch }) => {
  const [scanState, dispatch] = useReducer(reducer, { state: 'STOPPED', devices: [], index: -1 })
  const stateRef = useRef<ScanState>()
  stateRef.current = scanState

  useIonViewDidEnter(() => {
    console.log('requestLEScan')
    BleClient.requestLEScan({ allowDuplicates: true },
      ({ device: { deviceId: id, name }, rssi }) => { dispatch({ type: 'RESULT', id, name, rssi }) })
      .then(() => {
        console.log('requestLEScan OK')
        dispatch({ type: 'STARTED' })
      })
      .catch(e => {
        console.log('requestLEScan ERROR')
        dispatch({ type: 'START_FAILED' })
      })
  })

  useIonViewDidLeave(() => {
    console.log('stopLEScan')
    const state = stateRef.current
    if (state !== undefined && state.index !== -1) {
      const { id } = state.devices[state.index]
      select(id)
    }

    BleClient.stopLEScan()
      .then(() => { dispatch({ type: 'EXIT' }) })
      .catch(e => { dispatch({ type: 'EXIT' }) })

    // clearInterval(timer)
  })

  // These codes are used to fake an item
  // useEffect(() => {
  //   if (selected?.connect === 'CONNECTED') {
  //     dispatch({ type: 'RESULT', id: selected.id, name: 'HowlandStim' })
  //   }
  // }, [])

  // const connectedId = scanState.devices.find(x => x.id === selected?.id && selected.connect === 'CONNECTED')?.id
  // useEffect(() => {
  //   if (connectedId !== undefined) {
  //     timer = setInterval(() => {
  //       BleClient.readRssi(connectedId)
  //         .then(rssi => {
  //           dispatch({ type: 'RESULT', id: connectedId, name: 'HowlandStim', rssi })
  //         })
  //         .catch(e => {})
  //     }, 2000)
  //     return () => {
  //       clearInterval(timer)
  //     }
  //   }
  // }, [connectedId])

  return (
    <IonPage id='devices-page'>
      <IonHeader>
        <IonToolbar color='primary'>
          <IonButtons slot='start'>
            <IonBackButton />
          </IonButtons>
          <IonTitle>Devices</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonList>
          { scanState.devices.map(({ id, name, rssi }, index) => {
            if (name === 'HowlandStim') {
              return (
                <IonItem
                  key={`ble-scan-dev-${id}`}
                  button
                  routerLink='/home'
                  routerDirection='back'
                  onClick={() => {
                    // select(id)
                    // setSelectId(id)
                    // defer
                    dispatch({ type: 'SELECT', index })
                  }}>
                  <IonLabel color='secondary'>
                    <h1>{name ?? '(noname)'}</h1>
                    <p>{id}</p>
                    <p>{`${rssi ?? '??'} dB`}</p>
                  </IonLabel>
                  { selected?.id === id && selected?.connect === 'DISCONNECTED' && (
                    <IonBadge color='medium'>last connected</IonBadge>
                  )}
                </IonItem>
              )
            } else {
              return (
                <IonItem key={`ble-scan-dev-${id}`}>
                  <IonLabel color='medium'>
                    <h1>{name ?? '(noname)'}</h1>
                    <p>{id}</p>
                    <p>{`${rssi} dB`}</p>
                  </IonLabel>
                </IonItem>
              )
            }
          }) }
        </IonList>
      </IonContent>
    </IonPage>
  )
}

export default Devices
