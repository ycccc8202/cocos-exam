/**
 * Q2Game —— 主控：状态机 / 放流 / 死局判定 / 胜负反馈 / 重开
 *
 * 关卡主体全部来自 Q2.fire 场景已放置的节点（backgound / hg / bottle），
 * 本类只在运行时读取它们的真实几何，并动态生成金币。
 *
 * 胜负定义（用户规则）：
 *   · 成功 = 上方金币最终**全部沿容器最左下角出口**掉落到罐子里；
 *   · 其余任何「无法全部进罐」的局面都算死局失败。
 *
 * 死局判定（题目核心）：只依赖当前关卡状态与真实物理结果，不用步数 / 时间 / 预设脚本。
 *   按 Q2.fire 真实几何，10 根斜针分成两组：
 *   · 右侧 5 根 / 形导流针 hg-2~hg-6：既是把金币导向最左下开口的滑道，又被视为
 *     5 个底部槽位各自的「遮挡」（拔针 → 对应那段斜底转 sensor，金币可真实漏下去）。
 *   · 左侧 5 根 \ 形交叉阻挡针 hg-7~hg-11 与闸门横针 hg-1：**不遮挡槽位**，
 *     拔它们只放行金币沿保留的 / 滑道向左下滑，最终全部从左下开口进罐 → 不算死局。
 *   判定分三层：
 *     ① 真实漏币：金币穿过开放槽位的斜底、落到 SLOT_FAIL_Y 以下 → Q2Coin 报 slot → 判负；
 *     ② 规则判定（当帧立即判负）：
 *        · GEO.FATAL_PINS（当前 = ['hg-2']）：拔出指定针 → 立刻死局。
 *          hg-2 是 slot0（紧挨左下成功开口）的唯一遮挡针，拔掉即敞开必经之地，无需等物理验证；
 *        · GEO.FATAL_ON_GUARD_PULL（默认关）：置 true 时拔右侧任意一根守卫针即判负；
 *     ③ 通用「无解」兜底：所有针都拔完（再无任何操作可做）、金币全部静止、
 *        却没能全部进罐 → 判负。用于覆盖几何异常 / 卡死等任何未预料的僵局。
 *   其余情况只要局面仍可能有解（针没拔完、金币还在动）就绝不提前判负（题目第 5 条）。
 */

import { GEO, SCENE, GameState, bowlScatter } from './Q2Config';
import { Q2Assets } from './Q2Assets';
import { Q2Level, GameUI } from './Q2Level';
import { Q2Pin } from './Q2Pin';
import { Q2Coin } from './Q2Coin';
import { Q2Physics } from './Q2Physics';

export class Q2Game {
    private _root: cc.Node;
    private _ui: GameUI | null = null;
    private _pinRoot: cc.Node | null = null;
    private _coinLayer: cc.Node | null = null;
    private _pins: Q2Pin[] = [];
    private _coins: Q2Coin[] = [];
    private _state: GameState = 'ready';
    private _hits: number = 0;
    /** 「所有针都拔完、金币却全部静止、还没全进罐」的持续时间（通用无解兜底） */
    private _stallT: number = 0;
    /** 判负后的「自然落定」倒计时：>0 表示还在让物理跑，0 表示已冻结定格，-1 表示未判负 */
    private _loseSettle: number = -1;
    /** 结算面板延迟出现的倒计时：>0 表示已定胜负、面板还没弹（这期间输入已锁），-1 表示无 */
    private _resultT: number = -1;
    /** 死局原因文本（面板延迟出现时用它填副标题） */
    private _loseReason: string = '';
    /** 死局主标题（默认「死 局」；金币真的落进槽位时为「失败」） */
    private _loseTitle: string = '';

    constructor(root: cc.Node) {
        this._root = root;

        // ---------- 读取场景已有节点 ----------
        const pinRoot = root.getChildByName(SCENE.PIN_ROOT);
        if (!pinRoot) {
            cc.error('[Q2] 场景中未找到针容器节点：' + SCENE.PIN_ROOT);
            return;
        }
        this._pinRoot = pinRoot;
        for (let i = 0; i < SCENE.PIN_NAMES.length; i++) {
            const node = pinRoot.getChildByName(SCENE.PIN_NAMES[i]);
            if (node) {
                this._pins.push(Q2Pin.bind(node));
            } else {
                cc.warn('[Q2] 场景缺少针节点：' + SCENE.PIN_NAMES[i]);
            }
        }
        if (this._pins.length === 0) { return; }

        // 启用 Box2D 物理世界：给场景已有针挂静态碰撞体、建容器壁导流板
        Q2Physics.enable();
        Q2Physics.bindPins(this._pins);
        Q2Physics.buildWalls(root);

        // 金币层插到 hg 之前：渲染顺序 backgound → bottle → coins → hg（针盖在金币上）
        const coinLayer = new cc.Node('CoinsLayer');
        root.addChild(coinLayer);
        coinLayer.setSiblingIndex(pinRoot.getSiblingIndex());
        this._coinLayer = coinLayer;

        const frames = Q2Assets.coinFrames();
        // 金币一创建就挂动态刚体（见 Q2Coin.reset），受重力落到 hg-1 横针上物理堆叠
        for (let i = 0; i < GEO.COIN_TOTAL; i++) {
            const pos = bowlScatter(i);
            this._coins.push(Q2Coin.create(coinLayer, frames, pos.x, pos.y, i, pos.phase));
        }

        this._ui = Q2Level.build(root);
        root.on(cc.Node.EventType.TOUCH_START, this._onTouch, this);
        this._ui.restartBtn.on(cc.Node.EventType.TOUCH_END, this._onRestart, this);
        this._refreshCount();
        cc.log('[Q2] 已绑定场景针 ' + this._pins.length + ' 根，金币 ' + this._coins.length + ' 枚');
    }

    /** Canvas 触摸 → 转换到 hg 局部坐标 → 找最近未拔针 */
    private _onTouch(e: cc.Event.EventTouch): void {
        if (this._state !== 'ready' && this._state !== 'playing') { return; }
        if (!this._pinRoot) { return; }
        const p = this._pinRoot.convertToNodeSpaceAR(e.getLocation());
        let best: Q2Pin | null = null;
        let bestD = Infinity;
        for (let i = 0; i < this._pins.length; i++) {
            const pin = this._pins[i];
            if (pin.removed) { continue; }
            const d = pin.distanceTo(p.x, p.y);
            if (d < GEO.TOUCH_RADIUS && d < bestD) { best = pin; bestD = d; }
        }
        if (best) { this._pull(best); }
    }

    private _pull(pin: Q2Pin): void {
        if (!pin.pull()) { return; }
        if (pin.isGate && this._state === 'ready') {
            // 闸门针 hg-1 拔出 → Q2Pin.pull() 已把它的碰撞体转为 sensor，碗内金币堆
            // 瞬间失去支撑、由 Box2D 自然下落。这里只把金币切到结算阶段，
            // 不再逐颗脚本放流 / 搬运到出口。
            this._state = 'playing';
            for (let i = 0; i < this._coins.length; i++) { this._coins[i].release(); }
            if (this._ui) { this._ui.hintLabel.node.active = false; }
        }
        this._syncSlots();
        this._evaluate();
    }

    /**
     * 同步 5 个底部槽位的「遮挡」状态：每个槽位只由右侧 1 根 / 形导流针遮挡
     * （SLOT_GUARD_PINS[i] 对应 slot i），这根针既是导向左下开口的滑道、也是槽位
     * 的唯一遮挡。它被拔出 → 槽位底墙转 sensor，金币可真实滑落进槽位，但会被
     * 槽位下方的绿色水平挡板接住、停在绿色线之上（由 Q2Coin 判 slot 失败）。
     *
     * 左侧 5 根 \ 形交叉阻挡针（SAFE_PINS）与闸门针 hg-1 **不参与槽位配对**：
     * 拔它们只放行金币继续沿保留的 / 滑道向左下滑，不会开放任何槽位，因此
     * 不判死局 —— 这正是玩家正解要逐根拔掉的针。
     */
    private _syncSlots(): void {
        for (let i = 0; i < GEO.SLOT_COUNT; i++) {
            const guard = GEO.SLOT_GUARD_PINS[i];
            if (!guard) { continue; }
            let unblocked = false;
            for (let j = 0; j < this._pins.length; j++) {
                if (this._pins[j].name === guard && this._pins[j].removed) {
                    unblocked = true;
                    break;
                }
            }
            Q2Physics.setSlotOpen(i, unblocked);
        }
    }

    public update(dt: number): void {
        // 拔出动画在任何状态下都要推进
        for (let i = 0; i < this._pins.length; i++) { this._pins[i].update(dt); }

        // 结算面板延迟出现：胜负成立那一帧只「锁输入」（_onTouch 在状态非 ready/playing
        // 时直接早退，点了也没反应），面板本身要等 RESULT_UI_DELAY 秒后才淡入，
        // 让玩家先看完金币落定。放在最前面，保证判负落定（_loseSettle）期间也在计时。
        if (this._resultT >= 0) {
            this._resultT -= dt;
            if (this._resultT <= 0) {
                this._resultT = -1;
                this._showResultUi();
            }
        }

        const playing = this._state === 'playing';
        // 金币在 ready 阶段就已经在物理世界里（碗内被 hg-1 托住自由堆叠），
        // 所以任何状态都要推进序列帧与轮廓约束；只有 playing 才做入罐 / 流失结算。
        for (let i = 0; i < this._coins.length; i++) {
            const result = this._coins[i].update(dt);
            // ★「金币真的落进槽格」优先级最高：只要物理上真有金币漏进下方槽位，
            //   结算文案永远是「失败 / 金币已落入槽内」，压过任何其它判负理由
            //   （拔针规则、预判、掉出罐外等）。
            if (result === 'slot') {
                if (playing) {
                    this._lose('金币已落入槽内', '失败');
                    return;
                }
                // 已经因为别的理由判负（例如拔 hg-2 预判无解）、但物理上随后真有金币落进
                // 槽格 —— 结算升级，等面板弹出时显示的就是「失败 / 金币已落入槽内」。
                this._promoteToSlotResult();
                continue;
            }
            if (playing) {
                if (result === 'jar') {
                    this._hits++;
                    this._refreshCount();
                } else if (result === 'miss') {
                    this._lose('金币掉出罐外，无法全部收集');
                    return;
                }
            }
        }

        // 判负后的「自然落定」：这 0.6s 里物理继续跑，让半空 / 正滑进槽底的金币
        // 落到该停的位置（槽底挡板、出口外面），随后统一冻结定格 ——
        // 否则会出现「金币冻在半空不动」的定格画面（用户反馈"左边怎么会有两个金币"）。
        if (this._loseSettle > 0) {
            this._loseSettle -= dt;
            if (this._loseSettle <= 0) {
                this._loseSettle = 0;
                for (let i = 0; i < this._coins.length; i++) { this._coins[i].freeze(); }
            }
            return;
        }
        if (this._loseSettle === 0) { return; }

        if (!playing) { return; }

        // 胜利：全部结算且全部入罐
        if (this._hits === GEO.COIN_TOTAL) {
            let allDone = true;
            for (let i = 0; i < this._coins.length; i++) {
                if (!this._coins[i].done) { allDone = false; break; }
            }
            if (allDone) { this._win(); return; }
        }

        // 通用「无解」兜底：所有针都拔完了（再无任何操作可做）、金币全部静止，
        // 却没能全部进罐 —— 无论起因是几何异常、卡住还是别的意外，这个局面都已无解。
        // 只要还有针可拔、或还有金币在动，就认为仍可能有解，绝不提前判负。
        if (this._remainingPins() === 0) {
            let moving = false;
            for (let i = 0; i < this._coins.length; i++) {
                if (this._coins[i].isMoving) { moving = true; break; }
            }
            this._stallT = moving ? 0 : this._stallT + dt;
            if (this._stallT >= GEO.STALL_TIME) {
                this._lose('金币卡在中途，已无解');
            }
        } else {
            this._stallT = 0;
        }
    }

    /** 还没被拔掉的针数（= 玩家剩余可选操作数） */
    private _remainingPins(): number {
        let n = 0;
        for (let i = 0; i < this._pins.length; i++) {
            if (!this._pins[i].removed) { n++; }
        }
        return n;
    }

    /**
     * 拔针后的复检：只在「按规则已可确定无解」时才判负。
     *
     * ① GEO.FATAL_PINS（当前 = ['hg-2']）：拔出指定针 → 判死局。
     *    **但会先预判**（GEO.FATAL_PIN_PREJUDGE，默认开）：拔针当帧检查「剩余金币还能不能
     *    全部进罐」——只要还有一枚未结算的金币中心在出口右缘 -68 的右侧，它接下来必须
     *    横穿槽位区才能到左下出口，slot0 已敞开 → 必漏 → 判负；反之所有未结算金币都已进到
     *    出口列（x ≤ -68），它们只会垂直落进罐口，拔 hg-2 不会有任何损失 → 不判负，关卡继续。
     *    这就是「金币都能掉进罐子的时候，拔 hg-2 也不算失败」的实现。
     *
     * ② GEO.FATAL_ON_GUARD_PULL（默认 false）：置 true 时拔右侧任意一根守卫针即判负（不做预判）。
     *
     * ③ 默认都不命中时不在这里判负：拔掉其它守卫针只是让对应槽位的斜底变成 sensor，
     *    是否真的漏币由物理决定 —— 金币真漏下去时 Q2Coin 会报 slot（见 update），
     *    这才是可确定的无解证据。这样拔掉 hg-3~hg-6 这类「金币根本不会经过」的
     *    守卫针时不会误判（实测仍可 48/48 全收集）。
     *
     * 左侧 \ 针与 hg-1 不参与槽位开关，拔它们永不触发判负。
     */
    private _evaluate(): boolean {
        if (this._state !== 'ready' && this._state !== 'playing') { return false; }
        for (let i = 0; i < GEO.FATAL_PINS.length; i++) {
            const name = GEO.FATAL_PINS[i];
            let pulled = false;
            for (let j = 0; j < this._pins.length; j++) {
                if (this._pins[j].name === name && this._pins[j].removed) { pulled = true; break; }
            }
            if (!pulled) { continue; }
            if (GEO.FATAL_PIN_PREJUDGE && !this._fatalPinDoomed()) {
                cc.log('[Q2] ' + name + ' 已拔出，但剩余金币都在出口列内、仍可全部入罐 → 不判负');
                continue;
            }
            this._lose('金币最终会落入底部槽位');
            return true;
        }
        if (GEO.FATAL_ON_GUARD_PULL && Q2Physics.hasOpenSlot()) {
            this._lose('右侧遮挡针已拔，金币会从底部槽位漏走');
            return true;
        }
        return false;
    }

    /**
     * 「拔即死」针的**预判**：剩下的金币还有没有可能全部进罐（纯几何，不跑模拟）。
     *
     * 判据：左下出口列 = x ≤ GEO.CHAMBER_GAP_RIGHT(-68)。出口列里的金币只会被两侧
     * 壁夹住、垂直落进罐口（有摆速也不可能横穿回槽位区）；而 x > -68 的未结算金币
     * 处在槽位区右侧 / 上方，要想到达左下出口就必须横穿槽位区，slot0 一敞开必然漏进
     * 去 —— 所以只要有这样一枚，局面就真的无解。
     *
     * 已结算（done：进罐 / 流失）的金币不参与预判；已经进槽（trapped）的金币本就走
     * 物理漏币判负，无需在这里重复。
     */
    private _fatalPinDoomed(): boolean {
        for (let i = 0; i < this._coins.length; i++) {
            const c = this._coins[i];
            if (c.done) { continue; }
            if (c.x > GEO.CHAMBER_GAP_RIGHT) { return true; }
        }
        return false;
    }

    private _refreshCount(): void {
        if (this._ui) { this._ui.countLabel.string = '金币 ' + this._hits + ' / ' + GEO.COIN_TOTAL; }
    }

    /**
     * 结算（胜利 / 死局）时铺上「半透明遮罩 + 半透明圆角底板」：
     * 遮罩把底层画面整体压暗，让结果文字与重开按钮跳出来；底板承载文字。
     * 两者都从透明淡入（0.22s），避免硬切；重开时立即隐藏。
     */
    private _showResultBg(): void {
        if (!this._ui) { return; }
        const nodes: cc.Node[] = [this._ui.resultMask, this._ui.resultPanel];
        for (let i = 0; i < nodes.length; i++) {
            if (!nodes[i]) { continue; }
            cc.Tween.stopAllByTarget(nodes[i]);
            nodes[i].active = true;
            nodes[i].opacity = 0;
            cc.tween(nodes[i]).to(0.22, { opacity: 255 }).start();
        }
    }

    private _hideResultBg(): void {
        if (!this._ui) { return; }
        const nodes: cc.Node[] = [this._ui.resultMask, this._ui.resultPanel];
        for (let i = 0; i < nodes.length; i++) {
            if (!nodes[i]) { continue; }
            cc.Tween.stopAllByTarget(nodes[i]);
            nodes[i].active = false;
        }
    }

    private _win(): void {
        this._state = 'win';
        // 输入当帧就锁（_onTouch 只响应 ready/playing），面板延迟弹出
        this._resultT = Math.max(0, GEO.RESULT_UI_DELAY);
        cc.log('[Q2] 胜利：全部 ' + GEO.COIN_TOTAL + ' 枚金币入罐');
    }

    private _lose(reason: string, title: string = '死 局'): void {
        if (this._state === 'lose') { return; }
        this._state = 'lose';
        // 判负后不立刻冻结：先跑 LOSE_SETTLE_TIME 让金币自然落定（落进槽底挡板 /
        // 出口外面 / 斜底上），再统一冻结定格。见 update() 里的 _loseSettle 分支。
        this._loseSettle = GEO.LOSE_SETTLE_TIME;
        this._loseReason = reason;
        this._loseTitle = title;
        // 输入当帧就锁（_onTouch 只响应 ready/playing），面板延迟弹出
        this._resultT = Math.max(0, GEO.RESULT_UI_DELAY);
        cc.log('[Q2] ' + title + '：' + reason);
    }

    /**
     * 把「已经判负的结算」升级为物理漏币结论 —— 因为**金币真的落进槽格优先级最高**。
     *
     * 典型场景：拔 hg-2 时预判为无解、面板文案先写成「死 局 / 金币最终会落入底部槽位」，
     * 随后物理上金币真的穿过 slot0 的敞开斜底落进槽格 —— 此时文案要改成
     * 「失败 / 金币已落入槽内」，与实际画面一致。
     *
     * 只改文案、不改状态与计时：面板还没弹出时，弹出即用新文案；
     * 若面板已经弹出，就地刷新两行文字（不重播淡入）。
     */
    private _promoteToSlotResult(): void {
        if (this._state !== 'lose') { return; }
        if (this._loseTitle === '失败' && this._loseReason === '金币已落入槽内') { return; }
        this._loseTitle = '失败';
        this._loseReason = '金币已落入槽内';
        if (this._ui && this._ui.resultLabel.node.active) {
            this._ui.resultLabel.string = this._loseTitle;
            this._ui.reasonLabel.string = this._loseReason;
        }
        cc.log('[Q2] 物理上有金币落进槽格 → 结算升级为「失败 / 金币已落入槽内」');
    }

    /** 延时到点后统一弹出结算：遮罩 + 底板（淡入）+ 主标题 + 副标题 + 重开按钮 */
    private _showResultUi(): void {
        if (!this._ui) { return; }
        this._showResultBg();
        const win = this._state === 'win';
        const rl = this._ui.resultLabel;
        rl.node.active = true;
        rl.string = win ? '成 功' : (this._loseTitle || '死 局');
        rl.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        rl.node.color = win ? new cc.Color(255, 226, 130, 255) : new cc.Color(255, 120, 110, 255);
        const rs = this._ui.reasonLabel;
        rs.node.active = true;
        rs.string = win ? (GEO.COIN_TOTAL + ' 枚金币已全部收入罐中') : this._loseReason;
        rs.node.color = win ? new cc.Color(226, 232, 240, 255) : new cc.Color(255, 176, 170, 255);
        this._ui.restartBtn.active = true;
    }

    /** 重新开始：所有针 / 金币 / 状态一并恢复，无事件重复绑定、无残留对象 */
    private _onRestart(): void {
        this._state = 'ready';
        this._hits = 0;
        this._stallT = 0;
        this._loseSettle = -1;
        this._resultT = -1;
        this._loseReason = '';
        this._loseTitle = '';
        // 先恢复针节点（拔出动画可能把节点 active 置 false）与 hg-1 的碰撞体，
        // 再重置金币：顺序很重要，否则金币一挂上刚体就直接漏进下方针阵。
        for (let i = 0; i < this._pins.length; i++) { this._pins[i].reset(); }
        Q2Physics.resetPins(this._pins);
        Q2Physics.resetSlots();
        for (let i = 0; i < this._coins.length; i++) { this._coins[i].reset(); }
        if (this._ui) {
            this._hideResultBg();
            this._ui.resultLabel.node.active = false;
            this._ui.reasonLabel.node.active = false;
            this._ui.restartBtn.active = false;
            this._ui.hintLabel.node.active = true;
        }
        this._refreshCount();
        cc.log('[Q2] 关卡已重置');
    }

    public dispose(): void {
        this._root.off(cc.Node.EventType.TOUCH_START, this._onTouch, this);
        if (this._ui) { this._ui.restartBtn.off(cc.Node.EventType.TOUCH_END, this._onRestart, this); }
        Q2Physics.dispose();
    }
}
