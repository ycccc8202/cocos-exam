/**
 * Q2Coin —— 金币：真实物理掉落 / 沿针滑落 / 堆叠（Box2D）+ 入罐 / 流失 / 槽位结算
 *
 * 生命周期（真实运动全部由 Q2Physics 的 Box2D 刚体驱动）：
 *   wait     → 初始就在碗内挂动态刚体，受重力自然落下、彼此碰撞堆叠，
 *              被最上方水平横针 hg-1 的碰撞体托住（卡位），形成物理金币山
 *   physical → 拔掉 hg-1 放行后，位置 / 碰撞 / 滑落 / 堆叠全由物理引擎模拟；
 *              脚本每帧只读节点坐标做入罐 / 流失 / 槽位判定
 *   done     → 进罐（滑到罐内格位）/ 漏进槽位（停在绿色挡板上、判失败）/ 流失（淡出）
 *
 * 金币绕 Y 轴的翻转表现仍用 31 帧序列帧（刚体 fixedRotation=true，物理上不旋转，
 * 避免序列帧翻转与刚体自转叠加导致"变厚/发疯"）。done 后停止翻转，罐内为静止金币堆。
 *
 * 死局判定不在本类：由 Q2Game 依据「槽位遮挡状态」确定性判定（见 Q2Game._evaluate）。
 */

import { GEO, jarStack, chamberLimits } from './Q2Config';
import { Q2Physics } from './Q2Physics';

export type CoinResult = 'jar' | 'miss' | 'slot' | null;
export type CoinPhase = 'wait' | 'physical' | 'trapped' | 'done';

export class Q2Coin {
    public readonly node: cc.Node;
    private readonly _frames: cc.SpriteFrame[];
    private readonly _homeX: number;
    private readonly _homeY: number;
    /** 入罐后的堆叠格位（按生成序号，保证每枚落点固定、整齐堆满罐子） */
    private readonly _jarIndex: number;
    /** 碗内初始旋转相位，让金币堆有正面也有侧面薄片 */
    private readonly _phase0: number;

    private _x: number = 0;
    private _y: number = 0;
    private _phase: CoinPhase = 'wait';
    private _result: CoinResult = null;
    private _frameIdx: number = 0;
    /** 翻转进度：累计的「滚动路程」（px），与刚体速度联动，静止时不增长 */
    private _spinDist: number = 0;
    /** 颈口疏通计时：物理阶段在碗内 / 颈口长时间静止时打散颗粒拱桥 */
    private _stillT: number = 0;
    /** 出口疏通计时：币已落到斜底、堆在左下开口前不动时，推一把朝开口 */
    private _throatT: number = 0;

    public static create(parent: cc.Node, frames: cc.SpriteFrame[], x: number, y: number,
                         jarIndex: number, phase: number): Q2Coin {
        const node = new cc.Node('Coin');
        node.setAnchorPoint(0.5, 0.5);
        const sp = node.addComponent(cc.Sprite);
        sp.sizeMode = cc.Sprite.SizeMode.CUSTOM;
        parent.addChild(node);
        return new Q2Coin(node, frames, x, y, jarIndex, phase);
    }

    /** 按帧真实裁剪宽高比设置 contentSize：高度固定，宽度随翻转收窄，不变厚 */
    private _applyFrame(idx: number): void {
        if (this._frames.length === 0) { return; }
        const sp = this.node.getComponent(cc.Sprite);
        if (!sp) { return; }
        const frame = this._frames[idx];
        sp.spriteFrame = frame;
        const r = frame.getRect();
        const h = Math.max(1, r.height);
        this.node.setContentSize(GEO.COIN_SIZE * (r.width / h), GEO.COIN_SIZE);
    }

    private constructor(node: cc.Node, frames: cc.SpriteFrame[], x: number, y: number,
                        jarIndex: number, phase: number) {
        this.node = node;
        this._frames = frames;
        this._homeX = x;
        this._homeY = y;
        this._jarIndex = jarIndex;
        this._phase0 = phase % Math.max(1, frames.length);
        this.reset();
    }

    public reset(): void {
        cc.Tween.stopAllByTarget(this.node);
        // 无论上一局停在哪个阶段，先移除旧刚体，再重新挂一枚碗内动态刚体
        Q2Physics.deactivateCoin(this.node);
        this._x = this._homeX;
        this._y = this._homeY;
        // 投放点必须落在绿色轮廓墙内，否则刚体生成瞬间就在墙外会被物理强力弹飞
        const lim = chamberLimits(this._y);
        if (lim) {
            const lo = lim.left + GEO.CHAMBER_CLAMP_MARGIN + 2;
            const hi = lim.right - GEO.CHAMBER_CLAMP_MARGIN - 2;
            if (lo <= hi) { this._x = Math.max(lo, Math.min(hi, this._x)); }
        }
        this._phase = 'wait';
        this._result = null;
        this._frameIdx = this._phase0;
        this._spinDist = 0;
        // 轻微错开初始相位，避免整堆金币在同一帧同步扰动（同步抖动反而会维持拱桥）
        this._stillT = -(this._jarIndex % 7) * 0.03;
        this._throatT = -(this._jarIndex % 11) * 0.04;
        this.node.active = true;
        this.node.opacity = 255;
        this.node.angle = 0;
        this.node.setScale(1, 1);
        this.node.setPosition(this._x, this._y);
        this._applyFrame(this._phase0);
        // 初始即进入物理世界：零初速自由落体，落到 hg-1 横针上堆叠成金币山
        Q2Physics.activateCoin(this.node, this._x, this._y, 0, 0);
    }

    /** 拔掉闸门针 hg-1 后放行：切换为结算阶段（真实放行由针碰撞体转 sensor 触发） */
    public release(): void {
        if (this._phase !== 'wait') { return; }
        this._phase = 'physical';
        // 放行瞬间给一点向下初速度，让原本处于静力平衡的金币堆立刻开始流动，
        // 不必等到颈口疏通计时器触发；速度很小，不会把金币弹出绿色轮廓。
        const rb = this.node.getComponent(cc.RigidBody);
        if (rb) {
            const v = rb.linearVelocity;
            rb.linearVelocity = cc.v2(v ? v.x : 0, -40);
        }
    }

    public get done(): boolean { return this._phase === 'done'; }
    public get result(): CoinResult { return this._result; }
    public get phase(): CoinPhase { return this._phase; }
    public get x(): number { return this._x; }
    public get y(): number { return this._y; }

    /** 是否还在明显运动（供 Q2Game 判「所有针拔完却全部卡住」的通用无解兜底） */
    public get isMoving(): boolean {
        if (this._phase === 'done') { return false; }
        const rb = this.node.getComponent(cc.RigidBody);
        if (!rb) { return false; }
        const v = rb.linearVelocity;
        return !!v && v.lengthSqr() > GEO.STALL_VSQ;
    }

    /**
     * 判负后冻结：移出物理世界并停止序列帧，剩余金币不再继续下落 / 掉出画面。
     * 只在「还没结算」的金币上生效，已入罐（或已判 slot）的金币不受影响。
     */
    public freeze(): void {
        if (this._phase === 'done') { return; }
        this._phase = 'done';
        Q2Physics.deactivateCoin(this.node);
    }

    /** 每帧推进；返回本帧新产生的结果（jar/miss/slot），否则 null */
    public update(dt: number): CoinResult {
        // 金币绕 Y 轴翻转（序列帧），与物理刚体自转无关（fixedRotation=true）。
        // 翻转**只跟随真实运动**：按刚体速度累计「滚动路程」，每滚 SPIN_DIST_PER_FRAME
        // 像素翻一帧 —— 下落越快翻得越快；速度低于 SPIN_MIN_SPEED 视为静止，完全不翻。
        // 这样碗内被横针托住的金币山、槽位里停住的金币、罐内金币都是定格画面，
        // 不会出现「静止状态仍在持续转动 / 闪动」的观感。
        if (this._phase !== 'done' && this._frames.length > 1) {
            const rbsp = this.node.getComponent(cc.RigidBody);
            const vsp = rbsp ? rbsp.linearVelocity : null;
            const speed = vsp ? Math.sqrt(vsp.lengthSqr()) : 0;
            if (speed >= GEO.SPIN_MIN_SPEED) {
                this._spinDist += speed * dt;
                const step = Math.max(1, GEO.SPIN_DIST_PER_FRAME);
                let steps = 0;
                while (this._spinDist >= step && steps < 4) {
                    this._spinDist -= step;
                    this._frameIdx = (this._frameIdx + 1) % this._frames.length;
                    this._applyFrame(this._frameIdx);
                    steps++;
                }
                // 极端速度下丢帧，避免单帧连翻多帧造成闪烁
                if (this._spinDist > step) { this._spinDist = 0; }
            } else {
                this._spinDist = 0;
            }
        }

        if (this._phase === 'done') { return null; }

        // 位置全程由物理引擎驱动（wait 阶段金币也在碗内自由落体 / 堆叠成金币山）
        this._x = this.node.x;
        this._y = this.node.y;

        // trapped：已判「滑落进底部槽位」，但**仍留在物理世界里**继续掉，直到
        // 自然落进槽位格子、被槽底 / 隔板兜住为止（不再做任何传送或结算）。
        if (this._phase === 'trapped') { return null; }

        // 槽位失败：在轮廓夹回之前、用 Box2D 真实坐标判定。金币穿过「已开放槽位」
        // 的斜底、落到判定高度以下，即视作滑落进底部槽位 → 失败（游戏结束）。
        // 左下成功开口 x∈[-92,-68] 不属于任何槽位，isSlotOpen 返回 false，不受影响。
        if (this._phase !== 'wait' && this._y < GEO.SLOT_FAIL_Y
            && Q2Physics.isSlotOpen(this._x, this._y)) {
            return this._finish('slot');
        }

        // 越界兜底：高速 / 段接缝可能让金币穿出绿色轮廓，这里把它夹回内壁并
        // 同步刚体、清掉向外冲的横向速度，保证金币绝不出现在绿色圈线之外。
        Q2Physics.clampCoin(this.node, this._x, this._y);
        this._x = this.node.x;
        this._y = this.node.y;

        // wait：碗内物理堆叠（被 hg-1 托住），只做表现与轮廓约束，不做入罐 / 流失结算
        if (this._phase === 'wait') { return null; }

        // 颈口疏通（anti-jamming）：拔掉闸门针后，48 枚颗粒同时挤过沙漏形
        // 最窄颈口极易结成稳定拱桥，整堆金币一枚都不下滑。对「容器上半部、
        // 已长时间静止」的金币施加一次轻微横向错动 + 向下速度，打散拱桥。
        // 严格限定 y ≥ UNSTICK_MIN_Y：落到下方交叉针阵、被仍插着的针挡住而
        // 静止的金币不参与，保证「有插针遮挡就不能继续掉落」的规则不被破坏。
        const rb = this.node.getComponent(cc.RigidBody);
        if (rb) {
            const v = rb.linearVelocity;
            const inNeck = this._y >= GEO.UNSTICK_MIN_Y && this._y <= GEO.UNSTICK_MAX_Y;
            if (inNeck && v && v.lengthSqr() < GEO.UNSTICK_VSQ) {
                this._stillT += dt;
                if (this._stillT >= GEO.UNSTICK_TIME) {
                    const h = Math.sin(this._jarIndex * 91.7 + this._y * 0.37) * 43758.5453;
                    const n = (h - Math.floor(h)) * 2 - 1;
                    Q2Physics.nudgeCoin(this.node, n * GEO.UNSTICK_VX, GEO.UNSTICK_VY);
                    this._stillT = 0;
                }
            } else {
                this._stillT = 0;
            }

            // 出口疏通：金币已落到斜底、但堆在左下开口前方迟迟不动（48 枚一起挤
            // 2 倍币径的开口极易结成永久拱桥）。只在「左侧 5 根安全针全部拔出」时才启用：
            // 还有针插着时金币是被针托住的正常状态，不能被脚本推走。
            const inThroat = this._y <= GEO.THROAT_MAX_Y && this._y >= GEO.THROAT_MIN_Y;
            if (!inNeck && inThroat && v && v.lengthSqr() < GEO.UNSTICK_VSQ
                && Q2Physics.areSafePinsPulled()) {
                this._throatT += dt;
                if (this._throatT >= GEO.THROAT_STILL_TIME) {
                    Q2Physics.nudgeCoin(this.node, -GEO.THROAT_NUDGE_VX, -GEO.THROAT_NUDGE_VY);
                    this._throatT = 0;
                }
            } else {
                this._throatT = 0;
            }
        }

        // 入罐判定：落到罐口高度且横向在罐口范围内
        if (this._y <= GEO.JAR_CATCH_Y
            && Math.abs(this._x - GEO.JAR_CATCH_X) <= GEO.JAR_CATCH_HALF_W) {
            return this._finish('jar');
        }
        // 落到容器底部以下：只允许从最左下开口（正对罐口）离开。
        // 其他位置一律立即判流失并淡出，避免金币停留在绿色轮廓外的画面下方。
        if (this._y < GEO.CHAMBER_GAP_Y - 4
            && (this._x < GEO.JAR_CATCH_X - GEO.JAR_CATCH_HALF_W - 10
                || this._x > GEO.JAR_CATCH_X + GEO.JAR_CATCH_HALF_W + 10)) {
            return this._finish('miss');
        }
        // 流失判定：掉出画面底部或横向穿出封闭轮廓
        if (this._y <= GEO.MISS_Y || Math.abs(this._x) > GEO.MISS_ABS_X) {
            return this._finish('miss');
        }
        return null;
    }

    private _finish(r: 'jar' | 'miss' | 'slot'): CoinResult {
        this._result = r;
        if (r === 'slot') {
            // 滑落进底部槽位 = 失败。但**不做任何传送**：金币继续留在物理世界里，
            // 按物理掉进槽位格子、被槽底和隔板兜住后自然停住（"遵守物理规则掉进槽位，
            // 不会穿过去"）。判负后 Q2Game 会在 LOSE_SETTLE_TIME 之后统一 freeze()，
            // 那时金币已经稳稳停在格子底部。
            this._phase = 'trapped';
            this.node.opacity = 255;
            this.node.active = true;
            return r;
        }
        this._phase = 'done';
        Q2Physics.deactivateCoin(this.node);
        if (r === 'jar') {
            const slot = jarStack(this._jarIndex);
            cc.tween(this.node)
                .to(0.24, { x: slot.x, y: slot.y, angle: slot.angle, scale: GEO.JAR_COIN_SCALE }, { easing: 'quadIn' })
                .start();
        } else {
            cc.tween(this.node)
                .to(0.3, { y: this._y - 80, opacity: 0 }, { easing: 'quadIn' })
                .call(() => { this.node.active = false; })
                .start();
        }
        return r;
    }
}
