import { aws_lambda_nodejs as lambda } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { join } from 'path';
import { Runtime } from 'aws-cdk-lib/aws-lambda';

import { ChannelsResourceConfig, DefaultLambdaParams } from '../../constants';

interface ChannelsCognitoTriggersProps extends ChannelsResourceConfig {
  defaultLambdaParams?: DefaultLambdaParams;
}

const getCognitoLambdaTriggersEntryPath = (functionName: string) =>
  join(__dirname, '../../../lambdas', 'cognitoTriggers', `${functionName}.ts`);

export default class ChannelsCognitoTriggers extends Construct {
  public readonly customMessageLambda: lambda.NodejsFunction;
  public readonly preAuthenticationLambda: lambda.NodejsFunction;
  public readonly preSignUpLambda: lambda.NodejsFunction | undefined;

  constructor(
    scope: Construct,
    id: string,
    props: ChannelsCognitoTriggersProps
  ) {
    super(scope, id);

    const { enableUserAutoVerify, clientBaseUrl, defaultLambdaParams } = props;

    // Lambda to auto verify new users, not suitable for production
    let preSignUpLambda;

    if (enableUserAutoVerify) {
      preSignUpLambda = new lambda.NodejsFunction(this, 'PreSignUpLambda', {
        ...defaultLambdaParams,
        entry: getCognitoLambdaTriggersEntryPath('preSignUp'),
        environment: { ENABLE_USER_AUTO_VERIFY: `${enableUserAutoVerify}` }
      });
    }

    this.preSignUpLambda = preSignUpLambda;

    const customMessageLambda = new lambda.NodejsFunction(
      this,
      'CustomMessageLambda',
      {
        ...defaultLambdaParams,
        entry: getCognitoLambdaTriggersEntryPath('customMessage'),
        environment: {
          CLIENT_BASE_URL: clientBaseUrl
        }
      }
    );

    this.customMessageLambda = customMessageLambda;

    let preAuthenticationLambda = new lambda.NodejsFunction(
      this,
      'PreAuthenticationLambda',
      {
        ...defaultLambdaParams,
        entry: getCognitoLambdaTriggersEntryPath('preAuthentication')
      }
    );

    this.preAuthenticationLambda = preAuthenticationLambda;
  }
}
