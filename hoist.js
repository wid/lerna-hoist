#!/usr/bin/env node

"use strict";

const { getPackages } = require("@lerna/project");
const filterPackages = require("@lerna/filter-packages");
const batchPackages = require("@lerna/batch-packages");
const packageGraph = require("@lerna/package-graph");
const Project = require("@lerna/project");
const minimist = require('minimist')

async function getSortedPackages(rootPath, scope, ignore) {    
    const packages = await getPackages(rootPath);    
    const filtered = filterPackages(packages,
      scope,
      ignore,
      true,);     
    return batchPackages(filtered)
      .reduce((arr, batch) => arr.concat(batch), []);
  }

function getProductionPackageDependancies(packages) {
  return getPackageDependancies(packages, "dependencies");
}

function getAllPackageDependancies(packages) {
  return getPackageDependancies(packages, "allDependencies");
}

function getPackageDependancies(packages, whichDependencies) {
  let dependancies = {};

  const pGraph = new packageGraph(packages, whichDependencies, 0);
  pGraph.forEach(packageInfo => {
    packageInfo.externalDependencies.forEach(
      (packageInfo) => {
        dependancies = Object.assign(dependancies, { [packageInfo.name] : packageInfo.rawSpec});
      }
    );
  })
  return dependancies;
}

var args = minimist(process.argv.slice(2), {
  string: [ '--scope', '--ignore']
});

getSortedPackages(args['_'][0], args['--scope'], args['--ignore']).then((packages) => {  
  const project = new Project(args['_'][0]);
  
  const dependancies = getProductionPackageDependancies(packages);
  const allDependancies = getAllPackageDependancies(packages);

  let devDependancies = Object.assign({}, allDependancies);

  Object.keys(dependancies).forEach( (key) => delete devDependancies[key]);

  Object.assign( project.manifest.dependencies || {}, dependancies);
  Object.assign( project.manifest.devDependencies || {}, devDependancies);
  return project.manifest.serialize();
})



  

