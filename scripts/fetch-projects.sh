#!/bin/bash

# Check if the current repository is bare
if git rev-parse --is-bare-repository; then
    echo "Skipping bare repository"
else
    # Not a bare repository, run the commands
    git fetch -p && git rebase
fi

