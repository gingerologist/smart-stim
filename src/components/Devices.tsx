import React from 'react'
import {
  IonPage, IonHeader, IonToolbar, IonButtons, IonMenuButton, IonTitle
} from '@ionic/react'
import './Devices.css'

interface DevicesProps {

}

const Devices: React.FC<DevicesProps> = () => {
  return (
    <IonPage id='devices-page'>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot='start'>
            <IonMenuButton />
          </IonButtons>
          <IonTitle>Devices</IonTitle>
        </IonToolbar>
      </IonHeader>
    </IonPage>
  )
}

export default Devices
