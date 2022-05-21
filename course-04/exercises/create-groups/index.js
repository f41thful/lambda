
const uuid = require('uuid');
const AWS = require("aws-sdk");

const docClient = new AWS.DynamoDB.DocumentClient();
console.log("executing the script");
console.log("Generating id: " + uuid.v4());

exports.handler = async (event) => {
    console.log("executing the function");
    
    const body = JSON.parse(event.body);
    const item = {
      id: uuid.v4(),
      ...body
    };

    await docClient.put({
        TableName: process.env.GROUP_TABLE,
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