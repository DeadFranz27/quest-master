# Home Assistant Integration Setup

This guide will help you integrate Quest Master with Home Assistant to block devices based on task completion.

## Prerequisites

- Home Assistant installed and running on your network
- Devices (PlayStation, TV, etc.) already integrated with Home Assistant as switches or smart plugs

## Step 1: Create a Long-Lived Access Token

1. Open your Home Assistant web interface
2. Click on your profile (bottom left)
3. Scroll down to "Long-Lived Access Tokens"
4. Click "CREATE TOKEN"
5. Give it a name like "Quest Master"
6. Copy the token (you'll need this in Step 3)

## Step 2: Configure Device Entities

In Home Assistant, make sure your devices are set up as switches. Common setups:

- **Smart Plugs**: Use a smart plug to control power to devices
- **PlayStation/Xbox**: Use PS4/PS5 or Xbox integration
- **TV**: Use smart TV integration or smart plug
- **Computer**: Use Wake-on-LAN or smart plug integration

Note the entity IDs of your devices (e.g., `switch.playstation`, `switch.tv`).

## Step 3: Configure the Server

1. Navigate to the `server` directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

4. Edit the `.env` file with your details:
   ```
   HA_URL=http://YOUR_HA_IP:8123
   HA_TOKEN=YOUR_LONG_LIVED_ACCESS_TOKEN
   ```

5. Update device mappings in `server.js` (lines 26-32):
   ```javascript
   const DEVICE_ENTITY_MAP = {
     'playstation': 'switch.your_playstation_entity',
     'xbox': 'switch.your_xbox_entity',
     'tv': 'switch.your_tv_entity',
     'computer': 'switch.your_computer_entity',
     'tablet': 'switch.your_tablet_entity'
   };
   ```

## Step 4: Test the Connection

1. Start the server:
   ```bash
   npm start
   ```

2. Test the Home Assistant connection:
   ```bash
   curl http://localhost:3001/api/test-ha
   ```

   You should see:
   ```json
   {
     "connected": true,
     "message": "API running."
   }
   ```

## Step 5: Start Using Quest Master

1. In one terminal, run the server:
   ```bash
   cd server
   npm start
   ```

2. In another terminal, run the web app:
   ```bash
   npm run dev
   ```

3. Open the app in your browser (usually http://localhost:5173)

4. Create a task and select a device to block

5. When the task is incomplete, the device will be turned off via Home Assistant

6. Complete the task to unlock the device!

## Advanced: Home Assistant Automations

You can create automations in Home Assistant to prevent manual override:

```yaml
automation:
  - alias: "Prevent PlayStation Override"
    trigger:
      - platform: state
        entity_id: switch.playstation
        to: "on"
    condition:
      - condition: template
        value_template: "{{ states('input_boolean.playstation_blocked') == 'on' }}"
    action:
      - service: switch.turn_off
        entity_id: switch.playstation
      - service: notify.mobile_app
        data:
          message: "Complete your tasks first! 🎮"
```

## Troubleshooting

### Connection Issues

- Verify Home Assistant is accessible at the URL you configured
- Check that your token is valid (tokens don't expire)
- Make sure Home Assistant API is enabled

### Devices Not Blocking

- Verify entity IDs in the device mapping
- Check that entities exist in Home Assistant
- Test manually turning devices on/off from Home Assistant UI

### CORS Errors

- The server includes CORS support by default
- If issues persist, check browser console for specific errors

## Security Notes

- Keep your `.env` file secure and never commit it to version control
- Long-lived tokens have the same permissions as your user account
- Consider creating a separate Home Assistant user with limited permissions for Quest Master
- Use HTTPS if accessing Home Assistant over the internet

## Example Device Configurations

### Using TP-Link Kasa Smart Plug
```yaml
# configuration.yaml
switch:
  - platform: tplink
    host: 192.168.1.100  # Your plug's IP
    name: PlayStation
```

### Using Tuya Smart Plug
```yaml
# configuration.yaml
tuya:
  username: YOUR_EMAIL
  password: YOUR_PASSWORD
  country_code: 1  # US
```

### Using Wake-on-LAN for Computer
```yaml
# configuration.yaml
switch:
  - platform: wake_on_lan
    mac: "AA:BB:CC:DD:EE:FF"
    name: Computer
    host: 192.168.1.50
```

## Support

If you encounter issues:
1. Check the server logs for error messages
2. Verify Home Assistant logs: Settings > System > Logs
3. Test API endpoints manually using curl or Postman
