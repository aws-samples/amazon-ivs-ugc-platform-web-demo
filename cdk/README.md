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

**\*NOTE:** Please refer to the [seed.example.json file](./seed.example.json) so that you may create data that the DynamoDB client can use. Incorrect JSON data will lead to errors when seeding.\*

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
