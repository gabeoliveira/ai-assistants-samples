/**
 * @param {import('@twilio-labs/serverless-runtime-types').Context} context
 * @param {{ code: string, customerCpf: string, actualCpf: string, verificationAddress: string }} event
 * @param {import('@twilio-labs/serverless-runtime-types').ServerlessCallback} callback
 */
exports.handler = async function (context, event, callback) {
  const client = context.getTwilioClient();
  const verifyServiceSid = context.VERIFY_SERVICE_SID;

  const { code, customerCpf, actualCpf, verificationAddress } = event;

  if (!code || !customerCpf || !actualCpf || !verificationAddress) {
    return callback(null, { success: false, error: 'Missing required fields' });
  }

  const clean = (cpf) => cpf.replace(/[.\-]/g, '');
  const normalizedCustomerCpf = clean(customerCpf);
  const normalizedActualCpf = clean(actualCpf);

  if (normalizedCustomerCpf !== normalizedActualCpf) {
    return callback(null, { success: false, error: 'CPF verification failed' });
  }

  try {
    const verificationCheck = await client.verify.v2
      .services(verifyServiceSid)
      .verificationChecks
      .create({
        to: verificationAddress,
        code
      });

    if (verificationCheck.status === 'approved') {
      return callback(null, { success: true, status: verificationCheck.status });
    } else {
      return callback(null, { success: false, status: verificationCheck.status });
    }
  } catch (error) {
    console.error('Verification check error:', error);
    return callback(null, { success: false, error: error.message });
  }
};
