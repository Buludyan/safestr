import {APIGatewayProxyResult} from 'aws-lambda';
import {CoreDynamoDb} from 'core';
import {InterfacesProjectSpecificInterfaces} from 'interfaces';
import {InterfacesProjectSpecificConstants} from 'interfaces';
import {CoreLog} from 'core';

export namespace BackEndHandshakeLambda {
  import ICounters = InterfacesProjectSpecificInterfaces.ICounters;
  import countersTypeGuard = InterfacesProjectSpecificInterfaces.countersTypeGuard;
  import newCounters = InterfacesProjectSpecificInterfaces.newCounters;
  import KeyValueStore = CoreDynamoDb.KeyValueStore;
  import countersDynamoTableName = InterfacesProjectSpecificConstants.countersDynamoTableName;
  import log = CoreLog.log;

  export const handshakeLambdaHandler =
    'dist/src/lambdasHandlers/handshake-lambda.BackEndHandshakeLambda.handshake';

  export const handshake = async (): Promise<APIGatewayProxyResult> => {
    try {
      const myTable = new KeyValueStore<ICounters>(
        countersDynamoTableName,
        countersTypeGuard
      );

      const token = 'example-token';
      const initialCounters: ICounters = newCounters();

      await myTable.putRecord(token, initialCounters);

      return {
        statusCode: 200,
        body: JSON.stringify(token),
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Content-Type': 'application/json',
        },
      };
    } catch (err) {
      log.error(JSON.stringify(err));
      return {
        statusCode: 515,
        body: `Internal Server Error\n${err}`,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Content-Type': 'application/json',
        },
      };
    }
  };
}
