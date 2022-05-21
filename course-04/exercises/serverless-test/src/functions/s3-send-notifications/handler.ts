import { middyfy } from '@libs/lambda';
import { S3Handler, S3Event } from 'aws-lambda';

const s3SendNotification: S3Handler = async (event: S3Event) => {
  for(const record of event.Records) {
    const key = record.s3.object.key
    console.log("Processing item with key " + key)
  }
};

export const main = middyfy(s3SendNotification);
