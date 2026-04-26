# Telegram Mini App Setup Guide

This guide explains how to set up the Change Maker Awards leaderboard as a Telegram Mini App.

## Overview

The app has been converted to work as a Telegram Mini App on the `tg-mini-app` branch. It automatically detects whether it's running in Telegram or a regular browser and adapts accordingly.

## Prerequisites

- Deployed web application (currently hosted on Vercel at `https://change-makers-xi.vercel.app`)
- Telegram account
- Access to @BotFather

## Setup Steps

### 1. Create a Telegram Bot

1. Open Telegram and search for [@BotFather](https://t.me/BotFather)
2. Start a conversation with BotFather
3. Send the command `/newbot`
4. Follow the prompts to:
   - Choose a name for your bot (e.g., "Change Maker Awards Bot")
   - Choose a username for your bot (must end in `bot`, e.g., `ChangeMakerAwardsBot`)
5. BotFather will provide you with a **bot token** - save this securely

### 2. Configure Web App URL

1. Send the command `/newapp` to @BotFather
2. Select the bot you created in step 1
3. Provide a title for your Web App (e.g., "Change Maker Awards Leaderboard")
4. Provide a description (e.g., "View the leaderboard of nominees across all categories")
5. Provide the URL of your deployed app: `https://change-makers-xi.vercel.app`
6. BotFather will provide a **short URL** for your Web App

### 3. Set Up Bot Commands (Optional)

1. Send `/setcommands` to @BotFather
2. Select your bot
3. Add commands like:
   ```
   leaderboard - Open the awards leaderboard
   help - Show help information
   ```

### 4. Test the Mini App

1. Open the short URL provided by BotFather in a web browser
2. It should open in Telegram as a Mini App
3. Verify that:
   - The app loads correctly
   - The theme matches your Telegram settings (light/dark mode)
   - The header is hidden (uses Telegram's native header)
   - All functionality works (category selection, nominee display, etc.)

### 5. Deploy the Telegram Mini App Branch

If you haven't already deployed the `tg-mini-app` branch:

```bash
# Ensure you're on the tg-mini-app branch
git checkout tg-mini-app

# Deploy to Vercel
npx vercel@latest --prod
```

## Features in Telegram Mode

When the app runs in Telegram, it:

- **Detects Telegram environment** automatically
- **Applies Telegram theme colors** (background, text, buttons, links)
- **Expands to full height** within Telegram
- **Hides custom header** (uses Telegram's native header)
- **Disables user selection** for better mobile experience
- **Removes tap highlight** for native feel

## Branch Information

- **Main branch**: Regular web application with full header
- **tg-mini-app branch**: Telegram Mini App version with Telegram integration

Both branches are deployed and functional. Choose the appropriate branch based on your use case.

## Troubleshooting

### Mini App Not Loading

- Ensure the URL is correct and accessible
- Check that your Vercel deployment is successful
- Verify the URL is HTTPS (required for Telegram Mini Apps)

### Theme Not Applying

- Clear Telegram cache and reopen the Mini App
- Check your Telegram theme settings
- Ensure the Telegram Web App SDK is loading correctly

### Images Not Loading

- Verify the image optimization is disabled (using `unoptimized` prop)
- Check that the API is accessible from the deployed environment

## Additional Resources

- [Telegram Mini Apps Documentation](https://core.telegram.org/bots/webapps)
- [BotFather Commands](https://core.telegram.org/bots#botfather)
- [Telegram Web App SDK](https://telegram.org/js/telegram-web-app.js)

## Support

For issues or questions, refer to the main project README or contact the development team.
