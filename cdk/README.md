# Backend

For more information about deploying the backend stack, refer to the [README file](../README.md#deployment) at the root of the repository.

## Seeding channel and stream data

From the `cdk` directory, run the following command to start seeding channel and stream data:

```shell
make seed
```

This command will create the default amount (50) of mock channels. Each channel has one mock stream associated with it. When the stack name isn't specified, the command `make seed` will look for a stack named `UGC-dev` and, if the stack exists, add seeded data in the stack's DynamoDB tables. You can specify a stack by setting the `STACK` environment variable to your specified stack name. For instance, to seed data into a stack named "my-stack", run the following command:

```shell
make seed STACK=my-stack
```

Furthermore, if you want to specify the amount of data that should be seeded, you can run the command using the `SEED_COUNT` environment variable:

```shell
make seed SEED_COUNT=10
```

The command above will generate 10 new channels that have 1 stream each. By default, out of the 10 channels, 1 will be an offline channel, meaning that the stream associated with this channel will have an end time. The remaining channels will be live ones that have no end time. In the case where you need to control the amount of live and offline channels created, the seed command can be run using the `OFFLINE_SESSION_COUNT` environment variable:

```shell
make seed OFFLINE_SESSION_COUNT=20
```

The outcome of the seed command above is 50 new channels and streams, 20 of these channels are offline channels. In cases where full control of the data is necessary, you can use a JSON file as a means to create data. Use the `JSON` environment variable to specify the relative path to the JSON file and create custom seed data:

```shell
make seed JSON=./seed.example.json
```

***NOTE:** Please refer to the [seed.example.json file](./seed.example.json) so that you may create data that the DynamoDB client can use. Incorrect JSON data will lead to errors when seeding.*

All the environment variables can be used together to generate mock data that suites your needs:

```shell
make seed SEED_COUNT=40 OFFLINE_SESSION_COUNT=10 JSON=./custom_mock_data.json
```

The example seed command above will always generate 40 seeded data in the following amounts:
- First of the total 40 items will consist of mock data generated from the provided JSON file
- The next 10 items will consist of randomly generated offline stream sessions
- The remaining items will consist of randomly generated live-stream sessions

## Deleting seeded data

From the `cdk` directory, run the following command to delete all seeded channel and stream data:

```shell
make deleteSeed
```

By default, the command `make deleteSeed` will look for a stack named `UGC-dev` and delete seeded data from the stack. You can specify a stack by setting the `STACK` environment variable to your specified stack name. For instance, to delete seed data from a stack named "my-stack", run the following command:

```shell
make deleteSeed STACK=my-stack
```

## Fargate service auto scaling

The ECS Fargate service utilizes a target tracking scaling policy to dynamically adjust its capacity based on a CPU utilization target value. This approach allows it to scale out and accommodate peak traffic, ensuring optimal performance. Additionally, during periods of low utilization, the service scales in to reduce costs and optimize resource allocation. For more information, you can refer to the [target tracking scaling policy documentation](https://docs.aws.amazon.com/autoscaling/application/userguide/application-auto-scaling-target-tracking.html).

### Service auto scaling alarms

Service Auto Scaling automatically creates and manages CloudWatch alarms for your target tracking scaling policies. These alarms are responsible for monitoring metrics such as CPU utilization. When the metric falls below the target value, an alarm is triggered, prompting the service to automatically scale down and adjust the capacity accordingly. Furthermore, when these alarms are no longer necessary, Application Auto Scaling deletes them.

For this reason, please do not create, edit, or delete the CloudWatch alarms that are used with a target tracking scaling policy.

To learn how to hide auto scaling alarms, please consult the "Hide Auto Scaling alarms" user guide available at: [Hide Auto Scaling alarms user guide](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/hide-autoscaling-alarms.html).

## Stream events API

Amazon IVS sends change events about the status of your streams to Amazon EventBridge. The Stream Events API is an EventBridge rule that updates the DynamoDB Streams table for the UGC application.

When the postStreamEvents function receives an event with a `session created` event name, any existing live stream session in the same channel is updated to offline by removing the `isOpen` attribute from the corresponding DynamoDB record. This logic ensures that a channel cannot have more than one live stream session simultaneously. Subsequently, the new stream session is saved with the `isOpen` attribute set to true.

When a `session ended` event is received, the corresponding stream record is grabbed and updated by removing the `isOpen` attribute.

You can find the Stream events API code in the `/streamEventsApi` folder.

## Scheduled resource cleanup AWS Lambdas

The scheduled resource cleanup lambdas are created when the stack is deployed. No additional steps are necessary to set up and trigger these functions. The lambda functions exist in the `cdk/lambdas` folder. The schedule can be customized in the `cdk/Makefile`. AWS Lambda supports standard rate and cron expressions for frequencies of up to once per minute. Read more about [schedule expressions using rate or cron](https://docs.aws.amazon.com/lambda/latest/dg/services-cloudwatchevents-expressions.html).

### Amazon IVS idle stages cleanup

The cleanup lambda function follows these steps:
1. It retrieves a list of all stages
2. The `getIdleStageArn` helper function is employed to filter out idle stages that have been in existence for at least 1 hour
3. Subsequently, the filtered idle stages are deleted.

### Amazon Cognito unverified users cleanup

The cleanup lambda function follows these steps:
1. It retrieves a list of users with a `UNCONFIRMED` status
2. Within the unconfirmed users, we filter for users that have existed for at least 24 hours
3. Finally, the filtered unverified and expired users are deleted both from the Cognito user pool and AWS DynamoDB channels table.


## Amazon IVS Real-time host disconnect event handler

Amazon IVS host disconnect event cleanup is designed to delete active stages for which hosts have been disconnected from the session for at least 3 minutes. Upon a host's disconnection from a stage, the responsible endpoint follows these steps:
1. Extracts the host's channel ID from the request body, accommodating both object and JSON string formats
2. It retrieves the corresponding host details, including the stage and session, and formats them into a message body
3. This structured data is sent to an Amazon SQS queue for additional processing. It's important to highlight that the message comes with a 3-minute delay, allowing the host sufficient time to rejoin if they choose to
4. After 3-minute wait time, SQS triggers deleteStage lambda function.

### Amazon IVS Real-time host disconnect event cleanup triggers

This flow is triggered by:
1. Beacon API [Beacon API documention](https://developer.mozilla.org/en-US/docs/Web/API/Beacon_API)
2. Stage participantConnectionChangedEvent event [STAGE_CONNECTION_STATE_CHANGED](https://aws.github.io/amazon-ivs-web-broadcast/docs/sdk-reference/enums/StageEvents#stage_connection_state_changed)
3. EventBridge
4. SQS [Amazon FIFO SQS](#amazon-fifo-sqs)

### Amazon IVS real-time host disconnect event lambda cleanup

The cleanup lambda function follows these steps:
1. Lambda receives a message from the SQS queue
2. Checks if the host is present in the stage for potential reconnection
3. If the host is not detected in the stage, deletes the stage
4. Updates the channel table to reflect changes such as the removal/nullification of the stageId and stageCreationDate fields.

### Amazon FIFO SQS
A FIFO queue using content body for message deduplication and a 3-minute delayed delivery, allowing the host sufficient time to rejoin if they choose to.

### Amazon IVS multitrack video

Amazon Interactive Video Service (IVS) support low-latency streaming approach called multitrack video. This technology empowers broadcasting software like OBS Studio to:
- Encode and stream multiple video qualities directly from their GPU-powered computer.
- Automatically configure encoder settings for the best possible stream.
- Deliver a high quality Adaptive Bitrate (ABR) viewing experience.

Unlike single-track video streaming, which necessitates server-side transcoding, multitrack video achieves these capabilities without such requirements. Multitrack video enhances streaming efficiency and quality for content creators and viewers alike.

Please refer to the [Amazon IVS Multitrack Video](https://docs.aws.amazon.com/ivs/latest/LowLatencyUserGuide/multitrack-video.html) documentation for more information.

#### Required CDK configuration to enable channel multitrack input

Please make sure the correct configurations are set in the [cdk.json](./cdk.json) file to enable multitrack. If any of these configurations are incorrectly set, the stack deployment process will throw an error. 

Refer to the [Amazon IVS Multitrack Video: Setup Guide](https://docs.aws.amazon.com/ivs/latest/LowLatencyUserGuide/multitrack-video-setup.html) for more information on how to setup the feature. 

- ivsChannelType = "STANDARD"
- multitrackInputConfiguration.enabled = true
- multitrackInputConfiguration.maximumResolution = "SD" | "HD" | "FULL_HD" 
- multitrackInputConfiguration.policy = "ALLOW" | "REQUIRE" 

Please note that `ContainerFormat` will be automatically set as "FRAGMENTED_MP4" when multitrack is enabled. 
