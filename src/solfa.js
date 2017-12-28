const SOLFA_NAMES = 'drmfsltd'.split('')

const SOLFA_TO_SHORT_MAP = {
    'doe': 'd',
    'ray': 'r',
    'me': 'm',
    'far': 'f',
    'sew': 's',
    'la': 'l',
    'tea': 't'
};

function solfaWordToSolfa(word) {
    word = word || '-';
    return SOLFA_TO_SHORT_MAP[word.toLowerCase()] || word[0];
}

exports.SOLFA_NAMES = SOLFA_NAMES;
exports.SOLFA_TO_SHORT_MAP = SOLFA_TO_SHORT_MAP;
exports.solfaWordToSolfa = solfaWordToSolfa;