document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM fully loaded and parsed');

  const registerButton = document.getElementById('registerNotifications');
  const triggerButton = document.getElementById('triggerNotification');
  const serverNotificationButton = document.getElementById('sendServerNotification');

  console.log('Register button:', registerButton);
  console.log('Trigger button:', triggerButton);
  console.log('Server Notification button:', serverNotificationButton);

  let subscription = null;

  // Function to request notification permission and set up the web worker
  async function setupNotifications() {
    console.log('Setup notifications function called');

    if (!("Notification" in window)) {
      console.log("This browser does not support notifications.");
      return;
    }

    let permission = await Notification.requestPermission();
    console.log('Notification permission:', permission);

    if (permission === "granted") {
      console.log("Notification permission granted.");
      triggerButton.style.display = 'inline-block';
      serverNotificationButton.style.display = 'inline-block';
      console.log('Trigger and Server Notification buttons should now be visible');

      if ('serviceWorker' in navigator && 'PushManager' in window) {
        try {
          const registration = await navigator.serviceWorker.register('/js/notification-worker.js');
          console.log('Service Worker registered with scope:', registration.scope);

          const vapidPublicKey = await fetch('/vapidPublicKey').then(res => res.text());
          const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: convertedVapidKey
          });

          console.log('Push Subscription:', JSON.stringify(subscription));

          // Send the subscription to the server
          await fetch('/register', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(subscription)
          });

          console.log('Subscription sent to server');
        } catch (error) {
          console.error('Service Worker registration or subscription failed:', error);
        }
      }
    } else {
      console.log("Notification permission denied.");
    }
  }

  // Function to trigger an example notification
  function triggerExampleNotification() {
    console.log('Trigger notification function called');
    console.log('Current notification permission:', Notification.permission);

    if (Notification.permission === "granted") {
      console.log("Notification permission granted. Creating notification...");
      const notification = new Notification("Example Notification", {
        body: "This is a test notification from our Bun server!",
        icon: "/img.png"
      });
      console.log("Notification created:", notification);

      notification.onclick = function() {
        console.log("Notification clicked!");
        window.focus();
        this.close();
      };
      console.log("Notification onclick event listener added");
    } else {
      console.log("Notification permission not granted.");
      alert("Please allow notifications first.");
    }
  }

  // Function to send a server-side notification
  async function sendServerNotification() {
    console.log('Send server notification function called');
    try {
      const response = await fetch('/notification', { method: 'POST' });
      const result = await response.json();
      if (result.success) {
        console.log('Server notification sent successfully');
      } else {
        console.error('Failed to send server notification:', result.error);
      }
    } catch (error) {
      console.error('Error sending server notification:', error);
    }
  }

  // Helper function to convert base64 to Uint8Array
  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Event listeners
  if (registerButton) {
    registerButton.addEventListener('click', setupNotifications);
    console.log('Register button event listener added');
  } else {
    console.error('Register button not found');
  }

  if (triggerButton) {
    triggerButton.addEventListener('click', triggerExampleNotification);
    console.log('Trigger button event listener added');
  } else {
    console.error('Trigger button not found');
  }

  if (serverNotificationButton) {
    serverNotificationButton.addEventListener('click', sendServerNotification);
    console.log('Server Notification button event listener added');
  } else {
    console.error('Server Notification button not found');
  }
});
