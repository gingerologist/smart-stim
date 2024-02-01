import React from 'react'

import {
  IonPage, IonToolbar, IonButtons, IonBackButton, IonHeader,
  IonContent, IonList, IonItem, IonLabel, IonTitle, IonToggle
} from '@ionic/react'

import {
  // type IonInputCustomEvent, type InputChangeEventDetail,
  type IonToggleCustomEvent, type ToggleChangeEventDetail
} from '@ionic/core'

// import './Settings.css'

interface SettingsProp {
  testMode: boolean
  setTestMode: (mode: boolean) => void
}

const Settings: React.FunctionComponent<SettingsProp> = ({ testMode, setTestMode }) => {
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
              checked={testMode}
              onIonChange={(e: IonToggleCustomEvent<ToggleChangeEventDetail>) => {
                setTestMode(e.detail.checked)
                console.log(e.detail.checked)
              }}>Enable Testing Mode</IonToggle>
          </IonItem>
        </IonList>
      </IonContent>
    </IonPage>
  )
}

export default Settings
