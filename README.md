# Life Journal Daily Devotions

A comprehensive Bible reading and journaling application with live chat functionality.

## Features

- **Daily Bible Reading Plan**: Complete year-long reading plan with themed daily readings
- **SOAP Study Method**: Scripture, Observation, Application, Prayer journaling
- **Progress Tracking**: Visual calendar showing completed days and progress
- **Multiple Bible Data Sources**: Supports JSON files from Supabase storage, local CSV data, and Bible Gateway fallback
## Supabase Setup
- **Live Group Chat**: Real-time chat with other users for encouragement and prayer
This application uses Supabase for authentication and data storage.
- **Bible Search**: Search through scripture verses
### 1. Create a Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new account or sign in
3. Create a new project
4. Wait for the project to be set up
## Bible Data Configuration

The application supports multiple Bible data sources with automatic fallback:

### 1. Supabase JSON Storage (Recommended)
Upload a JSON file containing Bible data to your Supabase storage bucket:

1. **JSON Format**: The file should follow this structure:
   ```json
   {
     "books": {
       "Genesis": {
         "chapters": {
           "1": {
             "verses": {
               "1": "In the beginning God created the heavens and the earth.",
               "2": "The earth was formless and void..."
             }
           }
         }
       }
     }
   }
   ```

2. **Upload to Supabase**:
   - Create a storage bucket (e.g., `bible-data`)
   - Upload your JSON file (e.g., `bible.json`)
   - Ensure proper RLS policies for public read access

3. **Configure in App**:
   - Go to Resources tab
   - Use the Bible Data Status panel to configure bucket and file names
   - The app will automatically load and use your JSON data

### 2. Local CSV Data (Fallback)
- Place a `genesis_bible_verses.csv` file in the `public` folder
- Limited to sample verses but works offline

### 3. Bible Gateway (External Fallback)
- Provides links to Bible Gateway for passages not found locally
- Always available as final fallback

- **Sharing**: Share your SOAP entries with others
### 2. Get Your Project Credentials
1. Go to Settings → API in your Supabase dashboard
2. Copy your Project URL and anon/public key
3. Create a `.env` file in the project root:
   ```
   VITE_SUPABASE_URL=your_project_url_here
   VITE_SUPABASE_ANON_KEY=your_anon_key_here
   ```
- **Resources**: Links to helpful Bible study resources
### 3. Run Database Migrations
1. Install the Supabase CLI: `npm install -g supabase`
2. Login to Supabase: `supabase login`
3. Link your project: `supabase link --project-ref your-project-ref`
4. Run migrations: `supabase db push`
- **Cloud Sync**: Supabase integration for cross-device synchronization
### 4. Configure Authentication
1. Go to Authentication → Settings in your Supabase dashboard
2. Configure your site URL (e.g., `http://localhost:5173` for development)
3. Enable email authentication
4. Optionally configure social providers
- **User Authentication**: Secure sign-up/sign-in with guest mode option
### 5. Set Up Storage (Optional)
1. Go to Storage in your Supabase dashboard
2. Create a new bucket for Bible data (e.g., `bible-data`)
3. Set appropriate RLS policies for public read access
4. Upload your Bible JSON file

### Database Schema
The application creates the following tables:
- `profiles` - User profile information
- `soap_entries` - Daily SOAP study entries
- `chat_messages` - Group chat messages
- `chat_reactions` - Message reactions
- **Progressive Web App**: Install on mobile devices like a native app
All tables have Row Level Security (RLS) enabled to ensure users can only access their own data.

## Mobile App Installation

### Progressive Web App (PWA) - Recommended
The app is built as a PWA and can be installed on mobile devices:

**For iPhone/iPad:**
1. Open the app in Safari
2. Tap the Share button (square with arrow)
3. Scroll down and tap "Add to Home Screen"
4. Tap "Add" to install

**For Android:**
1. Open the app in Chrome
2. Tap the menu (three dots)
3. Tap "Add to Home Screen" or "Install App"
4. Tap "Install" to confirm

**Features when installed:**
- Works offline for reading and journaling
- Push notifications (future feature)
- Full-screen experience
- App icon on home screen
- Fast loading from home screen

### Native App Development Options

#### Option 1: React Native (Recommended for Native Apps)
```bash
# Install React Native CLI
npm install -g @react-native-community/cli

# Create new React Native project
npx react-native init LifeJournalMobile

# Copy components and adapt for React Native
```

#### Option 2: Capacitor (Hybrid App)
```bash
# Install Capacitor
npm install @capacitor/core @capacitor/cli

# Initialize Capacitor
npx cap init LifeJournal com.newhope.lifejournal

# Add platforms
npx cap add ios
npx cap add android

# Build and sync
npm run build
npx cap sync
```

#### Option 3: Expo (Easiest for React Developers)
```bash
# Install Expo CLI
npm install -g @expo/cli

# Create new Expo project
npx create-expo-app LifeJournalMobile

# Copy and adapt components
```

## Live Chat Setup

The application includes a live chat feature that works in two modes:

### Demo Mode (Default)
- Uses localStorage to simulate real-time chat
- Perfect for testing and demonstration
- No server setup required

### Live Server Mode
For real-time chat across multiple users:

1. **Install server dependencies:**
   ```bash
   cd src/server
   npm install
   ```

2. **Start the chat server:**
   ```bash
   npm start
   ```
   The server will run on `http://localhost:3001`

3. **The app will automatically connect** to the server when available

### Production Deployment

For production, you can deploy the chat server to:
- **Heroku**: Easy deployment with WebSocket support
- **Railway**: Modern platform with automatic deployments
- **DigitalOcean**: VPS with full control
- **AWS/Google Cloud**: Scalable cloud solutions

#### Environment Variables for Production:
```
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://your-app-domain.com
```

## Development

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Start development server
npm run dev

# Build for production
npm run build
```

## App Store Deployment

### iOS App Store
1. Use React Native or Capacitor to create iOS app
2. Set up Apple Developer Account ($99/year)
3. Configure app in App Store Connect
4. Submit for review (typically 1-7 days)

### Google Play Store
1. Use React Native or Capacitor to create Android app
2. Set up Google Play Developer Account ($25 one-time)
3. Upload APK/AAB to Play Console
4. Submit for review (typically 1-3 days)

### Alternative Distribution
- **TestFlight** (iOS): Beta testing before App Store
- **Firebase App Distribution**: Cross-platform beta testing
- **Direct APK**: Android users can install directly

## Embedding in WordPress/Divi

The application can be easily embedded in WordPress using an iframe:

```html
<div class="life-journal-embed">
  <iframe 
    src="https://your-deployed-app.netlify.app" 
    width="100%" 
    height="800"
    frameborder="0">
  </iframe>
</div>
```

## Chat Features

- **Real-time messaging** with other users
- **Prayer requests** and encouragement
- **Online user indicators**
- **Message types**: Regular messages, prayers, encouragement
- **Automatic reconnection** if connection is lost
- **Fallback to demo mode** if server is unavailable

## Technology Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **PWA**: Service Worker, Web App Manifest
- **Chat**: Socket.IO for real-time communication
- **Build Tool**: Vite
- **Deployment**: Netlify (frontend), Heroku/Railway (chat server)

## License

This project is created for New Hope West church community.