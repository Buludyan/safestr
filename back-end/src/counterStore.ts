import {CoreLog} from 'core';
import {AWSError} from 'aws-sdk/lib/error';
import * as AWS from 'aws-sdk';
import {CoreAwsCommonUtils} from 'core';
import {CoreCommonUtils} from 'core';
import {InterfacesProjectSpecificInterfaces} from 'interfaces';
import {CoreAwsService} from 'core';

export namespace BackEndCounterStore {
  import throwIfUndefined = CoreCommonUtils.throwIfUndefined;
  import makeSureThatXIs = CoreCommonUtils.makeSureThatXIs;
  import awsCommand = CoreAwsCommonUtils.awsCommand;
  import log = CoreLog.log;
  import AwsService = CoreAwsService.AwsService;
  import ICounters = InterfacesProjectSpecificInterfaces.ICounters;
  import countersTypeGuard = InterfacesProjectSpecificInterfaces.countersTypeGuard;
  import newCounters = InterfacesProjectSpecificInterfaces.newCounters;
  import ICounterIncrements = InterfacesProjectSpecificInterfaces.ICounterIncrements;

  const dynamoClient: AWS.DynamoDB = new AWS.DynamoDB({
    apiVersion: '2012-08-10',
    region: 'eu-central-1',
  });

  const dynamoDocClient: AWS.DynamoDB.DocumentClient =
    new AWS.DynamoDB.DocumentClient({
      apiVersion: '2012-08-10',
      region: 'eu-central-1',
    });

  export class CounterStore implements AwsService {
    constructor(private tableName: string) {}

    readonly construct = async (): Promise<void> => {
      return await awsCommand(
        async (): Promise<void> => {
          const createTableReq: AWS.DynamoDB.Types.CreateTableInput = {
            AttributeDefinitions: [
              {
                AttributeName: 'hashKey',
                AttributeType: 'S',
              },
            ],
            BillingMode: 'PROVISIONED',
            KeySchema: [
              {
                AttributeName: 'hashKey',
                KeyType: 'HASH',
              },
            ],
            ProvisionedThroughput: {
              ReadCapacityUnits: 1, //TODO: refine
              WriteCapacityUnits: 1,
            },
            TableClass: 'STANDARD',
            TableName: this.tableName,
          };

          await dynamoClient.createTable(createTableReq).promise();
          log.info(`Table ${this.tableName} is created`);
        },
        async (err: AWSError): Promise<void | null> => {
          if (err.code === 'ResourceInUseException') {
            log.info(`Table ${this.tableName} is already created`);
            return;
          }
          return null;
        }
      );
    };
    readonly destroy = async (): Promise<void> => {
      return await awsCommand(
        async (): Promise<void> => {
          const deleteTableReq: AWS.DynamoDB.Types.DeleteTableInput = {
            TableName: this.tableName,
          };

          await dynamoClient.deleteTable(deleteTableReq).promise();
          log.info(`Table ${this.tableName} is deleted`);
        },
        async (err: AWSError): Promise<void | null> => {
          if (err.code === 'ResourceNotFoundException') {
            log.info(`Table ${this.tableName} is not found`);
            return;
          }
          return null;
        }
      );
    };
    readonly init = async (hashKey: string): Promise<void> => {
      return await awsCommand(
        async (): Promise<void> => {
          const putItemInput: AWS.DynamoDB.DocumentClient.PutItemInput = {
            Item: {
              hashKey: hashKey,
              record: newCounters(),
            },
            TableName: this.tableName,
            ConditionExpression: 'not (attribute_exists(hashKey))',
          };

          await dynamoDocClient.put(putItemInput).promise();
          log.info(`Counters ${hashKey} is inserted`);
        },
        async (err: AWSError): Promise<void | null> => {
          if (err.code === 'ConditionalCheckFailedException') {
            log.error(`Item ${hashKey} is already existed`);
            return;
          }
          return null;
        }
      );
    };
    readonly getCounters = async (hashKey: string): Promise<ICounters> => {
      return await awsCommand(
        async (): Promise<ICounters> => {
          const getItemInput: AWS.DynamoDB.DocumentClient.GetItemInput = {
            Key: {
              hashKey: hashKey,
            },
            TableName: this.tableName,
          };

          const response = await dynamoDocClient.get(getItemInput).promise();
          log.info(`Successfully get ${JSON.stringify(response.Item)}`);
          throwIfUndefined(response.Item);
          const record = response.Item.record;
          makeSureThatXIs<ICounters>(record, countersTypeGuard);
          return record;
        },
        async (): Promise<ICounters | null> => {
          return null;
        }
      );
    };

    readonly incrementCounters = async (
      hashKey: string,
      countersIncrement: ICounterIncrements
    ): Promise<ICounters> => {
      return await awsCommand(
        async (): Promise<ICounters> => {
          log.info(
            `Incrementing item ${hashKey} with ${JSON.stringify(
              countersIncrement
            )}`
          );
          const updateItemReq: AWS.DynamoDB.DocumentClient.UpdateItemInput = {
            TableName: this.tableName,
            Key: {
              hashKey: hashKey,
            },
            UpdateExpression: `set #lastInfoJsonIndex = #lastInfoJsonIndex + :infoJsonIndexIncrement,
            #lastImageIndexToAdd = #lastImageIndexToAdd + :imageIndexIncrement,
            #lastProcessedImageIndex = #lastProcessedImageIndex + :processedImageIndexIncrement`,

            ExpressionAttributeNames: {
              '#lastInfoJsonIndex': 'lastInfoJsonIndex',
              '#lastImageIndexToAdd': 'lastImageIndexToAdd',
              '#lastProcessedImageIndex': 'lastProcessedImageIndex',
            },
            ExpressionAttributeValues: {
              ':infoJsonIndexIncrement':
                countersIncrement.infoJsonIndexIncrement,
              ':imageIndexIncrement': countersIncrement.imageIndexIncrement,
              ':processedImageIndexIncrement':
                countersIncrement.processedImageIndexIncrement,
            },
            ConditionExpression: 'attribute_exists(hashKey)',
            ReturnValues: 'ALL_NEW',
          };

          const response = await dynamoDocClient
            .update(updateItemReq)
            .promise();
          log.info(`Item ${hashKey} is incremented`);
          throwIfUndefined(response.Attributes);
          makeSureThatXIs<ICounters>(response.Attributes, countersTypeGuard);
          return response.Attributes;
        },
        async (): Promise<ICounters | null> => {
          return null;
        }
      );
    };
  }
}
