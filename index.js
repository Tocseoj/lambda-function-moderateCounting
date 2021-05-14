const nacl = require('tweetnacl')
const axios = require('axios')

// found on Discord Application -> General Information page
const PUBLIC_KEY = process.env.PUBLIC_KEY

const RESPONSE_TYPES =  { 
  "PONG": 1, 
  "ACK_NO_SOURCE": 2, 
  "MESSAGE_NO_SOURCE": 3, 
  "MESSAGE_WITH_SOURCE": 4, 
  "ACK_WITH_SOURCE": 5
}

function verifySignature(event) {
  const raw_body = event['rawBody']
  const auth_sig = event['params']['header']['x-signature-ed25519']
  const auth_ts  = event['params']['header']['x-signature-timestamp']
  
  const message = Buffer.from((auth_ts + raw_body), 'utf-8')
  const signature = Buffer.from(auth_sig, 'hex')
  const pub_key = Buffer.from(PUBLIC_KEY, 'hex')
  
  return nacl.sign.detached.verify(message, signature, pub_key)
}

exports.handler = async (event) => {
  console.log("event", event)

  if (event.action === 'register_guild_command') {
    const APP_ID = process.env.APP_ID
    const GUILD_ID = process.env.GUILD_ID
    const url = `https://discord.com/api/v8/applications/${APP_ID}/guilds/${GUILD_ID}/commands`
    const config = { headers: { Authorization: "Bot " + process.env.COUNTING_BOT }}
    const data = {
      "name": "blep",
      "description": "Send a random adorable animal photo",
      "options": [
        {
          "name": "animal",
          "description": "The type of animal",
          "type": 3,
          "required": true,
          "choices": [
            {
              "name": "Dog",
              "value": "animal_dog"
            },
            {
              "name": "Cat",
              "value": "animal_cat"
            },
            {
              "name": "Penguin",
              "value": "animal_penguin"
            }
          ]
        },
        {
          "name": "only_smol",
          "description": "Whether to show only baby animals",
          "type": 5,
          "required": false
        }
      ]
    }
    await axios.post(url, data, config)
    // No error logging
    return {
      statusCode: 200,
      body: JSON.stringify('Hello from Lambda!'),
    };
  }

  if (!verifySignature(event)) {
    throw `[UNAUTHORIZED] Invalid request signature`
  }

  let response = {
    type: RESPONSE_TYPES['MESSAGE_NO_SOURCE'],
    data: {
      tts: false,
      content: "BEEP BOOP",
      embeds: [],
      allowed_mentions: [],
    }
  }

  // check if message is a ping
  if (event['body-json']['type'] === 1) {
    response = { 
      type: RESPONSE_TYPES['PONG']
    }
  }

  response.headers = { Authorization: "Bot " + process.env.COUNTING_BOT }

  console.log("response", response)
  return response;
};
