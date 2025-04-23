# TheAgency Economy Bot & Website Connection

This repository contains a Discord bot with economy features and a website that connects to the bot to display real-time economy data like leaderboards.

## Features

- **Discord Economy Bot**: Currency system, shop, daily rewards, work commands, etc.
- **Real-time Leaderboard**: Website displays live currency data from the bot
- **API Connection**: Secure connection between the website and bot database
- **Admin Controls**: Role-based permission system for economy management

## Setup Instructions

### 1. Discord Bot Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure .env file**:
   ```
   DISCORD_TOKEN=your_discord_bot_token
   CLIENT_ID=your_discord_application_id
   ```

3. **Deploy Slash Commands**:
   ```bash
   npm run deploy
   ```

4. **Start the Bot**:
   ```bash
   npm run start
   ```

### 2. API Server Setup

The API server is included in the `api.js` file and connects to the same database as your Discord bot. To run it:

1. **Install API dependencies** (if not already installed):
   ```bash
   npm install express cors
   ```

2. **Configure API settings**:
   Edit the top of the api.js file to set:
   - Port (default: 3000)
   - CORS settings (what domains can access the API)
   - Optional API key for security

3. **Start the API Server**:
   ```bash
   node api.js
   ```

   Or run alongside your bot by adding to package.json:
   ```json
   "scripts": {
     "start": "node index.js & node api.js"
   }
   ```

### 3. Website Setup

The website is already configured to connect to the API server. Just update the API URL:

1. **Configure API connection**:
   In `script.js`, update the API_CONFIG object:
   ```javascript
   const API_CONFIG = {
     apiUrl: "http://localhost:3000/api/leaderboard",  // Change to your actual API URL
     apiKey: "",  // Add API key if your server requires one
     limit: 5,
     refreshInterval: 60000 // 60 seconds
   };
   ```

2. **Start the Website**:
   ```bash
   npx http-server -p 8080
   ```

## How It Works

### Leaderboard Data Flow

1. **Discord Bot → Database**: 
   - Users interact with economy commands (/balance, /work, /daily)
   - Commands store usernames and balances in the database

2. **Database → API**:
   - API server (api.js) connects to the same database
   - Exposes leaderboard data via a REST endpoint

3. **API → Website**:
   - Website fetches data from the API endpoint
   - Displays real-time leaderboard with actual usernames and balances

### Security Considerations

- **API Key**: Optionally secure the API with an authentication key
- **CORS Protection**: Limit API access to specific domains
- **Discord Bot Token**: Never expose your Discord token

## Further Customization

### Adding More Economy Commands

When adding new economy commands, add username tracking to store Discord usernames:

```javascript
// Store username when user interacts with economy commands
await economy.storeUsername(userId, interaction.user.username);
```

### Modifying API Endpoints

You can add more endpoints to the API server for other data like:
- Shop items
- Individual user stats
- Server economy statistics

## Environment Variables

- `PORT`: API server port (default: 3000)
- `WEBSITE_URL`: Domain for CORS protection
- `API_KEY`: Secret key for API authentication

## Troubleshooting

- **CORS Errors**: Ensure the WEBSITE_URL environment variable matches your actual domain
- **No Data Appearing**: Check if usernames are being stored with the storeUsername method
- **API Connection Failures**: Verify the API server is running and the URL is correct

## License

© 2025 TheAgency. All rights reserved.