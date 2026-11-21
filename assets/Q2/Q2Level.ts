/**
 * Q2Level —— 游戏 UI 构建（纯补充元素）
 *
 * 场景主体（容器 backgound / 针 hg / 瓶子 bottle）已在 Q2.fire 中放置，
 * 本模块只创建题目允许用引擎组件补充的"文字 / 提示 / 重开按钮"。
 */

import { GEO } from './Q2Config';

export interface GameUI {
    root: cc.Node;
    countLabel: cc.Label;
    hintLabel: cc.Label;
    /** 结算主标题（「成 功」/「死 局」） */
    resultLabel: cc.Label;
    /** 结算副标题：胜利提示语 / 死局原因（自动换行，限制在底板内） */
    reasonLabel: cc.Label;
    /** 结算时铺满全屏的半透明遮罩（压暗底层画面，让结果文字更清晰） */
    resultMask: cc.Node;
    /** 结算文字背后的半透明圆角底板 */
    resultPanel: cc.Node;
    restartBtn: cc.Node;
}

export class Q2Level {
    private static labelNode(name: string, str: string, fontSize: number, color: cc.Color): cc.Node {
        const node = new cc.Node(name);
        node.setAnchorPoint(0.5, 0.5);
        const label = node.addComponent(cc.Label);
        label.string = str;
        label.fontSize = fontSize;
        label.lineHeight = fontSize + 6;
        label.overflow = cc.Label.Overflow.NONE;
        // 系统字体 + CHAR 缓存，避免 Arial 中文字形碎片
        (label as any).fontFamily = 'Arial';
        label.cacheMode = cc.Label.CacheMode.CHAR;
        node.color = color;
        return node;
    }

    public static build(parent: cc.Node): GameUI {
        const ui = new cc.Node('GameUI');
        ui.setAnchorPoint(0.5, 0.5);
        parent.addChild(ui);

        const title = Q2Level.labelNode('Title', '拔 针 · 收 集 金 币', 24, new cc.Color(255, 214, 120, 255));
        title.setPosition(0, 480);
        ui.addChild(title);

        const count = Q2Level.labelNode('Count', '', 20, new cc.Color(255, 236, 180, 255));
        count.setPosition(0, 440);
        ui.addChild(count);

        const hint = Q2Level.labelNode('Hint', '拔掉挡住金币的横针，再逐根拔左侧斜针放行；右侧斜针千万别拔', 15,
            new cc.Color(190, 205, 220, 255));
        hint.setPosition(0, -440);
        ui.addChild(hint);

        const result = Q2Level.labelNode('Result', '', 36, new cc.Color(255, 226, 130, 255));
        result.setPosition(0, 328);
        result.active = false;
        ui.addChild(result);

        // 结算副标题（死局原因可能很长，必须限定宽度自动换行，不能顶出底板）
        const reason = Q2Level.labelNode('Reason', '', 17, new cc.Color(226, 232, 240, 255));
        reason.setContentSize(520, 0);
        const reasonLb = reason.getComponent(cc.Label) as cc.Label;
        reasonLb.overflow = cc.Label.Overflow.RESIZE_HEIGHT;
        reasonLb.enableWrapText = true;
        reasonLb.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        reason.setPosition(0, 266);
        reason.active = false;
        ui.addChild(reason);

        // 结算遮罩：铺满可视区域的半透明黑，压暗底层画面（不拦截触摸，重开按钮仍可点）
        const mask = new cc.Node('ResultMask');
        mask.setAnchorPoint(0.5, 0.5);
        const maskG = mask.addComponent(cc.Graphics);
        const vr = (cc as any).visibleRect;
        const vw = vr ? vr.width : cc.winSize.width;
        const vh = vr ? vr.height : cc.winSize.height;
        // 四周各多铺 200，任何分辨率 / 黑边都不会露底
        maskG.fillColor = new cc.Color(6, 8, 14, 125);
        maskG.rect(-vw * 0.5 - 200, -vh * 0.5 - 200, vw + 400, vh + 400);
        maskG.fill();
        mask.active = false;
        ui.addChild(mask);

        // 结算底板：文字与按钮背后的半透明圆角卡片（580x320，中心 y=260 —— 用户要求整体上移 200）
        // 高度收到 320：顶边 420，与上方「金币 N/48」计数行（底边约 427）留出间隙，不会压字。
        const panel = new cc.Node('ResultPanel');
        panel.setAnchorPoint(0.5, 0.5);
        panel.setPosition(0, 260);
        const panelG = panel.addComponent(cc.Graphics);
        panelG.fillColor = new cc.Color(10, 13, 20, 205);
        panelG.roundRect(-290, -160, 580, 320, 20);
        panelG.fill();
        panelG.strokeColor = new cc.Color(255, 214, 120, 110);
        panelG.lineWidth = 2;
        panelG.roundRect(-290, -160, 580, 320, 20);
        panelG.stroke();
        panel.active = false;
        ui.addChild(panel);

        // 重开按钮：Graphics 圆角底 + 独立 Label 子节点（避免 Label 改写本节点尺寸）
        const btn = new cc.Node('RestartBtn');
        btn.setAnchorPoint(0.5, 0.5);
        btn.setPosition(0, 175);
        btn.setContentSize(220, 64);
        const g = btn.addComponent(cc.Graphics);
        g.fillColor = new cc.Color(38, 110, 165, 240);
        g.roundRect(-110, -32, 220, 64, 14);
        g.fill();
        const btnLabel = Q2Level.labelNode('BtnLabel', '重新开始', 22, new cc.Color(255, 255, 255, 255));
        btn.addChild(btnLabel);
        btn.active = false;
        ui.addChild(btn);

        // 层序：标题/计数/提示 → 遮罩 → 底板 → 结果文字 → 重开按钮
        // （遮罩压在提示文字之上，才能把整屏都压暗；重开按钮在最上层，保证可点）
        mask.setSiblingIndex(3);
        panel.setSiblingIndex(result.getSiblingIndex());

        return {
            root: ui,
            countLabel: count.getComponent(cc.Label) as cc.Label,
            hintLabel: hint.getComponent(cc.Label) as cc.Label,
            resultLabel: result.getComponent(cc.Label) as cc.Label,
            reasonLabel: reasonLb,
            resultMask: mask,
            resultPanel: panel,
            restartBtn: btn
        };
    }
}
