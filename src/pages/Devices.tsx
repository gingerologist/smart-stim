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
  useIonViewWillEnter, useIonViewDidEnter, useIonViewWillLeave, useIonViewDidLeave,
  IonList, IonItem, IonLabel, IonNote, IonBadge
} from '@ionic/react'
import './Devices.css'

import type { AppAction, ScannedDevice } from '../types/appTypes'

interface ScanState {
  state: 'STARTING' | 'STARTED' | 'STOPPED'
  devices: ScannedDevice[]
}

type ScanAction =
  | { type: 'START' }
  | { type: 'START_FAILED' }
  | { type: 'STARTED' }
  | { type: 'RESULT', id: string, name?: string, rssi?: number }
  | { type: 'STOP' }



const onDisconnect = (id: string): void => {
  console.log(`${id} disconnected`)
}

function reducer (scanState: ScanState, action: ScanAction): ScanState {
  const { state, devices } = scanState
  switch (action.type) {
    case 'START':
      return { state: 'STARTING', devices }

    case 'START_FAILED':
      return { state: 'STOPPED', devices }

    case 'STARTED':
      return { state: 'STARTED', devices: [] }

    case 'RESULT': {
      if (state !== 'STARTED') return scanState
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
    case 'STOP': {
      return { state: 'STOPPED', devices }
    }
    default:
      return scanState
  }
}

interface DevicesProps {
  select?: ScannedDevice
}

const Devices: React.FC<DevicesProps> = ({ select }) => {
  const [scanState, dispatch] = useReducer(reducer, { state: 'STOPPED', devices: [] })

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
    BleClient.stopLEScan()
      .then(() => { dispatch({ type: 'STOP' }) })
      .catch(e => { dispatch({ type: 'STOP' }) })
  })

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
          { scanState.devices.map(({ id, name, rssi }) => {
            return (
              <IonItem key={id} onClick={() => {
                // BleClient.connect(id, onDisconnect)
                //   .then(() => {
                //     console.log(`${id} connected`)
                //   })
                //   .catch(e => {
                //     console.log(`failed to connect to ${id}`)
                //   })
              }}>
                <IonLabel>
                  <h2 color='primary'>{name ?? '(noname)'}</h2>
                  <p>{id}</p>
                  <p>{`${rssi} dB`}</p>
                </IonLabel>
                {(!!select && select.id === id) && <IonBadge>HELLO</IonBadge>}
              </IonItem>
            )
          })
          }
        </IonList>
      </IonContent>
    </IonPage>
  )
}

export default Devices
