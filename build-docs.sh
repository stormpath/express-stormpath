#!/bin/bash

# This script builds *every* release of the project documentation. This is used
# to rebuild all of our previous Express project docs. Should probably not be
# ran unless we update our Sphinx templates, and want to re-generate things all
# at once.

for tag in `git tag -l`; do
    git checkout $tag;
    cd docs;
    rm -rf _build/html;
    make html && cp -r _build/html ~/Desktop/$tag;
    cd ..;
done
