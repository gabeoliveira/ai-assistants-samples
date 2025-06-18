
/**
 * @param {import('@twilio-labs/serverless-runtime-types/types').Context} context
 * @param {{ mediaUrl: string, phoneNumber: string }} event
 * @param {import('@twilio-labs/serverless-runtime-types/types').ServerlessCallback} callback
 */
exports.handler = async function (context, event, callback) {
  const client = context.getTwilioClient();

  const { phoneNumber, mediaUrl } = event;

  if (!phoneNumber || !mediaUrl ) {
    return callback(null, {
      status: 400,
      message: 'Missing required parameters: mediaUrl or phoneNumber',
    });
  }

  // Normalize phoneNumber
  const to = phoneNumber.startsWith('whatsapp:')
    ? phoneNumber
    : `whatsapp:${phoneNumber}`;

  const from = `whatsapp:${context.WHATSAPP_FROM_NUMBER}`; // e.g., whatsapp:+14155238886

   try {
      const message = await client.messages.create({
        from,
        to,
        mediaUrl,
      });
  
      return callback(null, {
        success: true,
        messageSid: message.sid,
      });
    } catch (error) {
      console.error("Failed to send WhatsApp message:", error);
      return callback(error);
    }
};
