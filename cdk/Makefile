.DEFAULT_GOAL := help
ORANGE := \033[38;5;202m
RESET := \033[0m

.PHONY: help app install bootstrap deploy destroy clean

AWS_PROFILE_FLAG		 =	--profile $(AWS_PROFILE)
STAGE					 ?=	dev
PUBLISH					 ?=	false
STACK 					 ?=	UGC-$(STAGE)
COGNITO_CLEANUP_SCHEDULE ?= rate(48 hours)
STAGE_CLEANUP_SCHEDULE   ?= rate(24 hours)
CDK_OPTIONS 			 =	$(if $(AWS_PROFILE),$(AWS_PROFILE_FLAG)) -c stage=$(STAGE) -c publish=$(PUBLISH) -c stackName=$(STACK) -c cognitoCleanupScheduleExp="$(strip $(COGNITO_CLEANUP_SCHEDULE))" -c stageCleanupScheduleExp="$(strip $(STAGE_CLEANUP_SCHEDULE))"
FE_DEPLOYMENT_STACK		 =	UGC-Frontend-Deployment-$(STAGE)
SEED_COUNT 				 ?=	50
OFFLINE_SESSION_COUNT	 ?=	1

help: ## Shows this help message
	@echo "\n$$(tput bold)Available Rules:$$(tput sgr0)\n"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST)\
	 | sort \
	 | awk  \
	 'BEGIN {FS = ":.*?## "}; \
	 {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'
	@echo "\n$$(tput bold)IMPORTANT!$$(tput sgr0)\n"
	@echo "1. If AWS_PROFILE is not exported as an environment variable or provided through the command line, then the default AWS profile is used. \n" | fold -s
	@echo "   Option 1: export AWS_PROFILE=user1\n"
	@echo "   Option 2: make <target> AWS_PROFILE=user1\n"
	@echo "2. Set the STAGE value to \"dev\" or \"prod\" to use the corresponding configuration. The default value is \"dev\". \n" | fold -s
	@echo "3. Set the SCHEDULE value to either a cron or rate expression based on the UTC time zone. By default, a rate expression is used to run the cleanupUnverifiedUsers Lambda every 48 hours. \n" | fold -s"
	@echo "Read more about schedule expressions for EventBridge rules here: https://docs.aws.amazon.com/AmazonCloudWatch/latest/events/ScheduledEvents.html \n" | fold -s
	@echo "4. AWS CLI is required to run the seed command (https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-getting-started.html). \n"
	@echo "5. Add JSON=<file_path> as an argument for the seed command to use a JSON file to create data. Furthermore, the script will create randomly generated data to match the SEED_COUNT. By default the script will create 1 offline session count out of the seed count. To change this please use the OFFLINE_SESSION_COUNT attribute. \n"

app: install bootstrap deploy ## Installs NPM dependencies, bootstraps, and deploys the stack

install: ## Installs NPM dependencies
	@echo "Installing NPM dependencies..."
	npm install

bootstrap: ## Deploys the CDK Toolkit staging stack
	@echo "Bootstrapping..."
	npx cdk bootstrap $(CDK_OPTIONS)

deploy: ## Deploys the stack
	@echo "Deploying $(STACK)..."
	npx cdk deploy $(STACK) --outputs-file temp_out.json $(CDK_OPTIONS)
	@echo "Sanitizing CDK output..."
	node scripts/sanitize-output $(STACK)
	rm temp_out.json
	@echo "\n$$(tput bold) ✅ $(STACK) Deployed Successfully $$(tput sgr0)\n"
	@echo "\n$$(tput bold) $(ORANGE) Attention: Please note that adjustments made to your current cloud stack may not retrospectively affect all previously created resources. $$(tput sgr0)\n$(RESET)"
	@if [ $(PUBLISH) = true ]; then\
		echo "Publishing Frontend App...";\
		npm install --prefix ../web-ui;\
		npm run build --prefix ../web-ui;\
		npx cdk deploy $(FE_DEPLOYMENT_STACK) $(CDK_OPTIONS) &&\
		echo "Frontend Published. Cleaning up the deployment stack..." &&\
		npx cdk destroy $(FE_DEPLOYMENT_STACK) $(CDK_OPTIONS) --force &&\
		echo "\n$$(tput bold) ✅ Frontend App Published Successfully $$(tput sgr0)\n";\
	fi

destroy: clean ## Destroys the stack and cleans up
	@echo "Destroying $(STACK)..."
	npx cdk destroy $(STACK) $(CDK_OPTIONS)

clean: ## Deletes the cloud assembly directory (cdk.out)
	@echo "Cleaning..."
	rm -rf cdk.out

seed: ## Seed users and stream sessions.
	@echo "Seeding ${SEED_COUNT} Items..."
	aws cloudformation describe-stacks --stack-name ${STACK} $(if $(AWS_PROFILE),$(AWS_PROFILE_FLAG)) --query "Stacks[0].Outputs[?OutputKey=='containerEnvStr'].OutputValue" --output text > seed_temp_out.txt
	node scripts/run-seeder ${SEED_COUNT} ${OFFLINE_SESSION_COUNT} ${JSON}
	rm seed_temp_out.txt

deleteSeed: ## Delete all seeded users and stream sessions.
	@echo "Deleting Seeds..."
	aws cloudformation describe-stacks --stack-name ${STACK} $(if $(AWS_PROFILE),$(AWS_PROFILE_FLAG)) --query "Stacks[0].Outputs[?OutputKey=='containerEnvStr'].OutputValue" --output text > seed_temp_out.txt
	node scripts/delete-seeder
	rm seed_temp_out.txt