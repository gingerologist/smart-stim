import type { Dispatch, FunctionComponent } from 'react'
import React, { useState } from 'react'
import { Redirect, Route } from 'react-router'

import {
  type IonInputCustomEvent, type InputChangeEventDetail,
  type IonSelectCustomEvent, type SelectChangeEventDetail
} from '@ionic/core'

import {
  IonContent, IonHeader, IonTitle, IonToolbar,
  IonLabel,
  IonList, IonItem, IonSelect,
  IonPage, IonButtons, IonButton, IonListHeader, IonSelectOption, IonItemGroup, IonItemDivider, IonInput, IonFooter, IonProgressBar, IonFab, IonFabButton, IonIcon,
  IonAccordion, IonAccordionGroup, IonAvatar
} from '@ionic/react'

import { play, stop, bluetooth, bluetoothOutline, settings, settingsOutline } from 'ionicons/icons'

import type { SelectedDevice, SelectAction } from '../types/appTypes'

// import Devices from '../components/Devices'
import './Home.css'

const electrodeLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
const electrodeAmps = [15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, -1, -2, -3, -4, -5, -6, -7, -8, -9, -10, -11, -12, -13, -14, -15]

const timingLabels = ['Pulse Width', 'Pulse Interval', 'Hold Duration', 'Recycle Duration']

interface HomeProps {
  testMode: boolean
  selected: SelectedDevice
  selectDispatch: Dispatch<SelectAction>
}

const Home: FunctionComponent<HomeProps> = ({ testMode, selected }) => {
  const [electrodeConfig, setElectrodeConfig] = useState<number[]>([0, 0, 0, 0, 0, 0, 0, 0])
  // const [numOfPulses, setNumOfPulses] = useState<number>(1)
  const [pulseWidth, setPulseWidth] = useState<string>('50')
  const [pulseRecycleRatio, setPulseRecycleRatio] = useState<number>(4)
  // const [timingConfig, setTimingConfig] = useState<Array<number | null>>([0, 0, 0, 0])

  const currentOK = !electrodeConfig.every(x => x === 0) && electrodeConfig.reduce((acc, x) => (acc + x), 0) === 0
  const pulseWidthOK = pulseWidth !== ''
  const pulseWidthValue = parseInt(pulseWidth)

  const connected = selected !== null && selected.connect === 'CONNECTED'

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color={ testMode ? 'warning' : 'light'}>
          <IonTitle>{testMode ? 'Testing' : 'Stimulation'}</IonTitle>
          <IonButtons slot='end'>
            { !connected &&
              <IonButton routerLink='/devices' routerDirection='forward'>
                <IonIcon slot="icon-only" icon={bluetoothOutline}></IonIcon>
              </IonButton> }
            { connected &&
              <IonButton routerLink='/devices' routerDirection='forward' shape='round' color='primary' fill='solid'>
                <IonIcon slot="icon-only" icon={bluetooth}></IonIcon>
              </IonButton> }
            <IonButton routerLink='/settings' routerDirection='forward'>
              <IonIcon slot='icon-only' icon={settingsOutline}></IonIcon>
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className='ion-no-padding'>
        { testMode && <div />}
        { !testMode &&
        <IonAccordionGroup multiple>
          <IonAccordion value='current'>
            <IonItem slot='header' color={ currentOK ? 'success' : 'warning'}>
              <IonLabel>Current</IonLabel>
            </IonItem>
            <IonList slot='content'>
            { electrodeLabels.map((label, index) => (
              <IonItem key={`electrode-${label}`}>
                <IonSelect
                  label={label}
                  value={electrodeConfig[index]}
                  interface='popover'
                  onIonChange={(e: IonSelectCustomEvent<SelectChangeEventDetail<number>>) => {
                    setElectrodeConfig([...electrodeConfig.slice(0, index), e.detail.value, ...electrodeConfig.slice(index + 1)])
                  }}
                >
                  { electrodeAmps.map(num => <IonSelectOption key={`electrode-${label}-opt-${num}`} value={num}>{`${num} mA`}</IonSelectOption>) }
                </IonSelect>
              </IonItem>
            ))}
            </IonList>
          </IonAccordion>
          <IonAccordion value='timing'>
            <IonItem slot='header'>
              <IonLabel>Timing</IonLabel>
            </IonItem>
            <IonList slot='content'>
              {/* <IonItem key='timing-period'>
                <IonSelect label='Number of Pulses' class='timing' value={numOfPulses} interface='popover'
                  onIonChange={(e: IonSelectCustomEvent<SelectChangeEventDetail<number>>) => {
                    setNumOfPulses(e.detail.value)
                  }}
                >
                  { [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => <IonSelectOption key={`num-of-pulses-option-${num}`} value={num}>{num}</IonSelectOption>) }
                </IonSelect>
              </IonItem> */}
              <IonItem key='timing-pulse-width'>
                <IonInput label='Pulse Width (new)' class='timing' style={{ textAlign: 'right' }} inputMode='decimal' value={pulseWidth}
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
              <IonItem key='timing-pulse-recycle-ratio'>
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
              <IonItem>
                <IonLabel>Period</IonLabel>
                <IonLabel slot='end' style={{ textAlign: 'right' }}>
                  {pulseWidth === '' ? '--' : parseInt(pulseWidth) * pulseRecycleRatio } μs
                </IonLabel>
              </IonItem>
              <IonItem>
                <IonLabel>Frequency</IonLabel>
                <IonLabel slot='end' style={{ textAlign: 'right' }}>{pulseWidth === '' ? '--' : (1000000 / (parseInt(pulseWidth) * pulseRecycleRatio)).toFixed(2) } Hz</IonLabel>
              </IonItem>
            </IonList>
          </IonAccordion>
        </IonAccordionGroup> }
      </IonContent>
      <IonFooter>
        <IonFab horizontal='center' vertical='top' edge={true}>
          <IonFabButton disabled={!pulseWidthOK || !currentOK}>
            <IonIcon icon={play}></IonIcon>
          </IonFabButton>
        </IonFab>
        <IonToolbar>
          <IonButtons>
            <IonButton>Hello</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonFooter>
    </IonPage>
  )
}

export default Home
