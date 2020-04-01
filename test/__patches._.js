import Patch from '../src';

let methods = {
  method1: () => {
    return ['test1'];
  },
  method2 ({}, payload) {
    return payload.shift();
  },
  method3 ({kill, run}, payload) {
    kill(() => {
      console.log('killed')
    })

    return payload
  },
  method4 ({}) {
    return ['array']
  },
  promise1 ({run}, payload) {
    return new Promise(res => {
      setTimeout(() => {
        res(payload)
      }, 1000)
    })
  },
  run ({run}, payload) {
    return payload
  },
  run2 ({next}) {
    next('run')
    return 'success'
  }
};

let patches = {
  default: {
    method: 'method1',
    type: 'array',
    async: false,
    next: 'patch1'
  },
  patch1: {
    method: 'method2',
    type: 'string',
    async: false,
  },
  kill: {
    method: 'method3',
    type: 'string',
    async: false,
  },
  array: {
    method: 'method1',
    type: 'array',
    next: ['patch1', 'patch1'],
    async: false,
  },
  async: {
    method: 'promise1',
    type: 'promise',
    async: true,
    next: 'async2'
  },
  async2: {
    method: 'promise1',
    type: 'promise',
    async: true,
  },
};

let app = new Patch({patches, methods});

test('patch', () => {
  expect(app.patch()).toBe('test1')
});

test('kill', () => {
  expect(app.patch('kill', 'killed')).toBe('killed')
});

test('array', () => {
  expect(app.patch('array', null).length).toBe(2)
});

test('async', done => {
  app.patch('async', 'awesome').then((payload) => {
    payload === 'awesome' ? done() : null
  })
});

test('run', () => {
  expect(app.run('run', 'success')).toBe('success')
});

test('run nested', () => {
  expect(app.run('run2')).toBe('success')
});