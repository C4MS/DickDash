#!/usr/bin/env bash
export WHAT="Hotspot 🔥"
export TEXT="${1:-hotspot}"

exec actify \
        -t "${WHAT}"    \
        -m "${TEXT}"    \
        -b com.doordash.dasher
