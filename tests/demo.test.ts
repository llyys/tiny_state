import { createMachine } from "../src/machine";

test.skip("can run sequence", () => {
  const machine = createMachine({
    initial: "one",
    states: {
      one: {
        on: { NEXT: "two" },
      },
      two: {
        on: { NEXT: "three", PREV: "one" },
      },
      three: {
        type: "final",
        on: { PREV: "two" },
      },
    },
  });
  let state = machine.start();
  expect(state.value).toBe("one");
  expect(machine.transition("NEXT").value).toBe("two");
  expect(machine.transition("NEXT").value).toBe("three");
  expect(machine.transition("NEXT").value).toBeUndefined();
});

describe("can run hierarchical", ()=>{

	const subState = {
		initial: "one",
		states: {
			one: {
				on: {
					NEXT: "two",
					BACK: "cancel",
				},
			},
			two: {
				on: {
					NEXT: "finish",
				},
			},
			cancel: {
				type: "final",
				result: "PREV",
			},
			finish: {
				type: "final",
				result: "NEXT",
			},
		},
	};

	const machine = createMachine({
		initial: "A",
		states: {
			A: {
				on: { NEXT: "B" },
			},
			B: {
				on: { NEXT: "C", PREV: "A" },
			},
			C: {
				initial: "one",
				states: {
					one: {
						on: {
							NEXT: "two",
							BACK: "cancel",
						},
					},
					two: {
						on: {
							NEXT: "finish",
						},
					},
					cancel: {
						type: "final",
						result: "PREV",
					},
					finish: {
						type: "final",
						result: "NEXT",
					},
				},
				on: { NEXT: "D", PREV: "B" },
			},
			D: {
				type: "final",
			},
		},
	});

	test("can run hierarchical from state", () => {
		machine.setState({ C: "one" });
		expect(machine.transition("NEXT").value).toMatchObject({ C: "two" });

	});

	test("can step through", ()=>{

		machine.start();
		expect(machine.transition("NEXT").value).toBe("B");
		expect(machine.transition("NEXT").value).toMatchObject({ C: "one" });
		expect(machine.transition("NEXT").value).toMatchObject({ C: "two" });
	})
})
