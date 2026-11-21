/**
 * Q2Assets —— 金币序列帧的动态加载
 *
 * 容器 / 针 / 瓶子已被 Q2.fire 场景直接引用，无需代码加载；
 * 只有金币的 31 帧序列帧需要运行时按 uuid 加载（素材在非 resources 目录）。
 */

import { COIN_FRAME_UUIDS } from './Q2Config';

export class Q2Assets {
    private static _coinFrames: cc.SpriteFrame[] = [];
    private static _loaded: boolean = false;
    private static _loading: boolean = false;
    /** 加载中排队的回调：并发调用只发一次 loadAny，结果统一通知，避免重复初始化关卡 */
    private static _pending: Array<(ok: boolean, errMsg?: string) => void> = [];

    public static loadAll(done: (ok: boolean, errMsg?: string) => void): void {
        if (Q2Assets._loaded) { done(true); return; }
        Q2Assets._pending.push(done);
        if (Q2Assets._loading) { return; }
        Q2Assets._loading = true;

        cc.assetManager.loadAny(COIN_FRAME_UUIDS, function (err: Error, assets: cc.Asset[]) {
            Q2Assets._loading = false;
            const list = Q2Assets._pending.slice();
            Q2Assets._pending.length = 0;

            let ok = true;
            let msg = '';
            if (err) {
                ok = false;
                msg = err.message || String(err);
                cc.error('[Q2] 金币序列帧加载失败：' + msg);
            } else if (!assets || assets.length !== COIN_FRAME_UUIDS.length) {
                ok = false;
                msg = '金币帧数量不符：期望 ' + COIN_FRAME_UUIDS.length + '，实际 ' + (assets ? assets.length : 0);
                cc.error('[Q2] ' + msg);
            } else {
                for (let i = 0; i < assets.length; i++) {
                    const sf = assets[i] as cc.SpriteFrame;
                    if (sf instanceof cc.SpriteFrame) {
                        sf.addRef();
                        Q2Assets._coinFrames.push(sf);
                    }
                }
                Q2Assets._loaded = true;
                cc.log('[Q2] 金币序列帧加载完成：' + Q2Assets._coinFrames.length + ' 帧');
            }
            for (let i = 0; i < list.length; i++) { list[i](ok, msg); }
        });
    }

    public static coinFrames(): cc.SpriteFrame[] {
        return Q2Assets._coinFrames;
    }

    /** 仅退出场景时调用；重开关卡不释放（帧资源需复用） */
    public static releaseAll(): void {
        for (let i = 0; i < Q2Assets._coinFrames.length; i++) {
            Q2Assets._coinFrames[i].decRef();
        }
        Q2Assets._coinFrames = [];
        Q2Assets._loaded = false;
        Q2Assets._pending.length = 0;
    }
}
