#!/bin/sh
cd interfaces
npm i
npm run recompile
npm pack
cd ..
cd core
npm i
npm run recompile
npm pack
cd ..
cd back-end
npm i
npm uninstall interfaces
npm uninstall core
npm i ../interfaces/interfaces-1.0.0.tgz
npm i ../core/core-1.0.0.tgz
npm run recompile
cd ..

