import { formatJSONResponse } from '@libs/api-gateway';

const AWS = require('aws-sdk')

const docClient = new AWS.DynamoDB.DocumentClient()

const groupsTable = process.env.GROUPS_TABLE

const getGroups = async (event) => {
  console.log('Processing event: ', event)

  const scanParams = {
    TableName: groupsTable,
    Limit: getQueryParameter(event, "limit"),
    ExclusiveStartKey: decodeKey(getQueryParameter(event, "nextKey"))
  }

  console.log("Next key: " + scanParams.ExclusiveStartKey);

  if(scanParams.Limit < 1) {
    return badRequest("Limit must be greater than 0.");
  }

  console.log('Scan params: ', scanParams)
  let items = [];

  /*
    * Limit and nextKey optional
    * several scans from the previos scan to read all (until limit)
    * stop condition
    * accumulation of items
  */

  do {
    const result = await docClient.scan(scanParams).promise()

    items.push(result.Items);
    scanParams.ExclusiveStartKey = result.LastEvaluatedKey;
    
    if(scanParams.Limit) {
      scanParams.Limit -= result.Items.size;
    }

    console.log('Result: ', result)
  } while(scanParams.ExclusiveStartKey != null && scanParams.Limit > 0);

  // Return result
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      items,
      // Encode the JSON object so a client can return it in a URL as is
      nextKey: encodeNextKey(scanParams.ExclusiveStartKey)
    })
  }
};

function getQueryParameter(event, name) {
  const queryParams = event.queryStringParameters
  if (!queryParams) {
    return undefined
  }

  return queryParams[name]
}

/**
 * Encode last evaluated key using
 *
 * @param {Object} lastEvaluatedKey a JS object that represents last evaluated key
 *
 * @return {string} URI encoded last evaluated key
 */
function encodeNextKey(lastEvaluatedKey) {
  if (!lastEvaluatedKey) {
    return null
  }

  return encodeURIComponent(JSON.stringify(lastEvaluatedKey))
}

function decodeKey(key) {
  if (key) {
    return JSON.parse(decodeURIComponent(key));
  }
}

function badRequest(msg) {
  return {
    statusCode: 400,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      errorMessage: msg
    })
  }
}


export const main = getGroups;
