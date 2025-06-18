// helpers/mercado-pago.js
const axios = require('axios');

const BASE_URL = 'https://api.mercadopago.com';

function getHeaders(context, idempotencyKey) {
  return {
    Authorization: `Bearer ${context.MERCADO_PAGO_ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
    'X-Idempotency-Key': idempotencyKey || generateIdempotencyKey()
  };
}

function generateIdempotencyKey() {
  return 'mp-' + Date.now() + '-' + Math.floor(Math.random() * 10000);
}

exports.createPixPayment = async function (orderId, orderName, context, customer, phoneNumber) {
  const payload = {
    transaction_amount: 0.01, // 1-cent payments for demo purposes
    description: `Pagamento do pedido ${orderName}`,
    payment_method_id: 'pix',
    external_reference: orderId,
    payer: {
        email: customer.email,
        first_name: customer.firstName,
        last_name: customer.lastName,
    },
    metadata: {
        customerId: customer.userId
    },
    additional_info: {
        payer: {
            phone: {
                number: phoneNumber
            }
        }
    }

  };

  const headers = getHeaders(context, `pix-${orderId}`);

  const response = await axios.post(`${BASE_URL}/v1/payments`, payload, { headers });

  const { id, point_of_interaction } = response.data;

  return {
    mercadoPagoPaymentId: id,
    pixCode: point_of_interaction.transaction_data.qr_code,
    qrImageUrl: point_of_interaction.transaction_data.qr_code_base64,
    externalReference: orderId,
  };
};

exports.createCardPayment = async function (orderId) {
  const payload = {
    title: `Pedido ${orderId}`,
    quantity: 1,
    unit_price: 1.00, 
    currency_id: 'BRL',
  };

  const response = await axios.post(
    `${BASE_URL}/checkout/preferences`,
    {
      items: [payload],
      external_reference: `order-${orderId}`,
      back_urls: {
        success: 'https://yourdomain.com/success',
        pending: 'https://yourdomain.com/pending',
        failure: 'https://yourdomain.com/failure',
      },
      auto_return: 'approved',
    },
    { headers: getHeaders(this.context) }
  );

  const { id, init_point } = response.data;

  return {
    mercadoPagoPreferenceId: id,
    paymentUrl: init_point,
    externalReference: `order-${orderId}`,
  };
};
