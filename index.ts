import { serve } from "bun";
import { readFileSync, writeFileSync, existsSync } from "fs";
import webpush from "web-push";

const port = 4200;
const KEYS_FILE = "vapid_keys.json";
const LOCAL_TLS_ENABLED = process.env.LOCAL_TLS_ENABLED === "true";

// Function to get or generate VAPID keys
function getOrGenerateVAPIDKeys() {
  if (existsSync(KEYS_FILE)) {
    console.log("Reading VAPID keys from file");
    const keysData = readFileSync(KEYS_FILE, 'utf8');
    return JSON.parse(keysData);
  } else {
    console.log("Generating new VAPID keys");
    const vapidKeys = webpush.generateVAPIDKeys();
    writeFileSync(KEYS_FILE, JSON.stringify(vapidKeys), 'utf8');
    return vapidKeys;
  }
}

// Get or generate VAPID keys
const vapidKeys = getOrGenerateVAPIDKeys();

webpush.setVapidDetails(
  'mailto:your-email@example.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

let subscription: webpush.PushSubscription | null = null;

const serverOptions: any = {
  port: port,
  async fetch(req: Request) {
    const url = new URL(req.url);

    if (url.pathname === "/") {
      const html = `
<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Web Push Notifications Demo</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bulma@1.0.2/css/bulma.min.css">
</head>
<body>
    <section class="section">
        <div class="container">
            <div class="columns is-centered">
                <div class="column is-half">
                    <div class="card">
                        <div class="card-content">
                            <h1 class="title is-4">Web Push Notifications Demo</h1>
                            <p class="subtitle">
                                This is a proof of concept demonstrating web push notifications using a Bun server with HTTPS.
                                You can register for notifications, trigger client-side notifications, and receive server-side push notifications.
                            </p>
                            <div class="buttons">
                                <button id="registerNotifications" class="button is-primary">Register Notifications</button>
                                <button id="triggerNotification" class="button is-info" style="display: none;">Trigger Local Notification</button>
                                <button id="sendServerNotification" class="button is-success" style="display: none;">Send Server Notification</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
    <script src="/js/index.js"></script>
</body>
</html>
      `;
      return new Response(html, {
        headers: { "Content-Type": "text/html" },
      });
    }

    if (url.pathname === "/vapidPublicKey") {
      return new Response(vapidKeys.publicKey, {
        headers: { "Content-Type": "text/plain" },
      });
    }

    if (url.pathname === "/register" && req.method === "POST") {
      const body = await req.json();
      subscription = body;
      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (url.pathname === "/notification" && req.method === "POST") {
      if (!subscription) {
        return new Response(JSON.stringify({ error: "No subscription found" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      try {
        await webpush.sendNotification(subscription, JSON.stringify({
          title: "Server Notification",
          body: "This notification was sent from the server!",
        }));
        return new Response(JSON.stringify({ success: true }), {
          headers: { "Content-Type": "application/json" },
        });
      } catch (error) {
        console.error("Error sending notification:", error);
        return new Response(JSON.stringify({ error: "Failed to send notification" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Use Bun's built-in static file serving for everything else
    return new Response(Bun.file("public" + url.pathname));
  },
};

// Add TLS options only if LOCAL_TLS_ENABLED is true
if (LOCAL_TLS_ENABLED) {
  serverOptions.tls = {
    key: readFileSync("localhost-key.pem"),
    cert: readFileSync("localhost.pem"),
  };
}

const server = serve(serverOptions);

console.log(`Server running at ${LOCAL_TLS_ENABLED ? 'https' : 'http'}://localhost:${port}`);
console.log(`Static files will be served from the 'public' directory`);
console.log(`Make sure to set up your index.js file in the public/js directory`);
console.log(`LOCAL_TLS_ENABLED: ${LOCAL_TLS_ENABLED}`);
