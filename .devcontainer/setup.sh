#!/bin/bash
set -e

sudo rm -f /etc/apt/sources.list.d/yarn.list

sudo apt-get update -yqq
sudo apt-get upgrade -yqq -o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold"

sudo apt-get install -yqq build-essential btop p7zip-full
