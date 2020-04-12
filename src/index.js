import type from 'type-detect';
import cloneDeep from 'clone-deep';

const uids = [];

function generateUid (len) {
  len = len || 7;
  return (function check(uids) {
    let uid = `${Math.random().toString(35).substr(2, len)}`;

    if (uids.indexOf(uid) > -1) {
      return check(uids)
    }

    uids.push(uid);
    return uid
  })(uids);
}

export default class {
  constructor(methods) {
    this.methods = methods;
    this.killed = false;
    this.trampolinedRun = this.trampoline.call(this, this.run);

    return {
      run: (key, payload) => this.trampolinedRun(key, payload),
      killAll: this.killAll.bind(this)
    }
  }

  trampoline(fn) {
    return (...args) => {
      let uid = generateUid();
      let result = fn.call(this, ...args, uid);

      while (result && typeof result.run == 'function' && result.uid === uid ) {
        result = result.run.call(this)
      }

      return result
    }
  }

  run(key, payload, uid, localData, localMethods) {
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
      runRaw: (key, payload) => this.run.call(this, key, payload),
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
        return next && !localData.killed && !this.killed ? {run: () => this.run(next, nextPayload, uid, localData, localMethods), uid } : localData.res;
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