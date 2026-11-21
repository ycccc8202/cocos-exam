/**
 * Q2：参考视频玩法还原 —— 拔针收集金币（Pull the Pin）
 *
 * 视频玩法：上方沙漏形容器装金币，中部交叉的针既作阻挡又作滑道；
 * 玩家逐根拔针，改变金币的下落路径，使其全部落入左下方的罐子。
 *
 * 本文件为入口：加载金币序列帧 → 绑定 Q2.fire 中已放置的容器/针/瓶子 → 驱动主控。
 * 不创建也不修改场景中已有的主体节点，针的几何由节点真实 position/angle/size 读取。
 * 死局判定见 Q2Game._evaluate（由当前关卡状态推导，非固定步骤/时间）。
 * 完整规则与运行说明见同目录 README_ANSWER.md。
 */

const { ccclass } = cc._decorator;

import { Q2Assets } from './Q2Assets';
import { Q2Game } from './Q2Game';

@ccclass
export default class Q2 extends cc.Component {
    private _game: Q2Game | null = null;
    private _loadingLabel: cc.Node | null = null;

    protected start(): void {
        // 移除题目提示节点
        const hint = this.node.getChildByName('ExamHint');
        if (hint) { hint.active = false; }

        // 加载提示
        const label = new cc.Node('Loading');
        label.setAnchorPoint(0.5, 0.5);
        const lbl = label.addComponent(cc.Label);
        lbl.string = '资源加载中…';
        lbl.fontSize = 22;
        lbl.lineHeight = 30;
        this.node.addChild(label);
        this._loadingLabel = label;

        const self = this;
        Q2Assets.loadAll(function (ok: boolean, errMsg?: string) {
            if (label && label.isValid) { label.destroy(); }
            self._loadingLabel = null;
            if (!ok) {
                const errNode = new cc.Node('LoadError');
                errNode.setAnchorPoint(0.5, 0.5);
                const el = errNode.addComponent(cc.Label);
                el.string = '资源加载失败：' + (errMsg || '未知错误');
                el.fontSize = 18;
                self.node.addChild(errNode);
                cc.error('[Q2] ' + el.string);
                return;
            }
            // 幂等保护：无论何种原因重复回调，都只允许创建一个 Q2Game，
            // 否则会再生成一整套金币节点，画面上金币数量直接翻倍。
            if (self._game) { return; }
            self._game = new Q2Game(self.node);
            cc.log('[Q2] 玩法已启动，开始拔针吧');
        });
    }

    protected update(dt: number): void {
        if (this._game) { this._game.update(dt); }
    }

    protected onDestroy(): void {
        if (this._game) { this._game.dispose(); this._game = null; }
    }
}
