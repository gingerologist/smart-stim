import React, { useEffect, useState } from 'react'

import {
  type IonInputCustomEvent, type InputChangeEventDetail,
  type IonSelectCustomEvent, type SelectChangeEventDetail
} from '@ionic/core'

import {
  IonContent, IonHeader, IonTitle, IonToolbar,
  IonLabel,
  IonList, IonItem, IonSelect,
  IonPage, IonButtons, IonButton, IonSelectOption, IonItemDivider, IonInput, IonFooter, IonProgressBar, IonIcon,
  useIonAlert, IonLoading
} from '@ionic/react'

import { bluetooth, bluetoothOutline, settingsOutline, pencil, pencilOutline, eyedrop } from 'ionicons/icons'

import type { SelectedDevice, DeviceConfig } from '../types/appTypes'

// import Devices from '../components/Devices'
import './Home.css'

const electrodeLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
const electrodeAmps = [15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, -1, -2, -3, -4, -5, -6, -7, -8, -9, -10, -11, -12, -13, -14, -15]

interface HomeProps {
  allowZeroPulse: boolean
  selected: SelectedDevice
  config?: DeviceConfig

  disconnect: () => void
  setAllowZeroPulse: (mode: boolean) => void
  updateConfig: (config: DeviceConfig) => void
}

const Home: React.FunctionComponent<HomeProps> = ({
  allowZeroPulse, selected, config,
  disconnect, setAllowZeroPulse, updateConfig
}) => {
  const [currents, setCurrents] = useState<number[]>([0, 0, 0, 0, 0, 0, 0, 0])
  const [numOfPulses, setNumOfPulses] = useState<number>(1)
  const [pulseWidth, setPulseWidth] = useState<string>('50')
  const [pulseRecycleRatio, setPulseRecycleRatio] = useState<number>(4)

  const [presentAlert] = useIonAlert()

  const connected = selected !== null && selected.connect === 'CONNECTED'

  const loadConfig = (config: DeviceConfig): void => {
    if (config.numOfPulses === 0) {
      setAllowZeroPulse(true)
    }

    setNumOfPulses(config.numOfPulses)
    setCurrents([...config.current])
    setPulseWidth(config.pulseWidth.toString())

    let ratio = Math.round(config.recycle / config.pulseWidth)
    if (ratio < 2) {
      ratio = 2
    } else if (ratio > 10) {
      ratio = 10
    }

    setPulseRecycleRatio(ratio)
  }

  // config only changed from device, 'unidirectional data flow'
  useEffect(() => {
    if (config !== undefined) loadConfig(config)
  }, [config])

  const presentDisconnectAlert = (): void => {
    presentAlert({
      header: 'Disconnect the Device?',
      subHeader: `Device ID: ${selected?.id}`,
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
          disconnect()
        }
      }
    }).then(() => {})
      .catch(e => {})
  }

  const numOfPulsesOptions = allowZeroPulse ? [0, 1] : [1]

  const isDirty = (): boolean => {
    if (selected === null) return false
    if (selected.connect !== 'CONNECTED') return false

    // const { config } = selected
    if (config === undefined) return false

    if (!currents.every((c, i) => c === config.current[i])) return true
    if (numOfPulses !== config.numOfPulses) return true

    if (numOfPulses === 0) {
      return false
    }

    if (parseInt(pulseWidth) !== config.pulseWidth) return true
    if (parseInt(pulseWidth) * pulseRecycleRatio !== config.recycle) return true

    return false
  }

  const dirty = isDirty()

  const currentAllZero = (): boolean => {
    return currents.every(x => x === 0)
  }

  const currentSumNonZero = (): boolean => {
    return currents.reduce((acc, x) => (acc + x), 0) !== 0
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Howland Stim</IonTitle>
          <IonButtons slot='end'>
            { (selected === null || selected.connect === 'DISCONNECTED') &&
            <IonButton routerLink='/devices' routerDirection='forward'>
              {/* <IonIcon slot="start" icon={bluetoothOutline}></IonIcon> */}
              SCAN
            </IonButton> }
            { (selected !== null && selected.connect === 'CONNECTED' && !dirty) &&
            <IonButton color='primary' onClick={presentDisconnectAlert}>
              {/* <IonIcon icon={bluetooth}></IonIcon> */}
              {selected.id.slice(-8)}
            </IonButton> }

            { (selected !== null && selected.connect === 'CONNECTED' && dirty) &&
            <IonButton onClick={() => {
              if (config !== undefined) loadConfig(config)
            }}>DISCARD</IonButton> }

            { (selected !== null && selected.connect === 'CONNECTED' && dirty) &&
            <IonButton>COMMIT</IonButton> }

            {/* <IonButton routerLink='/settings' routerDirection='forward'>
              <IonIcon slot='icon-only' icon={settingsOutline}></IonIcon>
            </IonButton> */}
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className='ion-no-padding'>
        <IonLoading message='CONNECTING...' isOpen={selected?.connect === 'CONNECTING'} />
        <IonList aria-disabled={!connected}>
          {/* current settings */}
          <IonItemDivider color={(currentSumNonZero() || currentAllZero()) ? 'danger' : undefined}>Current</IonItemDivider>

          { electrodeLabels.map((label, index) => (
          <IonItem key={`electrode-${label}`}>
            <IonSelect
              label={label}
              value={currents[index]}
              interface='popover'
              onIonChange={(e: IonSelectCustomEvent<SelectChangeEventDetail<number>>) => {
                setCurrents([...currents.slice(0, index), e.detail.value, ...currents.slice(index + 1)])
              }}
              disabled={!connected}
            >
              { electrodeAmps.map(num => <IonSelectOption key={`electrode-${label}-opt-${num}`} value={num}>{`${num} mA`}</IonSelectOption>) }
            </IonSelect>
          </IonItem>))}

          {/* timing */}
          <IonItemDivider>Timing</IonItemDivider>

          <IonItem key='timing-num-of-pulses' disabled={!connected}>
            <IonSelect label='Pulses per Cycle' class='timing' value={numOfPulses} interface='popover'
              onIonChange={(e: IonSelectCustomEvent<SelectChangeEventDetail<number>>) => {
                setNumOfPulses(e.detail.value)
              }}>
              { numOfPulsesOptions.map(num => <IonSelectOption key={`num-of-pulses-option-${num}`} value={num}>{num}</IonSelectOption>) }
            </IonSelect>
          </IonItem>

          {/*  */}
          <IonItem key='timing-pulse-width' disabled={!connected || numOfPulses === 0} color={(connected && numOfPulses > 0 && !isNaN(parseInt(pulseWidth)) && config !== undefined && parseInt(pulseWidth) !== config.pulseWidth) ? 'warning' : undefined}>
            <IonInput
              label='Pulse Width' class='timing' style={{ textAlign: 'right' }} inputMode='decimal' value={pulseWidth}
              onIonInput={({ detail: { value } }: IonInputCustomEvent<InputChangeEventDetail>) => {
                if (typeof value !== 'string' || value.length === 0) {
                  setPulseWidth('')
                } else {
                  const i = parseInt(value)
                  if (!Number.isInteger(i) || i < 0 || i.toString() !== value) {
                    setPulseWidth(pulseWidth)
                  } else {
                    setPulseWidth(value)
                  }
                }
              }} />
          </IonItem>

          <IonItem key='timing-pulse-recycle-ratio' disabled={!connected || numOfPulses === 0}>
            <IonSelect label='Pulse/Recycle Ratio' class='timing' value={pulseRecycleRatio} interface='popover'
              onIonChange={(e: IonSelectCustomEvent<SelectChangeEventDetail<number>>) => {
                setPulseRecycleRatio(e.detail.value)
              }}
            >
              { [2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => <IonSelectOption key={`pulse-recycle-ratio-option-${num}`} value={num}>{`1 : ${num}`}</IonSelectOption>) }
            </IonSelect>
          </IonItem>

          <IonItem disabled={!connected || numOfPulses === 0}>
            <IonLabel>Period</IonLabel>
            <IonLabel slot='end' style={{ textAlign: 'right' }}>
              {pulseWidth === '' ? '--' : parseInt(pulseWidth) * (pulseRecycleRatio + 1) } μs
            </IonLabel>
          </IonItem>
          <IonItem disabled={!connected || numOfPulses === 0}>
            <IonLabel>Frequency</IonLabel>
            <IonLabel slot='end' style={{ textAlign: 'right' }}>{pulseWidth === '' ? '--' : (1000000 / (parseInt(pulseWidth) * (pulseRecycleRatio + 1))).toFixed(2) } Hz</IonLabel>
          </IonItem>
        </IonList>
      </IonContent>

      <IonFooter>
        <IonToolbar class='ion-padding'>
          <IonLabel>
            <h2>hello</h2>
            <p>something important</p>
          </IonLabel>
        </IonToolbar>
      </IonFooter>
    </IonPage>
  )
}

export default Home
