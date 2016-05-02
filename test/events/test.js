import test from 'ava'
import testData from './testData.json'
import request from 'supertest'

import cobalt from '../../src/index'

test.cb.before('setup', t => {
  t.end()
})

// Fail train
test.cb('/', t => {
  request(cobalt.Server)
    .get('/1.0/events')
    .expect('Content-Type', /json/)
    .expect(404)
    .expect(JSON.stringify(testData.slice(0, 10)))
    .end((err, res) => {
      t.pass()
      t.end()
    })
})

test.cb.after('cleanup', t => {
	t.end()
})