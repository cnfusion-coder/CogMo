const rgbMap = [
    '#ff6565',
    '#ffff7c',
    '#8dff8d',
    '#80ffff',
    '#9c9cff',
    '#ff9eff',
]

export function bracketColor(deepth = 0) {
    return rgbMap[deepth % rgbMap.length]
}

export function getId(data) {
    if (typeof data === 'number') {
        return data
    } return data.id
}

/**
 * @param ms
 * @return {Promise}
 */
export function delay(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

export const mapToArray = (obj, keyParser = {}) => {
    return Object.entries(obj).map(([key, value]) => {
        const parseKey = keyParser[key];
        if (typeof parseKey == "string") {
            return {key: parseKey, value};
        } else {
            return {key, value};
        }
    });
};

export function dateFormat(timemill) {
    const date = new Date(timemill);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
}

export function splitStringByInterval(s, a) {
    if (a <= 0) {
        return [s]; // 如果a小于等于0，直接返回原字符串作为数组的唯一元素
    }

    const result = [];
    for (let i = 0; i < s.length; i += a) {
        result.push(s.slice(i, i + a));
    }
    return result;
}

function cubicBezier(p0, p1, p2, p3, t) {
    const mt = 1 - t;
    return (
        mt * mt * mt * p0 +
        3 * mt * mt * t * p1 +
        3 * mt * t * t * p2 +
        t * t * t * p3
    );
}

/**
 * 对数据点进行线性插值，生成平滑的折线数据
 * @param {[number, number][]} points 原始点数组（要求按 x 升序）
 * @param {number} density 插值步长，例如 1 表示每隔1个x单位插值一次
 * @returns {[number, number][]} 插值后的点数组
 */
export function interpolatePoints(points, density = 20) {
    if (points.length < 2) return points;

    const result = [];

    // 计算控制点（简单处理）
    for (let i = 0; i < points.length - 1; i++) {
        const [x0, y0] = i > 0 ? points[i - 1] : points[i];
        const [x1, y1] = points[i];
        const [x2, y2] = points[i + 1];
        const [x3, y3] = i < points.length - 2 ? points[i + 2] : points[i + 1];

        // 计算控制点，使用 Catmull-Rom 转贝塞尔的方法（局部）
        const cp1x = x1 + (x2 - x0) / 6;
        const cp1y = y1 + (y2 - y0) / 6;
        const cp2x = x2 - (x3 - x1) / 6;
        const cp2y = y2 - (y3 - y1) / 6;

        // 插值
        for (let t = 0; t < 1; t += 1 / density) {
            const x = cubicBezier(x1, cp1x, cp2x, x2, t);
            const y = cubicBezier(y1, cp1y, cp2y, y2, t);
            result.push([x, y]);
        }
    }

    // 追加最后一点
    result.push(points[points.length - 1]);

    return result;
}
