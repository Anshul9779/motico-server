#!/bin/sh
echo "Pulling for latest changes"
git pull origin prisma
echo "\nInstalling dependencies"
yarn
echo "\nDelete Prev dist"
rm -rf "./dist"
echo "\nBuild files"
yarn build
echo "\nCopy build folder"
cp -R build dist/build