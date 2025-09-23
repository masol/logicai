

export default {
    machine: {
        id: 'plan',
        initial: 'inactive',
        states: {
            inactive: {
                invoke: {
                    src: 'dotest',
                    onDone:
                    {
                        target: 'inactive',
                    },
                    onError: 'inactive',
                },
            },
            active: { on: { TOGGLE: 'inactive' } }
        }
    },
    setup: {
        actors: [
            {
                name: 'dotest',
                func: async (args: any) => {
                    console.log("enter test fsm promise");
                    // console.log(args)
                    await new Promise(resolve => setTimeout(resolve, 6000));
                    console.log("leave test fsm promise");
                }
            }
        ]
    }
}