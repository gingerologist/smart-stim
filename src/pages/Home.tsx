import type { Dispatch, FunctionComponent } from 'react'
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

import { play, bluetooth, bluetoothOutline, settingsOutline } from 'ionicons/icons'

import type { SelectedDevice, SelectAction, DeviceConfig } from '../types/appTypes'

// import Devices from '../components/Devices'
import './Home.css'

const electrodeLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
const electrodeAmps = [15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, -1, -2, -3, -4, -5, -6, -7, -8, -9, -10, -11, -12, -13, -14, -15]

interface HomeProps {
  testMode: boolean
  selected: SelectedDevice
  config?: DeviceConfig

  disconnect: () => void
  setTestMode: (mode: boolean) => void
  updateConfig: (config: DeviceConfig) => void
}

const Home: FunctionComponent<HomeProps> = ({
  testMode, selected, config,
  disconnect, setTestMode, updateConfig
}) => {
  const [stimCurrent, setStimCurrent] = useState<number[]>([0, 0, 0, 0, 0, 0, 0, 0])
  const [testCurrent, setTestCurrent] = useState<number[]>([0, 0, 0, 0, 0, 0, 0, 0])
  const [pulseWidth, setPulseWidth] = useState<string>('50')
  const [pulseRecycleRatio, setPulseRecycleRatio] = useState<number>(4)

  const [presentAlert] = useIonAlert()

  const connected = selected !== null && selected.connect === 'CONNECTED'

  useEffect(() => {
    if (config === undefined) return
    if (config.numOfPulses === 0) {
      setTestMode(true)
    } else {
      setTestMode(false)
      setStimCurrent([...config.current])
      setPulseWidth(config.pulseWidth.toString())

      let ratio = Math.round(config.recycle / config.pulseWidth)
      if (ratio < 2) {
        ratio = 2
      } else if (ratio > 10) {
        ratio = 10
      }
      setPulseRecycleRatio(ratio)
    }
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

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color={ testMode ? 'dark' : 'light'}>
          <IonTitle>{testMode ? 'Testing' : 'Stimulation'}</IonTitle>
          <IonButtons slot='end'>
            { (selected === null || selected.connect === 'DISCONNECTED') && //
              <IonButton routerLink='/devices' routerDirection='forward'>
                <IonIcon slot="icon-only" icon={bluetoothOutline}></IonIcon>
              </IonButton> }
            { (selected !== null && selected.connect === 'CONNECTED') &&
              <IonButton shape='round' color='primary' fill='solid' onClick={presentDisconnectAlert}>
                <IonIcon slot="icon-only" icon={bluetooth}></IonIcon>
              </IonButton> }
            <IonButton routerLink='/settings' routerDirection='forward'>
              <IonIcon slot='icon-only' icon={settingsOutline}></IonIcon>
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className='ion-no-padding'>
        <IonLoading message='CONNECTING...' isOpen={selected?.connect === 'CONNECTING'} />
        { testMode &&
        <IonList>
          { electrodeLabels.map((label, index) => (
          <IonItem key={`test-current-${label}`}>
            <IonSelect
              label={label}
              value={testCurrent[index]}
              interface='popover'
              onIonChange={(e: IonSelectCustomEvent<SelectChangeEventDetail<number>>) => {
                setTestCurrent([...testCurrent.slice(0, index), e.detail.value, ...testCurrent.slice(index + 1)])
              }}>
              { electrodeAmps.map(num => <IonSelectOption key={`test-current-${label}-opt-${num}`} value={num}>{`${num} mA`}</IonSelectOption>) }
            </IonSelect>
          </IonItem>
          ))}
        </IonList>}

        { !testMode &&
        <IonList aria-disabled={!connected}>
          {/* current settings */}
          <IonItemDivider>Current</IonItemDivider>
          { electrodeLabels.map((label, index) => (
          <IonItem key={`electrode-${label}`}>
            <IonSelect
              label={label}
              value={stimCurrent[index]}
              interface='popover'
              onIonChange={(e: IonSelectCustomEvent<SelectChangeEventDetail<number>>) => {
                setStimCurrent([...stimCurrent.slice(0, index), e.detail.value, ...stimCurrent.slice(index + 1)])
              }}
              disabled={!connected}
            >
              { electrodeAmps.map(num => <IonSelectOption key={`electrode-${label}-opt-${num}`} value={num}>{`${num} mA`}</IonSelectOption>) }
            </IonSelect>
          </IonItem>))}

          {/* timing */}
          <IonItemDivider>Timing</IonItemDivider>

          <IonItem key='timing-num-of-pulses' disabled={!connected}>
            <IonSelect label='Pulses per Cycle' interface='popover'>
              { [0, 1].map(num => <IonSelectOption key={`num-of-pulses-option-${num}`} value={num}>{num}</IonSelectOption>) }
            </IonSelect>
          </IonItem>

          <IonItem key='timing-pulse-width' disabled={!connected}>
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

          <IonItem key='timing-pulse-recycle-ratio' disabled={!connected}>
            <IonSelect label='Pulse/Recycle Ratio' class='timing' value={pulseRecycleRatio} interface='popover'
              onIonChange={(e: IonSelectCustomEvent<SelectChangeEventDetail<number>>) => {
                setPulseRecycleRatio(e.detail.value)
              }}
            >
              { [2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => <IonSelectOption key={`pulse-recycle-ratio-option-${num}`} value={num}>{`1 : ${num}`}</IonSelectOption>) }
            </IonSelect>
          </IonItem>
          {/* timingLabels.map((label, index) => (
          <IonItem key={`timing-${label}`}>
            <IonInput
              label={label.slice(0, 1).toUpperCase() + label.slice(1)}
              class='timing'
              style={{ textAlign: 'right' }}
              inputMode='decimal'
              value={timingConfig[index]}
              disabled={index === 1 && numOfPulses === 1}
              onIonInput={(e: IonInputCustomEvent<InputChangeEventDetail>) => {
                let update
                const str = e.detail.value
                if (typeof str !== 'string') return
                if (str.length === 0) {
                  update = [...timingConfig.slice(0, index), null, ...timingConfig.slice(index + 1)]
                } else {
                  const num = parseInt(str)
                  if (!Number.isInteger(num) || num < 0 || num.toString() !== str) {
                    update = [...timingConfig]
                  } else {
                    update = [...timingConfig.slice(0, index), num, ...timingConfig.slice(index + 1)]
                  }
                }
                setTimingConfig(update)
              }}
            />
          </IonItem>
            )) */}
          <IonItem disabled={!connected}>
            <IonLabel>Period</IonLabel>
            <IonLabel slot='end' style={{ textAlign: 'right' }}>
              {pulseWidth === '' ? '--' : parseInt(pulseWidth) * (pulseRecycleRatio + 1) } μs
            </IonLabel>
          </IonItem>
          <IonItem disabled={!connected}>
            <IonLabel>Frequency</IonLabel>
            <IonLabel slot='end' style={{ textAlign: 'right' }}>{pulseWidth === '' ? '--' : (1000000 / (parseInt(pulseWidth) * (pulseRecycleRatio + 1))).toFixed(2) } Hz</IonLabel>
          </IonItem>
        </IonList> }
      </IonContent>

      <IonFooter className='ion-no-border' style={{ height: 64 }}>
        {/* <IonFab horizontal='center' vertical='top' edge={true}>
          <IonFabButton disabled={!pulseWidthOK || !currentOK}>
            SEND
          </IonFabButton>
        </IonFab> */}
        {/* <IonProgressBar type='indeterminate'></IonProgressBar> */}
        <IonToolbar>
          {/* <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}> */}
          <IonButtons slot='end'>
            <IonButton onClick={(): void => {
              const config = {
                timeout: 0,
                numOfPulses: 1,
                pulseWidth: parseInt(pulseWidth),
                pulseInterval: 0,
                mid: 0,
                recycle: parseInt(pulseWidth) * pulseRecycleRatio,
                tail: 0,
                current: stimCurrent
              }
              updateConfig(config)
            }}>START</IonButton>
            <IonButton>
              STOP
            </IonButton>
            <IonButton>
              DISCARD C
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonFooter>
    </IonPage>
  )
}

export default Home
