import {
  aws_lambda_event_sources as eventSources,
  aws_lambda_nodejs as lambda,
  aws_sqs as sqs,
  Duration,
  RemovalPolicy
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { join } from 'path';

import { defaultLambdaParams } from '../constants';

type FunctionProps = lambda.NodejsFunctionProps & {
  entryFunctionName: string;
  eventSourceProps?: eventSources.SqsEventSourceProps;
};

interface SQSLambdaTriggerProps {
  name: string;
  srcHandler: FunctionProps;
  dlqHandler: FunctionProps;
  srcQueueProps?: sqs.QueueProps;
  dlqQueueProps?: sqs.QueueProps;
}

const getLambdaEntryPath = (functionName: string) =>
  join(__dirname, '../../lambdas', `${functionName}.ts`);

/**
 * A construct that uses a Lambda function to process messages in an
 * Amazon Simple Queue Service (Amazon SQS) queue
 *
 * Lambda polls the SQS queue and invokes a Lambda function (srcLambda)
 * synchronously with an event containing queue messages. Lambda reads SQS
 * messages in batches and invokes a function instance for each batch. When
 * the function successfully processes a batch of messages, Lambda deletes
 * those messages from the queue.
 *
 * Failed messages are delivered back and made visible in the source queue
 * for a preset count (maxReceiveCount). When the ReceiveCount for a message
 * exceeds the maxReceiveCount for a queue, the message is moved to a dead-
 * letter queue where another Lambda function (dlqLambda) is triggered to
 * isolate problematic messages and determine why they are failing.
 */
export default class SQSLambdaTrigger extends Construct {
  public readonly srcLambda: lambda.NodejsFunction;
  public readonly dlqLambda: lambda.NodejsFunction;
  public readonly srcQueue: sqs.IQueue;
  public readonly dlqQueue: sqs.IQueue;

  constructor(scope: Construct, id: string, props: SQSLambdaTriggerProps) {
    super(scope, id);

    const {
      name,
      srcHandler: {
        entry: srcHandlerEntry,
        entryFunctionName: srcHandlerEntryFunctionName,
        eventSourceProps: srcEventSourceProps,
        ...srcHandlerProps
      },
      dlqHandler: {
        entry: dlqHandlerEntry,
        entryFunctionName: dlqHandlerEntryFunctionName,
        eventSourceProps: dlqEventSourceProps,
        ...dlqHandlerProps
      },
      srcQueueProps,
      dlqQueueProps
    } = props;
    const srcId = `${name}-Src`;
    const dlqId = `${name}-Dlq`;

    /**
     * Lambda Triggers
     */

    // Source Queue Lambda Trigger
    this.srcLambda = new lambda.NodejsFunction(this, `${srcId}-Lambda`, {
      ...defaultLambdaParams,
      functionName: `${srcId}-handler`,
      entry: srcHandlerEntry || getLambdaEntryPath(srcHandlerEntryFunctionName),
      description:
        'Triggered by Amazon SQS when new messages arrive in the queue',
      logRetention: 7,
      ...srcHandlerProps
    });
    // Dead-letter Queue Lambda Trigger
    this.dlqLambda = new lambda.NodejsFunction(this, `${dlqId}-Lambda`, {
      ...defaultLambdaParams,
      functionName: `${dlqId}-handler`,
      entry: dlqHandlerEntry || getLambdaEntryPath(dlqHandlerEntryFunctionName),
      description:
        'Triggered by Amazon SQS to handle message consumption failures and gracefully manage the life cycle of unconsumed messages',
      logRetention: 14,
      ...dlqHandlerProps
    });

    /**
     * Queues
     *
     * long-polling (recommended): receiveMessageWaitTime > 0 seconds
     * - the ReceiveMessage request queries all servers for messages (reduces false empty responses)
     * - SQS sends a response after it collects at least one available message (reduces empty responses)
     * - SQS sends an empty response only if the polling wait time expires
     */

    /**
     * Compute recommended queue and batching durations.
     *
     * These values are sensitive to changes as there are certain conditions that must be met between them.
     * For example, if the retention period of an SQS event is less than the visibility timeout, then the
     * event will expire before it can be received again by a consumer. This is because if a consumer has
     * indicated it wants to retry processing the event by reporting it as a batchItemFailure, then the
     * visibility timeout must first run out before it can receive it again.
     */
    const srcLambdaTimeoutInSeconds = this.srcLambda.timeout?.toSeconds() || 3;
    const maxBatchingWindowInSeconds = 0; // Invoke immediately with the SQS messages that are available
    const visibilityTimeoutInSeconds =
      6 * srcLambdaTimeoutInSeconds + maxBatchingWindowInSeconds;
    const maxReceiveCount = 5;
    const retentionPeriodInSeconds =
      maxReceiveCount * visibilityTimeoutInSeconds + 5; // message expiration + 5-second overhead

    const maxBatchingWindow = Duration.seconds(maxBatchingWindowInSeconds);
    const visibilityTimeout = Duration.seconds(visibilityTimeoutInSeconds);
    const retentionPeriod = Duration.seconds(retentionPeriodInSeconds);

    const defaultQueueProps = {
      receiveMessageWaitTime: Duration.seconds(20),
      removalPolicy: RemovalPolicy.DESTROY,
      retentionPeriod
    };
    // Dead-letter Queue
    this.dlqQueue = new sqs.Queue(this, `${dlqId}-Queue`, {
      ...defaultQueueProps,
      queueName: dlqId,
      ...dlqQueueProps
    });
    // Source Queue
    this.srcQueue = new sqs.Queue(this, `${srcId}-Queue`, {
      ...defaultQueueProps,
      queueName: srcId,
      visibilityTimeout,
      deadLetterQueue: {
        maxReceiveCount: 5, // maxReceiveCount allows for throttled messages to get processed after a burst of messages
        queue: this.dlqQueue
      },
      ...srcQueueProps
    });

    // Add the Source Queue and DLQ as Event Sources to the Lambda function handlers
    const defaultEventSourceProps = {
      batchSize: 10, // Process SQS messages in batches of 10
      maxBatchingWindow
    };
    this.srcLambda.addEventSource(
      new eventSources.SqsEventSource(this.srcQueue, {
        ...defaultEventSourceProps,
        reportBatchItemFailures: true, // Allows the source Lambda to return a partial success by making only the failed messages visible again
        ...srcEventSourceProps
      })
    );
    this.dlqLambda.addEventSource(
      new eventSources.SqsEventSource(this.dlqQueue, {
        ...defaultEventSourceProps,
        ...dlqEventSourceProps
      })
    );
  }
}
