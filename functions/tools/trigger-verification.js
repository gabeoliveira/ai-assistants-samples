const { sendVerificationFlow } = require(Runtime.getFunctions()['helpers/twilio'].path);


/**
 * @param {import('@twilio-labs/serverless-runtime-types/types').Context} context
 * @param {{}} event
 * @param {import('@twilio-labs/serverless-runtime-types/types').ServerlessCallback} callback
 */
exports.handler = async function (context, event, callback) {
    const client = context.getTwilioClient();
    const verifyServiceSid = context.VERIFY_SERVICE_SID;
    
    const { verificationAddress, verificationChannel } = event;
    const identityHeader = event.request?.headers?.['x-identity'] || event.request?.headers?.['X-Identity'];

    if (!identityHeader) {
        return callback(null, { success: false, error: 'Missing X-Identity header with user identity' });
    }

    const recipientNumber = identityHeader.startsWith('whatsapp:')
        ? identityHeader
        : `whatsapp:${identityHeader}`;

    console.log(event);

    if (!verificationAddress || !verificationChannel) {
        return callback(null, { success: false, error: 'Missing address or channel' });
    }

    try {
        const verification = await client.verify.v2.services(verifyServiceSid)
            .verifications
            .create({ to: verificationAddress, channel: verificationChannel });

        console.log('[trigger-verification] Verification triggered:', verification.sid);

        await sendVerificationFlow({
            context,
            to: recipientNumber,
            address: verificationAddress,
            channel: verificationChannel
        });
        
        return callback(null, { success: true, sid: verification.sid, status: verification.status });
    } catch (error) {
        console.error('Verification error:', error);
        return callback(null, { success: false, error: error.message });
    }
};
