let nacl = require('tweetnacl')

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
  let raw_body = event['rawBody']
  const auth_sig = event['params']['header']['x-signature-ed25519']
  const auth_ts  = event['params']['header']['x-signature-timestamp']
  
  const message = Buffer.from((auth_ts + raw_body), 'utf-8')
  const signature = Buffer.from(auth_sig, 'hex')
  const pub_key = Buffer.from(PUBLIC_KEY, 'hex')
  
  return nacl.sign.detached.verify(message, signature, pub_key)
}

exports.handler = async (event) => {
  console.log("event", event)

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

  console.log("response", response)
  
  return response;
};
