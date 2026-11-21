/**
界面上有三个输入框，分别对应 X,Y,Z 的值，请实现 {@link Q1.onGenerateBtnClick} 函数，生成一个 10 × 10 的可控随机矩阵，并显示到界面上，矩阵要求如下：
1. {@link COLORS} 中预定义了 5 种颜色
2. 每个点可选 5 种颜色中的 1 种
3. 按照从左到右，从上到下的顺序，依次为每个点生成颜色，(0, 0)为左上⻆点，(9, 9)为右下⻆点，(0, 9)为右上⻆点
4. 点(0, 0)随机在 5 种颜色中选取
5. 其他各点的颜色计算规则如下，设目标点坐标为(m, n）：
    a. (m, n - 1)所属颜色的概率为基准概率加 X%
    b. (m - 1, n)所属颜色的概率为基准概率加 Y%
    c. 如果(m, n - 1)和(m - 1, n)同色，则该颜色的概率为基准概率加 Z%
    d. 其他颜色平分剩下的概率
*/

const {ccclass, property} = cc._decorator;

const COLORS = [
    cc.Color.RED,
    cc.Color.GREEN,
    cc.Color.BLUE,
    cc.Color.YELLOW,
    cc.Color.ORANGE,
];

// 每个格子的大小
const GRID_ITEM_SIZE = 60;

// 矩阵为 10 × 10
const GRID_SIZE = 10;

// 单元格总数
const GRID_COUNT = GRID_SIZE * GRID_SIZE;

// 基准概率：5 种颜色均分
const BASE_PROB = 1 / COLORS.length;

@ccclass
export default class Q1 extends cc.Component {

    @property(cc.EditBox)
    private xEditBox: cc.EditBox = null;

    @property(cc.EditBox)
    private yEditBox: cc.EditBox = null;

    @property(cc.EditBox)
    private zEditBox: cc.EditBox = null;

    @property(cc.Node)
    private gridRootNode: cc.Node = null;

    @property(cc.Prefab)
    private gridItemPrefab: cc.Prefab = null;

    // 已创建的 100 个格子，重复生成时复用，只改颜色
    private _cells: cc.Node[] = [];

    // 上一次生成的颜色索引（记录便于打印/调试）
    private _colors: number[] = [];

    public onGenerateBtnClick() {
        if (!this.gridRootNode || !this.gridItemPrefab) {
            cc.error('[Q1] gridRootNode / gridItemPrefab 未绑定，无法生成矩阵');
            return;
        }

        const x = this.readPercent(this.xEditBox);
        const y = this.readPercent(this.yEditBox);
        const z = this.readPercent(this.zEditBox);

        // 1. 先算出 10 × 10 的颜色索引矩阵
        const cells = Q1.buildMatrix(x, y, z);
        this._colors = cells;

        // 2. 再一次性铺到界面上
        this.ensureCells();
        for (let m = 0; m < GRID_SIZE; m++) {
            for (let n = 0; n < GRID_SIZE; n++) {
                const idx = m * GRID_SIZE + n;
                const node = this._cells[idx];
                if (!node || !node.isValid) { continue; }
                node.color = COLORS[cells[idx]];
                node.setPosition(
                    (n - (GRID_SIZE - 1) * 0.5) * GRID_ITEM_SIZE,
                    ((GRID_SIZE - 1) * 0.5 - m) * GRID_ITEM_SIZE,
                );
                this.playAppear(node, idx);
            }
        }
        cc.log('[Q1] 已生成 10×10 矩阵  X=' + x + '%  Y=' + y + '%  Z=' + z + '%');
    }

    /**
     * 生成 10 × 10 的颜色索引矩阵，返回长度为 100 的数组，下标 = m * 10 + n。
     *
     * 坐标采用题目口径：(m, n) 中 m 为行号（0 在最上）、n 为列号（0 在最左），
     * 于是 (0,0)=左上、(0,9)=右上、(9,9)=右下，与题面描述一致。
     *
     * 遍历顺序：m 从小到大（从上到下），同一行内 n 从小到大（从左到右），
     * 因此生成 (m, n) 时，左侧 (m, n - 1) 与上方 (m - 1, n) 的颜色一定已经算好。
     *
     * X / Y / Z 单位为百分数，例如 10 表示 10%。
     */
    public static buildMatrix(x: number, y: number, z: number): number[] {
        const result: number[] = [];
        for (let m = 0; m < GRID_SIZE; m++) {
            for (let n = 0; n < GRID_SIZE; n++) {
                // 左侧 (m, n-1) / 上方 (m-1, n) 邻格的颜色，越界记为 -1（表示该方向没有邻格）
                const left = n > 0 ? result[m * GRID_SIZE + (n - 1)] : -1;
                const up = m > 0 ? result[(m - 1) * GRID_SIZE + n] : -1;
                // (0, 0) 没有邻格 → calcWeights 退化为 5 种颜色各 20%，即题目要求的随机选取
                result.push(Q1.pickColor(Q1.calcWeights(left, up, x, y, z)));
            }
        }
        return result;
    }

    /**
     * 计算目标格选用每种颜色的概率（顺序与 {@link COLORS} 一致，总和为 1）。
     *
     * 规则：
     *  a. 左侧同色 → 基准 + X%
     *  b. 上方同色 → 基准 + Y%
     *  c. 左侧与上方同色 → 该色 基准 + Z%（此时不再叠加 a、b）
     *  d. 其余颜色平分剩余概率
     * 第一行没有上方邻格，只有规则 a；第一列没有左侧邻格，只有规则 b；(0, 0) 两者都没有 → 纯随机。
     */
    public static calcWeights(left: number, up: number, x: number, y: number, z: number): number[] {
        const weights: number[] = [];
        const boosted: boolean[] = [];
        for (let i = 0; i < COLORS.length; i++) {
            weights.push(BASE_PROB);
            boosted.push(false);
        }

        if (left >= 0 && up >= 0 && left === up) {
            // c. 两侧同色，只享受 Z%
            weights[left] = BASE_PROB + z / 100;
            boosted[left] = true;
        } else {
            if (left >= 0) { weights[left] = BASE_PROB + x / 100; boosted[left] = true; }
            if (up >= 0) { weights[up] = BASE_PROB + y / 100; boosted[up] = true; }
        }

        // 只统计被提升的那 1~2 种颜色的概率，其余颜色稍后平分剩余
        let used = 0;
        for (let i = 0; i < weights.length; i++) {
            if (!boosted[i]) { continue; }
            // 概率截断到 [0, 1]，防止 X/Y/Z 填得过大出现负数或超过 100%
            weights[i] = Math.max(0, Math.min(1, weights[i]));
            used += weights[i];
        }

        // 提升后的概率和已经超过 1：按比例压缩，保持彼此的相对优势，其余颜色概率为 0
        if (used > 1) {
            for (let i = 0; i < weights.length; i++) {
                weights[i] = boosted[i] ? weights[i] / used : 0;
            }
            return weights;
        }

        // d. 其余颜色平分剩下的概率
        let restCount = 0;
        for (let i = 0; i < weights.length; i++) {
            if (!boosted[i]) { restCount++; }
        }
        const rest = restCount > 0 ? (1 - used) / restCount : 0;
        for (let i = 0; i < weights.length; i++) {
            if (!boosted[i]) { weights[i] = rest; }
        }
        return weights;
    }

    /** 按概率权重随机取一个颜色索引 */
    public static pickColor(weights: number[]): number {
        const total = weights.reduce(function (sum, w) { return sum + w; }, 0);
        if (total <= 0) { return Math.floor(Math.random() * COLORS.length); }
        let r = Math.random() * total;
        for (let i = 0; i < weights.length; i++) {
            r -= weights[i];
            if (r <= 0) { return i; }
        }
        // 浮点误差兜底：取最后一个概率非 0 的颜色
        for (let i = weights.length - 1; i >= 0; i--) {
            if (weights[i] > 0) { return i; }
        }
        return 0;
    }

    /** 首次点击时创建 100 个格子节点，之后再点只复用 */
    private ensureCells(): void {
        if (this._cells.length === GRID_COUNT) { return; }

        this.gridRootNode.destroyAllChildren();
        this._cells = [];
        for (let m = 0; m < GRID_SIZE; m++) {
            for (let n = 0; n < GRID_SIZE; n++) {
                const node = cc.instantiate(this.gridItemPrefab);
                node.name = 'cell_' + m + '_' + n;
                node.parent = this.gridRootNode;
                node.setPosition(
                    (n - (GRID_SIZE - 1) * 0.5) * GRID_ITEM_SIZE,
                    ((GRID_SIZE - 1) * 0.5 - m) * GRID_ITEM_SIZE,
                );
                this._cells.push(node);
            }
        }
    }

    /** 依次点亮的出场动画：从左上到右下逐个缩放弹出，直观体现生成顺序 */
    private playAppear(node: cc.Node, index: number): void {
        if (typeof cc.tween !== 'function') { return; }
        if (typeof node.stopAllActions === 'function') { node.stopAllActions(); }
        node.scale = 0.55;
        node.opacity = 0;
        cc.tween(node)
            .delay(index * 0.006)
            .to(0.12, { scale: 1, opacity: 255 }, { easing: 'backOut' })
            .start();
    }

    /** 读取输入框里的百分数：空/非法按 0 处理，并裁到 [-100, 100] */
    private readPercent(box: cc.EditBox, name?: string): number {
        if (!box || !box.string) {
            if (name) { cc.log('[Q1] ' + name + ' 未填，按 0% 处理'); }
            return 0;
        }
        const value = parseFloat(box.string.trim());
        if (isNaN(value)) {
            cc.warn('[Q1] 输入非法：' + box.string + '，按 0% 处理');
            return 0;
        }
        return Math.max(-100, Math.min(100, value));
    }
}
