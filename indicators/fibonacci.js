const levelsOverrided = [0, 0.236, 0.33, 0.382, 0.5, 0.618, 0.66, 0.786, 1, 1.414, 1.618];

function fibonacciRetrecement({levels} = {}) {
    console.log(levels)
    if (!levels || typeof levels !== 'object' || Array.isArray(levels) || Object.keys(levels).length === 0) {
        throw new Error('Unable to compute fib trace with the referenced `levels`');
    }

    const zero = Number(levels[0]);
    const one = Number(levels[1]);

    if (isNaN(zero) || isNaN(one)) {
        return {};
    }

    const distance = Math.abs(one - zero);
    const operation = one > zero ? (first, second) => first - second : (first, second) => first + second;

    return Object.fromEntries(
        levelsOverrided.map(level => {
            const difference = (1 - level) * distance;
            const value = operation(Number(levels[1]), difference);
            return [level, value];
        })
    );
}


module.exports = {
    fibonacciRetrecement
}
