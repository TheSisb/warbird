#!/bin/bash

lerna run build --scope=colyseus-test-core

lerna run start \
  --scope=colyseus-test-client \
  --stream
