const { v4: uuidv4 } = require('uuid');

/**
 * @param {import('@twilio-labs/serverless-runtime-types/types').Context} context
 * @param {{ name: string, month: string, amount: string }} event
 * @param {import('@twilio-labs/serverless-runtime-types/types').ServerlessCallback} callback
 */
exports.handler = async function (context, event, callback) {
  const client = context.getTwilioClient();
  const flowSid = context.STUDIO_FLOW_SID;

  const { name, month, amount, phone } = event;

  if (!name || !month || !amount) {
    return callback(null, {
      status: 400,
      message: 'Missing required parameters: name, month, or amount',
    });
  }

  // Create a numeric UUID (digits only)
  const paymentId = uuidv4().replace(/\D/g, '').slice(0, 12);

  // Calculate expiration timestamp (15 minutes from now)
  const expirationDate = Math.floor((Date.now() + 15 * 60 * 1000) / 1000).toString();

  // Build items array as a string
  const items = JSON.stringify([
    {
      label: `Consumo ${month}`,
      quantity: "1",
      id: "consumo",
      amount: amount,
    },
  ]);

  console.log("Payment ID:", paymentId);
  console.log("Items:", items);

  // Fixed pixCode
  const pixCode = "00020126360014BR.GOV.BCB.PIX0114+55119769326825204000053039865406250.005802BR5925GABRIEL FERNANDO LIMA OLI6009SAO PAULO6226052230y8nvnHC6a6hA41FpDmzh6304B692";

  try {
    const execution = await client.studio.v2.flows(flowSid).executions.create({
      parameters: {
        name,
        month,
        paymentId,
        pixCode,
        subtotalAmount: amount,
        totalAmount: amount,
        expirationDate,
        items,
      },
      to: `whatsapp:${phone}`, 
      from: context.MESSAGING_SERVICE_SID
    });

    return callback(null, {
      status: 200,
      executionSid: execution.sid,
      message: 'Studio Flow triggered successfully',
    });
  } catch (error) {
    console.error('Error triggering Studio Flow:', error);
    return callback(null, {
      status: 500,
      message: 'Failed to trigger Studio Flow',
      error: error.message,
    });
  }
};
