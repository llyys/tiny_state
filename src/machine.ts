interface IStateMachine {
  id?: string;
  initial: string;
  type?: string;
  states: Dictionary<IStates>;
  context?: any;
}

interface IStates {
  on?: Dictionary<string>;
  type?: string;
  result?: string;
  states?: Dictionary<IStates>;
  initial?: string;
}

interface IStateModel extends IStates {
  parent?: IStateModel;
  name?: string;
}

type Dictionary<V> = { [key: string]: V };

interface IState {
  value?: Dictionary<object> | string;
}

/*
redux in the nutshell
dispatch(action) {
  state = reducer(state, action);
  subscribers.forEach(s => s());
}
*/

function isString(x: any): x is string {
  return typeof x === "string";
}

export function createMachine(stateMachineDefinition: IStateMachine) {
  class Machine {
    state: IState = { value: undefined };

    getStateNode = (
      state: Dictionary<any> | string,
      stateModel: any
    ): [string, IStateModel] => {
      if (isString(state)) {
        return [state, stateModel];
      }
      for (let [key, value] of Object.entries(state)) {
        const nextScope = stateModel.states[key];
        nextScope.parent = stateModel;
        nextScope.name = key;
        return this.getStateNode(value, nextScope);
      }
      return stateModel;
    };

    buildState = (stateNode: IStateModel, val?: string): any => {
      if (!stateNode.parent) {
        return val;
      }
      let parent = stateNode;
      let obj: string | object = val || "";

      while (parent.parent) {
        const state: Dictionary<string | object> = {};
        const name = parent?.name ?? "";
        state[name] = obj;
        obj = state;
        parent = stateNode.parent;
      }
      return obj;
    };

    transition = (event: string): any => {
      const stateModel = { ...stateMachineDefinition };
      const [key, stateNode] = this.getStateNode(
        this.state.value || {},
        stateModel
      );

      const states = stateNode.states;
      if (!states) {
        return null;
      }
      const currentState = states[key];
      if (!currentState || !currentState.on) {
        return null;
      }

      let nextStateName = currentState.on[event];

      let nextState: IStateModel = states[nextStateName];
      if (nextState?.type === "final") {
        if (stateNode.parent && stateNode.on && nextState?.result) {
          // finished sub-state and automatically navigate to next state
          const subState = stateNode.on[nextState?.result];
          this.state.value = this.buildState(stateNode.parent, subState);
          return this.state;
        }
      }

      if (nextState && nextState.states && nextState.initial) {
        // on nested state
        const newLocal = nextState.initial;
        nextState = nextState.states[newLocal];
        nextState.parent = stateNode;
        nextState.name = nextStateName;
        this.state.value = this.buildState(nextState, newLocal);
      } else {
        this.state.value = this.buildState(stateNode, nextStateName);
      }

      return this.state;
    };

    start = () => {
      this.state = {
        value: stateMachineDefinition.initial,
      };
      return this.state;
    };

    setState = (state: string | Dictionary<Object>) => {
      this.state.value = state;
    };
  }

  return new Machine();
}
