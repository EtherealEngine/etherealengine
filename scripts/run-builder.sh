#!/bin/bash
set -e
set -x

until [ -f /var/lib/docker/certs/client/ca.pem ]
do
  echo "Waiting for /var/lib/docker/certs/client/ca.pem to be available from dind volume"
  sleep 1
done
START_TIME=`date +"%d-%m-%yT%H-%M-%S"`
mkdir -pv ~/.docker
cp -v /var/lib/docker/certs/client/* ~/.docker
touch ./builder-started.txt
# bash ./scripts/setup_helm.sh
bash ./scripts/setup_aws.sh $EKS_AWS_ACCESS_KEY_ID $EKS_AWS_ACCESS_KEY_SECRET $AWS_REGION $CLUSTER_NAME
npx cross-env ts-node --swc scripts/check-db-exists.ts
npm run prepare-database
npm run create-build-status
BUILDER_RUN=$(tail -1 builder-run.txt)
npx ts-node --swc scripts/install-projects.js >project-install-build-logs.txt 2>project-install-build-error.txt || npm run record-build-error -- --service=project-install
test -s project-install-build-error.txt && npm run record-build-error -- --service=project-install
npx cross-env ts-node --swc scripts/create-root-package-json.ts
mv package.json package.jsonmoved
mv package-root-build.json package.json
npm install
rm package.json
mv package.jsonmoved package.json
npm run prepare-database >prepare-database-build-logs.txt 2>prepare-database-build-error.txt || npm run record-build-error -- --service=prepare-database
test -s prepare-database-build-error.txt && npm run record-build-error -- --service=prepare-database
npx cross-env node --loader ts-node/esm packages/client/scripts/create-env-production.ts >buildenv-build-logs.txt 2>buildenv-build-error.txt || npm run record-build-error -- --service=buildenv
test -s buildenv-build-error.txt && npm run record-build-error -- --service=buildenv
if [ -n "$TWA_LINK" ]
then
  npx cross-env node --loader ts-node/esm packages/client/scripts/populate-assetlinks.ts >populate-assetlinks-build-logs.txt >populate-assetlinks-build-logs.txt 2>populate-assetlinks-build-error.txt || npm run record-build-error -- --service=populate-assetlinks
test -s populate-assetlinks-build-error.txt && npm run record-build-error -- --service=populate-assetlinks
fi
bash ./scripts/cleanup_builder.sh $DOCKER_LABEL


if [ $PRIVATE_ECR == "true" ]
then
  aws ecr get-login-password --region $AWS_REGION | docker login -u AWS --password-stdin $ECR_URL
else
  aws ecr-public get-login-password --region us-east-1 | docker login -u AWS --password-stdin $ECR_URL
fi

mkdir -p ./project-package-jsons/projects/default-project
cp packages/projects/default-project/package.json ./project-package-jsons/projects/default-project
find packages/projects/projects/ -name package.json -exec bash -c 'mkdir -p ./project-package-jsons/$(dirname $1) && cp $1 ./project-package-jsons/$(dirname $1)' - '{}' \;

bash ./scripts/build_and_publish_package.sh $RELEASE_NAME $DOCKER_LABEL root root $START_TIME $AWS_REGION $NODE_ENV $PRIVATE_ECR >root-build-logs.txt 2>root-build-error.txt
npm run record-build-error -- --service=root --isDocker=true

npm install -g cli @aws-sdk/client-s3

if [ "$SERVE_CLIENT_FROM_STORAGE_PROVIDER" = "true" ] && [ "$STORAGE_PROVIDER" = "s3" ]
then
  npx cross-env ts-node --swc scripts/get-deletable-client-files.ts

  bash ./scripts/build_and_publish_package.sh $RELEASE_NAME $DOCKER_LABEL api api $START_TIME $AWS_REGION $NODE_ENV $PRIVATE_ECR >api-build-logs.txt 2>api-build-error.txt &
  bash ./scripts/build_and_publish_package.sh $RELEASE_NAME $DOCKER_LABEL client client-serve-static $START_TIME $AWS_REGION $NODE_ENV $PRIVATE_ECR >client-build-logs.txt 2>client-build-error.txt &
  bash ./scripts/build_and_publish_package.sh $RELEASE_NAME $DOCKER_LABEL instanceserver instanceserver $START_TIME $AWS_REGION $NODE_ENV $PRIVATE_ECR >instanceserver-build-logs.txt 2>instanceserver-build-error.txt &
  bash ./scripts/build_and_publish_package.sh $RELEASE_NAME $DOCKER_LABEL taskserver taskserver $START_TIME $AWS_REGION $NODE_ENV $PRIVATE_ECR >taskserver-build-logs.txt 2>taskserver-build-error.txt &
  #bash ./scripts/build_and_publish_package.sh $RELEASE_NAME $DOCKER_LABEL testbot testbot $START_TIME $AWS_REGION $NODE_ENV $PRIVATE_ECR >testbot-build-logs.txt 2>testbot-build-error.txt && &

  wait < <(jobs -p)

  npm run record-build-error -- --service=api --isDocker=true
  npm run record-build-error -- --service=client --isDocker=true
  npm run record-build-error -- --service=instanceserver --isDocker=true
  npm run record-build-error -- --service=taskserver --isDocker=true
  #npm run record-build-error -- --service=testbot --isDocker=true
elif [ "$SERVE_CLIENT_FROM_API" = "true" ]
then
  bash ./scripts/build_and_publish_package.sh $RELEASE_NAME $DOCKER_LABEL api api-client $START_TIME $AWS_REGION $NODE_ENV $PRIVATE_ECR >api-build-logs.txt 2>api-build-error.txt &
  bash ./scripts/build_and_publish_package.sh $RELEASE_NAME $DOCKER_LABEL instanceserver instanceserver $START_TIME $AWS_REGION $NODE_ENV $PRIVATE_ECR >instanceserver-build-logs.txt 2>instanceserver-build-error.txt &
  bash ./scripts/build_and_publish_package.sh $RELEASE_NAME $DOCKER_LABEL taskserver taskserver $START_TIME $AWS_REGION $NODE_ENV $PRIVATE_ECR >taskserver-build-logs.txt 2>taskserver-build-error.txt &
  #bash ./scripts/build_and_publish_package.sh $RELEASE_NAME $DOCKER_LABEL testbot testbot $START_TIME $AWS_REGION $NODE_ENV $PRIVATE_ECR >testbot-build-logs.txt 2>testbot-build-error.txt && &

  wait < <(jobs -p)

  npm run record-build-error -- --service=api --isDocker=true
  npm run record-build-error -- --service=instanceserver --isDocker=true
  npm run record-build-error -- --service=taskserver --isDocker=true
  #npm run record-build-error -- --service=testbot --isDocker=true
else
  bash ./scripts/build_and_publish_package.sh $RELEASE_NAME $DOCKER_LABEL api api $START_TIME $AWS_REGION $NODE_ENV $PRIVATE_ECR >api-build-logs.txt 2>api-build-error.txt &
  bash ./scripts/build_and_publish_package.sh $RELEASE_NAME $DOCKER_LABEL client client $START_TIME $AWS_REGION $NODE_ENV $PRIVATE_ECR >client-build-logs.txt 2>client-build-error.txt &
  bash ./scripts/build_and_publish_package.sh $RELEASE_NAME $DOCKER_LABEL instanceserver instanceserver $START_TIME $AWS_REGION $NODE_ENV $PRIVATE_ECR >instanceserver-build-logs.txt 2>instanceserver-build-error.txt &
  bash ./scripts/build_and_publish_package.sh $RELEASE_NAME $DOCKER_LABEL taskserver taskserver $START_TIME $AWS_REGION $NODE_ENV $PRIVATE_ECR >taskserver-build-logs.txt 2>taskserver-build-error.txt &
  #bash ./scripts/build_and_publish_package.sh $RELEASE_NAME $DOCKER_LABEL testbot testbot $START_TIME $AWS_REGION $NODE_ENV $PRIVATE_ECR >testbot-build-logs.txt 2>testbot-build-error.txt && &

  wait < <(jobs -p)

  npm run record-build-error -- --service=api --isDocker=true
  npm run record-build-error -- --service=client --isDocker=true
  npm run record-build-error -- --service=instanceserver --isDocker=true
  npm run record-build-error -- --service=taskserver --isDocker=true
  #npm run record-build-error -- --service=testbot --isDocker=true
fi

bash ./scripts/deploy.sh $RELEASE_NAME ${TAG}__${START_TIME}

npx cross-env ts-node --swc scripts/update-cronjob-image.ts --repoName=${REPO_NAME} --tag=${TAG} --ecrUrl=${ECR_URL} --startTime=${START_TIME}

npx cross-env ts-node --swc scripts/clear-projects-rebuild.ts
npm run record-build-success
DEPLOY_TIME=`date +"%d-%m-%yT%H-%M-%S"`

bash ./scripts/cleanup_builder.sh $DOCKER_LABEL

END_TIME=`date +"%d-%m-%yT%H-%M-%S"`
echo "Started build at $START_TIME, deployed image to K8s at $DEPLOY_TIME, ended at $END_TIME"
sleep 3m
if [ "$SERVE_CLIENT_FROM_STORAGE_PROVIDER" = "true" ] && [ "$STORAGE_PROVIDER" = "s3" ] ; then
  npx cross-env ts-node --swc scripts/delete-old-s3-files.ts;
  echo "Deleted old client files from S3"
fi

echo $(kubectl get jobs | grep $RELEASE_NAME-builder-etherealengine-builder)
if [ -z "$(kubectl get jobs | grep $RELEASE_NAME-builder-etherealengine-builder)" ]
then
  echo "Non-job builder, sleeping"
  sleep infinity
else
  echo "Job-based builder, killing docker container"
  pkill dockerd
  pkill docker-init
fi