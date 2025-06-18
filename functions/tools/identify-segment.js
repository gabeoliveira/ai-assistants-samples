const axios = require('axios');

/**
 * @param {import('@twilio-labs/serverless-runtime-types/types').Context} context
 * @param {{ cpf?: string, phone_number?: string }} event
 * @param {import('@twilio-labs/serverless-runtime-types/types').ServerlessCallback} callback
 */
exports.handler = async function (context, event, callback) {
  const { cpf, phone_number } = event;

  if (!cpf && !phone_number) {
    return callback(null, "Either CPF or phone_number is required.");
  }

  const SEGMENT_SPACE_ID = context.SEGMENT_SPACE_ID;
  const SEGMENT_PROFILE_API_KEY = context.SEGMENT_PROFILE_API_KEY;

  let identifierType;
  let identifierValue;

  if (cpf) {
    identifierType = 'cpf';
    identifierValue = cpf;
  } else {
    identifierType = 'phone_number';

    // Normalize phone number: ensure it starts with '+'
    if (!phone_number.startsWith('+')) {
      identifierValue = `+${phone_number}`;
    } else {
      identifierValue = phone_number;
    }
  }

const encodedIdentifier = encodeURIComponent(`${identifierType}:${identifierValue}`);

const profileUrl = `https://profiles.segment.com/v1/spaces/${SEGMENT_SPACE_ID}/collections/users/profiles/${encodedIdentifier}/traits?limit=50`;


  try {
    const response = await axios.get(profileUrl, {
      auth: {
        username: SEGMENT_PROFILE_API_KEY,
        password: ''
      }
    });

    const traits = response.data?.traits;

    if (traits) {
      return callback(null, traits);
    } else {
      return callback(null, "No user was found. This is a new user");
    }

  } catch (error) {
    console.error('Error fetching profile from Segment:', error.response?.data || error.message);
    return callback(new Error("Failed to fetch profile from Segment."));
  }
};
