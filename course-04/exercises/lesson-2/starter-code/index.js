'use strict'

const AWS = require('aws-sdk')

const docClient = new AWS.DynamoDB.DocumentClient()

const groupsTable = process.env.GROUPS_TABLE

exports.handler = async (event) => {
  console.log('Processing event: ', event)

  // TODO: Read and parse "limit" and "nextKey" parameters from query parameters
  // let nextKey // Next key to continue scan operation if necessary
  // let limit // Maximum number of elements to return

  // HINT: You might find the following method useful to get an incoming parameter value
  // getQueryParameter(event, 'param')

  // TODO: Return 400 error if parameters are invalid
  
  // Scan operation parameters
  const scanParams = {
    TableName: groupsTable,
    Limit: getQueryParameter(event, "limit"),
    ExclusiveStartKey: decode(getQueryParameter(event, "nextKey"))
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
    scanParams.ExclusiveStartKey = result.nextKey;
    
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
}

/**
 * Get a query parameter or return "undefined"
 *
 * @param {Object} event HTTP event passed to a Lambda function
 * @param {string} name a name of a query parameter to return
 *
 * @returns {string} a value of a query parameter value or "undefined" if a parameter is not defined
 */
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
