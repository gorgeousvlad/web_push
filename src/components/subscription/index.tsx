import * as React from "react";
import { urlB64ToUint8Array } from '../../utils';
import './styles.css';

const APP_SERVER_KEY = 'BKP9tCRbKFsHM2ZCnqIOQDb8kXkLORHzi5e1s_altV0HcGER9C5Ez6ERxWc6g8r2c-BSY1tYE0ATcWt-Ahr-uS8';

export interface ISubscriptionState {
  hasSubscription: boolean;
  serviceWorkerRegistration: ServiceWorkerRegistration | null;
  subscriptionData: PushSubscription | null;
  isWorkerRegistered: boolean;
  
}
export class Subscription extends React.PureComponent<{}, ISubscriptionState> {
  public state: ISubscriptionState = {
    hasSubscription: false,
    serviceWorkerRegistration: null,
    subscriptionData: null,
    isWorkerRegistered: false,
  };

  componentDidMount() {
    if (window && navigator && 'serviceWorker' in navigator) {
      return navigator.serviceWorker.register('sw.js')
      .then(registration => {
        this.setState({serviceWorkerRegistration: registration}, this.initPush)
        console.log('ServiceWorker registration successful with scope: ', registration.scope)
      })
      .catch(err => console.log('ServiceWorker registration error ' + err));
    }
  }

  render() {
    const {hasSubscription, serviceWorkerRegistration, subscriptionData, isWorkerRegistered} = this.state;
    return (
      <div className="popup">
        <label htmlFor="push-input">{hasSubscription ? 'Отписаться' : 'Подписаться'}</label>
        <input checked={hasSubscription} id="push-input" type="checkbox" onChange={isWorkerRegistered && this.handleChange}/>
      </div>
    );
  }

  private initPush = () => {
    const {serviceWorkerRegistration} = this.state;

    this.setState({isWorkerRegistered: true});
  
    // Set the initial subscription value
    serviceWorkerRegistration.pushManager.getSubscription()
    .then( subscription => {
      this.setState({hasSubscription: !(subscription === null)});
    });
  }

  private subscribe = () => {
    const {serviceWorkerRegistration} = this.state;
  
    serviceWorkerRegistration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlB64ToUint8Array(APP_SERVER_KEY)
    })
    .then(subscription => {
      console.log('subscribed')
      this.setState({hasSubscription:true});
      console.log(JSON.stringify(subscription));
      fetch('/push/subscribe',{
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(subscription),
      })
      .then(function(response) {
        return response;
      })
      .then(text => {
        console.log('User is subscribed.');
        this.setState({hasSubscription: true});
      })
      .catch(error => {
        this.setState({hasSubscription:false});
        console.error('error fetching subscribe', error);
      });
      
    })
    .catch(function(err: any) {
      console.log('Failed to subscribe the user: ', err);
    });
  }

  private unsubscribe = () => {
    const {serviceWorkerRegistration} = this.state;

    serviceWorkerRegistration.pushManager.getSubscription()
    .then(subscription => {
      if (subscription) {
        const subscriptionData = {
          endpoint: subscription.endpoint
        };
        
        fetch('/push/unsubscribe',{
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify(subscriptionData)
        })
        .then(function(response) {
          return response;
        })
        .then(text => {
          this.setState({hasSubscription: false});
        })
        .catch(error => {
          this.setState({hasSubscription: true});
          console.error('error fetching subscribe', error);
        });

        this.setState({hasSubscription: false});

        return subscription.unsubscribe();
      }
    });
  }

  private handleChange = () => {
    if(this.state.hasSubscription) {
      this.unsubscribe();
    } else {
      this.subscribe();
    }
  }
}