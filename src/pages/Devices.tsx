/**
 * Devices start scan on enter and stop scan on exit.
 * 
 * If selected device is connected
 */

import { BleClient } from '@capacitor-community/bluetooth-le'

import React, { useEffect } from 'react'
import type { Dispatch } from 'react'
import {
  IonPage, IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle, IonContent, useIonViewWillEnter, useIonViewWillLeave,
  IonList, IonItem, IonLabel
} from '@ionic/react'
import './Devices.css'

import type { AppAction, ScannedDevice } from '../types/appTypes'

interface DevicesProps {
  dispatch: Dispatch<AppAction>
  scanned: ScannedDevice[]
}

const onDisconnect = (id: string): void => {
  console.log(`${id} disconnected`)
}

const Devices: React.FC<DevicesProps> = ({ dispatch, scanned }) => {
  useEffect(() => {
    BleClient.getConnectedDevices([])
      .then(list => { console.log('connected devices', list) })
      .catch(e => { console.log('error', e) })
  }, [])

  useIonViewWillEnter(() => {
    dispatch({ type: 'START_SCAN' })
  })

  useIonViewWillLeave(() => {
    dispatch({ type: 'STOP_SCAN' })
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
          { scanned.map(({ id, name, rssi }) => {
            return (
              <IonItem key={id} onClick={() => {
                BleClient.connect(id, onDisconnect)
                  .then(() => {
                    console.log(`${id} connected`)
                  })
                  .catch(e => {
                    console.log(`failed to connect to ${id}`)
                  })
              }}>
                <IonLabel>
                  <h2>{name ?? '(noname)'}</h2>
                  <p>{id}</p>
                  <p>{`${rssi} dB`}</p>
                </IonLabel>
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
