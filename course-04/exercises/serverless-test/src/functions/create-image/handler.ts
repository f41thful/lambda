import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';


import { middyfy } from '@libs/lambda';

import schema from './schema';

const uuid = require('uuid');
const AWS = require("aws-sdk");

const docClient = new AWS.DynamoDB.DocumentClient();
console.log("executing the script");
console.log("Generating id: " + uuid.v4());

const groupsTable = process.env.GROUPS_TABLE
const imagesTable = process.env.IMAGES_TABLE
const bucketName = process.env.IMAGES_S3_BUCKET
const expirationTime = parseInt(process.env.SIGNED_URL_EXPIRATION)

const s3 = new AWS.S3({
  signatureVersion: 'v4' // Use Sigv4 algorithm
})

const createGroup: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
  console.log("executing the function");

  const group = await docClient.get({
    TableName: groupsTable,
    Key: {
      id: event.body.groupId
    }
  }).promise()

  if(group.Item == null) {
    return {
      statusCode: 409,
      headers: {
          "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({error: `The group ${event.body.groupId} does not exist.`})      
    }
  }
    
  const itemId = uuid.v4()

  const item = {
    id: itemId,
    ...event.body,
    imageUrl: `https://${bucketName}.s3.amazonaws.com/${itemId}`
  };

  await docClient.put({
      TableName: imagesTable,
      Item: item
  }).promise();
  
  return {
      statusCode: 201,
      headers: {
          "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({item, uploadUrl: getUploadUrl(item.id)})
  };
};

function getUploadUrl(imageId) {
  return s3.getSignedUrl('putObject', { 
    Bucket: bucketName, 
    Key: imageId,
    Expires: expirationTime 
  })
 
}

export const main = middyfy(createGroup);
