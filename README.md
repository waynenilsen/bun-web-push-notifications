# Web Push Notifications POC

This is a proof of concept for web push notifications. It uses several technologies:

- [Web Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Notification API](https://developer.mozilla.org/en-US/docs/Web/API/Notification)

Together, these technologies allow a website to send notifications to a user's device even when the website is not open.
This stack applies across all platforms, and all browsers that support the Web Push API.

## Web Push Notification System Overview

This system implements a web push notification service using a Bun server with HTTPS support. It allows sending notifications to users even when they're not actively viewing the webpage. The system consists of several key components:

### 1. Backend Server (index.ts)

The backend server, written in TypeScript and running on Bun, handles the core functionality:

- Generates and manages VAPID keys for secure communication
- Serves the main HTML page and static assets
- Handles subscription registration
- Sends push notifications to clients

Key features:
- Uses the `web-push` library for push notification functionality
- Supports both HTTP and HTTPS (configurable)
- Stores subscriptions in memory (note: not persistent across server restarts)

### 2. Frontend JavaScript (index.js)

The client-side JavaScript handles user interactions and sets up push notifications:

- Requests notification permission from the user
- Registers a service worker
- Subscribes the client to push notifications
- Sends the subscription to the server
- Provides UI for triggering local and server-side notifications

### 3. Service Worker (notification-worker.js)

The service worker acts as a background process that handles push events:

- Listens for push events from the server
- Creates and displays notifications to the user
- Handles notification click events, opening or focusing the main application window

### How It All Works Together

1. **Initial Setup**:
  - The server generates VAPID keys (if not already present) for secure push messaging.
  - When a user visits the webpage, the client-side JavaScript requests notification permission.

2. **Subscription Process**:
  - If permission is granted, the client registers the service worker and subscribes to push notifications.
  - The subscription details are sent to the server and stored.

3. **Sending Notifications**:
  - The server can send push messages to subscribed clients using the stored subscription details.
  - This works even when the user is not actively viewing the webpage.

4. **Receiving Notifications**:
  - The service worker receives the push event and creates a notification.
  - Users see the notification on their device, even if the browser is closed.

5. **Handling Interaction**:
  - When a user clicks the notification, the service worker can open or focus the main application window.

This system allows for real-time communication with users, keeping them engaged with your application even when they're not actively using it. It's particularly useful for delivering important updates, alerts, or personalized content to your users.

## Running locally

### Testing on a laptop

SSL is required for web push notifications. To generate a self-signed certificate for localhost, run the following commands:

```
brew install mkcert
mkcert localhost
```

This will generate two files: `localhost.pem` and `localhost-key.pem`.

Next you have to trust the certificate. In finder, double click on the `localhost.pem` file. This will open the
Keychain Access app. Find the certificate in the list, right click on it, and select "Get Info".
Expand the "Trust" section and set "When using this certificate" to "Always Trust".

```
LOCAL_TLS_ENABLED=1 bun dev
```

Open https://localhost:4200

### Testing on a phone

Buy a cheap domain from cloudflare.

Set up a cloudflare tunnel by following the steps on their website, the tunnel's target is http://localhost:4200/
Cloudflare will deal with SSL / TLS.

Start the bun server with the following command:

```
LOCAL_TLS_ENABLED=0 bun dev
```

## Troubleshooting

On macos

1. Ensure that "do not disturb" is not enabled on your Mac. This will prevent notifications from being displayed.
2. Ensure that Chrome is allowed by mac to display notifications.
Go to System Preferences -> Notifications and ensure that Chrome is allowed to display notifications.

On android

1. Ensure that do not disturb is not enabled on your phone.
2. Ensure that Chrome is allowed to display notifications.

Note that on android the local "show notifications" button does not work.

This test page was useful to me during testing https://www.kenherbert.dev/browser-notification-tester/
If you're having trouble with notifications, try this page. If this page is not working, then the issue is with your
browser or device.
