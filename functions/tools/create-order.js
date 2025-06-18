const shopifyHelper = require(Runtime.getFunctions()['helpers/shopify'].path);
const mercadoPagoHelper = require(Runtime.getFunctions()['helpers/mercado-pago'].path);
const twilioHelper = require(Runtime.getFunctions()['helpers/twilio'].path);

exports.handler = async function (context, event, callback) {
  const { lineItems, customer, shippingAddress, paymentMethod, items, phoneNumber } = event;

  if (!lineItems || !paymentMethod || !items) {
    return callback(null, { success: false, error: 'Missing required fields' });
  }

  try {
    // Step 1: Create Shopify order with PENDING status
    const order = await shopifyHelper.createOrder({
      context,
      lineItems,
      email: customer.email,
      shippingAddress,
      financialStatus: 'PENDING'
    });

    let paymentResult;
    let message;

    // Step 2: Handle Payment
    if (paymentMethod === 'PIX') {
        paymentResult = await mercadoPagoHelper.createPixPayment(order.id, order.name, context, customer, phoneNumber);

        console.log(paymentResult);

        message = await twilioHelper.sendPixCode({
            context,
            pixCode: paymentResult.pixCode,
            phoneNumber,
            paymentId: order.name,
            items,

        });
    } else if (paymentMethod === 'CREDIT_CARD') {
      paymentResult = await mercadoPagoHelper.createCardPayment(order.name);
    } else {
      return callback(null, { success: false, error: 'Unsupported payment method' });
    }

    return callback(null, {
      success: true,
      orderId: order.id,
      orderName: order.name,
      payment: paymentResult,
      message
    });
  } catch (err) {
    console.error('Order/payment failed:', JSON.stringify(err.response?.data || err.message, null, 2));
    return callback(null, { success: false, error: err.message });
  }
};