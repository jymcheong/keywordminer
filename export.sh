#!/bin/sh

sudo docker exec -it KeywordMiner /bin/bash -c "/orientdb/bin/console.sh use \"remote:127.0.0.1/KeywordMiner root ; EXPORT DATABASE /orientdb/schema.gz -excludeALL -includeSchema=TRUE;\""
sudo docker exec -it KeywordMiner /bin/bash -c "/orientdb/bin/console.sh use \"remote:127.0.0.1/KeywordMiner root ; EXPORT DATABASE /orientdb/functions.gz -includeClass=OFunction -includeInfo=FALSE -includeClusterDefinitions=FALSE -includeSchema=FALSE -includeIndexDefinitions=FALSE -includeManualIndexes=FALSE;\""
