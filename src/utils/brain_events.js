// 基础事件结构
class SendableEvent {
    constructor(event, data) {
        this.event = event;
        this.data = typeof data === 'object' ? data : {};
        this.time_mill = Date.now();
    }

    toJSON() {
        return {
            event: this.event,
            data: this.data,
            time_mill: this.time_mill,
        };
    }
}

// Debug事件
class DebugEventData {
    constructor(msg) {
        this.msg = msg;
    }
}

// AddLevel事件
class AddBrainLevelEventData {
    constructor(index, value, commit = '') {
        this.index = index;
        this.value = value;
        this.commit = commit;
    }
}

function addLevelEvent(index, level, commit = '') {
    return new SendableEvent('add_brain_level', new AddBrainLevelEventData(index, level, commit));
}

// SetLevel事件
class SetBrainLevelEventData {
    constructor(index, value, commit = '') {
        this.index = index;
        this.value = value;
        this.commit = commit;
    }
}

function setLevelEvent(index, level, commit = '') {
    return new SendableEvent('set_brain_level', new SetBrainLevelEventData(index, level, commit));
}

function setLevelEvents(level, commit = '', ...indexList) {
    return indexList.map(i => setLevelEvent(i, level, commit));
}

// ResetLevel事件
class ResetBrainLevelEventData {
    constructor(index, commit = '') {
        this.index = index;
        this.commit = commit;
    }
}

function resetLevelEvent(index, commit = '') {
    return new SendableEvent('reset_brain_level', new ResetBrainLevelEventData(index, commit));
}

// 行为模块事件标记
const BrainBehavior = {
    aural: 0,
    vision: 1,
    declarative: 2,
    imagine: 3,
    procedural: 4,
    speech: 5,
    motor: 6
};

// 行为模块对应脑区标记
const BrainRegion = [
    [5, 10],
    [2, 7],
    [4, 9],
    [6, 1],
    [10, 5],
    [1, 5, 6, 10],
    [1, 6],
];

/**
 * @param {string | number} motorId
 * @return {number[]}
 */
function getBehaviorEventGenerator(motorId) {
    if (typeof motorId === 'string') {
        motorId = motorId.toLowerCase();
        if (!(motorId in BrainBehavior)) {
            console.warn(`Unknown Motor Name: ${motorId}`);
            return [];
        }
        motorId = BrainBehavior[motorId];
    } else if (typeof motorId === "number") {
        if (motorId < 0 && motorId > 6) {
            console.warn(`Unknown Motor Index: ${motorId}`);
            return [];
        }
    } else {
        console.warn(`Unknown Motor Input Type: ${typeof motorId}`);
        return [];
    }

    return BrainRegion[motorId];
}

// 导出模块
export {
    addLevelEvent,
    setLevelEvent,
    setLevelEvents,
    resetLevelEvent,
    getBehaviorEventGenerator,
    BrainBehavior,
};
