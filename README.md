<div align="center">
  <img src="assets/icon.png" alt="BillKhata Logo" width="120" height="120" />
  <h1>BillKhata 🧾</h1>
</div>

**BillKhata** is an offline-first, lightning-fast billing application designed specifically for Indian retail shop owners (Kirana stores, hardware shops, mobile shops). It prioritizes speed and simplicity, enabling shopkeepers to create professional GST invoices in under 30 seconds with zero friction.

## 🚀 Core Principles

- **Speed First**: Every interaction is optimized for speed. Customers shouldn't wait.
- **Offline First**: All data is stored locally on the device using SQLite. No internet required.
- **Zero Friction**: No mandatory setup or complex registration. Smart defaults everywhere.

## ✨ Key Features

- **⚡ fast Billing**: Create professional bills in seconds using smart autocomplete.
- **🇮🇳 Indian Context**: Built-in support for GST (5%, 12%, 18%, 28%), Indian currency formatting (₹1,00,000), and paise handling.
- **📄 PDF Generation**: Generate professional HTML-based PDF invoices with multiple templates (Classic, Modern, Compact) and color themes.
- **📲 Easy Sharing**: One-tap sharing via WhatsApp or system share sheet.
- **📦 Smart Inventory**: Items and prices are learned automatically as you bill. No manual catalog entry required.
- **⚙️ Customizable**: Configure shop details, logos, signatures, and terms & conditions.
- **🛡️ Secure & Private**: All data lives on your device. Complete ownership of your business data.
- **♻️ Bill Lifecycle**: Edit, duplicate, soft-delete, and restore bills.

## 🛠 Tech Stack

- **Framework**: [React Native](https://reactnative.dev/) with [Expo](https://expo.dev/) (SDK 54)
- **Language**: TypeScript
- **Database**: [Drizzle ORM](https://orm.drizzle.team/) + [Expo SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Navigation**: [Expo Router](https://docs.expo.dev/router/introduction/)
- **PDF**: `expo-print` for HTML-to-PDF generation

## 🏁 Getting Started

### Prerequisites

- Node.js (LTS)
- npm or yarn

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/bill-khata.git
    cd bill-khata
    ```

2.  **Install dependencies**
    ```bash
    npm install --legacy-peer-deps
    ```

3.  **Start the development server**
    ```bash
    npm start
    ```

4.  **Run on device**
    - Scan the QR code with the **Expo Go** app (Android/iOS).
    - Or run on emulator: `npm run android` / `npm run ios`.

## 📂 Project Structure

```
bill-khata/
├── app/                    # Expo Router screens (File-based routing)
│   ├── (tabs)/             # Bottom tab navigator (Home, Bills, Settings)
│   ├── bill/               # Bill creation & details
│   ├── wizard/             # First-launch setup wizard
│   └── _layout.tsx         # Root layout & providers
├── src/
│   ├── components/         # Reusable UI components
│   ├── db/                 # Drizzle ORM schema & queries
│   ├── stores/             # Zustand state stores (Settings, Drafts)
│   ├── services/           # PDF Generation, Sharing
│   ├── theme/              # Design system (Colors, Typography)
│   └── utils/              # Formatters & helpers
```

## 🏗 Architecture

### Database
The app uses **Drizzle ORM** with `expo-sqlite`.
- `invoices`: Stores bill metadata, customer info, and totals.
- `invoice_items`: Individual line items linked to invoices.
- `items`: Auto-populated table for product autocomplete.
- `bill_drafts`: Auto-save mechanism for crash recovery.

### State Management
**Zustand** is used for global state, with `persist` middleware for data that needs to survive restarts (like Settings).
- `settingsStore`: Shop details, preferences, theme.
- `billDraftStore`: Manages temporary bill state.

## 🤝 Contributing

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

This project is licensed for personal and commercial use as per the included license agreement. See the LICENSE file for details.
