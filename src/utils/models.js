/**
 * @typedef {{
 *     name: string,
 *     value: string,
 *     view: string,
 *     tint: string
 * }} TrunkType
 */

/**
 * @type {TrunkType[]}
 */

export const trunktypes = [
    {
        name: '空 Null',
        value: 'N',
        view: 'NULL',
        tint: '#cbcbcb'
    },
    {
        name: '想象 Imagine',
        value: 'I',
        view: 'IMAGINE',
        tint: '#a7ff22'

    },
    {
        name: '运动 Motor',
        value: 'M',
        view: 'MOTOR',
        tint: '#ff771b'
    },
    {
        name: '目标 Goal',
        value: 'G',
        view: 'GOAL',
        tint: '#fff825'
    },
    {
        name: '言语 Speech',
        value: 'S',
        view: 'SPEECH',
        tint: '#1eff9e'
    },
    {
        name: '陈述 Declarative',
        value: 'D',
        view: 'DECLARATIVE',
        tint: '#306bff'
    },
    {
        name: '视觉 Vision',
        value: 'V',
        view: 'VISION',
        tint: '#d52bff'
    },
    {
        name: '听觉 Aural',
        value: 'A',
        view: 'AURAL',
        tint: '#3cffff'
    },
    {
        name: '程序 Procedural',
        value: 'P',
        view: 'PROCEDURAL',
        tint: '#ff2982'
    },
]

/**
 * @param {string} name
 * @return {TrunkType}
 */
export function getTrunkType(name) {
    const targets = trunktypes.filter(e => e.view === name || e.value === name);
    if (targets.length === 0) return trunktypes[0];
    return targets[0];
}

export const trunkTypeFilters = trunktypes.map(e => ({
    text: e.name,
    value: e.value
}));

export const parseTrunkType = (dk) => {
    if (!dk) return trunktypes[0]
    if (typeof dk.trunktype === "string") return trunktypes.filter(e => e.value === dk.trunktype || e.view === dk.trunktype)[0]
    return dk.trunktype
}