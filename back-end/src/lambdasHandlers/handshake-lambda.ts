import {APIGatewayProxyResult} from 'aws-lambda';
import {CoreDynamoDb} from 'core';
import {InterfacesProjectSpecificInterfaces} from 'interfaces';
import {InterfacesProjectSpecificConstants} from 'interfaces';
import {CoreLog} from 'core';
import md5 = require('md5');

export namespace BackEndHandshakeLambda {
  import ICounters = InterfacesProjectSpecificInterfaces.ICounters;
  import countersTypeGuard = InterfacesProjectSpecificInterfaces.countersTypeGuard;
  import newCounters = InterfacesProjectSpecificInterfaces.newCounters;
  import newToken = InterfacesProjectSpecificInterfaces.newToken;
  import KeyValueStore = CoreDynamoDb.KeyValueStore;
  import countersDynamoTableName = InterfacesProjectSpecificConstants.countersDynamoTableName;
  import log = CoreLog.log;

  export const handshakeLambdaHandler =
    'dist/src/lambdasHandlers/handshake-lambda.BackEndHandshakeLambda.handshake';

  export const handshake = async (): Promise<APIGatewayProxyResult> => {
    try {
      const countersDynamoTable = new KeyValueStore<ICounters>(
        countersDynamoTableName,
        countersTypeGuard
      );

      // TODO: what if same millisecond?
      const token = md5(Date.now().toString());
      await countersDynamoTable.putRecord(token, newCounters());

      return {
        statusCode: 200,
        body: JSON.stringify(newToken(token)),
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
