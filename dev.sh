#!/usr/bin/env bash
DEV_SERVER_PROTOCOL="${DEV_SERVER_PROTOCOL:-http}"
DEV_SERVER_HOST="${DEV_SERVER_HOST:-0.0.0.0}"
DEV_SERVER_PORT="5000"

# If the dev server port is set, then add a port argument
# to the webpack-dev-server init command
if [ -z $DEV_SERVER_PORT ]; then
  DEV_PORT_ARG=""
else
  DEV_PORT_ARG="--port $DEV_SERVER_PORT"
fi
node node_modules/.bin/webpack-dev-server \
  --config webpack.development.js \
  --host "$DEV_SERVER_HOST" \
  $DEV_PORT_ARG \
  --history-api-fallback \
  --hot \
  --inline \
  --progress
