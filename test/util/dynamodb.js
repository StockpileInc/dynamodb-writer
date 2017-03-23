'use strict'

const {DynamoDB} = require('aws-sdk')
const Dynalite = require('dynalite')
const DynamoDbWriter = require('../../src/')
const debug = require('debug')('dynamodb-writer:test:util:dynamodb')

const PORT = 4567
const TABLE_NAME = 'dynamodb-writer-test'

exports.createClient = function createClient () {
  return new DynamoDB({
    apiVersion: '2012-08-10',
    accessKeyId: 'dummy',
    secretAccessKey: 'dummy',
    region: 'us-east-1',
    endpoint: 'http://localhost:' + PORT
  })
}

exports.createWriter = function createWriter (dynamodb) {
  return DynamoDbWriter.create(dynamodb, {table: TABLE_NAME})
}

exports.dynalite = function dynalite (cb) {
  debug('Creating dynalite server on port ' + PORT)
  return Dynalite({
    createTableMs: 0,
    deleteTableMs: 0
  }).listen(PORT, cb)
}

exports.createTable = function createTable (dynamodb, cb) {
  debug('creating table...')
  dynamodb.createTable({
    TableName: TABLE_NAME,
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5
    },
    AttributeDefinitions: [
      {
        AttributeName: 'id',
        AttributeType: 'N'
      },
      {
        AttributeName: 'created',
        AttributeType: 'N'
      }
    ],
    KeySchema: [
      {
        AttributeName: 'id',
        KeyType: 'HASH'
      },
      {
        AttributeName: 'created',
        KeyType: 'RANGE'
      }
    ]
  }, (err) => {
    if (err) return cb(err)
    cb(null)
  })
}

exports.deleteTable = function deleteTable (dynamodb, cb) {
  debug('Deleting table...')
  dynamodb.deleteTable({
    TableName: TABLE_NAME
  }, (err) => {
    if (err) return cb(err)
    cb(null)
  })
}

exports.item = function item (opts = {}) {
  return {
    id: {N: opts.id || id()},
    created: {N: opts.created || String(Date.now())}
  }
}

const id = (function () {
  let lastId = 0
  return function id () {
    return String(++lastId)
  }
})()
