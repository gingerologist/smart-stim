/**
 * Devices start scan on enter and stop scan on exit.
 *
 * If selected device is connected
 */

import { BleClient, numbersToDataView } from '@capacitor-community/bluetooth-le'

import React, { useEffect, useState, useRef, useReducer } from 'react'
import type { Dispatch } from 'react'
import {
  IonPage, IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle, IonContent,
  useIonViewWillEnter, useIonViewDidEnter, useIonViewWillLeave, useIonViewDidLeave,
  IonList, IonItem, IonLabel, IonNote, IonBadge, IonModal, IonAlert, useIonAlert
} from '@ionic/react'
import './Devices.css'

import type { AppAction, ScannedDevice, SelectAction, SelectedDevice } from '../types/appTypes'

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
  | { type: 'EXIT' }

const onDisconnect = (id: string): void => {
  // TODO
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
      return { state: 'STARTED', devices }

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
      return { state: 'STOPPED', devices }
    case 'EXIT':
      return { state: 'STOPPED', devices: [] }
    default:
      return scanState
  }
}

interface DevicesProps {
  selected: SelectedDevice
  selectDispatch: Dispatch<SelectAction>
}

let timer

const delay = async (ms: number) => await new Promise(resolve => setTimeout(resolve, ms))

const BLE_NUS_SVC_UUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e'
const BLE_NUS_RXD_UUID = '6e400002-b5a3-f393-e0a9-e50e24dcca9e'
const BLE_NUS_TXD_UUID = '6e400003-b5a3-f393-e0a9-e50e24dcca9e'

const connect = async (id: string): Promise<void> => {
  try {
    await BleClient.connect(id, onDisconnect)
    for (;;) {
      const services = await BleClient.getServices(id)
      if (services.length === 0) {
        await delay(200)
        continue
      }

      const uartSvc = services.find(svc => svc.uuid === BLE_NUS_SVC_UUID)
      if (uartSvc === undefined) {
        throw new Error('uart service not found')
      }

      await BleClient.startNotifications(id, BLE_NUS_SVC_UUID, BLE_NUS_TXD_UUID, notify)

      // const enc = new TextEncoder()
      // const arr = enc.encode('hello')
      // const view = new DataView(arr.buffer)
      // await BleClient.write(id, BLE_NUS_SVC_UUID, BLE_NUS_RXD_UUID, numbersToDataView([0x00]))
      await BleClient.write(id, BLE_NUS_SVC_UUID, BLE_NUS_RXD_UUID,
        numbersToDataView([
          0x02, 0x00,
          0x00, 0x00,
          0x01, 0x00,
          0x32, 0x00,
          0x00, 0x00,
          0x00, 0x00,
          0xc8, 0x00,
          0x00, 0x00,
          0x00, 0x00, 0x0A, 0xf6, 0x00, 0x00, 0x00, 0x00
        ]))
      break
      // await BleClient.writeWithoutResponse(id, BLE_NUS_SVC_UUID, BLE_NUS_RXD_UUID, view)
    }
  } catch (e) {
    console.log(e)
    await BleClient.disconnect(id)
  }
}

const notify = dataview => {

}

const Devices: React.FC<DevicesProps> = ({ selected, selectDispatch }) => {
  const [scanState, dispatch] = useReducer(reducer, { state: 'STOPPED', devices: [] })
  const [presentAlert] = useIonAlert()

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
      .then(() => { dispatch({ type: 'EXIT' }) })
      .catch(e => { dispatch({ type: 'EXIT' }) })

    clearInterval(timer)
  })

  useEffect(() => {
    if (selected?.connect === 'CONNECTED') {
      dispatch({ type: 'RESULT', id: selected.id, name: 'HowlandStim' })
    }
  }, [])

  useEffect(() => {
    if (selected?.connect === 'CONNECTING') {
      // BleClient.connect(selected.id, onDisconnect)
      //   .then(() => {
      //     console.log(`${selected.id} connected`)
      //     BleClient.getServices(selected.id)
      //       .then(services => {
      //         console.log('services', services)
      //         selectDispatch({ type: 'CONNECTED' })
      //       })
      //       .catch(e => {
      //         console.log(`${selected.id} getServices() failed`)
      //         selectDispatch({ type: 'CONNECT_FAILED' })
      //       })
      //   })
      //   .catch(e => {
      //     console.log(`${selected.id} connect failed`)
      //     selectDispatch({ type: 'CONNECT_FAILED' })
      //   })
      connect(selected.id)
        .then(() => { selectDispatch({ type: 'CONNECTED' }) })
        .catch(e => { selectDispatch({ type: 'CONNECT_FAILED' }) })
    } else if (selected?.connect === 'DISCONNECTING') {
      BleClient.disconnect(selected.id)
        .then(() => {})
        .catch(e => {})
        .finally(() => {
          selectDispatch({ type: 'DISCONNECTED' })
        })
    }
  }, [selected])

  const connectedId = scanState.devices.find(x => x.id === selected?.id && selected.connect === 'CONNECTED')?.id
  useEffect(() => {
    if (connectedId !== undefined) {
      timer = setInterval(() => {
        BleClient.readRssi(connectedId)
          .then(rssi => {
            dispatch({ type: 'RESULT', id: connectedId, name: 'HowlandStim', rssi })
          })
          .catch(e => {})
      }, 2000)
      return () => {
        clearInterval(timer)
      }
    }
  }, [connectedId])

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
            if (name === 'HowlandStim') {
              return (
                <IonItem
                  key={`ble-scan-dev-${id}`}
                  button
                  onClick={() => {
                    console.log('selected', selected)
                    if (selected === null || selected.connect === 'DISCONNECTED') {
                      selectDispatch({ type: 'CONNECT', id })
                    } else if (selected.connect === 'CONNECTED') {
                      presentAlert({
                        header: 'Disconnect the device?',
                        buttons: [{
                          text: 'CANCEL',
                          role: 'CANCEL'
                        }, {
                          text: 'YES',
                          role: 'YES'
                        }],
                        onDidDismiss: (e) => {
                          const { role } = e.detail
                          if (role === 'YES') {
                            selectDispatch({ type: 'DISCONNECT' })
                          }
                        }
                      }).then(() => {})
                        .catch(e => {})
                    }
                  }} >
                  <IonLabel color='secondary'>
                    <h1>{name ?? '(noname)'}</h1>
                    <p>{id}</p>
                    <p>{`${rssi ?? '??'} dB`}</p>
                  </IonLabel>
                  { selected?.id === id && (
                    <IonBadge color='success'>
                      { selected.connect }
                    </IonBadge>
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
