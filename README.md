## 📱 Local Development & Testing

### 1. Start the Local Development Server
To start the Expo Metro bundler and run your front end locally:
```powershell
npx expo start

## 📱 Over-The-Air (OTA) Updates & Building

This project uses **EAS Update** and **Tailscale** for seamless mobile testing on standalone Android builds (`.apk`).

### 1. Prerequisites
- **Tailscale**: Ensure Tailscale is running on both your computer and mobile device.
- **Backend API**: Start the server with `npm run dev`.

### 2. Push Over-The-Air (OTA) Updates
To push JavaScript/UI changes to installed devices without rebuilding the `.apk`:

```powershell
npx eas-cli update --channel preview --message "Describe your changes here"
