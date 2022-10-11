import {CoreLog} from './../utilities/log';
import * as AWS from 'aws-sdk';
import {AWSError} from 'aws-sdk/lib/error';
import {CoreAwsCommonUtils} from './aws-common-utils';
import {createReadStream} from 'fs';
import {CoreAwsService} from './aws-service';

export namespace CoreS3Bucket {
  import awsCommand = CoreAwsCommonUtils.awsCommand;
  import log = CoreLog.log;
  import AwsService = CoreAwsService.AwsService;

  const s3Client: AWS.S3 = new AWS.S3({
    apiVersion: '2006-03-01',
    region: 'eu-central-1',
  });

  export class S3Bucket implements AwsService {
    constructor(private bucketName: string) {}

    readonly construct = async () => {
      log.info(`Constructing S3 bucket ${this.bucketName}`);
      return await awsCommand(
        async (): Promise<void> => {
          const createBucketRequest: AWS.S3.CreateBucketRequest = {
            Bucket: this.bucketName,
          };

          await s3Client.createBucket(createBucketRequest).promise();
          log.info(`S3 bucket constructed ${this.bucketName}`);
        },
        async (err: AWSError): Promise<void | null> => {
          if (err.code === 'BucketAlreadyOwnedByYou') {
            log.error(
              `Bucket ${this.bucketName} already owned by you, skipping creation.`
            );
            return;
          }
          return null;
        }
      );
    };
    readonly destroy = async () => {
      log.info(`Destroying s3 bucket ${this.bucketName}`);
      return await awsCommand(
        async (): Promise<void> => {
          // TODO: check other parameters
          await s3Client.deleteBucket({Bucket: this.bucketName}).promise();
          log.info(`S3 bucket destroyed ${this.bucketName}`);
        },
        async (err: AWSError): Promise<void | null> => {
          if (err.code === 'NoSuchBucket') {
            log.error(
              `Bucket ${this.bucketName} does not exist, nothing to delete!`
            );
            return;
          }
          return null;
        }
      );
    };

    readonly sendFile = async (
      fileName: string,
      filePath: string,
      contentType: string,
      publicAccess: boolean
    ): Promise<void> => {
      log.info(`Sending file ${fileName} to s3 bucket ${this.bucketName}`);
      return await awsCommand(
        async (): Promise<void> => {
          const fileBody = createReadStream(filePath);
          const putObjectReq: AWS.S3.PutObjectRequest = {
            Bucket: this.bucketName,
            Key: fileName,
            Body: fileBody,
            ContentType: contentType,
            ACL: publicAccess ? 'public-read' : 'bucket-owner-full-control',
          };
          await s3Client.putObject(putObjectReq).promise();

          log.info(`File sent ${fileName} to s3 bucket ${this.bucketName}`);
        },
        async (): Promise<void | null> => {
          return null;
        }
      );
    };

    readonly setAclToFile = async (
      fileName: string,
      publicAccess: boolean
    ): Promise<void> => {
      log.info(
        `Setting file ${fileName} ACL permissions, publicAccess=${publicAccess}`
      );
      return await awsCommand(
        async (): Promise<void> => {
          const putObjectReq: AWS.S3.PutObjectAclRequest = {
            Bucket: this.bucketName,
            Key: fileName,
            ACL: publicAccess ? 'public-read' : 'bucket-owner-full-control',
          };
          await s3Client.putObjectAcl(putObjectReq).promise();

          log.info(`File ${fileName} permissions set`);
        },
        async (): Promise<void | null> => {
          return null;
        }
      );
    };

    readonly getFile = async (
      fileName: string,
      changeNameTo: string
    ): Promise<string | null> => {
      log.info(`Getting file ${fileName} from S3 bucket ${this.bucketName}`);
      return await awsCommand(
        async (): Promise<string> => {
          // TODO: check other parameters
          const getObjectReq: AWS.S3.GetObjectRequest = {
            Bucket: this.bucketName,
            Key: fileName,
            ResponseContentDisposition: `attachment; filename=${changeNameTo}`,
          };
          const response = await s3Client.getObject(getObjectReq).promise();
          log.info(`File ${fileName} got from S3 bucket ${this.bucketName}`);
          // TODO: refine this
          return response.Body as string;
        },
        async (): Promise<string | null> => {
          return null;
        }
      );
    };

    readonly isFilePresent = async (fileName: string): Promise<boolean> => {
      log.info(`Asking s3 for file ${this.bucketName}/${fileName} presence`);
      return await awsCommand(
        async (): Promise<boolean> => {
          const getObjectReq: AWS.S3.GetObjectRequest = {
            Bucket: this.bucketName,
            Key: fileName,
          };
          const response = await s3Client.getObject(getObjectReq).promise();
          log.info(`File ${fileName} got from S3 bucket ${this.bucketName}`);
          // TODO: refine this
          return true;
        },
        async (err: AWSError): Promise<boolean | null> => {
          if (err.code === 'NoSuchKey') {
            return false;
          }
          return null;
        }
      );
    };

    readonly getSignedURL = async (
      fileName: string,
      changeNameTo: string
    ): Promise<string> => {
      log.info(`Getting file ${fileName} from S3 bucket ${this.bucketName}`);
      return await awsCommand(
        async (): Promise<string> => {
          const getObjectReq: AWS.S3.GetObjectRequest = {
            Bucket: this.bucketName,
            Key: fileName,
            ResponseContentDisposition: `attachment; filename=${changeNameTo}`,
          };
          const url = await s3Client.getSignedUrl('getObject', getObjectReq);
          log.info(`File ${fileName} S3 URL is ${url}`);
          return url;
        },
        async (): Promise<string | null> => {
          return null;
        }
      );
    };

    readonly getArn = async (): Promise<string> => {
      return `arn:aws:s3:::${this.bucketName}`;
    };

    readonly setCors = async (methods: ('PUT' | 'GET')[]): Promise<void> => {
      log.info(`Setting CORS for S3 bucket ${this.bucketName}`);
      return await awsCommand(
        async (): Promise<void> => {
          const putBucketCorsReq: AWS.S3.PutBucketCorsRequest = {
            Bucket: this.bucketName,
            CORSConfiguration: {
              CORSRules: [
                {
                  AllowedHeaders: ['*'],
                  AllowedMethods: [...methods],
                  AllowedOrigins: ['*'],
                },
              ],
            },
          };
          await s3Client.putBucketCors(putBucketCorsReq).promise();
          log.info(`CORS for S3 is set`);
        },
        async (): Promise<void | null> => {
          return null;
        }
      );
    };
  }
}
