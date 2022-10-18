import * as AWS from 'aws-sdk';
import {CoreLog} from '../utilities/log';
import {CoreCommonUtils} from '../utilities/common-utils';
import {CoreAwsCommonUtils} from './aws-common-utils';
import {CoreAwsService} from './aws-service';

export namespace CoreRekognition {
  import awsCommand = CoreAwsCommonUtils.awsCommand;
  import log = CoreLog.log;
  import AwsService = CoreAwsService.AwsService;
  import throwIfUndefined = CoreCommonUtils.throwIfUndefined;

  const rekognitionClient: AWS.Rekognition = new AWS.Rekognition({
    apiVersion: '2016-06-27',
    region: 'eu-central-1',
  });

  interface DetectProtectiveEquipmentPersonInfo {
    faceCovered: boolean;
    headCovered: boolean;
    leftHandCovered: boolean;
    rightHandCovered: boolean;
    personDetected: boolean;
  }

  export interface DetectProtectiveEquipmentResult {
    readonly persons: DetectProtectiveEquipmentPersonInfo[];
  }

  const handleMinConfidence = (
    bodyPart: AWS.Rekognition.ProtectiveEquipmentBodyPart,
    minConfidence: number
  ) => {
    throwIfUndefined(bodyPart.EquipmentDetections);
    return (
      bodyPart.EquipmentDetections.map(eq => {
        throwIfUndefined(eq.Confidence);
        if (eq.Confidence >= minConfidence) {
          return true;
        }
        return false;
      }).filter(el => el === true).length > 0
    );
  };

  export class Rekognition implements AwsService {
    constructor() {}
    readonly construct = async (): Promise<void> => {};
    readonly destroy = async (): Promise<void> => {};

    readonly detectProtectiveEquipment = async (
      imageContent: Buffer,
      requiredEquipmentTypes: ('FACE_COVER' | 'HAND_COVER' | 'HEAD_COVER')[],
      minConfidence: number
    ): Promise<DetectProtectiveEquipmentResult> => {
      return await awsCommand(
        async (): Promise<DetectProtectiveEquipmentResult> => {
          const ppeRequest: AWS.Rekognition.DetectProtectiveEquipmentRequest = {
            Image: {
              Bytes: imageContent,
            },
            SummarizationAttributes: {
              RequiredEquipmentTypes: requiredEquipmentTypes,
              MinConfidence: minConfidence,
            },
          };
          const response = await rekognitionClient
            .detectProtectiveEquipment(ppeRequest)
            .promise();
          log.info(JSON.stringify(response));
          throwIfUndefined(response.Persons);
          return {
            persons: response.Persons.map(
              (person): DetectProtectiveEquipmentPersonInfo => {
                const personInfo: DetectProtectiveEquipmentPersonInfo = {
                  faceCovered: false,
                  headCovered: false,
                  leftHandCovered: false,
                  rightHandCovered: false,
                  personDetected: false,
                };
                throwIfUndefined(person.Confidence);
                if (person.Confidence <= 30) {
                  return personInfo;
                }
                personInfo.personDetected = true;
                throwIfUndefined(person.BodyParts);
                person.BodyParts.forEach(bodyPart => {
                  throwIfUndefined(bodyPart.Name);
                  throwIfUndefined(bodyPart.EquipmentDetections);
                  if (bodyPart.Name === 'FACE') {
                    personInfo.faceCovered = handleMinConfidence(
                      bodyPart,
                      minConfidence
                    );
                  } else if (bodyPart.Name === 'HEAD') {
                    personInfo.headCovered = handleMinConfidence(
                      bodyPart,
                      minConfidence
                    );
                  } else if (bodyPart.Name === 'LEFT_HAND') {
                    personInfo.leftHandCovered = handleMinConfidence(
                      bodyPart,
                      minConfidence
                    );
                  } else if (bodyPart.Name === 'RIGHT_HAND') {
                    personInfo.rightHandCovered = handleMinConfidence(
                      bodyPart,
                      minConfidence
                    );
                  }
                });
                return personInfo;
              }
            ),
          };
        },
        async (): Promise<DetectProtectiveEquipmentResult | null> => {
          return null;
        }
      );
    };
  }
}
