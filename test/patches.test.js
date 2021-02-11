import Runeux from '../dist';

const lib = new Runeux({
  'fnTest': function () {
    return 'success'
  },
  'payloadTest': function (_, payload) {
    return payload
  },
  'nextTest': function ({next}) {
    next('getArrayLength')
    return [1,2]
  },
  'getArrayLength': function (_, payload) {
    return payload.length
  },
  'nextLoop': function ({next}, payload) {
    if (payload < 3) {
      payload++;
      next('nextLoop')
    }
    return payload
  },
  'nextLoopWithPayload': function ({next}, run_again) {
    if (run_again) {
      next('nextLoopWithPayload', false)
    }
    return run_again
  },
})

test('Run a function', () => {
  expect(lib.run('fnTest')).toBe('success');
});

test('Pass a payload', () => {
  expect(lib.run('payloadTest', 'payload')).toBe('payload');
});

test('Next Test', () => {
  expect(lib.run('nextTest')).toBe(2);
});

test('Next Loop', () => {
  expect(lib.run('nextLoop', 0)).toBe(3);
});

test('Next Loop with New Payload', () => {
  expect(lib.run('nextLoopWithPayload', true)).toBe(false);
});