import { middyfy } from '@libs/lambda';

const AWS = require("aws-sdk");

const imagesTable = process.env.IMAGES_TABLE;
const indexName = process.env.INDEX_NAME;

const docClient = new AWS.DynamoDB.DocumentClient();


const createGroup = async (event) => {
  console.log("executing the function");
  
  
  const imageId = event.pathParameters.imageId
  
  const image = await docClient.query({
    TableName: imagesTable,
    IndexName: indexName,
    KeyConditionExpression: 'id = :imageId',
    ExpressionAttributeValues: {
      ":imageId": imageId
    }
  }).promise();

  if(image.Items.size == 0) {
    return {
      statusCode: 404,
      headers: {
          "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({error: `The image id ${imageId} cannot be found.`})
    }
  }
  
  return {
      statusCode: 200,
      headers: {
          "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({items: image.Items[0]})
  }
};

export const main = middyfy(createGroup);
