import { createMachine } from "../src/machine";
const machine = createMachine({
  initial: "idle",
  states: {
    idle: {
			enter:()=>{console.log('enter idle')},
      on: {
				switch: "pending",
				parallel: "runParallel"
      },
    },
    pending: {
      on: {
        switch: "idle",
      },
		},
		afterParallel:{
			on:{
				next: "finish"
			}
		},
		finish:{
			type:'final'
		},
		runParallel:{
			type:'parallel',
			states:{
				taskA:{
					initial: "pending",
					states:{
						pending:{
							on:{
								switch: "complete"
							}
						},
						complete:{
							type: 'final'
						}
					}
				},
				taskB:{
					initial: "pending",
					states:{
						pending:{
							on:{
								switch: "complete"
							}
						},
						complete:{
							type: 'final'
						}
					}
				},
				join:"afterParallel"
			}
		}
  },
});
let state = machine.state;
console.log(`current state: ${state}`);
state = machine.transition(state, "switch");
console.log(`current state: ${state}`);
state = machine.transition(state, "switch");
console.log(`current state: ${state}`);

state = machine.transition(state, "parallel")
console.log(`current state: ${state}`);
