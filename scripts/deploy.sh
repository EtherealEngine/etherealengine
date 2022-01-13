set -e
set -x

STAGE=$1
TAG=$2

helm upgrade --reuse-values --set analytics.image.repository=$ECR_URL/xrengine-$STAGE-analytics,analytics.image.tag=$TAG,api.image.repository=$ECR_URL/xrengine-$STAGE-api,api.image.tag=$TAG,gameserver.image.repository=$ECR_URL/xrengine-$STAGE-gameserver,gameserver.image.tag=$TAG,client.image.repository=$ECR_URL/xrengine-$STAGE-client,client.image.tag=$TAG $STAGE xrengine/xrengine
