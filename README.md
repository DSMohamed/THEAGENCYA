# TheAgency Discord Economy Bot

A powerful, modern Discord bot for server economy, moderation, and community engagement. Now powered by **Firebase Firestore** for persistent, cloud-based data storage—safe from redeploys and server moves!

## Features

- **Economy System**: Currency, daily/work rewards, shop, inventory, transfers, and leaderboard
- **Moderation Tools**: Ban, kick, timeout, warn, clear messages, and warnings management
- **Admin Controls**: Role-based permissions, admin-only commands, and shop management
- **Custom Embeds**: Easily post rules, info, and banners
- **Welcome System**: Customizable welcome messages for new members
- **API Server**: REST API for leaderboard and user data (for website integration)
- **Cloud Database**: All data is stored in Firestore (Firebase), so you never lose data on redeploy

---

## Setup Instructions

### 1. Prerequisites

- Node.js v16+
- A Discord bot application ([create here](https://discord.com/developers/applications))
- A Firebase project with Firestore enabled ([get started here](https://console.firebase.google.com/))

1. **Install dependencies**:
   ```bash
   npm install
   ```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```
DISCORD_TOKEN=your_discord_bot_token
CLIENT_ID=your_discord_application_id
PORT=3000 # (optional, for API server)
NODE_ENV = production
```

### 4. Set Up Firebase Service Account

1. In the Firebase Console, go to **Project Settings > Service Accounts**.
2. Click **Generate new private key** and download the JSON file.
3. Place the file in `utils/firebase-key.json` (do NOT commit this file to GitHub).

### 5. Deploy Slash Commands

```bash
npm run deploy
```

### 6. Start the Bot

```bash
npm start
```

---

## Firestore Database Structure

- `users` collection: User balances, inventory, cooldowns, usernames
- `shop/items` document: Array of shop items
- `config/admin` document: Admin roles and display role
- `warnings` collection: User warnings per guild
- `welcome` collection: Welcome config per guild

---

## API Server (Optional)

The API server (in `api.js`) exposes endpoints for leaderboard and user data. Start it with:

```bash
node api.js
```

Endpoints:

- `/api/leaderboard?limit=5` — Top users
- `/api/user/:userId/balance` — User balance
- `/api/health` — Health check

---

## Security Best Practices

- **Never share your Discord bot token or `firebase-key.json`!**
- Use production mode for Firestore and keep your service account key private.
- Use environment variables for all secrets.

---

## Troubleshooting

- **Token errors**: Regenerate your Discord token and update `.env`.
- **Firestore errors**: Ensure your service account file is correct and Firestore is enabled.
- **No data**: Check that your bot has permission to write to Firestore and that the correct project is used.

---

## License

© 2025 TheAgency. All rights reserved.
