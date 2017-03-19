/* eslint-env mocha */
'use strict'

const assert = require('assert')
const async = require('async')
const dynamodb = require('./util/dynamodb')

describe('writer', function () {
  before(function createDynamoDbClient () {
    this.dynamodb = dynamodb.createClient()
  })

  beforeEach(function createWriter () {
    this.writer = dynamodb.createWriter(this.dynamodb)
  })

  before(function startDynalite (done) {
    this.dynalite = dynamodb.dynalite(done)
  })

  before(function createTable (done) {
    this.timeout(5000)
    dynamodb.createTable(this.dynamodb, done)
  })

  after(function deleteTable (done) {
    this.timeout(5000)
    dynamodb.deleteTable(this.dynamodb, done)
  })

  after(function teardownDynamoDb (done) {
    this.dynalite.close(done)
  })

  it('should queue up to 24 items without writing', function (done) {
    async.times(24, (n, next) => {
      this.writer.save(dynamodb.item(), next)
    }, (err) => {
      assert.ifError(err)
      assert.equal(this.writer.queue.length, 24)
      done(null)
    })
  })
  it('25th write should trigger flush automatically', function (done) {
    async.times(25, (n, next) => {
      this.writer.save(dynamodb.item(), next)
    }, (err) => {
      assert.ifError(err)
      assert.equal(this.writer.queue.length, 0)
      done(null)
    })
  })

  it('should be able to manually call flush', function (done) {
    async.times(10, (n, next) => {
      this.writer.save(dynamodb.item(), next)
    }, (err) => {
      assert.ifError(err)
      assert.equal(this.writer.queue.length, 10)
      this.writer.flush((err) => {
        assert.ifError(err)
        assert.equal(this.writer.queue.length, 0)
        done(null)
      })
    })
  })

  it('should be able to flush with empty queue', function (done) {
    assert.equal(this.writer.queue.length, 0)
    this.writer.flush(done)
  })
})
