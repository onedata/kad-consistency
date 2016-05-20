#!/usr/bin/env node

var fs = require('fs');
var async = require('async');
var spawn = require('child_process').spawn;
var mutateParameters = require('../parameter-mutation');
var getRawOutputToDataJsTransformer = require('../data-to-js').getRawOutputToDataJsTransformer;

function runSeparateProcess(param, done) {
  var child = spawn(process.execPath, [__dirname + '/../simulation.js', JSON.stringify(param)]);
  child.stdout.on('end', done);
  child.stdout.on('data', function (buffer) {
    console.log(buffer.toString())
  });
}

var defaultParameters = {
  useExtension: false,
  peerOptions: {
    requestTimeout: 100,
    maxPutTimeoutsRatio: 0.2,
    maxPutConflictsRatio: 0.1,
    minGetCommonRatio: 0.51,
    maxGetTimeoutsRatio: 0.49
  },
  scenario: {
    peerCount: 128,
    objectCount: 160,
    readsPerObject: 0,
    updatesPerObject: 8,
    postUpdateReadsPerObject: 8
  },
  malfunctions: {
    messageLossProbability: 0.0,
    valuePoisoningProbability: 0.0,
    publisherPoisoningProbability: 0.0,
    rationalPeerProbability: 0.0
  },
  runName: 'rational-attack/results'
};

var mutators = [
  {
    //values: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30],
    values: [1, 2, 3, 4, 5],
    setter: function (params) {
      return params
    }
  }, {
    values: [true, false],
    setter: function (params, val) {
      params.useExtension = val;
      return params
    }
  }, {
    values: [0, 0.08, 0.16, 0.24, 0.32, 0.40, 0.48, 0.56],
    setter: function (params, val) {
      params.malfunctions.rationalPeerProbability = val;
      return params
    }
  }, {
    values: [0, 0.02],
    setter: function (params, val) {
      params.malfunctions.messageLossProbability = val;
      return params
    }
  }
];

var dataJsTransformer = getRawOutputToDataJsTransformer();

async.eachLimit(mutateParameters(defaultParameters, mutators), 4, runSeparateProcess, function (err, done) {
  fs.readFile(__dirname + '/results.raw', 'utf8', function (err, data) {
    dataJsTransformer(data, function (err, js) {
      fs.writeFile(__dirname + '/data.js', js, done);
    })
  });
});
