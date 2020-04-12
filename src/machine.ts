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

    buildState = (
      stateNode: IStateModel,
      val?: string
    ): any => {
      if (!stateNode.parent) {
        return val;
      }
      let parent = stateNode;
      let obj:string|object = val||"";

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

      //@ts-ignore
      const currentState = stateNode.states[key];
      //@ts-ignore
      let nextStateName = currentState.on[event];

      //@ts-ignore
      let nextState: IStateModel = stateNode.states[nextStateName];
      if (nextState.states && nextState.initial) {
        const newLocal = nextState.initial;
        nextState = nextState.states[newLocal];
        nextState.parent = stateNode;
        nextState.name = nextStateName;
        this.state.value = this.buildState(
          nextState,
          newLocal
        );
      } else {
        //@ts-ignore
        this.state.value = this.buildState(
          stateNode,
          nextStateName
        );
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
