#!/bin/bash

# build the frontend
npm install --prefix application/frontend/
npm run build --prefix application/frontend/

# build the shared code layer
npm install --prefix application/functions/shared-code/nodejs/
npm run build --prefix application/functions/shared-code/nodejs/

# build the functions
npm install --prefix application/functions/add-item/
npm run build --prefix application/functions/add-item/

npm install --prefix application/functions/get-items/
npm run build --prefix application/functions/get-items/

cdk synth
cdk deploy