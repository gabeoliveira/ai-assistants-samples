

exports.sendPixCode = async function ({ context, pixCode, phoneNumber, paymentId, items }) {
  const client = context.getTwilioClient();
  const whatsappNumber = context.WHATSAPP_FROM_NUMBER;
  const contentSid = context.PAYMENT_CONTENT_SID;

  console.log(items);

  // Normalize phoneNumber
  const to = phoneNumber.startsWith('whatsapp:')
    ? phoneNumber
    : `whatsapp:${phoneNumber}`;

  // Calculate expiration timestamp (15 minutes from now)
  const expirationDate = Math.floor((Date.now() + 15 * 60 * 1000) / 1000).toString();

  const amount = items.reduce((acc, item) => {
    const itemTotal = (item.amount || 0) * (item.quantity || 1);
    return acc + itemTotal;
  }, 0).toFixed(2); // Ensures two decimal places, as string

  //const cleanPixCode = pixCode.replace(/\s+/g, '').trim();

  const contentVariables = {
    '1': paymentId,
    '2': "Estamos quase lá! Agora é só efetuar o pagamento de seu pedido e já podemos concluir!",
    '3': "Owl Store",
    '4': pixCode,
    '5': amount,
    '6': amount,
    '7': expirationDate,
    '8': JSON.stringify(items)

  }

  console.log('Content Variables:', contentVariables);

  const message = await client.messages.create({
    to,
    from: 'whatsapp:' + whatsappNumber,
    contentSid,
    contentVariables: JSON.stringify(contentVariables)
  });

  return message;
};


/**
 * Sends a WhatsApp message using a Twilio Content Flow (twilio/flows) to prompt user for the verification code.
 *
 * @param {Object} params
 * @param {string} params.to - WhatsApp number of the user (e.g., +5511999999999)
 * @param {string} params.body - Verification field body
 * @param {import('@twilio-labs/serverless-runtime-types/types').Context} context - Twilio context
 * @returns {Promise<void>}
 */
exports.sendVerificationFlow = async function ({ context, to, address, channel }) {
  const client = context.getTwilioClient();
  const from = 'whatsapp:' + context.WHATSAPP_FROM_NUMBER;
  const contentSid = context.VERIFICATION_CONTENT_SID; // your twilio/flows content SID

  function getMaskedMessage(channel, address) {
    if (channel === 'sms' || channel === 'whatsapp') {
      const masked = address.slice(0, -4) + 'XXXX';
      return `Enviamos um SMS para o número ${masked}`;
    }

    if (channel === 'email') {
      const [user, domain] = address.split('@');
      const maskedUser = user.length > 3 ? user.slice(0, 3) + '***' : '***';
      return `Enviamos um e-mail para o endereço ${maskedUser}@${domain}`;
    }

    return `Enviamos um código para o canal ${channel}`;
  }

  const messageBody = getMaskedMessage(channel, address);

  const contentVariables = {
    '1': messageBody,
  };

  try {
    const flowMessage = await client.messages.create({
      to,
      from,
      contentSid,
      contentVariables: JSON.stringify(contentVariables)
    });

    console.log(`[Verification Flow] Sent to ${to} with SID ${flowMessage.sid}`);
  } catch (err) {
    console.error('[Verification Flow] Error sending verification flow:', err.message);
    throw err;
  }
};

