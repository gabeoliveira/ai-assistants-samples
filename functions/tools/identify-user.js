const Airtable = require('airtable');

/**
 * @param {import('@twilio-labs/serverless-runtime-types/types').Context} context
 * @param {{}} event
 * @param {import('@twilio-labs/serverless-runtime-types/types').ServerlessCallback} callback
 */
exports.handler = async function (context, event, callback) {
    // Configure Airtable
    const base = new Airtable({ apiKey: context.AIRTABLE_API_KEY }).base(context.AIRTABLE_BASE_ID);

    console.log(event);

    const { identity } = event;

    try {
      const records = await base('Customers').select({
        filterByFormula: `{whatsapp} = '${identity}'`
      }).firstPage();

      if (records.length > 0) {
        console.log('Records found');
        const returnData = {
            ...records[0].fields,
            customer_record_id: records[0].id
        }
        return callback(null, returnData);
       

      } else {
        console.log('No record found with the given id.');
        return callback(null,"No user was found. This is a new user");
      }

    } catch (err) {
      console.error(err);
      return callback(new Error("Failed to fetch visits"));
    }
  
    
  };
  