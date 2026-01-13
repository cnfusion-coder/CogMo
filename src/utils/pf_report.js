import {PDFDocument} from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import dengxianFont from "../assets/fonts/FZZDXK.ttf"
import heitiFont from "../assets/fonts/FZHTK.ttf"
import {dateFormat, splitStringByInterval} from "./global.js"

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
 * @typedef  {{ 
 *    taskId: number, 
 *    name: string, 
 *    gender: string, 
 *    age: number, 
 *    educationBackground: string, 
 *    trainingBackground: string, 
 *    cognitiveFeatures: string, 
 *    sleep: string, 
 *    motivation: string, 
 *    emotion: string, 
 *    relationships: string, 
 *    subjectiveFeeling: string, 
 *    workStatus: string, 
 *    workEnvironment: string, 
 *    isTaskCompleted: boolean, 
 *    seriousErrorCount: number, 
 *    misoperationCount: number, 
 *    emotionalAwareness: string, 
 *    teamwork: string, 
 *    workPerformance: string, 
 *    score: number, 
 *    overallEvaluation: string 
 * }} PerformanceReportData
 */

export async function performance_pdf(data) {
    if (!inited) await init();

    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit)
    const heiti = await pdfDoc.embedFont(myFonts.heiti);
    const dengxian = await pdfDoc.embedFont(myFonts.dengxian);

    const h = pageHelper(550, 750);
    const page = pdfDoc.addPage(h.get());

    page.drawText(
        "绩效评价报告",
        h.p({left: 200, top: 50}, {font: heiti})
    );

    const fontSize = 12;
    const baseLineHeight = 24;
    const tableBase = 100;
    const contentBase = 117;
    const sidePadding = 40;

    let rtb = tableBase;
    let rcb = contentBase;

    page.drawText(
        dateFormat(Date.now()),
        h.p({right: 160, top: 90}, {font: dengxian, size: 16})
    )

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
    textbf("绩效信息");
    nextLine();

    const fields = [
        { label: "目标任务", value: data.taskId },
        { label: "姓名", value: data.name },
        { label: "性别", value: data.gender },
        { label: "年龄", value: data.age },
        { label: "教育背景", value: data.educationBackground },
        { label: "培训背景", value: data.trainingBackground },
        { label: "认知特征", value: data.cognitiveFeatures },
        { label: "睡眠情况", value: data.sleep },
        { label: "工作动机", value: data.motivation },
        { label: "情绪状态", value: data.emotion },
        { label: "人际关系", value: data.relationships },
        { label: "主观感受", value: data.subjectiveFeeling },
        { label: "工作状态", value: data.workStatus },
        { label: "工作环境", value: data.workEnvironment },
        { label: "任务是否完成", value: data.isTaskCompleted ? '是' : '否' },
        { label: "严重错误次数", value: data.seriousErrorCount },
        { label: "误操作次数", value: data.misoperationCount },
        { label: "情绪感知能力", value: data.emotionalAwareness },
        { label: "团队协作能力", value: data.teamwork },
        { label: "工作绩效表现", value: data.workPerformance },
        { label: "得分", value: data.score },
        { label: "总体评价", value: data.overallEvaluation }
    ];

    fields.forEach(field => {
        text(field.label);
        const preparedContent = splitStringByInterval(String(field.value), 29);
        divider((preparedContent.length === 0) ? 1 : preparedContent.length);
        preparedContent.forEach(e =>{
            text(e, 84)
            nextLine(1, false);
        });
        nextLine((preparedContent.length === 0) ? 1 : 0);
    });

    endSideLine();

    return URL.createObjectURL(new Blob([await pdfDoc.save()], {type: "application/pdf"}));
}