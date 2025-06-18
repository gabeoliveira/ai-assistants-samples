const { shopifyApi, LATEST_API_VERSION, admin } = require('@shopify/shopify-api');
require('@shopify/shopify-api/adapters/node');

let shopify = null;


function getShopifyClient(context) {
  if (!shopify) {
    shopify = shopifyApi({
      apiVersion: LATEST_API_VERSION,
      isCustomStoreApp: true,
      adminApiAccessToken: context.SHOPIFY_ACCESS_TOKEN,
      hostName: context.SHOPIFY_STORE_DOMAIN,
      apiSecretKey: context.SHOPIFY_API_SECRET_KEY
    });
  }

  return new shopify.clients.Graphql({
    session: {
      shop: context.SHOPIFY_STORE_DOMAIN,
      accessToken: context.SHOPIFY_ACCESS_TOKEN,
    },
  });
}

exports.createOrder = async function ({ context, lineItems, email, shippingAddress, financialStatus }) {
    const client = getShopifyClient(context);

    const mutation = `
        mutation CreateOrder($order: OrderCreateOrderInput!) {
            orderCreate(order: $order) {
                order {
                    id
                    name
                }
                userErrors {
                    field
                    message
                }
            }
        }
    `;

    const variables = {
        order: {
            email,
            financialStatus,
            lineItems: lineItems.map(item => ({
                variantId: `gid://shopify/ProductVariant/${item.variantId}`,
                quantity: item.quantity,
        })),
        shippingAddress
        }
    };

    const response = await client.query({ data: { query: mutation, variables } });

    const result = response.body.data.orderCreate;

    if (result.userErrors.length > 0) {
        throw new Error(result.userErrors.map(e => e.message).join(', '));
    }

    return result.order;
};

exports.getOrderByName = async function (context, orderName) {
  const client = getShopifyClient(context);

  const query = `
    query GetOrderByName($query: String!) {
      orders(first: 1, query: $query) {
        edges {
          node {
            id
            name
            createdAt
            displayFinancialStatus
            displayFulfillmentStatus
            totalPriceSet {
              shopMoney {
                amount
                currencyCode
              }
            }
            lineItems(first: 10) {
              edges {
                node {
                  title
                  quantity
                  variant {
                    id
                    sku
                    price
                    product {
                      id
                      title
                    }
                  }
                  originalTotalSet {
                    shopMoney {
                      amount
                      currencyCode
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  const variables = {
    query: `name:${orderName}`
  };

  const response = await client.query({ data: { query, variables } });
  const edges = response.body.data.orders.edges;

  if (!edges.length) {
    throw new Error(`Order with name ${orderName} not found.`);
  }

  return edges[0].node;
};