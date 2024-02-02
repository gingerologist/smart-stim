import React from 'react'

import {
  IonPage, IonToolbar, IonButtons, IonBackButton, IonHeader,
  IonContent, IonList, IonItem, IonLabel, IonTitle, IonToggle, IonNote
} from '@ionic/react'

import {
  // type IonInputCustomEvent, type InputChangeEventDetail,
  type IonToggleCustomEvent, type ToggleChangeEventDetail
} from '@ionic/core'

// import './Settings.css'

interface SettingsProp {
  allowZeroPulse: boolean
  setAllowZeroPulse: (mode: boolean) => void
}

const Settings: React.FunctionComponent<SettingsProp> = ({ allowZeroPulse, setAllowZeroPulse }) => {
  return (
    <IonPage id='settings-page'>
      <IonHeader>
        <IonToolbar color='tertiary'>
          <IonTitle>Settings</IonTitle>
          <IonButtons slot='start'>
            <IonBackButton />
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonList>
          <IonItem>
            <IonToggle
              justify='space-between'
              checked={allowZeroPulse}
              onIonChange={(e: IonToggleCustomEvent<ToggleChangeEventDetail>) => {
                setAllowZeroPulse(e.detail.checked)
            }}>
              <IonLabel>
                <h2>Allow zero pulses per cycle</h2>
                <p>静态输出电流，无波形，仅用于测试。</p>
              </IonLabel>
            </IonToggle>

          </IonItem>
        </IonList>
      </IonContent>
    </IonPage>
  )
}

export default Settings
