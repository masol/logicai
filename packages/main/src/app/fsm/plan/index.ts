

export default {
    machine: {
        id: 'plan',
        initial: 'inactive',
        states: {
            inactive: { on: { TOGGLE: 'active' } },
            active: { on: { TOGGLE: 'inactive' } }
        }
    }
}