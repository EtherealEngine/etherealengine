![Ethereal Engine](https://github.com/etherealengine/etherealengine/raw/dev/etherealengine%20black.png)

# Github Actions

Included here are all of the Github Actions that can be used to perform deployments,
run test builds, publish publish packages, and more. 

If you're forking this branch to make your own version, you probably don't need to run most of
these actions, and if you're making a private copy, you have a limited number of minutes for
Github actions per month. As as result, all of the actions conditionally run based on associated 
Github Secrets being explicitly set to 'true', so a fork won't run any of them by default.

## branch-build.yml
This action checks that the codebase builds and runs properly. It:
* Runs `npm install`
* Runs a linter
* Runs a test suite
* Builds the `client` package (other packages don't need to be built)

There is one secret controlling this action:

*`BRANCH_BUILD_ENABLED` - setting it to true will enable the action

## dev-deploy.yml
This action builds the codebase builder Docker image, pushes that to a specified Docker repo, and then
deploys it to a dev Kubernetes cluster using kubectl and Helm. It assumes that `dev` is the main branch and that anything 
pushed to `dev` should be deployed to a dev deployment. In particular, this action:

* Installs kubectl and Helm via a Snapcraft Snap, then downloads the Ethereal Engine Helm repo
* Builds the Ethereal Engine Builder Docker image
* Installs aws-sdk
* Pushes the Builder image to the dev-builder repo in ECR
* Uses Helm to upgrade the dev builder deployment with the dev-builder image  

There are two secrets controlling this action:
*`DEPLOYMENTS_ENABLED` - setting it to true will enable the action
*`SEND_FINISHED_WEBHOOK` - setting it to true will enable sending a webhook notification if everything
is successful; if `DEPLOYMENTS_ENABLED` is not true, this step will never be reached

As of this writing, deployment of Ethereal Engine is only officially supported on AWS' EKS. As a result, several
variables and scripts deal with AWS SDKs. If you want to deploy to GKE or another cloud provider, you'll
have to modify some of these variables, downloads, and calls to use another service.

This action uses several other secrets to control what repo it is interacting with:
*`EKS_AWS_ACCESS_KEY_ID`: The public key of an IAM user that has EKS access
*`EKS_AWS_ACCESS_KEY_SECRET`: The secret key of an IAM user that has EKS access
*`AWS_REGION`: The region of the EKS cluster/ECR repo to which this built image will be pushed and deployed
*`CLUSTER_NAME`: The name of the cluster to which this built image will be deployed
*`DEV_REPO_NAME`: The name of the repo that this built image will be deployed to; most easily set to `etherealengine-dev-builder`
(also have a repo `etherealengine-dev` for the final built image)
*`DEV_REPO_URL`: The URL of the ECR registry that this built image will be pushed to. Do *not* include the repo name;
if you are pushing the image to `12345.dkr.ecr.us-west-1.amazonaws.com/etherealengine-dev-builder`, then `REPO_URL`
should be `12345.dkr.ecr.us-west-1.amazonaws.com` and `REPO_NAME` should be `etherealengine-dev-builder`.
*`PRIVATE_REPO`: Set to `true` if the ECR registry you're pushing to is private, otherwise don't set this
or set it to anything else other than `true`
*`WEBHOOK_URL`: The URL of the webhook that should be called when the action finishes (no need to set
if `SEND_FINISHED_WEBHOOK` is not set)

##documentation.yml
This action runs Docusaurus build to create documentation for everything and deploys it 

There is one secret controlling this action:

*`DOCUMENTATION_BUILD_ENABLED` - setting it to true will enable the action

## prod-deploy.yml
This action builds the codebase builder Docker image, pushes that to a specified Docker repo, and then
deploys it to a prod Kubernetes cluster using kubectl and Helm. It assumes that `main` is the stable,
production-ready branch and that anything pushed to `prod` should be deployed to a prod deployment. 
In particular, this action:

* Installs kubectl and Helm via a Snapcraft Snap, then downloads the Ethereal Engine Helm repo
* Builds the Ethereal Engine Builder Docker image
* Installs aws-sdk
* Pushes the Builder image to the prod-builder repo in ECR
* Uses Helm to upgrade the prod builder deployment with the prod-builder image

There are two secrets controlling this action:
*`DEPLOYMENTS_ENABLED` - setting it to true will enable the action
*`SEND_FINISHED_WEBHOOK` - setting it to true will enable sending a webhook notification if everything
is successful; if `DEPLOYMENTS_ENABLED` is not true, this step will never be reached

As of this writing, deployment of Ethereal Engine is only officially supported on AWS' EKS. As a result, several
variables and scripts deal with AWS SDKs. If you want to deploy to GKE or another cloud provider, you'll
have to modify some of these variables, downloads, and calls to use another service.

This action uses several other secrets to control what repo it is interacting with:
*`EKS_AWS_ACCESS_KEY_ID`: The public key of an IAM user that has EKS access
*`EKS_AWS_ACCESS_KEY_SECRET`: The secret key of an IAM user that has EKS access
*`AWS_REGION`: The region of the EKS cluster/ECR repo to which this built image will be pushed and deployed
*`CLUSTER_NAME`: The name of the cluster to which this built image will be deployed
*`PROD_REPO_NAME`: The name of the repo that this built image will be deployed to; most easily set to `etherealengine-prod-builder`
(also have a repo `etherealengine-prod` for the final built image)
*`REPO_URL`: The URL of the ECR registry that this built image will be pushed to. Do *not* include the repo name;
if you are pushing the image to `12345.dkr.ecr.us-west-1.amazonaws.com/etherealengine-prod-builder`, then `REPO_URL`
should be `12345.dkr.ecr.us-west-1.amazonaws.com` and `REPO_NAME` should be `etherealengine-prod-builder`.
*`PRIVATE_REPO`: Set to `true` if the ECR registry you're pushing to is private, otherwise don't set this
or set it to anything else other than `true`
*`WEBHOOK_URL`: The URL of the webhook that should be called when the action finishes (no need to set
if `SEND_FINISHED_WEBHOOK` is not set)

##publish-gh-container.yml
This action builds the Docker image when a new release is created and pushes it to Github Containers.

There is one secret controlling this action:

*`PUBLISH_GH_CONTAINER_ENABLED` - setting it to true will enable the action

##publish-npm-packages.yml
This action builds each individual npm package when a new release is created, bumps the release version number,
and pushes them to npm and Github Packages. 
In particular, this action:

*Configures the npm roken
*Sets the git email and username
*Switches to a temporary branch and bumps the version number in each package (the next release number
if none is given, or the tag version if that is provided)
*Makes a Pull request on `dev` from that version bump branch
*Publishes the updated packages to npm
*Runs a script to update the package.json files to point to Github Packages instead of npm
*Publishes the updated packages to Github Packages

There is one secret controlling this action:

*`PUBLISH_NPM_PACKAGES_ENABLED` - setting it to true will enable the action

##update-deps-branch.yml
Most of Ethereal Engine's dependencies are version-locked in the respective package.jsons, and the main repo has
renovate make PRs when new versions of dependencies have been published. To prevent a constant stream of minor
version bumps interrupting build caches, the main repo has renovate automatically merge these updates to
the branch `deps`, and at a later date many of these updates can be reviewed and merged in in one go.
This action updates the `deps` branch with new commits to `dev` branch.

There is one secret controlling this action:

*`UPDATE_DEPS_BRANCH_ENABLED` - setting it to true will enable the action