/**
 * Q2Config —— 场景节点引用 / 几何常量 / 资源 uuid 表
 *
 * 重要：容器(bg)、针(hg-1~11)、瓶子(bottle) 均为 Q2.fire 场景中已放置的节点，
 * 本实现只读取它们的真实 position/angle/size 来驱动逻辑，不再代码创建这些物体。
 * 金币序列帧不在场景中，运行时按 uuid 加载。
 */

/** 所有素材的 spriteFrame uuid（保留完整表，便于扩展；当前仅金币帧需动态加载） */
export const UUIDS: { [key: string]: string } = {
    backgound_0: '359b5df2-1869-4d9b-b26d-c0de7aea2de2',
    backgound_1: '189641a5-528f-4990-bd5c-44b1a6b5185c',
    backgound_2: '438559f8-e37c-44ce-98c3-74afdfe10738',
    backgound_3: 'fa48f26f-21da-4a34-99a4-6e1e9e5ef8af',
    backgound_4: 'c52cd39b-a559-43b6-a76e-21a3930d0409',
    bottle: 'a81d309f-caa0-4a32-a3d0-fbdc5835c393',
    bottle2: '7c1df1a6-496c-48cf-be4c-b5f1446d7039',
    'hg-1': '2e5781ae-f777-43f1-968d-2e42888d8c2f',
    'hg-1-glow': '06b9e302-9238-48bf-b118-f0499b125027',
    'hg-2': 'e3ec85b6-8a9b-4808-b3e1-b44423cb6565',
    'hg-2-glow': '5eaeaea0-1df6-4f33-9648-3ce459692757',
    'hg-3': '55793d86-2348-47a4-b335-8e8e2d6db63a',
    'hg-3-glow': 'ecee058c-632a-4c74-8273-ef14df3c650e',
    'hg-4': '8313eefd-0724-46f8-b655-5bea921b8a54',
    'hg-4-glow': '17bc5f9f-a2bf-4a9a-9087-8d8344266b6c',
    'hg-5': 'd64040b5-80bf-45ea-afb6-313ce89a032a',
    'hg-5-glow': 'e2581288-0b3a-47de-9a02-729800d63384',
    'hg-6': '4ac1a833-2b5e-414e-8f39-325c064db570',
    'hg-6-glow': '5f18925c-0d2c-4618-ac8f-641374f937a1',
    'hg-7': '62bebc95-898c-48d1-9a70-72c24e14438c',
    'hg-7-glow': 'da2f1fd2-dd54-4952-b043-8dc2512f093a',
    'hg-8': '8c633b54-8667-4137-a3ce-abfbc01b8fee',
    'hg-8-glow': '036fbd7f-a038-4b08-9941-be62659ab8c4',
    'hg-9': '8982a0eb-c32e-4246-bf7f-509ae9b6c950',
    'hg-9-glow': '6de82d25-5032-4115-935f-5ae795c72e22',
    'hg-10': 'bbc4e74d-a5ea-4dc7-8ede-843b4925e90c',
    'hg-10-glow': '0472bd20-ca25-4dd7-916b-a8fd75536225',
    'hg-11': 'c108fde6-6c70-4f28-b164-f56c58074a71',
    'hg-11-glow': '657057f0-78fa-4b74-b634-e60b413d4d67',
    'oct-1': 'e5a08d08-36d2-45d7-9b89-b64be8cb0bab',
    'oct-1-glow': '4bdf9ca5-7171-4ccf-84be-0f196175a0b4',
    'oct-2': '89943119-2e56-4fb6-a4a9-1c491bd64e94',
    'oct-2-glow': 'c798ec2b-5d99-44d6-a4fd-b8ab04ce152f',
    'oct-3': 'f151e13b-6906-4f4e-a24f-01365546c271',
    'oct-3-glow': 'ebac48d3-1c2a-4bc2-8b23-c85540d4f9bd',
    'oct-4': 'cdf85a11-a408-42cc-b5d7-e2547a133530',
    'oct-4-glow': '349657f2-fb15-496c-b698-4f72c2a792f7',
    'oct-5': '3be435c6-a756-4321-806e-4081906cf997',
    'oct-5-glow': '73cc9b51-1470-491a-9dd3-b051e7e472d3',
    'oct-6': 'a84819f5-532b-4c79-a0f1-e85cc0c1fdd3',
    'oct-6-glow': 'dd28e48f-ef06-48f4-918a-6e8e650df3e6',
    'oct-7': '8768a6f5-61f8-40e4-94bd-7b6da67e5517',
    'oct-7-glow': 'c17b1891-400f-4513-98b9-ca0330e7c86e'
};

/** 金币 31 帧序列（ident.10 .. ident.40）的 uuid，按序排列 */
export const COIN_FRAME_UUIDS: string[] = [
    '2550810d-a606-4d17-82e0-20b166e508d1', '926f6b34-e77d-4f3f-9307-b3810f423c42',
    '5c4b0019-c843-427e-836f-f39219a07804', '07d98af0-8a03-4b65-a945-4e09680a4aae',
    'f6565cd4-3f99-4172-ad09-5057d57b539a', '877b277c-cd0e-480c-a47b-b0ae16484264',
    '47e7caf1-ad59-4c95-af11-953b1e8d8148', 'ce5769be-b34d-4775-882c-c50014d20cde',
    'f77b92ad-013f-43ee-a8a1-1f475c8f7c7c', '884f3ce5-2bf5-4528-969f-7481593dc89b',
    'eb70b5b2-9684-4754-b4d6-d6581a6746c9', 'f6385f34-9aac-4571-b8d6-a9676d673ffa',
    'b655cd35-d6df-4a5a-a959-00cbb8286b06', '823b4c52-36b9-471a-a4ff-96c4c54a2b36',
    '21b7126f-4b5f-4ed4-a1ee-b1e45009f495', '3b28b948-d85d-413d-8ea8-a07c6b48e7bb',
    '7c434529-bc4a-4fff-a9b8-ecdb0d42d597', '0fda15d5-9a15-4103-81da-e8a7d22facea',
    '46622775-7a3d-4a31-b5fb-e442654c5272', 'eb66807b-93a3-4af6-a60d-24028394b41d',
    'ac789c6c-d615-4e0f-9dbd-b1a8dbdda7a6', 'f3761bbc-6ff0-4ab0-b082-4637f416aa13',
    'eb2065d6-e783-4c54-b9cf-6940db84c498', '5d4ef887-49ec-4cad-8799-5087bf8f9185',
    'b02dfa7d-0267-4056-b8da-a3650882e810', 'c3e2a5d5-a2b3-4fc2-b045-6c405b957e77',
    '7f11ede4-4af0-43a9-a724-7a8bed4d18d4', '6545fe80-890a-4284-8a96-3963f226e1c7',
    '2e605953-eff0-4ddc-9260-c907e738c8a6', '844a0e20-f429-4e7e-a227-303807b2aa73',
    'bcece784-b488-460b-ae1a-ba85e9651361'
];

/** Q2.fire 场景中已放置的节点名（代码通过 getChildByName 读取，不创建） */
export const SCENE = {
    PIN_ROOT: 'hg',
    PIN_NAMES: ['hg-1', 'hg-2', 'hg-3', 'hg-4', 'hg-5', 'hg-6', 'hg-7', 'hg-8', 'hg-9', 'hg-10', 'hg-11'],
    GATE_PIN: 'hg-1',      // 顶部闸门针：水平横放，拔掉它金币才开始下落
    JAR_ROOT: 'bottle',
    JAR_MOUTH: 'bottle2',
    JAR_BODY: 'bottle'
};

/**
 * 几何常量：坐标取自 Q2.fire 中节点的真实局部坐标（Canvas 750x1334，y 向上）。
 * 代码中所有针的线段端点都在运行时由节点 position/angle/size 计算，
 * 这里只保存"判定用"的瓶口/容器位置常量。
 */
export const GEO = {
    /**
     * 瓶口判定常量：由 Q2.fire 中父节点 bottle 与子节点 bottle2 的实时变换推导。
     * 场景已把父 bottle 缩放为 0.7、位置调到 (-81.20,-256.74)，子节点随之缩放：
     *   JAR_X         = bottle.x + bottle2.x * bottle.scale = -81.20 + 1*0.7     = -80.50
     *   JAR_MOUTH_Y   = bottle.y + bottle2.y * bottle.scale = -256.74 + 65.8*0.7 = -210.68
     *   JAR_MOUTH_HALF_W = bottle2.width * bottle.scale / 2  = 97*0.7/2          = 33.95
     * 若再次调整场景中罐子的位置/缩放，按上式同步这三个数即可（针几何仍由节点实时计算，无需改）。
     */
    JAR_X: -80.50,
    JAR_MOUTH_Y: -210.68,
    JAR_MOUTH_HALF_W: 33.95,
    /**
     * 碗内初始投放布局：金币一创建就挂动态刚体、受重力自由落下堆到 hg-1 横针上，
     * 所以这些点位只是「投放点」，最终静止位置由 Box2D 堆叠决定（不再是脚本摆好的静态点阵）。
     * 关键点：层距与同层间距都 ≥ 金币物理直径，挂刚体瞬间不互相重叠，
     * 否则 Box2D 会把重叠金币强力弹开、在颈口挤成致密死堆，拔针后更难流动。
     * 每层容量由 chamberLimits(y) 的真实内壁宽度决定，从下往上填满 COIN_TOTAL 为止。
     */
    BOWL_SPAWN_BASE_Y: 40,
    BOWL_SPAWN_STEP: 16,
    BOWL_SPAWN_MARGIN: 9,
    BOWL_SPAWN_MIN_GAP: 15,
    BOWL_SCATTER_JITTER_X: 2.0,
    BOWL_SCATTER_JITTER_Y: 2.0,
    /**
     * 金币目标显示直径。按视频截图的相对尺寸换算：
     * 视频里金币≈针宽1.43倍(实测10px/7px)，场景滑道针宽15.1px → 约21.6px；
     * 罐口基准(视频罐口55px/金币10px)换算约17.6px。
     * 取 18px：比原 20px 再缩 10%，让金币更顺畅流过窄颈口；物理直径同步 14→12，
     * 按重提后的轮廓，颈口最窄处（y=5）内壁 54px、扣墙厚 8 后净宽 46px，
     * 直径 12 的金币可并排 3 枚、y=15 处可并排 4 枚，结拱概率显著下降
     * （见 COIN_PHYS_RADIUS）。
     * 用 CUSTOM 模式 + 按每帧裁剪宽高比设置 contentSize：高度恒为 COIN_SIZE、
     * 宽度随翻转收窄（正面约17.7、侧面约5.3），既不变厚也能稳定渲染。
     * 初始即在物理世界中，全程统一尺寸（不再有"掉落前缩小、掉落时放大"的脚本阶段）。
     */
    COIN_SIZE: 18,
    /**
     * 金币总数：48 枚。
     * 上一版 70 枚在「轮廓约束 + 唯一开口」修复后不再有任何流失，70 枚全部入罐保留显示，
     * 罐子被塞满、观感上金币数量比之前明显偏多；这里回落到视频里适中的一罐量。
     * 碗内 6 层投放（bowlScatter 点位总数同为 48），罐内只占 7 列 × 7 行的下半部。
     */
    COIN_TOTAL: 48,
    /** 金币翻转：每「滚动」多少像素翻一帧（与速度无关的时间轴自转已废弃） */
    SPIN_DIST_PER_FRAME: 10,
    /**
     * 视为「静止」的速度阈值（px/s）：低于此速度金币完全停止翻转。
     * 与 STALL_VSQ 取同一口径（20px/s），保证「判定静止」与「画面静止」一致：
     * 碗内被 hg-1 托住的金币山、槽位里停住的金币都停在一帧上，不会持续闪动。
     */
    SPIN_MIN_SPEED: 20,
    /** 针被拔出时飞出的距离 / 时长 */
    PULL_DISTANCE: 300,
    PULL_TIME: 0.36,
    /** 触摸命中针的像素半径（针身细，需放宽） */
    TOUCH_RADIUS: 30,
    /**
     * 入罐金币堆叠：**尺寸与碗内金币统一**（JAR_COIN_SCALE = 1），且排布自动适配瓶身。
     * 罐玻璃区(世界系)按贴图实测：x[-123.3,-39.7]、y[-301.3,-221.0]、最宽 83.7、高 80.3。
     * 但瓶身是桶形，越往下越窄（y=-297 只剩 44px、y=-269 是 73.7、最宽在 y≈-241 的 83.3），
     * 所以不再用「固定 7 列 × 固定行距」的网格，而是 jarStack() 逐行按 jarHalfWidth(y)
     * 取这一行真实可用宽度再收紧列距 → 自然形成桶形金币堆，也不再顶出瓶身剪影。
     * 列数/行距由 COIN_SIZE × JAR_COIN_SCALE 与 COIN_TOTAL 自动推导，改尺寸不用再手调数值。
     */
    JAR_GLASS_CX: -81.20,
    JAR_GLASS_BOTTOM_Y: -301.3,
    JAR_GLASS_TOP_Y: -221.0,
    /** 堆叠离玻璃内壁留的余量（金币倾斜 18° 后四角会外扩，留量避免越出瓶身） */
    JAR_GLASS_MARGIN: 5,
    /** 罐内散落抖动：层内位置随机偏移、相邻行错落、金币随机倾斜角度（打破网格感） */
    JAR_STACK_JITTER_X: 1.4,
    JAR_STACK_JITTER_Y: 1.2,
    JAR_STACK_ROW_SHIFT: 1.05,
    JAR_STACK_TILT: 18,
    /**
     * 罐内金币缩放：1 = 与碗内金币完全同尺寸（本轮按用户要求统一，不再入罐缩小）。
     * 参考视频里原作罐内金币≈碗内金币的 0.55 倍；若要回到那种观感，把这里改回 0.56 即可，
     * jarStack() 会按 0.56 自动重排（此时罐内不再拥挤、底部只填一半高度）。
     */
    JAR_COIN_SCALE: 1,

    /* ---------------- Box2D 物理引擎参数 ---------------- */
    /** 重力（Cocos 2D 物理 gravity，像素/秒²，默认 -320；取 -900 让下落节奏接近视频） */
    PHYS_GRAVITY: -320,
    /** 针碰撞体：沿针身略收窄/收短，金币接触面贴在针上表面 */
    PIN_BODY_W_SCALE: 0.62,
    PIN_BODY_H_SCALE: 0.98,
    /**
     * 针尖（局部 -Y 那一头）碰撞体收缩量，单位 px；只作用于 PIN_TIP_TRIM_NAME 这根针。
     * 5 根右侧 / 形针的贴图针尖几乎正好压斜底（hg-3~hg-6 针尖只比斜底高 2.5px），
     * 其中 hg-2 的针尖 ≈(-63,-154.3)、斜底在该处 -155.7，碰撞盒四角还比斜底低约 2px，
     * 又正好堵在左下开口（-96~-68）右缘 —— 硬币沿斜底滑向开口时会先撞上这个「小凸台」，
     * 一多就结成稳定堆积、整堆不再下滑（截图里笼子左下那堆金币的直接成因之一）。
     * 针尖端缩 10px：凸台从斜底上消失，形成连续的左下滑道；针身中段仍是静态挡板，
     * 拔针时照样放行金币，不影响「拔右针 → 金币漏进槽位」的判断。
     */
    PIN_TIP_TRIM_NAME: 'hg-2',
    PIN_TIP_TRIM: 10,
    PIN_FRICTION: 0.10,
    /**
     * 金币圆形刚体：半径略小于显示半径（显示直径 18），比值 1.5 与原 20/14 接近，
     * 视觉与碰撞一致、堆叠时金币不会明显互相套叠。
     * 漏斗颈口最窄处（y=5）内壁 54px，扣 WALL_THICK=8 后净通道 46px：
     *   y=5 处 r=8(d16) → 2 枚并排；r=7(d14) → 3 枚；r=6(d12) → 3 枚（46/12=3.83），
     *   y=15 处净通道 48px → d12 恰好并排 4 枚。
     * 取 6：颈口从「勉强 2 枚」跃到「稳容 3 枚以上」，最左下开口 24px
     * 也从 1 枚变 2 枚，48 枚挤过时不再结出稳定拱桥，配合低摩擦与疏通顺畅下滑。
     */
    COIN_PHYS_RADIUS: 6,
    /** 颗粒间 / 壁面摩擦必须足够低，否则金币在颈口与斜壁上结拱后不会自行滑散 */
    COIN_FRICTION: 0.03,
    COIN_RESTITUTION: 0.02,
    COIN_DENSITY: 1.2,
    COIN_LINEAR_DAMPING: 0.02,
    /**
     * 容器静态碰撞墙：不再用「两条垂直壁 + 一块导流板」近似，而是沿截图标注的
     * 绿色轮廓内壁逐段拼接（见 CHAMBER_LEFT / CHAMBER_RIGHT / wallSegments），
     * 把金币完全关在轮廓内，只在最左下开口 CHAMBER_GAP_* 处放行。
     */
    WALL_FRICTION: 0.02,
    /** 每段碰撞墙的厚度；相邻段首尾重叠，杜绝高速金币从接缝穿透。
     *  取 8（半厚 4）：墙向轮廓内侵入更少，颈口净通道比 16 厚时宽 8px（现 46~48px）。 */
    WALL_THICK: 8,
    /** 脚本越界兜底：金币中心相对内壁再内缩的余量 */
    CHAMBER_CLAMP_MARGIN: 6,
    /** 只有明显穿出内壁（超过该容差）才夹回，避免贴壁金币每帧被反复修正 */
    CLAMP_TOLERANCE: 3,
    /**
     * 颈口疏通（anti-jamming）：拔掉闸门针后，48 枚颗粒挤过沙漏形最窄颈口
     * 极易形成稳定拱桥而完全不下滑。对「颈口及以上、已经长时间静止」的金币
     * 施加一次轻微横向错动 + 向下速度，打散拱桥让它继续流动。
     * 严格限定 y ≥ UNSTICK_MIN_Y：落到下方交叉针阵上、被仍插着的针挡住而静止的
     * 金币不会被扰动，保证「插针遮挡时金币不继续掉落」的规则不被破坏。
     */
    UNSTICK_MIN_Y: 12,
    UNSTICK_MAX_Y: 150,
    UNSTICK_TIME: 0.30,
    UNSTICK_VSQ: 2500,
    UNSTICK_VX: 70,
    UNSTICK_VY: -90,
    /**
     * 笼子/出料口疏通（第二处 anti-jamming）：金币落到斜底、直到左下开口这一段，
     * 净宽只有 2 倍币径，48 枚一起挤过来同样会结成拱桥而整堆停住
     * （截图里「闸门和左 5 针都拔了，金币却堆在笼子左下不再下滑」就是这个位置）。
     * 对「已静止超过 THROAT_STILL_TIME、且 y 落在开口前方这段」的金币，
     * 直接给一次朝左下开口的轻推（速度改为 (-VX, -VY)），把拱桥整体错位打散。
     * 只作用于开口前的滑道，不碰碗内被插针托住的金币，也不改任何判定。
     */
    THROAT_MIN_Y: -152,
    THROAT_MAX_Y: -100,
    THROAT_STILL_TIME: 0.55,
    THROAT_NUDGE_VX: 55,
    THROAT_NUDGE_VY: 20,
    /**
     * 通用「无解」兜底：所有针都拔完、金币全部静止、却没能全部进罐时判负。
     * STALL_VSQ 是「视为静止」的速度平方阈值（20px/s），STALL_TIME 是持续时长。
     * 两者都取得很保守：只用来兜住真正卡死的僵局，不影响正常流动中的任何一帧。
     */
    STALL_VSQ: 400,
    STALL_TIME: 1.2,
    /**
     * 判负后「自然落定」时长：判负瞬间不立刻冻结金币，先让物理再跑这么久，
     * 让半空 / 正在滑进槽底的金币落到该停的位置（槽底、挡板上、或出口外面），
     * 然后再统一冻结定格。否则会出现「金币悬在半空不动」的定格画面。
     */
    LOSE_SETTLE_TIME: 0.6,
    /**
     * 结算面板（半透明遮罩 + 底板 + 文字 + 重开按钮）的延迟出现时长。
     * 胜负一旦成立**当帧就锁输入**（点了也没反应，见 Q2Game._onTouch），
     * 但面板晚这么久才淡入，让玩家先看清金币落定的结果再弹结算。
     * 0 = 立刻显示；想更快/更慢改这一个值即可。
     */
    RESULT_UI_DELAY: 1.0,
    /**
     * 最左下开口（唯一允许金币离开容器的缺口），由截图绿色描边反算：
     * 像素 x∈[110,129]、y≈408 → 场景 x∈[-90,-71]、y≈-156，中心 x≈-80.5 正对罐心。
     * 名义开口取 [-96,-68]（宽 28px）；再配合 buildWalls 里「左壁最后一段不向开口方向
     * 多探一个墙厚、0 号槽底不再向左外扩一个墙厚」，实际净宽 ≈ 24px = 2 倍金币物理直径，
     * 金币不再需要单列排队（原净宽只有 ~15px，是笼子左下堆币不动的直接原因）。
     * 落点中心 x≈-80 仍正对罐心、完全落在罐口 x∈[-122.5,-38.5] 内。
     */
    CHAMBER_GAP_LEFT: -96,
    CHAMBER_GAP_RIGHT: -68,
    CHAMBER_GAP_Y: -156,
    /**
     * 出口左侧「护栏」：从出口左唇（-96,-156）向下延长的一段竖直实体墙。
     *
     * 目的（用户要求：保证金币下落时不会穿到绿线左边去）：金币从出口掉出后若
     * 带一点向左的横向速度，会飘到容器左壁外侧、看起来像掉到"外面"。这道护栏的
     * **内侧面正好对齐出口左唇 x=-96.2**（不占用开口净宽），把下落柱限制在
     * 护栏右侧，金币只会顺着它垂直落进罐口。
     *
     * 位置取自用户绿线标注：竖直条世界 x∈[-104.3,-96.2]（中心 ≈ -100.2、宽 8）、
     * y 从 -161.5 延长到 -190.9；实现上端接到出口高度 -156（与左壁末端无缝），
     * 下端取 -191，不伸进罐口（罐口 -210.68），视觉上就是容器左唇向下延长的一点。
     */
    OUTLET_RAIL_X: -100.2,
    OUTLET_RAIL_TOP_Y: -156,
    OUTLET_RAIL_BOTTOM_Y: -191,
    /** 入罐判定：金币中心低于罐口且落在罐口横向范围内 */
    JAR_CATCH_X: -80.5,
    JAR_CATCH_HALF_W: 42,
    JAR_CATCH_Y: -210,
    /** 掉出画面失败线 */
    MISS_Y: -420,
    /** 横向绝对越界线：超过它说明金币已穿出封闭轮廓，直接判流失 */
    MISS_ABS_X: 128,

    /* ---------------- 底部 5 个陷阱槽位 ---------------- */
    /**
     * 笼子底部有 5 个由竖直隔板分开的槽位，沿右高左低的斜底均分：
     * x∈[SLOT_X0, SLOT_X1] = [-68, 97.7]，正好是「左下成功开口右缘 → 右壁末端」。
     * 左下开口 x∈[-92,-68] 不在槽位内，仍是唯一通往罐子的出口。
     * 槽位默认被斜底挡住（有遮挡）；**只有右侧的 / 形导流针被拔**才判定为「没遮挡」，
     * 该段斜底转为 sensor，金币可真实滑落进槽位 —— 但滑落进去即判失败。
     * 左侧 \ 形交叉阻挡针不遮挡槽位，拔它们只放行金币、不算失败（见 SAFE_PINS）。
     */
    SLOT_COUNT: 5,
    SLOT_X0: -68,          // = CHAMBER_GAP_RIGHT，左下开口右缘
    SLOT_X1: 97.7,         // = CHAMBER_RIGHT 末端 x
    /** 金币中心低于该高度且落在「已开放槽位」内 → 判 slot 失败。
     *  取 -158（略高于挡板顶面停驻高度 -160）：金币穿过开放槽位斜底、正落向
     *  绿色挡板时即结算，避免稳定停在 -160 时因浮点误差迟迟不触发。 */
    SLOT_FAIL_Y: -158,
    /** 只在该高度以下跳过轮廓夹回：笼子底部区域，避免把正落进槽位的金币又夹回斜壁 */
    SLOT_CLAMP_SKIP_Y: -110,
    /**
     * 槽位下方的「绿色区域」= 一道真实存在的水平静态挡板（截图里的亮绿色横线）。
     * 金币从开放槽位漏下后必须被它挡住、停在槽位里（绿色线之上），
     * 不允许继续滑落到绿色线下方 / 罐子方向 / 画面外。
     *
     * 高度 -178（顶面 -174 = 美术里槽位格子底边实测 y≈-173.7）：
     *   金币停在格子里时中心 y≈-168，正好压在美术的格子底线上、看起来是"躺在格子底"，
     *   而不是悬在格子上部。仍在斜底最低点(-156) 之下、罐口(-210) 之上，不干扰成功路径。
     * 左端 -68 = SLOT_X0 = 成功开口右缘：**整排槽位（含 0 号槽的左半）都有实心底**，
     *   金币掉进任何槽位都不会从槽底漏出去；开口本身在 x<-68，不受影响
     *   （开口侧另有 SlotDivider0 竖直壁，只向格子内偏移，不探进开口）。
     * 右端 97.7 = SLOT_X1（右壁末端）。
     */
    SLOT_GUARD_Y: -178,
    SLOT_GUARD_X0: -68,
    SLOT_GUARD_X1: 97.7,
    SLOT_GUARD_THICK: 8,
    /**
     * 槽位「格子」侧壁厚度：5 个槽位各自是一个真实的物理口袋 ——
     * 槽口（可开关的斜底段）打开后金币按物理掉进格子，被格子四周的实体壁兜住，
     * 不会穿过槽底、也不会隔着隔板滑进隔壁格子。
     * 侧壁上端止于该槽口斜底（不探进通道，不影响金币沿斜底下滑），
     * 下端到绿色挡板顶面（-166）。
     */
    SLOT_DIVIDER_W: 8,
    /** 判 slot 失败后金币的停驻高度（保留兼容：新实现不再用它传送金币，改为物理自然停住） */
    SLOT_LAND_Y: -160,
    /**
     * 槽位遮挡针 = 右侧 5 根「/ 形导流针」（圆环在右上、针尖在左下，angle −36~−38°）。
     * 由 Q2.fire 真实几何解析：这 5 根圆环端 x∈[+58,+120]（右侧），另一端 x 依次为
     * −66.1/−32.7/0.9/32.0/63.6，索引 i 对应 slot i。
     * 它们既是把金币导向最左下成功开口的滑道，也被当作对应槽位的遮挡：
     * 拔掉 → 该段斜底转 sensor（见 Q2Physics.setSlotOpen）。
     * 用户规则：拔右侧 5 根中任意一根都算「槽位失守」。
     */
    SLOT_GUARD_PINS: ['hg-2', 'hg-3', 'hg-4', 'hg-5', 'hg-6'],
    /**
     * 安全放行针 = 左侧 5 根「\ 形交叉阻挡针」（圆环在左上、针尖在右下，angle +42~+44°）。
     * 圆环端 x∈[−59,−133]（左侧），与 / 针 X 交叉形成网格；它们只负责「暂时挡住金币、
     * 让金币在针上堆叠」，**不遮挡任何槽位**。拔掉它们金币沿仍保留的 / 滑道继续向左下
     * 滑落、最终全部从左下开口进罐 → **不算死局**，这正是玩家正解要逐根拔掉的针。
     * 用户规则：拔左侧 5 根（任意根 / 任意组合 / 全拔）都不会死局。
     */
    SAFE_PINS: ['hg-7', 'hg-8', 'hg-9', 'hg-10', 'hg-11'],
    /**
     * 「拔右侧守卫针」是否**立即**判死局。
     *
     * false（当前）= 只按真实物理结算判负：某个槽位开放后，金币真的穿过该段斜底、
     *   落到 SLOT_FAIL_Y 以下 → Q2Coin 报 slot → 判负。这样死局完全由状态 +
     *   真实漏币推出，满足题目「局面还有解时不得提前失败」。
     * true = 保留「拔右侧任意一根即死」的纯规则判定（不看金币有没有真的漏）。
     *
     * 为什么默认 false：用 Box2D 2.3 离线复现（与引擎内置同版本，1/60 步长、
     *   10/10 迭代、48 枚金币、两套轮廓各跑一遍）实测，拔掉守卫针并开放对应槽位后：
     *     hg-2(→slot0)  44/48 进罐，4 枚真实漏进槽位  ← 真陷阱
     *     hg-3..hg-6    48/48 全部进罐，一枚不漏      ← 拔了并没有损失
     *   原因是金币的落点集中汇聚到最左侧 slot0 上方，slot1~4 的斜底即使开着也没有
     *   金币经过。若仍按「拔任意一根即判死」，玩家拔 hg-6 后其实仍能全收集，会出现
     *   「局面有解却被判负」的提前失败，与题目第 5 条冲突。
     * 若想按用户最初的口径回到严格规则，把此项改为 true 即可（其余逻辑不用动）。
     */
    FATAL_ON_GUARD_PULL: false,
    /**
     * 「拔掉即死」的指定针（按场景节点名）。拔出其中任意一根 → 当帧直接判死局，
     * 不再等物理上真的漏币。优先级高于 FATAL_ON_GUARD_PULL，与真实漏币判定并存
     * （任一命中即判负），因此是"更严"的附加规则，不会让局面变得更宽松。
     *
     * 当前 = ['hg-2']：hg-2 是 slot0 的唯一遮挡针（针尖 x≈−66，正对最左槽），
     *   slot0 紧挨左下成功开口，是金币必经之地 —— 它一被拔，槽底立刻敞开、
     *   金币必然从这里漏走，所以直接判死局（用户要求：本关拔 hg-2 即判负）。
     *   置为 [] 即关闭该规则，只保留物理漏币判负。
     */
    FATAL_PINS: ['hg-2'],
    /**
     * 「拔即死」名单是否要**先预判**再判负（默认 true）。
     *
     * 为什么需要预判：hg-2 虽然是 slot0 的唯一遮挡针，但如果玩家是在**金币都已经
     * 进到左下出口列（x ≤ CHAMBER_GAP_RIGHT = -68）、马上要落进罐子**的时候才拔它，
     * 此时槽底敞开也漏不到任何一枚 —— 局面仍然可解，不该判负。
     *
     * 预判判据（Q2Game._fatalPinDoomed，纯几何、不用模拟）：
     *   只要还存在一枚「未结算（还没入罐）且中心仍在 x > -68」的金币，它后续必须
     *   从右侧横穿过槽位区才能到左下出口，一定会踩进 slot0 的洞 → 真已无解 → 判负；
     *   若所有未结算金币的中心都已 ≤ -68（全在出口列里，只会垂直落进罐口）→ 不判负，
     *   关卡继续跑，它们会正常 48/48 入罐。
     *
     * 置 false 则退回「拔 hg-2 无条件当帧判死局」的旧口径。
     */
    FATAL_PIN_PREJUDGE: true
};

/**
 * 容器绿色轮廓内壁的两条折线链（按 y 从高到低排列，格式 [x, y]）。
 *
 * 来源（第二版，按美术内腔重提）：
 *   把 backgound_0/2/1 按 Q2.fire 的场景坐标合成，按颜色分类取出「深红内腔」的
 *   左右边界，逐高度采样后手整理成单调折线（不是手绘描边拟合）。
 *   抽取结果（场景坐标，y : 内腔左缘, 右缘）：
 *     155:-121/105  145:-123/104  135:-122/103  125:-120/106  115:-117/99
 *     105:-114/101  95:-111/98   85:-106/94    75:-101/89    65:-95/83
 *     55:-87/75     45:-76/56     35:-59/48     25:-34/29     15:-26/22
 *     5:-27/18      -5:-36/33    -15:-45/36    -25:-55/47    -35:-65/65
 *     -45:-75/75    -55:-84/78   -65:-93/93    -75:-102/94   -85:-109/96
 *     -95..-125:-113/96  -135:-113/99  -145:-113/90  -155:-112/94
 *     -165:-106/74  -175:-106/8
 *   折线取内腔边界 ±4px（= WALL_THICK/2），碰撞墙的「内表面」正好贴住美术内腔。
 *
 * 为什么要重提：旧链是照着手绘绿线拟合的，实测在碗下段（y=36~70）只有美术的
 *   一半宽（y=70 时 -75.6/66.5 vs 美术 -98/86，单侧偏窄 20px 以上），金币堆被
 *   无形墙挤在碗底中间、还容易结拱（之前只能靠 UNSTICK 强推）；而在 y=0~-40
 *   又比美术宽 10~25px，金币会压到侧框上。新版把这两处一并修正。
 *
 * 形状：上部碗（上宽下窄）→ 中部收窄颈口(x≈±27, y≈15) → 下部笼子
 *      （左右向外扩张到 x≈±107）→ 底部右高左低的斜底 → 最左下开口。
 * 左链末端即开口左缘，右链末端接斜底右端；两者之间留缺口（不通墙）。
 * 斜底右端 (97.7,-120) 与旧值一致，槽位/挡板/开口几何完全不变。
 */
export const CHAMBER_LEFT: Array<[number, number]> = [
    [-127.0, 150], [-119.5, 110], [-113.0, 90], [-103.0, 70], [-91.0, 55],
    [-71.0, 40], [-38.0, 25], [-30.0, 15], [-31.0, 5], [-40.0, -5],
    [-54.0, -20], [-74.0, -40], [-93.0, -60], [-106.9, -80], [-106.7, -100],
    [-102.5, -120], [-98.2, -140], [GEO.CHAMBER_GAP_LEFT, GEO.CHAMBER_GAP_Y]
];

export const CHAMBER_RIGHT: Array<[number, number]> = [
    [109.0, 150], [104.0, 110], [101.0, 90], [90.0, 70], [78.0, 55],
    [66.0, 50], [55.0, 40], [33.0, 25], [26.0, 15], [23.0, 5], [37.0, -5],
    [45.0, -20], [75.0, -40], [96.0, -60], [97.2, -80], [97.4, -100],
    [97.7, -120]
];

/**
 * 生成封闭碰撞墙的线段集合 [x1, y1, x2, y2]。
 * 左壁链 + 斜底 + 右壁链；左壁末端与斜底左端之间的开口不连墙，
 * 因此金币只能从最左下缺口离开容器，落进正下方的罐子。
 */
export function wallSegments(): Array<[number, number, number, number]> {
    const seg: Array<[number, number, number, number]> = [];
    for (let i = 0; i < CHAMBER_LEFT.length - 1; i++) {
        const a = CHAMBER_LEFT[i], b = CHAMBER_LEFT[i + 1];
        seg.push([a[0], a[1], b[0], b[1]]);
    }
    for (let i = 0; i < CHAMBER_RIGHT.length - 1; i++) {
        const a = CHAMBER_RIGHT[i], b = CHAMBER_RIGHT[i + 1];
        seg.push([a[0], a[1], b[0], b[1]]);
    }
    // 斜底：开口右缘 → 右壁末端（右高左低，金币自然向左滑入开口）
    const rEnd = CHAMBER_RIGHT[CHAMBER_RIGHT.length - 1];
    seg.push([GEO.CHAMBER_GAP_RIGHT, GEO.CHAMBER_GAP_Y, rEnd[0], rEnd[1]]);
    return seg;
}

/**
 * 给定高度 y，返回该处容器内壁允许的 x 范围（供脚本越界兜底夹回）。
 * 左右链按 y 单调递减，用相邻两点线性插值；超出链范围时钳到端点。
 *
 * 右壁只到 y=-120，再往下右边界由「右高左低的斜底」给出：金币必须位于
 * 斜底表面之上，即 x ≤ 斜底在该高度的 x，否则就是穿到了斜底下方。
 * y 低于开口高度（已离开容器）返回 null，交给入罐 / 流失判定，不再夹回。
 */
export function chamberLimits(y: number): { left: number; right: number } | null {
    const gapY = GEO.CHAMBER_GAP_Y;
    if (y < gapY) { return null; }

    const sample = (chain: Array<[number, number]>): number => {
        if (y >= chain[0][1]) { return chain[0][0]; }
        for (let i = 0; i < chain.length - 1; i++) {
            const a = chain[i], b = chain[i + 1];
            if (y <= a[1] && y >= b[1]) {
                const t = (a[1] - y) / (a[1] - b[1] || 1);
                return a[0] + (b[0] - a[0]) * t;
            }
        }
        return chain[chain.length - 1][0];
    };

    const rEnd = CHAMBER_RIGHT[CHAMBER_RIGHT.length - 1];   // (97.7, -120)
    let right: number;
    if (y >= rEnd[1]) {
        right = sample(CHAMBER_RIGHT);
    } else {
        const t = (y - gapY) / (rEnd[1] - gapY);
        right = GEO.CHAMBER_GAP_RIGHT + (rEnd[0] - GEO.CHAMBER_GAP_RIGHT) * t;
    }
    return { left: sample(CHAMBER_LEFT), right };
}

/* ---------------- 底部槽位几何 ---------------- */

/** 斜底（右高左低）在横坐标 x 处的高度；与 chamberLimits 的斜底右边界同源 */
export function slotFloorY(x: number): number {
    const rEnd = CHAMBER_RIGHT[CHAMBER_RIGHT.length - 1];
    return GEO.CHAMBER_GAP_Y
        + (x - GEO.CHAMBER_GAP_RIGHT) / (rEnd[0] - GEO.CHAMBER_GAP_RIGHT)
        * (rEnd[1] - GEO.CHAMBER_GAP_Y);
}

/** 5 个槽位的 x 区间（从左到右），左端接成功开口右缘、右端接右壁末端 */
export function slotSpans(): Array<{ x0: number; x1: number }> {
    const w = (GEO.SLOT_X1 - GEO.SLOT_X0) / GEO.SLOT_COUNT;
    const out: Array<{ x0: number; x1: number }> = [];
    for (let i = 0; i < GEO.SLOT_COUNT; i++) {
        out.push({ x0: GEO.SLOT_X0 + i * w, x1: GEO.SLOT_X0 + (i + 1) * w });
    }
    return out;
}

/** x 落在第几个槽位；落在左下成功开口或槽位之外返回 -1 */
export function slotIndexOf(x: number): number {
    if (x < GEO.SLOT_X0 || x >= GEO.SLOT_X1) { return -1; }
    const w = (GEO.SLOT_X1 - GEO.SLOT_X0) / GEO.SLOT_COUNT;
    return Math.min(GEO.SLOT_COUNT - 1, Math.floor((x - GEO.SLOT_X0) / w));
}

/**
 * 把整条斜底拆成 5 段（每段对应一个槽位），供 Q2Physics 建可独立开关的槽位底墙。
 * 段首尾由 WALL_THICK 重叠，关闭时与整条斜底完全等价（金币仍全部导向左下开口）。
 */
export function slotSegments(): Array<[number, number, number, number]> {
    const seg: Array<[number, number, number, number]> = [];
    const spans = slotSpans();
    for (let i = 0; i < spans.length; i++) {
        const s = spans[i];
        seg.push([s.x0, slotFloorY(s.x0), s.x1, slotFloorY(s.x1)]);
    }
    return seg;
}

/**
 * 5 个槽位「格子」的侧壁：竖直线段盒 [中心 x, 底 y, 顶 y, 宽度]。
 *
 * 目的：让每个槽位成为真正闭合的口袋 —— 金币从开放槽口按物理掉进格子后，
 * 被左/右隔板与槽底挡住，**不会穿过去**（既不会穿过槽底往下掉，也不会横穿
 * 隔板滑进隔壁格子 / 滑出容器）。
 *
 * 几何：
 *   · 底 y = 绿色挡板顶面（SLOT_GUARD_Y + 半厚），与挡板严丝合缝；
 *   · 顶 y = 该 x 处的槽口斜底（slotFloorY），因此侧壁整体在通道下方，
 *     不探进金币下滑的斜底通道，不影响成功路径的滑落；
 *   · 0 号槽左壁（= 左下成功开口右缘）只向格子内侧偏移半个厚度，
 *     绝不向开口方向探出，避免刮到正从开口掉出的金币；
 *   · 最右一根向内偏移，与右壁末端一起封死格子右端。
 */
export function slotDividerBoxes(): Array<[number, number, number, number]> {
    const spans = slotSpans();
    const w = GEO.SLOT_DIVIDER_W;
    const yBot = GEO.SLOT_GUARD_Y + GEO.SLOT_GUARD_THICK * 0.5;
    const xs: number[] = [spans[0].x0];
    for (let i = 0; i < spans.length; i++) { xs.push(spans[i].x1); }
    const out: Array<[number, number, number, number]> = [];
    for (let i = 0; i < xs.length; i++) {
        const x = xs[i];
        const yTop = slotFloorY(x);
        if (yTop <= yBot + 1) { continue; }
        let cx = x;
        if (i === 0) { cx = x + w * 0.5; }                    // 只向格子内
        else if (i === xs.length - 1) { cx = x - w * 0.5; }   // 只向格子内
        out.push([cx, yBot, yTop, w]);
    }
    return out;
}

/**
 * 槽位下方的「绿色区域」水平挡板线段 [x0, y, x1, y]。
 * 常驻静态碰撞体、不参与槽位开关：金币从开放槽位漏下后被它接住，
 * 停在槽位里（绿色线之上），不再滑落到绿色线下方 / 画面外。
 * 左端 SLOT_GUARD_X0 刻意避开最左下成功开口，右端到右壁末端。
 */
export function slotGuardSegment(): [number, number, number, number] {
    return [GEO.SLOT_GUARD_X0, GEO.SLOT_GUARD_Y,
        GEO.SLOT_GUARD_X1, GEO.SLOT_GUARD_Y];
}

/** 游戏状态 */
export type GameState = 'ready' | 'playing' | 'win' | 'lose';

/**
 * 碗内初始投放坐标（确定性，重开一致）：从颈口上方开始逐层向上，
 * 每层可用宽度取 chamberLimits(y) 的真实绿色轮廓内壁，按 ≥ 金币物理直径的
 * 间距均匀铺开；从下往上填满 COIN_TOTAL 枚即止。
 * 挂刚体瞬间金币互不重叠、且全部落在物理墙内：既不会被 Box2D 强力弹飞，
 * 也不会在颈口预先挤出一片致密死堆（后者是「拔针后金币不下滑」的帮凶）。
 */
const BOWL_POINTS: Array<{ x: number; y: number; phase: number }> = (() => {
    const pts: Array<{ x: number; y: number; phase: number }> = [];
    let y = GEO.BOWL_SPAWN_BASE_Y;
    while (pts.length < GEO.COIN_TOTAL && y <= GEO.UNSTICK_MAX_Y - 10) {
        const lim = chamberLimits(y);
        if (lim) {
            const lo = lim.left + GEO.BOWL_SPAWN_MARGIN;
            const hi = lim.right - GEO.BOWL_SPAWN_MARGIN;
            const span = hi - lo;
            if (span > 0) {
                const cap = Math.max(1, Math.floor(span / GEO.BOWL_SPAWN_MIN_GAP));
                const n = Math.min(cap, GEO.COIN_TOTAL - pts.length);
                for (let col = 0; col < n; col++) {
                    const idx = pts.length;
                    const jx = Math.sin(idx * 12.9898 + 78.233) * 43758.5453;
                    const jy = Math.sin(idx * 39.3468 + 11.135) * 24634.6345;
                    const jp = Math.sin(idx * 73.1562 + 4.871) * 31415.9265;
                    const nX = (jx - Math.floor(jx)) * 2 - 1;
                    const nY = (jy - Math.floor(jy)) * 2 - 1;
                    const nP = jp - Math.floor(jp);
                    // 抖动幅度不超过「半格 − 金币半径」，保证抖动后仍不与邻枚重叠
                    const jit = Math.min(GEO.BOWL_SCATTER_JITTER_X,
                        Math.max(0, span / n * 0.5 - GEO.COIN_PHYS_RADIUS - 1));
                    const x = lo + (col + 0.5) * (span / n) + nX * jit;
                    pts.push({
                        x,
                        y: y + nY * GEO.BOWL_SCATTER_JITTER_Y,
                        phase: Math.floor(nP * 31)
                    });
                }
            }
        }
        y += GEO.BOWL_SPAWN_STEP;
    }
    return pts;
})();

/** 碗内第 index 枚金币的初始位置与旋转相位 */
export function bowlScatter(index: number): { x: number; y: number; phase: number } {
    const p = BOWL_POINTS[index % BOWL_POINTS.length];
    return { x: p.x, y: p.y, phase: p.phase };
}

/** 碗内金币坐标表长度（应等于 COIN_TOTAL） */
export function bowlPointCount(): number { return BOWL_POINTS.length; }

/** 确定性 0..1 哈希（与碗内散落同源，重开布局一致） */
function hash01(i: number, seed: number): number {
    const v = Math.sin(i * seed + 78.233) * 43758.5453;
    return v - Math.floor(v);
}

/**
 * 罐玻璃内壁的半宽表（y 升序，单位 px，按贴图像素实测逐行扫描得到）。
 * 瓶身是桶形：底部收口、中段最宽、颈下再收一点，金币堆必须按行宽度收紧才不会顶出剪影。
 */
const JAR_PROFILE: Array<[number, number]> = [
    [-301.3, 14.0], [-297.3, 22.0], [-291.3, 28.0], [-283.0, 32.5], [-275.0, 36.4],
    [-269.2, 36.9], [-261.2, 38.7], [-255.2, 40.0], [-253.0, 40.2], [-241.0, 41.7],
    [-233.0, 41.4], [-227.0, 39.4], [-221.0, 36.6]
];

/** 给定高度处玻璃内壁的半宽（线性插值，超出表范围取端点值） */
export function jarHalfWidth(y: number): number {
    const n = JAR_PROFILE.length;
    if (y <= JAR_PROFILE[0][0]) { return JAR_PROFILE[0][1]; }
    if (y >= JAR_PROFILE[n - 1][0]) { return JAR_PROFILE[n - 1][1]; }
    for (let i = 1; i < n; i++) {
        if (y <= JAR_PROFILE[i][0]) {
            const a = JAR_PROFILE[i - 1];
            const b = JAR_PROFILE[i];
            const t = (y - a[0]) / (b[0] - a[0]);
            return a[1] + (b[1] - a[1]) * t;
        }
    }
    return JAR_PROFILE[n - 1][1];
}

/** 罐内堆叠布局（按当前 COIN_SIZE × JAR_COIN_SCALE 与 COIN_TOTAL 推导一次后缓存） */
interface JarLayout {
    /** 罐内金币显示直径 */
    d: number;
    /** 每行列数 */
    cols: number;
    /** 行数 */
    rows: number;
    /** 最底一行金币中心的 y */
    bottomY: number;
    /** 行距（含倾斜后的包围盒仍落在瓶身内的保守值） */
    stepY: number;
}

let _jarLayout: JarLayout | null = null;

function jarLayout(): JarLayout {
    if (_jarLayout) { return _jarLayout; }
    const d = GEO.COIN_SIZE * GEO.JAR_COIN_SCALE;
    let maxHalf = 0;
    for (let i = 0; i < JAR_PROFILE.length; i++) {
        if (JAR_PROFILE[i][1] > maxHalf) { maxHalf = JAR_PROFILE[i][1]; }
    }
    // 最宽处可容纳的首尾中心跨度（两侧各留 margin + 半个币）
    const maxSpan = maxHalf * 2 - GEO.JAR_GLASS_MARGIN * 2 - d;
    // 列距按半个币错位（重叠 50%，罐内本来就是密密麻麻的一堆金币）
    const cols = Math.max(2, Math.min(9, Math.floor(maxSpan / (d * 0.5)) + 1));
    const rows = Math.ceil(GEO.COIN_TOTAL / cols);
    const bottomY = GEO.JAR_GLASS_BOTTOM_Y + GEO.JAR_GLASS_MARGIN + d * 0.5;
    const roomH = (GEO.JAR_GLASS_TOP_Y - GEO.JAR_GLASS_MARGIN)
        - (GEO.JAR_GLASS_BOTTOM_Y + GEO.JAR_GLASS_MARGIN) - d;
    const stepY = rows > 1 ? Math.min(d * 0.62, roomH / (rows - 1)) : 0;
    _jarLayout = { d: d, cols: cols, rows: rows, bottomY: bottomY, stepY: stepY };
    return _jarLayout;
}

/**
 * 罐内第 index 枚金币的最终堆叠落点：自然散落、不排成整齐网格。
 * 先按「列 × 行」定位，再用 jarHalfWidth(y) 把这一行的横向跨度夹进瓶身可用宽度，
 * 最后叠加层内抖动、相邻行错落、随机倾斜 —— 越靠罐底越窄，自然成桶形堆。
 */
export function jarStack(index: number): { x: number; y: number; angle: number } {
    const L = jarLayout();
    const col = index % L.cols;
    const row = Math.floor(index / L.cols);
    const nx = hash01(index, 12.9898) * 2 - 1;
    const ny = hash01(index, 39.3468) * 2 - 1;
    const na = hash01(index, 73.1562) * 2 - 1;
    const shift = (row % 2 === 0 ? -1 : 1) * GEO.JAR_STACK_ROW_SHIFT;

    const y0 = L.bottomY + row * L.stepY;
    // 这一行真实可用的「首尾金币中心跨度」：玻璃半宽 - 内壁余量 - 币半径
    const half = jarHalfWidth(y0) - GEO.JAR_GLASS_MARGIN - L.d * 0.5;
    const gapX = L.cols > 1 ? Math.max(0, Math.min(L.d * 0.5, (half * 2) / (L.cols - 1))) : 0;

    const x = GEO.JAR_GLASS_CX
        + (col - (L.cols - 1) / 2) * gapX
        + shift + nx * GEO.JAR_STACK_JITTER_X;
    const y = y0 + ny * GEO.JAR_STACK_JITTER_Y;
    const angle = na * GEO.JAR_STACK_TILT;
    return { x, y, angle };
}
