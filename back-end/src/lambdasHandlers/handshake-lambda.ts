import {APIGatewayProxyResult} from 'aws-lambda';
import {CoreDynamoDb} from 'core';
import {InterfacesProjectSpecificInterfaces} from 'interfaces';
import {InterfacesProjectSpecificConstants} from 'interfaces';
import {CoreLog} from 'core';
import md5 = require('md5');

export namespace BackEndHandshakeLambda {
  import ICounter = InterfacesProjectSpecificInterfaces.ICounter;
  import counterTypeGuard = InterfacesProjectSpecificInterfaces.counterTypeGuard;
  import newCounter = InterfacesProjectSpecificInterfaces.newCounter;
  import newToken = InterfacesProjectSpecificInterfaces.newToken;
  import KeyValueStore = CoreDynamoDb.KeyValueStore;
  import counterDynamoTableName = InterfacesProjectSpecificConstants.counterDynamoTableName;
  import log = CoreLog.log;

  export const handshakeLambdaHandler =
    'dist/src/lambdasHandlers/handshake-lambda.BackEndHandshakeLambda.handshake';

  export const handshake = async (): Promise<APIGatewayProxyResult> => {
    try {
      const countersDynamoTable = new KeyValueStore<ICounter>(
        counterDynamoTableName,
        counterTypeGuard
      );

      // TODO: what if same millisecond?
      const token = md5(Date.now().toString());
      await countersDynamoTable.putRecord(token, newCounter());

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
