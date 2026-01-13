import {PDFDocument} from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'

import dengxianFont from "../assets/fonts/FZZDXK.ttf"
import heitiFont from "../assets/fonts/FZHTK.ttf"
import {dateFormat, interpolatePoints, splitStringByInterval} from "./global.js";


/**
 * @typedef  {{
 *    simulate_date: number,
 *    task: {
 *        name: string,
 *        description: string,
 *        evaluationPurpose: string
 *    },
 *    workload: {
 *        trunk_active_times: number,
 *        total_active_times: {
 *            data: number,
 *            reference_value: number
 *        },
 *        trunk_workload: number,
 *        total_workload: {
 *            data: number,
 *            reference_value: number
 *        },
 *        condition_description: string,
 *        performance_chart: HeatPoint[]
 *    }
 * }} WorkloadReportData
 */


/**
 * 绘制第一象限折线图
 * 保证数据集内数据均处于 (0, 0) 与 (maxX, maxY) 内
 * @param {number} width 折线图的宽度
 * @param {number} height 折线图的高度
 * @param {number} maxX 横坐标最大端点
 * @param {number} maxY 纵坐标最大端点
 * @param {function(x1: number, y1: number, x2: number, y2: number)} drawLine 折线图绘制函数
 * @param {[number, number][]} points 数据集[x, y] （已按照 x 升序排序）
 */
function drawLineChart(
    width,
    height,
    maxX,
    maxY,
    drawLine,
    points
) {
    if (points.length < 2) return;

    const mapX = (x) => (x / maxX) * width;
    const mapY = (y) => height - (y / maxY) * height;

    for (let i = 0; i < points.length - 1; i++) {
        const [x1, y1] = points[i];
        const [x2, y2] = points[i + 1];
        drawLine(mapX(x1), mapY(y1), mapX(x2), mapY(y2));
    }
}

/**
 * 绘制第一象限折线图
 * 保证数据集内数据均处于 (0, 0) 与 (maxX, maxY) 内
 * @param {number} width 折线图的宽度
 * @param {number} height 折线图的高度
 * @param {number} maxX 横坐标最大端点
 * @param {number} maxY 纵坐标最大端点
 * @param {function(x: number, y: number)} drawPoint 折线图绘制函数
 * @param {[number, number][]} points 数据集[x, y] （已按照 x 升序排序）
 */
function drawPoints(
    width,
    height,
    maxX,
    maxY,
    drawPoint,
    points
) {
    const mapX = (x) => (x / maxX) * width;
    const mapY = (y) => height - (y / maxY) * height;
    points.forEach(e => {
        drawPoint(mapX(e[0]), mapY(e[1]));
    });
}

let inited = false;

const myFonts = {
    dengxian: undefined,
    heiti: undefined
};


async function init() {
    myFonts.dengxian = await fetch(dengxianFont).then((res) => res.arrayBuffer());
    myFonts.heiti = await fetch(heitiFont).then((res) => res.arrayBuffer());
    inited = true;
}

function pageHelper(width, height) {

    /**
     * @param e {{
     *     left?: number,
     *     right?: number,
     *     bottom?: number,
     *     top?: number
     * }}
     * @param {object} o
     * @return {{x: number, y: number}}
     */
    function p(e, o = {}) {
        if (e.left !== undefined) {
            o.x = e.left;
        } else if (e.right !== undefined) {
            o.x = width - e.right;
        }

        if (e.bottom !== undefined) {
            o.y = e.bottom;
        } else if (e.top !== undefined) {
            o.y = height - e.top;
        }

        return o;
    }

    return {get: () => [width, height], p}
}

/**
 * @param data {WorkloadReportData}
 * @return {Promise<string>}
 */
export async function workload_pdf(data) {

    console.log(data);

    if (!inited) await init();

    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit)
    const heiti = await pdfDoc.embedFont(myFonts.heiti);
    const dengxian = await pdfDoc.embedFont(myFonts.dengxian);


    const h = pageHelper(550, 750);

    const page = pdfDoc.addPage(h.get());

    page.drawText(
        "实验堆主控室控制任务认知负荷表",
        h.p({left: 95, top: 50}, {font: heiti})
    );

    page.drawText(
        dateFormat(data.simulate_date),
        h.p({right: 160, top: 90}, {font: dengxian, size: 16})
    )

    const fontSize = 13;
    const baseLineHeight = 24;
    const tableBase = 100;
    const contentBase = 117;
    const sidePadding = 40;


    let rtb = tableBase;
    let rcb = contentBase;

    function hline() {
        page.drawLine({
            start: h.p({left: sidePadding, top: rtb}),
            end: h.p({right: sidePadding, top: rtb})
        });
    }

    function nextLine(lh = 1, bl = true) {
        rtb += lh * baseLineHeight;
        rcb += lh * baseLineHeight;
        if (bl) hline();
    }

    function divider(lh = 1, left = 80) {
        page.drawLine({
            start: h.p({left: sidePadding + left, top: rtb}),
            end: h.p({left: sidePadding + left, top: rtb + lh * baseLineHeight})
        });
    }

    function text(content, left = 4, offsetY = 0, size = fontSize) {
        page.drawText(content, h.p(
            {left: sidePadding + left, top: rcb + offsetY},
            {font: dengxian, size}
        ));
    }

    function line(x0, y0, x1, y1) {
        page.drawLine({
            start: {x: x0, y: y0},
            end: {x: x1, y: y1},
        });
    }

    function point(x, y) {
        page.drawCircle({
            x, y, size: 1
        })
    }

    function textbf(content, left = 4) {
        page.drawText(content, h.p(
            {left: sidePadding + left, top: rcb},
            {font: heiti, size: fontSize}
        ));
    }

    function endSideLine() {
        page.drawLine({
            start: h.p({left: sidePadding, top: tableBase}),
            end: h.p({left: sidePadding, top: rtb})
        });
        page.drawLine({
            start: h.p({right: sidePadding, top: tableBase}),
            end: h.p({right: sidePadding, top: rtb})
        });
    }


    hline();

    textbf("任务信息");
    nextLine();

    text("任务名称");
    divider();
    text(data.task.name, 90)
    nextLine();

    text("任务描述");
    const preparedContent1 = splitStringByInterval(data.task.description, 29);
    divider((preparedContent1.length === 0) ? 1 : preparedContent1.length);
    preparedContent1.forEach(e =>{
        text(e, 84)
        nextLine(1, false);
    });
    nextLine((preparedContent1.length === 0) ? 1 : 0);

    text("评价目的");
    const preparedContent2 = splitStringByInterval(data.task.evaluationPurpose, 29);
    divider((preparedContent2.length === 0) ? 1 : preparedContent2.length);
    preparedContent2.forEach(e =>{
        text(e, 84)
        nextLine(1, false);
    });
    nextLine((preparedContent2.length === 0) ? 1 : 0);

    textbf("任务认知负荷");
    nextLine();

    text("单独脑区活动时间");
    divider(1, 110);
    text(data.workload.trunk_active_times, 120);
    nextLine();

    text("脑区总活动时间");
    divider(1, 110);
    text(data.workload.total_active_times.data, 120);
    divider(1, 300);
    text("参考", 304);
    text(data.workload.total_active_times.reference_value, 334);
    nextLine();

    text("单独脑区认知负荷");
    divider(1, 110);
    text(data.workload.trunk_workload, 120);
    nextLine();

    text("认知总负荷");
    divider(1, 110);
    text(data.workload.total_workload.data, 120);
    divider(1, 300);
    text("参考", 304);
    text(data.workload.total_workload.reference_value, 334);
    nextLine();

    text("工况重要描述");
    splitStringByInterval(data.workload.condition_description, 35)
        .forEach(e => {
            nextLine(1, false);
            text(e, 6)
    })
    nextLine();

    text("工作绩效热图");
    nextLine(1, false);
    text("实时脑力负荷值", 4, 5, 10)
    nextLine(1, false);
    // region 画图
    const chartPadding = 10;
    const leftTop = h.p({left: sidePadding + chartPadding,top: rtb + chartPadding});
    const rightBottom = h.p({right: sidePadding + chartPadding, top: rtb + 4 * baseLineHeight - chartPadding});
    const preparedDataset = data.workload.performance_chart
        .map(({tmr, workload}) => [tmr, workload])
        .filter((e) => e[0] !== 0 || e[1] !== 0);
    Math.max(...preparedDataset.map(([num]) => num));

    drawLineChart(
        rightBottom.x - leftTop.x,
        rightBottom.y - leftTop.y,
        Math.max(...preparedDataset.map(([x, _]) => x)),
        Math.max(...preparedDataset.map(([_, y]) => y)),
        (x0, y0, x1, y1) => {
            line(leftTop.x + x0, leftTop.y + y0, leftTop.x + x1,leftTop.y + y1)
        },
        interpolatePoints(preparedDataset)
    );
    drawPoints(
        rightBottom.x - leftTop.x,
        rightBottom.y - leftTop.y,
        Math.max(...preparedDataset.map(([x, _]) => x)),
        Math.max(...preparedDataset.map(([_, y]) => y)),
        (x, y) => {
            point(leftTop.x + x,leftTop.y + y)
        },
        preparedDataset
    )
    line(leftTop.x, leftTop.y, leftTop.x, rightBottom.y);
    line(leftTop.x, leftTop.y, leftTop.x - 2, leftTop.y - 4);
    line(leftTop.x, leftTop.y, leftTop.x + 2, leftTop.y - 4);
    line(rightBottom.x, rightBottom.y, leftTop.x, rightBottom.y);
    line(rightBottom.x, rightBottom.y, rightBottom.x - 4, rightBottom.y + 2);
    line(rightBottom.x, rightBottom.y, rightBottom.x - 4, rightBottom.y - 2);

    // endregion 画图
    nextLine(4, false);
    text("时间", 440,  -10, 10)
    nextLine()

    endSideLine();

    return URL.createObjectURL(new Blob([await pdfDoc.save()], {type: "application/pdf"}));
}