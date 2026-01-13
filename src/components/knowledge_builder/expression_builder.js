export function trueExpression(sortIndex = 0) {
    return {
        type: 'C',
        meta: true,
        not: false,
        separable: false,
        sortIndex
    }
}

export function falseExpression(sortIndex = 0) {
    return {
        type: 'C',
        meta: false,
        not: false,
        separable: false,
        sortIndex
    }
}

export function inputExpression(meta, sortIndex = 0) {
    return {
        type: 'I',
        meta,
        not: false,
        separable: false,
        sortIndex
    }
}

export function andExpression(first, second, sortIndex = 0) {
    return {
        type: 'A',
        meta: [first, second],
        not: false,
        separable: true,
        sortIndex
    }
}

export function orExpression(first, second, sortIndex = 0) {
    return {
        type: 'O',
        meta: [first, second],
        not: false,
        separable: true,
        sortIndex
    }
}

/*
* fun: (meta) => hash signal
*/
export function expressionInputMetaArray(expression = {}, fun = (meta = {}) => `${meta}`) {
    switch (expression.type) {
        case 'I':
            return [fun(expression.meta)]
        case 'A':
        case 'O':
            return [].concat(expressionInputMetaArray(expression.meta[0], fun), expressionInputMetaArray(expression.meta[1], fun))
        default:
            return []
    }
}

export function expressionDataStatistics(expressionList = [], fun = (meta = {}) => `${meta}`) {
    let usedMeta = []
    expressionList.forEach((expression) => {
        usedMeta = usedMeta.concat(expressionInputMetaArray(expression, fun))
    })
    return {
        sum: usedMeta.length,
        kindSum: (new Set(usedMeta)).size,
        expressionSum: expressionList.length
    }
}

export function checkExpressionList(list = []) {
    for (let i = 0; i < list.length; i++) {
        list[i].last = (i === list.length - 1)
    }
    return list
}

export function pushExpression(list = [], expression = {}) {
    list.push(expression)
    return checkExpressionList(list)
}

export function removeExpressionAt(list = [], index = -1) {
    if (index >= list.length || index < 0) {
        return list
    }
    list.splice(index, 1)
    return checkExpressionList(list)
}

export function splitExpression(list = [], index = -1) {
    if (index >= list.length || index < 0)
        return list

    const exp = list[index]

    if (!exp.separable)
        return list

    list.splice(index, 1, exp.meta[0], exp.meta[1])
    console.log(list)
    return checkExpressionList(list)
}

export function mergeExpression(list = [], start = -1, mergeType = '') {

    switch (mergeType) {
        case 'A': {
            if (start + 1 >= list.length || start < 0)
                return list

            list.splice(start, 2, andExpression(list[start], list[start + 1], list[start].sortIndex))
            return checkExpressionList(list)
        }
        case 'O': {
            if (start + 1 >= list.length || start < 0)
                return list

            list.splice(start, 2, orExpression(list[start], list[start + 1], list[start].sortIndex))
            return checkExpressionList(list)
        }
        case 'N': {
            if (start >= list.length || start < 0)
                return list

            if (list[start].type === 'C') {
                list[start].meta = !list[start].meta
            } else {
                list[start].not = !list[start].not
            }

            return list
        }
        default: {
            return list
        }
    }
}

function sym(value = '', meta = {}, blank = {right: false, left: false}) {
    return [{t: 'sym', value, meta, blank}]
}

function symLB(depth = 0) {
    return sym('(', {depth})
}

function symRB(depth = 0) {
    return sym(')', {depth})
}

export function isSymLB(symbol = {}) {
    return symbol.value === '('
}

export function isSymRB(symbol = {}) {
    return symbol.value === ')'
}

export function isSymBracket(symbol = {}) {
    return isSymLB(symbol) || isSymRB(symbol)
}

function kno(value) {
    return [{t: 'kno', value}]
}

export function isSym(part = {}) {
    return part.t === 'sym'
}

export function isKno(part = {}) {
    return part.t === 'kno'
}

function warpPart(listValue = [], depth = 0) {
    return symLB(depth).concat(listValue).concat(symRB(depth))
}

function prefixPart(listValue = [], prefix = '', rightBlank = true) {
    return sym(prefix, {}, {right: rightBlank, left: false}).concat(listValue)
}

function binaryPart(listValue1 = [], operation = '', listValue2 = [], leftBlank = true, rightBlank = true) {
    return listValue1.concat(sym(operation, {}, {left: leftBlank, right: rightBlank})).concat(listValue2)
}

export function symToString(symbol = {}) {
    if (!isSym(symbol)) return ''
    return (symbol.blank.left ? ' ' : '') + symbol.value + (symbol.blank.right ? ' ' : '')
}

export function expressionViewPart(exp, wrap = false, parentOperation = '', depth = 0) {
    switch (exp.type) {
        case 'A': {
            let nextDeep = wrap && parentOperation !== 'AND' || exp.not
            const res = binaryPart(
                expressionViewPart(exp.meta[0], true, 'AND', nextDeep ? depth + 1 : depth),
                'AND',
                expressionViewPart(exp.meta[1], true, 'AND', nextDeep ? depth + 1 : depth)
            )
            return exp.not ? prefixPart(warpPart(res, depth), 'NOT') : (wrap && parentOperation !== 'AND' ? warpPart(res, depth) : res)
        }
        case 'O': {
            let nextDeep = wrap && parentOperation !== 'OR' || exp.not
            const res = binaryPart(
                expressionViewPart(exp.meta[0], true, 'OR', nextDeep ? depth + 1 : depth),
                'OR',
                expressionViewPart(exp.meta[1], true, 'OR', nextDeep ? depth + 1 : depth)
            )
            return exp.not ? prefixPart(warpPart(res, depth), 'NOT') : (wrap && parentOperation !== 'OR' ? warpPart(res, depth) : res)
        }
        case 'C': {
            return exp.meta ? sym('TRUE') : sym('FALSE')
        }
        case 'I': {
            return exp.not ? prefixPart(kno(exp.meta), 'NOT') : kno(exp.meta)
        }
        default: {
            return sym('UNKNOWN')
        }
    }
}

export function checkResultExpressionList(expressionList = [], fun = (meta = {}) => `${meta}`) {
    let expressionSignalList = expressionList.map(e => (e.type === 'I' ? fun(e.meta) : undefined))
    let errorMap = [...expressionSignalList.map(e => (e === undefined))]
    for (let i = 0; i < expressionSignalList.length - 1; ++i) {
        if (errorMap[i] || expressionSignalList[i] === undefined) continue
        for (let j = i + 1; j < expressionSignalList.length; ++j) {
            if (expressionSignalList[j] === undefined) continue
            if (expressionSignalList[j] === expressionSignalList[i]) {
                errorMap[i] = errorMap[j] = true
            }
        }
    }
    return errorMap
}

export function editRequest(ifExpression = null, thenExpressions = []) {
    return {
        IF: ifExpression instanceof Object ? [ifExpression] : [],
        THEN: thenExpressions
    }
}

function fixExpressionSortIndex(expression = {}, sortIndex = 0, transformation = (base) => (++base)) {
    switch (expression.type) {
        case 'A':
        case 'O': {
            let middle0 = fixExpressionSortIndex(expression.meta[0], sortIndex);
            expression.meta[0] = middle0.expression;
            sortIndex = middle0.sortIndex;

            let middle1 = fixExpressionSortIndex(expression.meta[1], sortIndex);
            expression.meta[1] = middle1.expression;
            sortIndex = middle1.sortIndex;

            expression.sortIndex = sortIndex;
            sortIndex = transformation(sortIndex);
            return {expression, sortIndex};
        }
        default: {
            expression.sortIndex = sortIndex;
            sortIndex = transformation(sortIndex);
            return {expression, sortIndex};
        }
    }
}

export function fixExpressionListSortIndex(expressionList = [], sortIndex = 0, transformation = (base) => (++base)) {
    for (let i = 0; i < expressionList.length; ++i) {
        let middleware = fixExpressionSortIndex(expressionList[i], sortIndex, transformation);
        expressionList[i] = middleware.expression;
        sortIndex = middleware.sortIndex;
    }
    return {expressionList, sortIndex};
}