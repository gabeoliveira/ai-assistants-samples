exports.handler = async function(context, event, callback) {
    const client = context.getTwilioClient();
  
    console.log(event);

    const identityHeader = event.request?.headers?.['x-identity'] || event.request?.headers?.['X-Identity'];

    if (!identityHeader) {
        return callback(null, { success: false, error: 'Missing X-Identity header with user identity' });
    }
  
    const to = identityHeader;
    const from = `whatsapp:${context.WHATSAPP_FROM_NUMBER}`; // e.g., whatsapp:+14155238886
    const contentSid = context.CALL_REQUEST_CONTENT_SID;
  
    if (!contentSid) {
      return callback("Invalid or missing Content SID in environment variables.");
    }
  
    try {
      const message = await client.messages.create({
        from,
        to,
        contentSid,
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
  