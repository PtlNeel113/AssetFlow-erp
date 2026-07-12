// System-Level Browser Notification Helper using HTML5 Notification API

export function requestNotificationPermission() {
  if (!("Notification" in window)) {
    console.warn("This browser does not support system-level desktop notifications.");
    return Promise.resolve("unsupported");
  }

  if (Notification.permission === "granted") {
    return Promise.resolve("granted");
  }

  return Notification.requestPermission();
}

export function triggerSystemNotification(title: string, body: string) {
  if (!("Notification" in window)) return;
  
  if (Notification.permission === "granted") {
    try {
      new Notification(title, {
        body,
        icon: "/favicon.ico",
        tag: "assetflow-notification-" + Date.now(),
      });
    } catch (e) {
      console.error("Failed to trigger system-level Notification:", e);
    }
  } else if (Notification.permission === "default") {
    console.log("Notification permission has not been requested or granted yet.");
  }
}
