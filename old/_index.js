import type from 'type-detect';
import cloneDeep from 'clone-deep';

export default class {
  constructor ({methods, patches}) {
    this.methods = methods;
    this.patches = patches;
    this.killed = false;

    return {
      run: (key, payload) => this.run.call(this, key, payload),
      patch: (key, payload) => this.patch.call(this, key, payload),
      killAll: this.killAll.bind(this)
    }
  }

  run (key, payload = null, local = {
      kill (cb) {
        this.onKill = cb;
        this.killed = true;
        return this
      },
      next (fn) {
        this.nextFun = fn
      },
      killed: false,
      onKill: null,
      nextFn: null
    }) {
      let method = key.split('.').reduce((o, x) => o == undefined ? o : o[x], this.methods)
      
      if (method) {
        try {
          let res = method.call(this.methods, {
            kill: (cb) => local.kill.call(local, cb),
            next: (fn) => local.next.call(local, fn), 
            patch: (key, payload) => this.patch.call(this, key, payload),
            run: (key, payload) => this.run.call(this, key, payload)
          }, payload);
          let next = local.nextFn

          switch (type(res).toLowerCase()) {
            case 'promise':
              return new Promise((result, reject) => {
                res.then((payload) => {
                  result(next ? this.next(next, local, payload) : res)
                }).catch(err => {reject(err); throw err})
              })
            break;

            default: 
              return next ? this.next(next, local, res) : res;
            break;

          }
        } catch (err) {

        }
      } else {
        console.log(`Method ${key} does not exist`)
        return null
      }
  }

  patch (key = 'default', payload = null, local = {
    kill (cb) {
      this.onKill = cb;
      this.killed = true;
      return this
    },
    next (fn) {
      nextFun = fn
    },
    killed: false,
    onKill: null,
    nextFn: null
  }) {

    let patch = key in this.patches ? this.patches[key] : null;

    if (!patch) {console.log(`Patch ${key} doesn not exist`); return}

    let method = patch ? patch.method.split('.').reduce((o, x) => o == undefined ? o : o[x], this.methods) : null;

    if (method) {
      try {
        let res = method.call(this.methods, {
          kill: (cb) => local.kill.call(local, cb),
          next: (fn) => local.next.call(local, fn), 
          patch: (key, payload) => this.patch.call(this, key, payload),
          run: (key, payload) => this.run.call(this, key, payload)
        }, payload);
        
        let next =  local.nextFn || patch.next;

        if (patch.async) {
          return new Promise((result, reject) => {
            res.then((payload) => {
              result(next ? this.next(next, local, payload, this.patch) : res)
            }).catch(err => {reject(err); throw err})
          })    
        } else {
          return next ? this.next(next, local, res, this.patch) : res;
        }
      } catch (err) {
        console.log(err)
        return null
      }        
    } else {
      console.log(`Method ${patch.method} does not exist`)
      return null
    }
  }

  next (next, local, res, toCall) {
    if (local.killed) {
      if (local.onKill) {
        local.onKill(res)
      }
      return res
    }

    switch (type(next).toLowerCase()) {
      case 'string':
        return toCall.call(this, next, cloneDeep(res), local)
      break;

      case 'array':
        return next.slice().map(fn => toCall.call(this, fn, cloneDeep(res), local))
      break;

      default:
        throw 'Next is in incorrect format'
      break;
    }
  }

  killAll () {
    this.killed = true;
  }
}