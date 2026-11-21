/**
 * Q2Physics —— Box2D 物理世界封装（Cocos Creator 2.4.x 内置 2D 物理系统）
 *
 * 金币的掉落 / 沿针滑落 / 互相堆叠全部交给物理引擎真实模拟：
 *   · 每根场景已有针节点 → 静态刚体 + 矩形碰撞体（节点 angle 自带斜面，金币自然沿针滑落）
 *   · 容器内壁 → 沿截图标注的绿色轮廓逐段拼接的静态碰撞墙，把金币完全关在轮廓内，
 *                 只在最左下开口处放行（唯一通往罐子的出口）
 *   · 槽位下方 → 一道水平静态挡板（截图里的亮绿色横线），接住从开放槽位漏下的金币，
 *                 让它们停在槽位里、不再滑落到绿色线下方
 *   · 每枚金币 → 动态刚体 + 圆形碰撞体，真实碰撞、滑落、堆叠成金币山
 *   · 拔针 → 该针碰撞体转为 sensor，失去支撑的金币自然继续下落
 *   · 重开 → 移除全部金币刚体、恢复针碰撞体
 *
 * 不创建 / 不修改 Q2.fire 场景中已有的主体节点（backgound / hg / bottle），
 * 只给已有针节点运行时挂物理组件，并新建不可见的静态碰撞墙节点。
 * 死局判定由本模块的槽位遮挡状态（hasOpenSlot）确定（见 Q2Game._evaluate）。
 */

import { GEO, wallSegments, chamberLimits, slotSegments, slotIndexOf, slotGuardSegment, slotDividerBoxes } from './Q2Config';
import { Q2Pin } from './Q2Pin';

/** 已挂到针节点上的物理组件，便于拔针 / 重开时切换 */
interface PinBody {
    collider: cc.PhysicsBoxCollider;
}

export class Q2Physics {
    private static _enabled = false;
    /** 新建的静态碰撞墙节点（轮廓壁 + 槽位底墙），重开无需重建，仅在销毁时统一清理 */
    private static _walls: cc.Node[] = [];
    /** 针名 → 碰撞体 */
    private static _pinBodies: { [name: string]: PinBody } = {};
    /** 5 个槽位底墙的碰撞体：对应针被拔出后转 sensor，金币即可漏进槽位 */
    private static _slotBodies: cc.PhysicsBoxCollider[] = [];
    /** 槽位是否已「没遮挡」（开放）；重开时全部复位为 false */
    private static _slotOpen: boolean[] = [];
    /** 针名 → 是否已拔出（用于判断「左侧安全针是否全拔 → 可做出口疏通」） */
    private static _pulled: { [name: string]: boolean } = {};

    /** 启用物理世界（须在创建任何刚体前调用） */
    public static enable(): void {
        if (Q2Physics._enabled) { return; }
        const mgr = cc.director.getPhysicsManager();
        mgr.enabled = true;
        mgr.gravity = cc.v2(0, GEO.PHYS_GRAVITY);
        //  solver 迭代提高一点，避免 48 枚金币堆叠时互相抖动 / 下沉
        (cc.PhysicsManager as any).VELOCITY_ITERATIONS = 10;
        (cc.PhysicsManager as any).POSITION_ITERATIONS = 10;
        Q2Physics._enabled = true;
        cc.log('[Q2] Box2D 物理世界已启用，gravity=' + GEO.PHYS_GRAVITY);
    }

    public static get isEnabled(): boolean { return Q2Physics._enabled; }

    /**
     * 为场景已有针挂静态刚体 + 矩形碰撞体。
     * 针节点本身带 angle（±36°~±44°），碰撞体跟随旋转 => 天然形成斜滑道 / 挡板。
     */
    public static bindPins(pins: Q2Pin[]): void {
        for (let i = 0; i < pins.length; i++) {
            const pin = pins[i];
            if (Q2Physics._pinBodies[pin.name]) { continue; }
            const node = pin.node;
            const rb = node.getComponent(cc.RigidBody) || node.addComponent(cc.RigidBody);
            rb.type = cc.RigidBodyType.Static;
            rb.enabledContactListener = false;

            const col = node.getComponent(cc.PhysicsBoxCollider) || node.addComponent(cc.PhysicsBoxCollider);
            // 碰撞体略小于针贴图：金币接触面贴在针身上表面，不会看起来陷进针里
            // 针尖（局部 -Y 那一端）按 PIN_TIP_TRIM 再削一截：局部 +Y 指向针环，
            // 故「高度减 trim + 中心往 +Y 移 trim/2」正好只缩短针尖那一头，
            // 让堵在左下开口右缘的针尖凸台从斜底上消失（见 GEO.PIN_TIP_TRIM）。
            const trim = (pin.name === GEO.PIN_TIP_TRIM_NAME) ? GEO.PIN_TIP_TRIM : 0;
            col.size = cc.size(
                node.width * GEO.PIN_BODY_W_SCALE,
                node.height * GEO.PIN_BODY_H_SCALE - trim
            );
            col.offset = cc.v2(0, trim * 0.5);
            col.friction = GEO.PIN_FRICTION;
            col.restitution = 0;
            col.density = 1;
            col.sensor = false;
            col.apply();
            Q2Physics._pinBodies[pin.name] = { collider: col };
        }
    }

    /**
     * 创建容器静态碰撞墙：沿绿色轮廓内壁逐段拼接（碗壁 → 颈部漏斗 → 笼子斜壁
     * → 左右壁 → 右高左低斜底），把金币完全约束在轮廓内。
     * 左壁末端与斜底左端之间**不连墙**，形成唯一开口（CHAMBER_GAP_*），
     * 金币只能从这里离开容器、落进正下方的罐子。
     *
     * 每段用旋转的细长 Box 碰撞体表示，长度额外加一个墙厚让相邻段首尾重叠，
     * 杜绝高速金币从折点接缝穿透。全部加到 root 下，与针、金币同一局部坐标系。
     */
    public static buildWalls(root: cc.Node): void {
        if (Q2Physics._walls.length > 0) { return; }
        const addSeg = (s: [number, number, number, number], name: string,
                        startPad: number = GEO.WALL_THICK * 0.5,
                        endPad: number = GEO.WALL_THICK * 0.5): cc.Node => {
            const dx = s[2] - s[0];
            const dy = s[3] - s[1];
            const len = Math.sqrt(dx * dx + dy * dy) || 1;
            const angle = Math.atan2(dy, dx) * 180 / Math.PI;
            const ux = dx / len;
            const uy = dy / len;
            // 两端默认各多伸半个墙厚（相邻段首尾重叠、杜绝接缝穿透）；
            // 传 0 表示该端不外扩 —— 开口两侧的段必须这样，否则墙盒会探进开口里。
            return Q2Physics._makeBox(
                root, name,
                (s[0] + s[2]) * 0.5 + ux * (endPad - startPad) * 0.5,
                (s[1] + s[3]) * 0.5 + uy * (endPad - startPad) * 0.5,
                len + startPad + endPad, GEO.WALL_THICK, angle
            );
        };

        // 左右轮廓壁：wallSegments() 的最后一段是整条斜底，这里不直接建，
        // 改由 5 段「槽位底墙」拼接（关闭时首尾重叠，与整条斜底完全等价）。
        const segs = wallSegments();
        const normalCount = segs.length - 1;
        for (let i = 0; i < normalCount; i++) {
            // 终点正好落在开口左缘的那一段（左壁最后一段）：终点不外扩。
            // 它原本会多伸 4px 到 (-86.8,-158.2)，把 28px 的开口吃掉 5px、
            // 还比斜底低 2px，是金币滑到开口前被顶住的直接原因之一。
            const atGapLeft = Math.abs(segs[i][2] - GEO.CHAMBER_GAP_LEFT) < 0.01
                && Math.abs(segs[i][3] - GEO.CHAMBER_GAP_Y) < 0.01;
            Q2Physics._walls.push(addSeg(segs[i], 'WallSeg' + i,
                GEO.WALL_THICK * 0.5, atGapLeft ? 0 : GEO.WALL_THICK * 0.5));
        }
        const slots = slotSegments();
        for (let i = 0; i < slots.length; i++) {
            // 0 号槽底的左端就是开口右缘：起点同样不外扩（原实现会向左多吃 4px）。
            const atGapRight = Math.abs(slots[i][0] - GEO.CHAMBER_GAP_RIGHT) < 0.01
                && Math.abs(slots[i][1] - GEO.CHAMBER_GAP_Y) < 0.01;
            const node = addSeg(slots[i], 'SlotFloor' + i,
                atGapRight ? 0 : GEO.WALL_THICK * 0.5, GEO.WALL_THICK * 0.5);
            Q2Physics._walls.push(node);
            const col = node.getComponent(cc.PhysicsBoxCollider);
            if (col) { Q2Physics._slotBodies[i] = col; }
            Q2Physics._slotOpen[i] = false;
        }

        // 槽位下方的「绿色区域」：一道水平静态挡板，接住从开放槽位漏下的金币，
        // 让它们停在槽位里（绿色线之上），不再继续滑落到绿色线下方 / 罐子里。
        // 常驻实体、不参与槽位开关；左端刻意避开最左下成功开口。
        // 不用 addSeg（它会自动加长一个墙厚）：避免左端向左外扩挡住成功开口。
        const guard = slotGuardSegment();
        Q2Physics._walls.push(Q2Physics._makeBox(
            root, 'SlotGuard',
            (guard[0] + guard[2]) * 0.5, guard[1],
            guard[2] - guard[0], GEO.SLOT_GUARD_THICK, 0
        ));

        // 5 个槽位 = 5 个真实「口袋」：金币可以从开放的槽口掉进格子，但会被格子
        // 四周的实体壁（本段竖直隔板 + 上面的绿色挡板）兜住，**掉进槽位不会穿过去**：
        // 既不会穿过槽底往下掉，也不会横穿隔板滑进隔壁格子。常驻实体、不参与开关。
        const dividers = slotDividerBoxes();
        for (let i = 0; i < dividers.length; i++) {
            const dv = dividers[i];
            Q2Physics._walls.push(Q2Physics._makeBox(
                root, 'SlotDivider' + i,
                dv[0], (dv[1] + dv[2]) * 0.5, dv[3], dv[2] - dv[1], 0
            ));
        }

        // 出口左侧护栏：从出口左唇竖直向下延长一段实体墙，把下落柱限制在护栏右侧，
        // 金币不会在掉落途中飘到容器左壁外面（只会顺着护栏垂直落进罐口）。
        // 内侧面与出口左唇对齐，不占用开口净宽；下端 -191 不伸进罐口。
        Q2Physics._walls.push(Q2Physics._makeBox(
            root, 'OutletRail',
            GEO.OUTLET_RAIL_X,
            (GEO.OUTLET_RAIL_TOP_Y + GEO.OUTLET_RAIL_BOTTOM_Y) * 0.5,
            GEO.WALL_THICK,
            GEO.OUTLET_RAIL_TOP_Y - GEO.OUTLET_RAIL_BOTTOM_Y, 0
        ));

        cc.log('[Q2] 碰撞墙已建立：轮廓壁 ' + normalCount + ' 段 + 可开关槽位底墙 '
            + slots.length + ' 段 + 槽位下方绿色挡板 1 段 + 槽位隔板 ' + dividers.length + ' 段');
    }

    /**
     * 槽位开放 / 关闭：对应的**右侧 / 形导流针**被拔出后「没遮挡」，该段斜底转 sensor，
     * 金币可真实穿过斜底滑落进槽位（由 Q2Coin 判失败）；重开时全部复位为实体。
     * 左侧 \ 形交叉阻挡针与闸门针 hg-1 不参与槽位开关（见 Q2Game._syncSlots）。
     */
    public static setSlotOpen(index: number, open: boolean): void {
        if (index < 0 || index >= GEO.SLOT_COUNT) { return; }
        if (Q2Physics._slotOpen[index] === open) { return; }
        Q2Physics._slotOpen[index] = open;
        const col = Q2Physics._slotBodies[index];
        if (col) { col.sensor = open; col.apply(); }
    }

    public static resetSlots(): void {
        for (let i = 0; i < GEO.SLOT_COUNT; i++) { Q2Physics.setSlotOpen(i, false); }
    }

    /** 坐标 (x,y) 是否处于「已开放的槽位」区域（只在笼子底部以下生效） */
    public static isSlotOpen(x: number, y: number): boolean {
        if (y > GEO.SLOT_CLAMP_SKIP_Y) { return false; }
        const i = slotIndexOf(x);
        return i >= 0 && Q2Physics._slotOpen[i] === true;
    }

    /**
     * 是否存在「已失去遮挡」的槽位（右侧 / 形导流针 hg-2~hg-6 中任一根被拔）。
     * 供 Q2Game 的规则判定使用（GEO.FATAL_ON_GUARD_PULL = true 时才据此判负）；
     * 默认关闭时判负改为「金币真的漏进开放槽位」（Q2Coin 报 slot），由物理结果决定。
     * 左侧 \ 形交叉阻挡针 hg-7~hg-11 与 hg-1 拔出都不会让本方法返回 true。
     * 与 isSlotOpen 共用同一份 _slotOpen 状态，重开由 resetSlots() 复位。
     */
    public static hasOpenSlot(): boolean {
        for (let i = 0; i < GEO.SLOT_COUNT; i++) {
            if (Q2Physics._slotOpen[i] === true) { return true; }
        }
        return false;
    }

    /**
     * 脚本越界兜底：金币若因高速 / 段接缝明显穿出绿色轮廓，把它夹回内壁并同步刚体。
     * 约束一直到开口高度为止；金币离开容器后（chamberLimits 返回 null）
     * 交给 Q2Coin 的入罐 / 流失判定，不再夹回。返回是否发生了夹回。
     *
     * 注意：这里只修正「明显越界」的金币，且**绝不清零横向速度**。
     * 旧实现每帧把贴壁金币夹回并把 vx 置 0，等于把金币钉死在漏斗斜壁上，
     * 拔针后整堆金币都无法沿壁向颈口汇聚 —— 正是「金币没有下滑」的直接原因。
     */
    public static clampCoin(node: cc.Node, x: number, y: number): boolean {
        // 槽位已开放：金币正在漏进槽位，不再夹回轮廓，让它真实滑落（由 Q2Coin 判失败）
        if (Q2Physics.isSlotOpen(x, y)) { return false; }
        const lim = chamberLimits(y);
        if (!lim) { return false; }
        const m = GEO.CHAMBER_CLAMP_MARGIN;
        const tol = GEO.CLAMP_TOLERANCE;
        const lo = lim.left + m;
        const hi = lim.right - m;
        if (lo > hi) { return false; }
        let nx = x;
        let dir = 0;
        if (nx < lo - tol) { nx = lo; dir = -1; }
        else if (nx > hi + tol) { nx = hi; dir = 1; }
        if (nx === x) { return false; }

        node.setPosition(nx, y);
        const rb = node.getComponent(cc.RigidBody);
        if (rb) {
            rb.syncPosition(false);
            const v = rb.linearVelocity;
            if (v) {
                // 只清掉仍然冲向墙外的那一侧横向速度，保留沿壁下滑的切向速度
                const outward = dir < 0 ? v.x < 0 : v.x > 0;
                rb.linearVelocity = cc.v2(outward ? 0 : v.x, v.y);
            }
        }
        return true;
    }

    /** 创建一块不可见的静态矩形碰撞体 */
    private static _makeBox(root: cc.Node, name: string, x: number, y: number,
                            w: number, h: number, angle: number): cc.Node {
        const node = new cc.Node(name);
        node.setPosition(x, y);
        node.angle = angle;
        root.addChild(node);
        const rb = node.addComponent(cc.RigidBody);
        rb.type = cc.RigidBodyType.Static;
        const col = node.addComponent(cc.PhysicsBoxCollider);
        col.size = cc.size(w, h);
        col.offset = cc.v2(0, 0);
        col.friction = GEO.WALL_FRICTION;
        col.restitution = 0;
        col.apply();
        return node;
    }

    /**
     * 让金币进入物理世界：挂动态刚体 + 圆形碰撞体。
     * 初始阶段（碗内）以零初速调用，金币自由落体堆到 hg-1 横针上被托住；
     * fixedRotation = true：金币靠 31 帧序列帧表现翻转，物理上不旋转，堆叠更稳定、更贴近视频。
     */
    public static activateCoin(node: cc.Node, x: number, y: number, vx: number, vy: number): void {
        node.setPosition(x, y);
        const rb = node.getComponent(cc.RigidBody) || node.addComponent(cc.RigidBody);
        rb.type = cc.RigidBodyType.Dynamic;
        rb.gravityScale = 1;
        rb.linearDamping = GEO.COIN_LINEAR_DAMPING;
        rb.angularDamping = 0.8;
        rb.fixedRotation = true;
        rb.bullet = true;              // 防止高速下落穿过细针
        rb.allowSleep = false;         // 拔针后需要立刻响应，不让金币睡着
        rb.enabledContactListener = false;

        const col = node.getComponent(cc.PhysicsCircleCollider) || node.addComponent(cc.PhysicsCircleCollider);
        col.radius = GEO.COIN_PHYS_RADIUS;
        col.offset = cc.v2(0, 0);
        col.friction = GEO.COIN_FRICTION;
        col.restitution = GEO.COIN_RESTITUTION;
        col.density = GEO.COIN_DENSITY;
        col.sensor = false;
        col.apply();

        rb.linearVelocity = cc.v2(vx, vy);
        rb.angularVelocity = 0;
    }

    /** 金币结算（入罐 / 流失）后移出物理世界，交给脚本 tween 收尾 */
    public static deactivateCoin(node: cc.Node): void {
        const circle = node.getComponent(cc.PhysicsCircleCollider);
        if (circle) { node.removeComponent(circle); }
        const rb = node.getComponent(cc.RigidBody);
        if (rb) { node.removeComponent(rb); }
    }

    /** 给刚体一次轻微扰动，用于打散颈口处的颗粒拱桥（见 GEO.UNSTICK_*） */
    public static nudgeCoin(node: cc.Node, vx: number, vy: number): void {
        const rb = node.getComponent(cc.RigidBody);
        if (!rb) { return; }
        rb.linearVelocity = cc.v2(vx, vy);
    }

    /**
     * 拔针：让该针停止阻挡金币；重开时恢复。
     * 用 sensor 切换而不是组件 enabled：sensor 是 Box2D shape 上的属性，
     * apply() 之后立即生效，且组件始终保持 enabled、生命周期稳定，
     * 不会出现「针已拔出但碰撞体仍在托住金币」的引擎时序问题。
     */
    public static setPinEnabled(pin: Q2Pin, enabled: boolean): void {
        const body = Q2Physics._pinBodies[pin.name];
        if (!body) { return; }
        const col = body.collider;
        const sensor = !enabled;
        if (col.sensor === sensor) { return; }
        col.sensor = sensor;
        col.apply();
        Q2Physics._pulled[pin.name] = !enabled;
    }

    /**
     * 左侧 5 根「安全针」是否已全部拔出。
     * 只在这种情况下才允许对斜底/出料口做疏通推动（见 GEO.THROAT_*）：
     * 只要还有一根安全针插着，金币就是「被针托住」的正常状态，不能被脚本推走，
     * 否则会破坏「插针遮挡 → 金币不掉」的规则感。
     */
    public static areSafePinsPulled(): boolean {
        for (let i = 0; i < GEO.SAFE_PINS.length; i++) {
            if (!Q2Physics._pulled[GEO.SAFE_PINS[i]]) { return false; }
        }
        return true;
    }

    /** 重开：恢复所有针碰撞体（金币刚体由 Q2Coin.reset 自行移除） */
    public static resetPins(pins: Q2Pin[]): void {
        for (let i = 0; i < pins.length; i++) {
            Q2Physics.setPinEnabled(pins[i], true);
        }
        Q2Physics._pulled = {};
    }

    /** 关卡销毁时清理新建的静态碰撞墙节点 */
    public static dispose(): void {
        for (let i = 0; i < Q2Physics._walls.length; i++) {
            const n = Q2Physics._walls[i];
            if (n && n.isValid) { n.destroy(); }
        }
        Q2Physics._walls.length = 0;
        Q2Physics._pinBodies = {};
        Q2Physics._slotBodies = [];
        Q2Physics._slotOpen = [];
        Q2Physics._pulled = {};
        Q2Physics._enabled = false;
        cc.director.getPhysicsManager().enabled = false;
    }
}
