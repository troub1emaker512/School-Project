// calculator.test.js
const { addChar, deleteChar, compute, cos, sin, tan, sqrt, ln, percent } = require('./calculator');

describe('addChar', () => {
    let input;

    beforeEach(() => {
        input = { value: '0' }; // Mocking the input field
    });

    test('appends character to existing value', () => {
        input.value = '51';
        addChar(input, '2');
        expect(input.value).toBe('512');
    });
});

describe('Math Functions', () => {
    let form;

    beforeEach(() => {
        form = { display: { value: '' } }; // Mocking the form and display
    });

    test('computes cosine correctly', () => {
        form.display.value = '0';
        cos(form);
        expect(form.display.value).toBe(1);
    });

    test('computes sine correctly', () => {
        form.display.value = '0';
        sin(form);
        expect(form.display.value).toBe(0);
    });

    test('computes tangent correctly', () => {
        form.display.value = '0';
        tan(form);
        expect(form.display.value).toBe(0);
    });

    test('computes square root correctly', () => {
        form.display.value = '9';
        sqrt(form);
        expect(form.display.value).toBe(3);
    });

    test('computes natural logarithm correctly', () => {
        form.display.value = '1';
        ln(form);
        expect(form.display.value).toBe(0);
    });
});

describe('deleteChar and compute', () => {
    let input, form;

    beforeEach(() => {
        input = { value: '512' }; // Mocking input field
        form = { display: { value: '1+2' } }; // Mocking the form and display
    });

    test('deletes the last character from input', () => {
        deleteChar(input);
        expect(input.value).toBe('51');
    });

    test('evaluates with parentheses', () => {
        form.display.value = '(1+2)*2';
        compute(form);
        expect(form.display.value).toBe(6);
    });
});

describe('Edge Cases and Validation', () => {
    let form;

    beforeEach(() => {
        form = { display: { value: '' } };
    });

    test('handles percent functionality', () => {
        const input = { value: '50' };
        percent(input);
        expect(input.value).toBe('50%');
    });
});
