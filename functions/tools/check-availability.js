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

    const { date, time, type} = event;
    const [year, month, day] = date.split('-');
    const [hours, minutes] = time.split(':');

    const constructedDate = new Date(Date.UTC(year, month - 1, day, parseInt(hours) + 3 , minutes));

    console.log(constructedDate);


    try {
      const records = await base('Visits').select({
        filterByFormula: `{apartment_id} = '100001'`
      }).firstPage();

      if (records.length > 0) {
        console.log('Records found');
        const conflictVisit = records.find(record => {
            const visitDate = new Date(record.fields.visit_date);
            console.log(record.fields.visit_date);
            console.log(visitDate);
            return visitDate.getTime() === constructedDate.getTime();
            
        });

        if(conflictVisit) return callback(null, "The apartment isn't available at this time");
        else return callback(null, "The apartment is available for visiting at this time");

      } else {
        console.log('No record found with the given id.');
      }

    } catch (err) {
      console.error(err);
      return callback(new Error("Failed to fetch visits"));
    }
  
    
  };
  