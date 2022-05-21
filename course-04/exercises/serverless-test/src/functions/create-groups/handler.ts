import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';


import { middyfy } from '@libs/lambda';

import schema from './schema';

const uuid = require('uuid');
const AWS = require("aws-sdk");

const docClient = new AWS.DynamoDB.DocumentClient();
console.log("executing the script");
console.log("Generating id: " + uuid.v4());


const createGroup: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
  console.log("executing the function");
    
  const item = {
    id: uuid.v4(),
    ...event.body
  };

  await docClient.put({
      TableName: process.env.GROUPS_TABLE,
      Item: item
  }).promise();
  
  const response = {
      statusCode: 201,
      headers: {
          "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify(item)
  };
  return response;
};

export const main = middyfy(createGroup);
