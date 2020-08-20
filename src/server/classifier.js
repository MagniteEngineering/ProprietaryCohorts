if (ProprietaryCohorts) {
    ProprietaryCohorts.classifier = function (url, state) {
        if (typeof state !== 'object') {
            console.log('state is not an object')
            return;
        }

        if (!Array.isArray(state.history)) {
            state.history = [];
        }

        state.history.push(url);

        if (!state.cohortId) {
            state.cohortId = Date.now();
        }

        console.log(state);

        return state.cohortId;
    }
}