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

    const { date, time, type, customer_record_id} = event;
    const [year, month, day] = date.split('-');
    const [hours, minutes] = time.split(':');

    const constructedDate = new Date(Date.UTC(year, month - 1, day, hours, minutes));

    console.log(constructedDate);

    try {
        const newVisitRecord = {
          
            apartment: [ 'recyE9XUoO0igJRpL' ],
            customer: [ customer_record_id ],
            status: 'Confirmed',
            visit_date: constructedDate,
            visit_type: type

        }
        
      const visit = await base('Visits').create(newVisitRecord);

      console.log('Visit created: ', visit);

      return callback(null, visit);


    } catch (err) {
      console.error(err);
      return callback(new Error("Failed to record visit"));
    }
  
    
  };

  