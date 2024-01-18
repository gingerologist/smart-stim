import {
  type IonInputCustomEvent, type InputChangeEventDetail,
  type IonSelectCustomEvent, type SelectChangeEventDetail
} from '@ionic/core'

import React, { useState } from 'react'
import { Redirect, Route } from 'react-router'
import {
  IonContent, IonHeader, IonTitle, IonToolbar,
  IonLabel,
  IonList, IonItem, IonSelect,
  IonPage, IonButtons, IonButton, IonListHeader, IonSelectOption, IonItemGroup, IonItemDivider, IonInput, IonFooter, IonProgressBar, IonFab, IonFabButton, IonIcon
} from '@ionic/react'

import { play, stop } from 'ionicons/icons'

import Devices from '../components/Devices'
import './Home.css'

const electrodeLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
const electrodeAmps = [15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, -1, -2, -3, -4, -5, -6, -7, -8, -9, -10, -11, -12, -13, -14, -15]

const timingLabels = ['period', 'pulse', 'hold', 'recycle']

const Home: React.FC = () => {
  const [electrodeConfig, setElectrodeConfig] = useState<number[]>([0, 0, 0, 0, 0, 0, 0, 0])
  const [timingConfig, setTimingConfig] = useState<Array<number | null>>([0, 0, 0, 0])

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Smart Stim</IonTitle>
          <IonButtons slot='end'>
            <IonButton>Hello</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className='ion-no-padding'>
        <IonList>
          <IonItemGroup>
            <IonItemDivider>
              <IonLabel>Electrode</IonLabel>
            </IonItemDivider>

            { electrodeLabels.map((label, index) => (
              <IonItem key={`electrode-${label}`}>
                <IonSelect
                  label={label}
                  value={electrodeConfig[index]}
                  interface='popover'
                  onIonChange={(e: IonSelectCustomEvent<SelectChangeEventDetail>) => { setElectrodeConfig([...electrodeConfig.slice(0, index), e.detail.value, ...electrodeConfig.slice(index + 1)]) }}
                >
                  { electrodeAmps.map(num => <IonSelectOption key={`electrode-${label}-opt-${num}`} value={num}>{`${num} mA`}</IonSelectOption>) }
                </IonSelect>
              </IonItem>
            ))}
          </IonItemGroup>

          <IonItemGroup>
            <IonItemDivider>
              <IonLabel>Timing</IonLabel>
            </IonItemDivider>

            { timingLabels.map((label, index) => (
              <IonItem key={`timing-${label}`}>
                <IonLabel position='fixed'>{label.slice(0, 1).toUpperCase() + label.slice(1)}</IonLabel>
                <IonInput
                  class='ion-input-us'
                  style={{ textAlign: 'right' }}
                  value={timingConfig[index]}
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
            ))}

            {/* <IonItem key='period-input'>
              <IonLabel>Period</IonLabel>
              <IonInput class='ion-input-us' type='number' style={{ textAlign: 'right' }} value={timingConfig[0]}></IonInput>
            </IonItem> */}
          </IonItemGroup>
        </IonList>
      </IonContent>
      <IonFooter style={{ height: 120 }}>
        <IonFab horizontal='center' vertical='top' edge={true}>
          <IonFabButton>
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
