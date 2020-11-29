#!/usr/bin/env bash
# Replace this script to perform a action on a offer.
# This script/example sends a notification.

# ----- iOS -----
# Actify
# u/YoelkiToelki
# https://yulkytulky.com/

export WHAT="${1:-test}"
shift;
export TEXT="${@:-name}"

exec actify \
	-t "${WHAT}"	\
	-m "${TEXT}"	\
	-b doordash.DoorDashConsumer
