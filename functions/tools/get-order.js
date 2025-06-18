const { getOrderByName } = require(Runtime.getFunctions()['helpers/shopify'].path);

/**
 * @param {import('@twilio-labs/serverless-runtime-types/types').Context} context
 * @param {{ orderName: string }} event
 * @param {import('@twilio-labs/serverless-runtime-types/types').ServerlessCallback} callback
 */
exports.handler = async function (context, event, callback) {
  const { orderName } = event;

  if (!orderName) {
    return callback(null, {
      success: false,
      error: 'Missing required parameter: orderName',
    });
  }

  try {
    const order = await getOrderByName(context, orderName);

    return callback(null, {
      success: true,
      order,
    });
  } catch (error) {
    console.error('Failed to fetch order:', error.message);
    return callback(null, {
      success: false,
      error: error.message,
    });
  }
};
