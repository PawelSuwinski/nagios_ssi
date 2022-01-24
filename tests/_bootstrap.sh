#! /bin/bash
#
# Bootstrap for test env.
#
# @see https://github.com/guessi/docker-nagios4
# @package nagios_ssi
# @author Paweł Suwiński, psuw@wp.pl
# ---

set -e

IMAGE='psuw/docker-nagios4'
NAME='psuw.nagios_ssi'

# build nagios4 docker image
[[ ! $(docker images -q $IMAGE) ]] && docker build --tag $IMAGE - <<EOT
FROM guessi/docker-nagios4
RUN usermod -G nagios www-data
EOT

# get container id if run
getID() {
  docker ps --format '{{ .ID }}' --filter name=$NAME
}

ID=$(getID)

# stop container if run
if [[ -n $ID ]]; then
  [[ $1 == 'stop' ]] && docker stop $ID
  exit 0
fi

# run container
cd ${0%/*}/..
fixDiff="$PWD/tests/fixtures.diff"

docker run -d --rm -p 80:80 -p 443:443 -p 5666:5666 --name $NAME \
  --mount type=bind,src=$PWD/ssi,dst=/opt/nagios/share/ssi \
  $IMAGE

ID=$(getID)

# get copy of patched directory on dev environment
if [[ $ENV == 'dev' ]]; then
  fixDir=$(mktemp -d)
  cd $fixDir
  docker exec -w /opt/nagios $ID tar -c etc | tar -x
  cp -R etc _etc
  patch -p0 < "$fixDiff"
  echo $fixDir
fi

# workaround for using VOLUME in Dockerfile issue
docker exec -i -w /opt/nagios $ID patch -p0 < "$fixDiff"
