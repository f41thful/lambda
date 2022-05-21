import { middyfy } from '@libs/lambda';

const AWS = require("aws-sdk");

const imagesTable = process.env.IMAGES_TABLE;
const groupsTable = process.env.GROUPS_TABLE;

const docClient = new AWS.DynamoDB.DocumentClient();


const createGroup = async (event) => {
  console.log("executing the function");
  
  
  const groupId = event.pathParameters.groupId

  const group = await docClient.get({
      TableName: groupsTable,
      Key: {
        id: groupId
      }
  }).promise();

  
  if(group.Item == null) {
    return {
      statusCode: 404,
      headers: {
          "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({error: `Group id ${groupId} not found`})
    };
  }
  

  const images = await docClient.query({
    TableName: imagesTable,
    KeyConditionExpression: 'groupId = :groupId',
    ExpressionAttributeValues: {
      ":groupId": groupId
    }
}).promise();

  
  const response = {
      statusCode: 200,
      headers: {
          "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({items: images.Items})
  };
  return response;
};

export const main = middyfy(createGroup);
