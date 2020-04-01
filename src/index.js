import type from 'type-detect';
import cloneDeep from 'clone-deep';

export default class {
  constructor(methods) {
    this.methods = methods;
    this.killed = false;
    this.trampolinedRun = this.trampoline(this.run.bind(this));

    return {
      run: (key, payload) => this.trampolinedRun(key, payload),
      killAll: this.killAll.bind(this)
    }
  }

  trampoline(fn) {
    return function (...args) {
      let result = fn(...args)
      while (typeof result === 'function') {
        result = result()
      }
      return result
    }
  }

  run(key, payload, localData, localMethods) {
    localData = localData || {
      killed: false,
      onKill: null,
      next: null,
      nextPayload: undefined,
      res: null
    };

    localMethods = {
      kill(cb) {
        localData.onKill = cb;
        localData.killed = true;
        return localData.res
      },
      next(fn, payload) {
        localData.next = fn;
        localData.nextPayload = payload;
      },
      run: (key, payload) => this.trampolinedRun(key, payload),
    }

    let method = key.split('.').reduce((o, x) => o == undefined ? o : o[x], this.methods);

    if (method) {
      try {
        payload = payload !== undefined ? payload : localData.res;
        localData.res = method.call({}, localMethods,  payload);

        let next = localData.next;
        let nextPayload = localData.nextPayload !== undefined ? localData.nextPayload : localData.res;
        localData.nextPayload = undefined;
        localData.next = null;

        let res = next && !localData.killed && !this.killed ? () => this.run(next, nextPayload, localData, localMethods) : localData.res;
        return res;
      } catch (err) {
        console.error(err)
      }
    } else {
      console.log(`Method ${key} does not exist`)
      return null
    }
  }

  killAll() {
    this.killed = true;
  }
}