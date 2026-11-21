/**
 * Q2Pin —— 绑定到 Q2.fire 场景中已放置的针节点
 *
 * 针素材本身竖直（圆环在顶部），视频中的 X 交叉由节点的 angle 形成。
 * 绑定时读取节点真实 position / angle / height，算出针的线段两端：
 *   top    = 圆环端（拔出时针朝这个方向抽出）
 *   bottom = 针尖端（金币滑向这一端）
 * 这条真实线段用于「拔出动画方向」与「触摸命中距离」；金币的碰撞 / 滑落
 * 由 Box2D 物理（节点自带 angle 的静态碰撞体）真实模拟，无需脚本近似。
 */

import { GEO } from './Q2Config';
import { Q2Physics } from './Q2Physics';

export class Q2Pin {
    public readonly node: cc.Node;
    public readonly name: string;
    /** 圆环端（线段起点） */
    public readonly top: cc.Vec2;
    /** 针尖端（线段终点，金币滑向这一端） */
    public readonly bottom: cc.Vec2;

    private _removed: boolean = false;
    private _animT: number = -1;
    private _origX: number;
    private _origY: number;
    private _origAngle: number;
    private _fromX: number = 0;
    private _fromY: number = 0;
    private _toX: number = 0;
    private _toY: number = 0;

    public static bind(node: cc.Node): Q2Pin {
        return new Q2Pin(node);
    }

    private constructor(node: cc.Node) {
        this.node = node;
        this.name = node.name;
        this._origX = node.x;
        this._origY = node.y;
        this._origAngle = node.angle;

        // 局部 +Y（圆环端）绕 Z 旋转 angle 后的偏移
        const half = node.height * 0.5;
        const rad = node.angle * Math.PI / 180;
        const dx = -half * Math.sin(rad);
        const dy = half * Math.cos(rad);
        this.top = new cc.Vec2(node.x + dx, node.y + dy);
        this.bottom = new cc.Vec2(node.x - dx, node.y - dy);
    }

    public get removed(): boolean { return this._removed; }
    public get isGate(): boolean { return this.name === 'hg-1'; }

    /** 拔出：沿圆环方向抽出并渐隐。不可逆（重开时由 reset 恢复） */
    public pull(): boolean {
        if (this._removed) { return false; }
        this._removed = true;
        // 同步把该针碰撞体转为 sensor：压在针上的金币瞬间失去支撑，由 Box2D 自然续落
        Q2Physics.setPinEnabled(this, false);

        let dx = this.top.x - this.bottom.x;
        let dy = this.top.y - this.bottom.y;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        dx /= len; dy /= len;

        this._fromX = this.node.x;
        this._fromY = this.node.y;
        this._toX = this._fromX + dx * GEO.PULL_DISTANCE;
        this._toY = this._fromY + dy * GEO.PULL_DISTANCE;
        this._animT = 0;
        return true;
    }

    public update(dt: number): void {
        if (this._animT < 0) { return; }
        this._animT += dt;
        let t = this._animT / GEO.PULL_TIME;
        if (t > 1) { t = 1; }
        const ease = 1 - (1 - t) * (1 - t);
        this.node.x = this._fromX + (this._toX - this._fromX) * ease;
        this.node.y = this._fromY + (this._toY - this._fromY) * ease;
        this.node.opacity = 255 * (1 - t);
        if (t >= 1) {
            this.node.active = false;
            this._animT = -1;
        }
    }

    /** 完全复位（重开时调用） */
    public reset(): void {
        this._removed = false;
        this._animT = -1;
        this.node.active = true;
        this.node.opacity = 255;
        this.node.x = this._origX;
        this.node.y = this._origY;
        this.node.angle = this._origAngle;
    }

    /** 点到针线段的距离，用于放宽触摸命中（针身只有 17~19px 宽） */
    public distanceTo(px: number, py: number): number {
        const ax = this.top.x, ay = this.top.y;
        const bx = this.bottom.x, by = this.bottom.y;
        const dx = bx - ax, dy = by - ay;
        const len2 = dx * dx + dy * dy;
        if (len2 < 1e-6) { return Math.sqrt((px - ax) * (px - ax) + (py - ay) * (py - ay)); }
        let t = ((px - ax) * dx + (py - ay) * dy) / len2;
        if (t < 0) { t = 0; } else if (t > 1) { t = 1; }
        const cx = ax + t * dx, cy = ay + t * dy;
        return Math.sqrt((px - cx) * (px - cx) + (py - cy) * (py - cy));
    }
}
