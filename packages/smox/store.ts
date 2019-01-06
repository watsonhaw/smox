import { produce } from '../immed/index'

export class Smox {
  state: any
  actions: any
  effects: any
  subs: Function[]
  constructor({ state = {}, actions = {}, effects = {} }) {
    this.state = state
    this.actions = this.wireActions([], state, actions)
    this.effects = this.wireEffects([], actions, effects)
    this.subs = []
  }

  private wireActions(path: string[], state: Object, actions: Object) {
    Object.keys(actions).forEach(key => {
      typeof actions[key] === 'function'
        ? ((key, action) => {
            actions[key] = function(data) {
              let res: any = produce(state, draft => {
                action(draft, data)
              })
              this.state = setPlain(path, res, this.state)
              this.subs.forEach(fun => fun())
            }.bind(this)
          })(key, actions[key])
        : this.wireActions(path.concat(key), state[key], actions[key])
    })

    return actions
  }

  private wireEffects(path: string[], actions: Object, effects: Object) {
    Object.keys(effects).forEach(key => {
      typeof effects[key] === 'function'
        ? ((key, effect) => {
            effects[key] = function(data) {
              effect(actions, data)
            }
          })(key, effects[key])
        : this.wireEffects(path.concat(key), actions[key], effects[key])
    })

    return effects
  }

  subscribe(sub) {
    this.subs.push(sub)
  }
  unsubscribe(sub) {
    this.subs.filter(f => f !== sub)
  }
}

function setPlain(path: string[], value: any, source: any) {
  let target = {}
  if (path.length) {
    target[path[0]] =
      path.length > 1 ? setPlain(path.slice(1), value, source[path[0]]) : value
    return { ...source, ...target }
  }
  return value
}