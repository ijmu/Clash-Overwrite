/*
 * FlClash.js
 * FlClash / Mihomo 动态覆写 v5.6（2026-10-17）
 *
 * v5.6：与 ClashParty.js v5.6 同步——媒体分组精简：
 *   1. 砍「国外媒体」组：netflix / disney / primevideo / hbo /
 *      spotify 规则集移除（走 Final 兜底）；
 *   2. YouTube 由 geosite-google include 命中走 Google 组；
 *   3. TikTok / Telegram / X(Twitter) 保留；
 *   4. 「国内媒体」保留，DIRECT 优先。
 *
 * v5.5：与 ClashParty.js v5.5 同步——开发者与社交分流补齐
 *   （来源：CFW star 分组调研）：
 *   1. 新增「开发者」组（szkane Developer.list，classical text）；
 *   2. 新增「论坛」「社交媒体」组（QuixoticHeart forum.mrs /
 *      socialmedia.mrs）；
 *   3. GitHub 组并入 gits.mrs；AI服务 组并入 ai.mrs；
 *   4. 远控软件进程直连（ToDesk / Sunlogin / mstsc / RustDesk）。
 *
 * v5.4：与 ClashParty.js v5.4 同步的分流补齐与规则化（全部经
 *   CDN 可用性逐一实测）：
 *   1. Microsoft 组补 onedrive / xbox / github-copilot 独立
 *      规则集（均指向原组统一管理）；bing@cn / steam@cn
 *      追加至直连区；
 *   2. 新增 Discord / X(Twitter) / Reddit / Wikimedia / Steam
 *      独立组（候选统一 REF + 主要地区 + 手动选择，无节点
 *      地区自动隐藏）；图标 5 枚已入库 icons/（lige47 图标库）。
 *
 * v5.3：与 ClashParty.js v5.3 同步的分组切换稳定性专项
 *   （结构不变、业务组全保留）：
 *   1. 新增「故障转移」组（fallback，include-all 动态成员）：
 *      当前节点失效时按订阅顺序切到第一个存活节点，延迟
 *      抖动不切换——长连接几乎不断流。纳入 节点选择 /
 *      手动选择 / Final 候选；图标复用仓库闲置的 quanqiu.png。
 *   2. 故障响应提速：测速间隔 300 → 180 秒；max-failed-times
 *      2 → 1。tolerance 150 保持不变。
 *
 * v5.2：与 ClashParty.js v5.2 同步的运行日志实测优化（全部为增量）：
 *   1. NCSI 直连（msftconnecttest.com / msftncsi.com）：不在
 *      microsoft@cn 内，此前命中 geosite-microsoft 走代理，
 *      节点故障时 Windows 误报"无 Internet"（日志实测 20 次失败）；
 *   2. lencr.org（Let's Encrypt OCSP / CRL）直连：证书校验
 *      不依赖代理，代理断连时 LE 证书站点首连不受影响；
 *   3. binance.bh 显式归入加密货币组：不在
 *      category-cryptocurrency 上游集内，此前落 Final 兜底；
 *   4. ota.nvidia.com（GeForce 驱动 OTA）直连，NVIDIA 国内可达。
 *
 * v5.1：与 ClashParty.js v5.1 同步的 AI 分流升级（全部为增量，
 *   不改动既有业务规则）：
 *   1. 接入 VPSDance/ai-proxy-rules 聚合规则集（每日自动同步，
 *      合并 v2fly / blackmatrix7 等多源去重补漏，testingcf 同源加载）：
 *      - ai-global（classical）→ AI服务：自动补齐 geosite 未收录的
 *        海外 AI 域名（character.ai / civitai / leonardo.ai /
 *        AWS Q / Adobe Firefly 等），不再依赖手工补域名；
 *        置于业务大类之前，与 category-ai-!cn 同指 AI服务，
 *        双收录域名（copilot.cloud.microsoft / storage.googleapis.com
 *        等）归属不变；
 *      - ai-cn（classical）→ DIRECT：国内 AI 补漏直连
 *        （coze 全系 / chatglm / hailuoai 等）；
 *   2. AI服务 组补「台湾节点」候选（Gemini / ChatGPT / Claude
 *      均支持台湾出口，美西线路的延迟备选；
 *      include-all 过滤组语义下与既有地区候选行为一致）；
 *   3. 保留手工 AI 补充规则（runpod.io 不在聚合集内）。
 *
 * v5.0：与 ClashParty.js v5.0 同步的全面提速与抗断流增强，
 *   并完整重建（仓库内旧 v3 文件在韩国节点定义处截断，本版为
 *   依据 README 声明的 include-all 架构重建的完整可运行版本）：
 *   1. 新增「其他节点」组：include-all + exclude-filter 排除全部
 *      地区正则，未识别地区节点自动归入 url-test 组；
 *      节点选择 / 手动选择 / Final 纳入（内联节点全可识别时不创建）；
 *   2. DNS 新增 direct-nameserver（纯 IP 加密 DoH）：
 *      DIRECT 出口域名固定走国内递归，首连更快，
 *      且不会被 nameserver-policy 送往境外 DoH 绕一圈；
 *   3. nameserver-policy 补 rule-set:geosite-tencent → 国内 DoH，
 *      微信系域名解析更快更稳；
 *   4. 新增 NTP 服务（ntp.aliyun.com，直连）：内核时间漂移时
 *      hysteria2 / tuic 等基于时间的鉴权不再"莫名全断"；
 *   5. 游戏平台国内域名直连（category-games@cn +
 *      category-game-platforms-download@cn，仅 @cn 属性子集）；
 *   6. 显式声明 etag-support: true 与 keep-alive 15/15（内核默认值
 *      一致，显式化防客户端回退）；
 *   7. 规则集源与 ClashParty v4.2 同步切换 testingcf.jsdelivr.net
 *      （Cloudflare 边缘，大陆直连可达性优于主域）；
 *      url-test tolerance 80 → 150，与 ClashParty 一致，稳定优先；
 *   8. 图标与 ClashParty v4.1 同步：业务组改用本仓库 icons/，
 *      地区组保留 lige47 图标源；
 *   9. uTLS 指纹注入：对内联 proxies 的 vmess / vless / trojan
 *      补 client-fingerprint: 'chrome'（proxy-providers 内节点
 *      由 provider 定义，脚本无法注入，保持原样）。
 *   空组行为已经 mihomo v1.19.32 实测：include-all 过滤后为空的
 *   策略组以 COMPATIBLE 占位存在，配置可正常加载、引用不悬空。
 *
 * v3：AI 美国优先；手动组自动选择优先；移除共享 CDN 全域直连；
 * 新增 Wise / iFAST / Neverless / Speedtest 独立分流；精简 Fake-IP 排除。
 * 金融默认地区沿用个人 Egern 偏好，不代表服务商通用地区要求。
 * 已保存的策略选择优先于候选顺序，更新后请手动检查一次业务组。
 * 保留 DNS fallback、测速和 TCP 参数；测速延迟不代表吞吐或业务可用性。
 *
 * 保留 include-all 动态加载 proxies / proxy-providers。
 * FlClash：关闭客户端 DNS 覆写和追加系统 DNS，IPv6 关闭，运行模式 Rule。
 */

function main(config) {
  if (!config || typeof config !== 'object') {
    return config
  }

  const hasProviders = Object.keys(config['proxy-providers'] || {}).length > 0
  if ((!Array.isArray(config.proxies) || config.proxies.length === 0) && !hasProviders) {
    throw new Error('[FlClash.js] 配置中缺少 proxies / proxy-providers')
  }

  /* ============================================================
   * 一、基础地址
   * ============================================================ */

  /*
   * 地区组图标沿用 lige47 图标源（保留 v3 行为）；
   * 业务组与「其他节点」图标改用本仓库 icons/
   * （v5.0 与 ClashParty v4.1/v4.4 同步，图标本地化）。
   */
  const ICON =
    'https://cdn.jsdelivr.net/gh/lige47/lige_icon@main/icon/'

  const REPO_ICON =
    'https://testingcf.jsdelivr.net/gh/ijmu/Clash-Overwrite@main/icons/'

  /*
   * v5.0：testingcf 为 jsDelivr 的 Cloudflare 边缘域，
   * 大陆直连可达性优于 cdn.jsdelivr.net 主域
   * （与 ClashParty v4.2 同步，降低规则更新失败概率）。
   */
  const RSET =
    'https://testingcf.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/'

  /* dler-io Crypto 规则集（classical，含交易所/行情/Web3 域名） */
  const CRYPTO_DLER =
    'https://testingcf.jsdelivr.net/gh/dler-io/Rules@main/Clash/Provider/Crypto.yaml'

  /*
   * v5.1：VPSDance AI 聚合规则集（classical，仓库每日自动同步，
   * 合并 v2fly / blackmatrix7 等多源去重补漏）。
   * global：海外 AI 全集（character.ai / civitai / leonardo.ai /
   * AWS Q / Adobe Firefly 等 geosite 未收录域名）；
   * cn：国内 AI 全集（coze 全系 / chatglm.cn / hailuoai.com 等）。
   * 与 ClashParty.js v5.1 同步。
   */
  const AI_GLOBAL =
    'https://testingcf.jsdelivr.net/gh/VPSDance/ai-proxy-rules@main/rules/clash/global.yaml'

  const AI_CN =
    'https://testingcf.jsdelivr.net/gh/VPSDance/ai-proxy-rules@main/rules/clash/cn.yaml'

  /*
   * v5.5：QuixoticHeart/rule-set（ruleset 分支，每日构建，
   * domain mrs）与 szkane/ClashRuleSet（classical text）。
   * 与 ClashParty.js v5.5 同步。
   */
  const QX_DOMAIN =
    'https://testingcf.jsdelivr.net/gh/QuixoticHeart/rule-set@ruleset/meta/domain/'

  const DEV_LIST =
    'https://testingcf.jsdelivr.net/gh/szkane/ClashRuleSet@main/Clash/Ruleset/Developer.list'

  /* ============================================================
   * 二、测速参数
   * ============================================================ */

  const urlTest = {
    url: 'https://www.gstatic.com/generate_204',
    'expected-status': 204,

    // 3 分钟测速一次（v5.3：300 → 180，与 ClashParty 同步）
    interval: 180,

    // 单节点测速最多等待 3 秒
    timeout: 3000,

    // 一次失败立即触发强制重测（v5.3：2 → 1）
    'max-failed-times': 1,

    // 健康节点间的切换容差；当前节点测速不存活时另行切换。
    // v5.0：80 → 150，与 ClashParty 同步，
    // 节点延迟抖动时不轻易切换（每次切换都会中断既有连接）。
    tolerance: 150,

    // 只有策略组真正被使用时才测速
    lazy: true
  }

  /* ============================================================
   * 三、地区识别
   * ============================================================ */

  const REGION_DEFS = [
    {
      name: '香港节点',
      icon: '01Country/Hongkong.png',
      regex: /香港|Hong ?Kong|\bHK\b|\bHKG\b|🇭🇰/i
    },

    {
      name: '台湾节点',
      icon: '01Country/taiwan.png',
      regex: /台湾|臺灣|Taiwan|\bTW\b|🇹🇼/i
    },

    {
      name: '日本节点',
      icon: '01Country/Japan(1).png',
      regex: /日本|东京|東京|大阪|Japan|\bJP\b|🇯🇵/i
    },

    {
      name: '新加坡节点',
      icon: '01Country/singapore.png',
      regex: /新加坡|狮城|獅城|Singapore|\bSG\b|🇸🇬/i
    },

    {
      name: '韩国节点',
      icon: '01Country/Korea.png',
      regex: /韩国|韓國|首尔|首爾|Korea|\bKR\b|🇰🇷/i
    },

    {
      name: '美国节点',
      icon: '01Country/America.png',
      regex:
        /美国|美國|洛杉矶|洛杉磯|圣何塞|聖荷西|西雅图|西雅圖|凤凰城|鳳凰城|United ?States|America|\bUS\b|\bUSA\b|🇺🇸/i
    },

    {
      name: '英国节点',
      icon: REPO_ICON + 'uk.png',
      regex: /英国|英國|伦敦|倫敦|United ?Kingdom|\bUK\b|🇬🇧/i
    },

    {
      name: '德国节点',
      icon: REPO_ICON + 'de.png',
      regex: /德国|德國|法兰克福|法蘭克福|Germany|\bDE\b|🇩🇪/i
    },

    {
      name: '法国节点',
      icon: REPO_ICON + 'fr.png',
      regex: /法国|法國|巴黎|France|\bFR\b|🇫🇷/i
    },

    {
      name: '菲律宾节点',
      icon: REPO_ICON + 'ph.png',
      regex: /菲律宾|菲律賓|马尼拉|馬尼拉|Philippines|Manila|\bPH\b|\bMNL\b|🇵🇭/i
    },

    {
      name: '土耳其节点',
      icon: REPO_ICON + 'tr.png',
      regex: /土耳其|伊斯坦布尔|伊斯坦堡|Turkey|Türkiye|\bTR\b|\bIST\b|🇹🇷/i
    },

    {
      name: '尼日利亚节点',
      icon: REPO_ICON + 'ng.png',
      regex: /尼日利亚|尼日利亞|拉各斯|Lagos|Nigeria|\bNG\b|🇳🇬/i
    }
  ]

  /* ============================================================
   * 四、过滤正则（include-all / exclude-filter 用）
   * ============================================================ */

  /*
   * 只过滤明确的信息条目，避免"支持 / 时间 / 应急"等宽泛词误删节点。
   * 与 ClashParty 的 INFO_RE 保持同一词表。
   */
  const INFO_SRC =
    '套餐|订阅|到期|重置|剩余|续费|官网|网址|流量|频道|公告|失联|过期|有效期|到期时间|客户端|交流群|电报群|expire|traffic'

  /*
   * 全部地区正则合并为一个 alternation，
   * 供「其他节点」的 exclude-filter 使用。
   */
  const REGION_SRC = REGION_DEFS.map(
    (def) => '(?:' + def.regex.source + ')'
  ).join('|')

  const infoExclude = '(?i)(?:' + INFO_SRC + ')'

  const regionAndInfoExclude =
    '(?i)(?:' + REGION_SRC + '|' + INFO_SRC + ')'

  /* ============================================================
   * 五、策略组定义
   * ============================================================ */

  const REF = '节点选择'

  const GROUPS_BUILD = [
    {
      name: 'Wise',
      icon: REPO_ICON + 'wise.png',
      type: 'select',
      lists: ['英国节点', REF, '手动选择', 'DIRECT']
    },
    {
      name: 'iFAST',
      icon: REPO_ICON + 'ifast.png',
      type: 'select',
      lists: ['英国节点', REF, '手动选择', 'DIRECT']
    },
    {
      name: 'Neverless',
      icon: REPO_ICON + 'neverless.png',
      type: 'select',
      lists: ['美国节点', REF, '手动选择', 'DIRECT']
    },
    {
      name: 'Speedtest',
      icon: REPO_ICON + 'speedtest.png',
      type: 'select',
      lists: ['DIRECT', REF, '手动选择']
    },
    {
      name: 'AI服务',
      icon: REPO_ICON + 'chatgpt4.0.png',
      type: 'select',
      /*
       * v5.1：补台湾候选——Gemini / ChatGPT / Claude 均支持
       * 台湾出口，美西线路的延迟备选；与 ClashParty 同步。
       */
      lists: [
        '美国节点',
        '新加坡节点',
        '日本节点',
        '台湾节点',
        REF,
        '手动选择'
      ]
    },

    {
      name: 'Telegram',
      icon: REPO_ICON + 'telegram.png',
      type: 'select',
      lists: [
        REF,
        '新加坡节点',
        '香港节点',
        '手动选择'
      ]
    },

    {
      name: '加密货币',
      icon: REPO_ICON + 'Bitcoin.png',
      type: 'select',
      lists: [
        '香港节点',
        '美国节点',
        '台湾节点',
        '日本节点',
        '新加坡节点',
        REF,
        '手动选择'
      ]
    },

    /*
     * v5.6：「国外媒体」组已砍——Netflix / Disney / HBO /
     * PrimeVideo / Spotify 走 Final 兜底，YouTube 由
     * geosite-google 命中走 Google 组。与 ClashParty.js 同步。
     */

    {
      name: 'TikTok',
      icon: REPO_ICON + 'tiktok.png',
      type: 'select',
      lists: [
        '美国节点',
        '日本节点',
        '新加坡节点',
        REF,
        '手动选择'
      ]
    },

    {
      name: '国内媒体',
      /*
       * v5.6：保留，DIRECT 优先——B 站等默认直连；
       * 需要港澳台内容时手动切 节点选择。
       */
      icon: REPO_ICON + 'bilibili.png',
      type: 'select',
      lists: [
        'DIRECT',
        REF
      ]
    },

    {
      name: 'Apple',
      icon: REPO_ICON + 'apple.png',
      type: 'select',
      lists: [
        'DIRECT',
        REF,
        '美国节点',
        '香港节点',
        '手动选择'
      ]
    },

    {
      name: 'Google',
      icon: REPO_ICON + 'google.png',
      type: 'select',
      lists: [
        REF,
        '香港节点',
        '美国节点',
        '土耳其节点',
        '尼日利亚节点',
        '手动选择'
      ]
    },

    {
      name: 'Microsoft',
      icon: REPO_ICON + 'microsoft.png',
      type: 'select',
      lists: [
        'DIRECT',
        REF,
        '香港节点',
        '美国节点',
        '手动选择'
      ]
    },

    {
      name: 'GitHub',
      icon: REPO_ICON + 'github.png',
      type: 'select',
      lists: [
        REF,
        '香港节点',
        '美国节点',
        '手动选择'
      ]
    },

    /*
     * v5.4：分流补齐——以下新组候选统一为
     * REF + 主要地区 + 手动选择，无对应节点时地区自动隐藏。
     * 与 ClashParty.js v5.4 同步。
     */
    {
      name: 'Discord',
      icon: REPO_ICON + 'discord.png',
      type: 'select',
      lists: [
        REF,
        '美国节点',
        '新加坡节点',
        '香港节点',
        '手动选择'
      ]
    },

    {
      name: 'X(Twitter)',
      icon: REPO_ICON + 'twitter.png',
      type: 'select',
      lists: [
        REF,
        '美国节点',
        '新加坡节点',
        '日本节点',
        '手动选择'
      ]
    },

    {
      name: 'Reddit',
      icon: REPO_ICON + 'reddit.png',
      type: 'select',
      lists: [
        REF,
        '美国节点',
        '手动选择'
      ]
    },

    {
      name: 'Wikipedia',
      icon: REPO_ICON + 'wikipedia.png',
      type: 'select',
      lists: [
        REF,
        '手动选择',
        'DIRECT'
      ]
    },

    {
      name: 'Steam',
      icon: REPO_ICON + 'steam.png',
      type: 'select',
      lists: [
        REF,
        '香港节点',
        '美国节点',
        '日本节点',
        '新加坡节点',
        '手动选择'
      ]
    },

    /*
     * v5.5：开发者 / 论坛 / 社交媒体。与 ClashParty.js v5.5 同步。
     */
    {
      name: '开发者',
      icon: REPO_ICON + 'docker.png',
      type: 'select',
      lists: [
        REF,
        '手动选择',
        'DIRECT'
      ]
    },

    {
      name: '论坛',
      icon: REPO_ICON + 'forum.png',
      type: 'select',
      lists: [
        REF,
        '手动选择'
      ]
    },

    {
      name: '社交媒体',
      icon: REPO_ICON + 'socialmedia.png',
      type: 'select',
      lists: [
        REF,
        '美国节点',
        '新加坡节点',
        '香港节点',
        '手动选择'
      ]
    }
  ]

  const FINAL_LISTS = [
    REF,
    '故障转移',
    '香港节点',
    '台湾节点',
    '日本节点',
    '新加坡节点',
    '美国节点',
    '其他节点',
    'DIRECT'
  ]

  /* ============================================================
   * 六、业务规则
   * ============================================================ */

  const CATEGORY_MAP = [
    [
      '国内媒体',
      [
        'bilibili',
        'iqiyi',
        'youku'
      ]
    ],

    [
      'Apple',
      [
        'apple',
        'icloud'
      ]
    ],

    [
      'AI服务',
      [
        'category-ai-!cn'
      ]
    ],

    [
      '加密货币',
      [
        'category-cryptocurrency'
      ]
    ],

    /*
     * v5.6：「国外媒体」段已砍——netflix / disney / primevideo /
     * hbo / spotify 不再加载（走 Final 兜底）；youtube 由
     * geosite-google include 命中走 Google 组。
     * 与 ClashParty.js v5.6 同步。
     */

    [
      'Google',
      [
        'google'
      ]
    ],

    /*
     * GitHub 必须位于 Microsoft 前面，
     * Microsoft 大类会覆盖部分 GitHub 域名。
     * v5.4：github-copilot 补齐（同指 GitHub 组）。
     * v5.5：gits 补 GitHub 散装资产域名。
     */
    [
      'GitHub',
      [
        'github-copilot',
        'github',
        'gits'
      ]
    ],

    /*
     * v5.4：Microsoft 细分规则集（均指向 Microsoft 组统一管理）。
     */
    [
      'Microsoft',
      [
        'onedrive',
        'xbox',
        'microsoft',
        'bing'
      ]
    ],

    /*
     * v5.5：ai 补漏（双收录同指 AI服务）；开发者 / 论坛 /
     * 社交媒体 新增。
     */
    [
      'AI服务',
      [
        'ai'
      ]
    ],

    [
      '开发者',
      [
        'developer'
      ]
    ],

    [
      '论坛',
      [
        'forum'
      ]
    ],

    [
      '社交媒体',
      [
        'socialmedia'
      ]
    ],

    /*
     * v5.4：分流补齐新组。
     */
    [
      'Discord',
      [
        'discord'
      ]
    ],

    [
      'X(Twitter)',
      [
        'twitter'
      ]
    ],

    [
      'Reddit',
      [
        'reddit'
      ]
    ],

    [
      'Wikipedia',
      [
        'wikimedia'
      ]
    ],

    [
      'Steam',
      [
        'steam'
      ]
    ]
  ]

  const BLOCK_ADS = false

  const BLOCK_QUIC = true

  /*
   * v5.4：新增 bing@cn 与 steam@cn 直连（@cn 属性子集，
   * 仅收国内可达域名）。与 ClashParty.js v5.4 同步。
   */
  const DIRECT_SETS = [
    'apple-cn',
    'icloud@cn',
    'category-ai-cn',
    'microsoft@cn',
    'google@cn',
    'bing@cn',
    'steam@cn',
    'douyin',
    'category-games@cn',
    'category-game-platforms-download@cn'
  ]

  /* ============================================================
   * 七、内联节点处理与地区可用性判定
   * ============================================================ */

  const INFO_RE = new RegExp(INFO_SRC, 'i')

  const hasProxies =
    Array.isArray(config.proxies) && config.proxies.length > 0

  /*
   * 内联 proxies：过滤信息伪节点 + uTLS 指纹注入
   * （proxy-providers 内节点脚本无法触达，保持原样）。
   */
  if (hasProxies) {
    config.proxies = config.proxies.filter((proxy) => {
      if (!proxy) return false
      if (!proxy.name) return false
      if (INFO_RE.test(proxy.name)) return false
      return true
    })

    const FP_TYPES = { vmess: 1, vless: 1, trojan: 1 }
    for (const p of config.proxies) {
      if (p && FP_TYPES[p.type] && !p['client-fingerprint']) {
        p['client-fingerprint'] = 'chrome'
      }
    }
  }

  /*
   * 地区可用性判定：
   * - 内联 proxies 存在时，逐节点识别，地区组候选精确生成；
   * - 仅 proxy-providers 时脚本无法枚举节点，假定地区全可用
   *   （空过滤组以 COMPATIBLE 占位存在，不影响配置加载，
   *   mihomo v1.19.32 实测确认）。
   */
  const regionPresent = {}

  if (hasProxies) {
    for (const def of REGION_DEFS) {
      regionPresent[def.name] = false
    }
    for (const proxy of config.proxies) {
      for (const def of REGION_DEFS) {
        if (def.regex.test(proxy.name)) {
          regionPresent[def.name] = true
        }
      }
    }
  }

  const regionOk = (name) =>
    hasProxies ? regionPresent[name] === true : true

  /*
   * 「其他节点」成员判定：
   * - 内联 proxies：存在未被地区正则识别的真实节点时创建；
   * - 仅 providers：始终创建（exclude-filter 交给内核动态筛选）。
   */
  let hasOther = hasProxies ? false : true

  if (hasProxies) {
    for (const proxy of config.proxies) {
      const inRegion = REGION_DEFS.some((def) =>
        def.regex.test(proxy.name)
      )
      if (!inRegion) {
        hasOther = true
        break
      }
    }
  }

  /* ============================================================
   * 八、生成策略组
   * ============================================================ */

  const groups = []

  groups.push({
    name: REF,
    icon: REPO_ICON + 'rocket.png',

    type: 'select',

    proxies: [
      '自动选择',
      '故障转移',
      '手动选择',
      'DIRECT',
      ...REGION_DEFS.map((def) => def.name).filter(regionOk),
      ...(hasOther ? ['其他节点'] : [])
    ]
  })

  groups.push({
    name: '自动选择',
    icon: REPO_ICON + 'lightning.png',

    type: 'url-test',

    'include-all': true,

    'exclude-filter': infoExclude,

    ...urlTest
  })

  /*
   * v5.3：故障转移（fallback，include-all 动态成员）。
   * 当前节点失效时按订阅顺序切到第一个存活节点，延迟抖动
   * 不切换；日常仍推荐自动选择，节点不稳期 / 大流量下载时
   * 手动选用。与 ClashParty.js v5.3 同步；fallback 不使用
   * tolerance，字段显式声明，不展开 urlTest。
   */
  groups.push({
    name: '故障转移',
    icon: REPO_ICON + 'quanqiu.png',

    type: 'fallback',

    'include-all': true,

    'exclude-filter': infoExclude,

    url: urlTest.url,

    'expected-status': urlTest['expected-status'],

    interval: urlTest.interval,

    timeout: urlTest.timeout,

    'max-failed-times': urlTest['max-failed-times'],

    lazy: urlTest.lazy
  })

  /*
   * 手动选择：自动选择 + 故障转移 + 地区组 + 其他节点 + 直连。
   */
  groups.push({
    name: '手动选择',
    icon: REPO_ICON + 'jichang.png',

    type: 'select',

    'include-all': true,

    'exclude-filter': infoExclude,

    proxies: [
      '自动选择',
      '故障转移',
      ...REGION_DEFS.map((def) => def.name).filter(regionOk),
      ...(hasOther ? ['其他节点'] : []),
      'DIRECT'
    ]
  })

  for (const def of GROUPS_BUILD) {
    const candidates = []

    for (const item of def.lists) {
      if (item === 'DIRECT') {
        candidates.push('DIRECT')
        continue
      }

      if (
        item === REF ||
        item === '手动选择'
      ) {
        candidates.push(item)
        continue
      }

      if (regionOk(item)) {
        candidates.push(item)
      }
    }

    groups.push({
      name: def.name,
      icon: def.icon,

      type: 'select',

      proxies: candidates
    })
  }

  groups.push({
    name: 'Final',
    icon: REPO_ICON + 'quanqiu-2.png',

    type: 'select',

    proxies: FINAL_LISTS.filter((item) => {
      if (
        item === 'DIRECT' ||
        item === REF
      ) {
        return true
      }

      if (item === '其他节点') {
        return hasOther
      }

      return regionOk(item)
    })
  })

  const regionGroups = REGION_DEFS.map((def) => ({
    name: def.name,

    icon: def.icon.startsWith('http')
      ? def.icon
      : ICON + def.icon,

    type: 'url-test',

    'include-all': true,

    filter: '(?i)(?:' + def.regex.source + ')',

    'exclude-filter': infoExclude,

    ...urlTest
  }))

  const otherGroups = hasOther
    ? [
        {
          name: '其他节点',

          icon: REPO_ICON + 'quanqiu-1.png',

          type: 'url-test',

          'include-all': true,

          'exclude-filter': regionAndInfoExclude,

          ...urlTest
        }
      ]
    : []

  const orderedGroups = groups.concat(
    regionGroups,
    otherGroups
  )

  /* ============================================================
   * 九、Rule Provider
   * ============================================================ */

  const providers = {}

  const rules = []

  const addRuleSet = (name) => {
    const key = 'geosite-' + name

    providers[key] = {
      type: 'http',

      behavior: 'domain',

      format: 'mrs',

      url:
        RSET +
        'geosite/' +
        name +
        '.mrs',

      interval: 86400
    }

    return key
  }

  const addGeoIP = (name) => {
    const key = 'geoip-' + name

    providers[key] = {
      type: 'http',

      behavior: 'ipcidr',

      format: 'mrs',

      url:
        RSET +
        'geoip/' +
        name +
        '.mrs',

      interval: 86400
    }

    return key
  }

  /* ============================================================
   * 十、本机防护与局域网直连
   * ============================================================ */

  rules.push(
    'PROCESS-NAME,qbittorrent.exe,DIRECT',
    'PROCESS-NAME,BitComet.exe,DIRECT',
    'PROCESS-NAME,uTorrent.exe,DIRECT',
    'PROCESS-NAME,transmission-qt.exe,DIRECT',
    'PROCESS-NAME,aria2c.exe,DIRECT',
    'PROCESS-NAME,Thunder.exe,DIRECT',
    /*
     * v5.5：远控软件进程直连（szkane RemoteDesktop.list）。
     * 与 ClashParty.js v5.5 同步。
     */
    'PROCESS-NAME,ToDesk.exe,DIRECT',
    'PROCESS-NAME,ToDesk_Service.exe,DIRECT',
    'PROCESS-NAME,ToDesk_Session.exe,DIRECT',
    'PROCESS-NAME,SunloginClient.exe,DIRECT',
    'PROCESS-NAME,mstsc.exe,DIRECT',
    'PROCESS-NAME,RustDesk.exe,DIRECT',
    'PROCESS-NAME,rustdesk.exe,DIRECT'
  )

  rules.push(
    'RULE-SET,' +
    addRuleSet('category-public-tracker') +
    ',DIRECT'
  )

  rules.push('DST-PORT,7680,REJECT')

  rules.push(
    'RULE-SET,' +
    addRuleSet('private') +
    ',DIRECT'
  )

  rules.push(
    'RULE-SET,' +
    addGeoIP('private') +
    ',DIRECT,no-resolve'
  )

  /* ============================================================
   * 十一、反诈
   * ============================================================ */

  rules.push(
    'DOMAIN-KEYWORD,96110,REJECT',
    'DOMAIN-SUFFIX,gjfzpt.cn,REJECT'
  )

  /* ============================================================
   * 十二、个人业务精确规则
   * ============================================================ */

  /*
   * v5.2：系统与证书基础设施直连（运行日志实测优化）。
   * - NCSI（msftconnecttest / msftncsi）不在 microsoft@cn 内，
   *   此前命中 geosite-microsoft 走代理，节点故障时 Windows
   *   误报"无 Internet"，固定直连；
   * - lencr.org 为 Let's Encrypt OCSP / CRL，证书校验不依赖
   *   代理，直连避免代理断连时 LE 证书站点首连变慢；
   * - ota.nvidia.com 为 GeForce 驱动 OTA，国内可达。
   * 与 ClashParty.js v5.2 同步。
   */
  rules.push(
    'DOMAIN-SUFFIX,msftconnecttest.com,DIRECT',
    'DOMAIN-SUFFIX,msftncsi.com,DIRECT',
    'DOMAIN-SUFFIX,lencr.org,DIRECT',
    'DOMAIN,ota.nvidia.com,DIRECT'
  )

  /*
   * v5.2：binance.bh 不在 category-cryptocurrency 上游集内，
   * 此前落 Final 兜底，显式归入加密货币组。
   */
  rules.push('DOMAIN-SUFFIX,binance.bh,加密货币')

  rules.push(
    'DOMAIN-SUFFIX,rilipro.com,DIRECT',
    'DOMAIN-SUFFIX,egernlicense.com,DIRECT',
    'DOMAIN-SUFFIX,liangxin.xyz,DIRECT',
    'DOMAIN,m1.tohno-0.top,DIRECT',
    'DOMAIN-SUFFIX,ipix.ink,DIRECT',
    'DOMAIN-SUFFIX,duolingo.com,DIRECT',
    'DOMAIN-SUFFIX,skk.moe,DIRECT'
  )

  rules.push(
    'DOMAIN-SUFFIX,wise.com,Wise',
    'DOMAIN-SUFFIX,moscwise.com,Wise',
    'DOMAIN-SUFFIX,transferwise.com,Wise',
    'DOMAIN,secure.fundsupermart.com,iFAST',
    'DOMAIN-SUFFIX,ifastgb.com,iFAST',
    'DOMAIN-SUFFIX,ifastcorp.com,iFAST',
    'DOMAIN-SUFFIX,neverless.com,Neverless',
    'RULE-SET,' + addRuleSet('ookla-speedtest') + ',Speedtest'
  )

  rules.push(
    'DOMAIN-SUFFIX,steamcontent.com,DIRECT',
    'DOMAIN-SUFFIX,steamserver.net,DIRECT',
    'DOMAIN,steamcdn-a.akamaihd.net,DIRECT',
    'DOMAIN,steampipe.akamaized.net,DIRECT',
    'DOMAIN,steampipe-partner.akamaized.net,DIRECT',
    'DOMAIN,steampipe-kr.akamaized.net,DIRECT',
    'DOMAIN-SUFFIX,wmsjsteam.com,DIRECT',
    'DOMAIN-SUFFIX,steamchina.com,DIRECT',
    'DOMAIN-SUFFIX,8686c.com,DIRECT',
    'DOMAIN,client-update.queniuqe.com,DIRECT',
    'DOMAIN,dl.steam.clngaa.com,DIRECT',
    'DOMAIN,dl.steam.ksyna.com,DIRECT',
    'DOMAIN,st.dl.bscstorage.net,DIRECT',
    'DOMAIN,st.dl.eccdnx.com,DIRECT',
    'DOMAIN,st.dl.pinyuncloud.com,DIRECT'
  )

  /* ============================================================
   * 十三、地区金融分流（地区组不可用时整组跳过）
   * ============================================================ */

  const REGION_FINANCE = [
    {
      region: '香港节点',
      suffixes: [
        'za.group',
        'zaticdn.com',
        'zajourney.com',
        'livibank.com',
        'etnet.com.hk',
        'bochk.com',
        'bochkonline.com',
        'hsbc.com.hk',
        'tealiumiq.com',
        'hangseng.com',
        'citibank.com.hk',
        'hkmu.edu.hk',
        'airstarbank.com',
        'hk.bankcomm.com',
        'fusionbank.com',
        'prod-mox.com',
        'mox.com',
        'tapngo.com.hk',
        'sc.com',
        'standardchartered.com',
        'cncbinternational.com',
        'welab.bank',
        'futunn.com',
        'futuhn.com',
        'futustatic.com',
        'futuhk.com',
        'futu5.com',
        'moomoo.com',
        'fututrade.com',
        'futusg.com',
        'futuie.com',
        'futuholdings.com',
        'futuesop.com',
        'clubsim.com.hk',
        'pccw.com'
      ],
      exacts: [
        'mcxymt1vz-smy-nsfkm9-07xj6-8.device.marketingcloudapis.com',
        'lptag.liveperson.net',
        'lpcdn.lpsnmedia.net',
        'log-58144bf0.we-stats.com',
        'mobile.eum-appdynamics.com',
        'tags.tiqcdn.com',
        'cdn.appdynamics.com',
        'eapi.preferences.prod.ap-east-1.vam-hk.cloud1.vv1865.com',
        'v1d3dx-skadsdkless.appsflyersdk.com'
      ]
    },
    {
      region: '美国节点',
      suffixes: [
        'ibkr.com',
        'ibllc.com',
        'interactivebrokers.com',
        'interactivebrokers.com.hk'
      ],
      exacts: []
    },
    {
      region: '英国节点',
      suffixes: [
        'kraken.com'
      ],
      exacts: []
    },
    {
      region: '德国节点',
      suffixes: [
        'n26.com',
        'tech26.de',
        'number26.de'
      ],
      exacts: []
    },
    {
      region: '菲律宾节点',
      suffixes: [
        'maya.ph',
        'paymaya.com',
        'mayabank.ph',
        'voyagerinnovation.com',
        'voyagerapis.com'
      ],
      exacts: [
        '940c5ecf154a2dd669454fc022ed18283a8196d9.csftr.com'
      ]
    }
  ]

  for (const fin of REGION_FINANCE) {
    if (!regionOk(fin.region)) {
      continue
    }

    for (const domain of fin.suffixes) {
      rules.push(
        'DOMAIN-SUFFIX,' + domain + ',' + fin.region
      )
    }

    for (const domain of fin.exacts) {
      rules.push(
        'DOMAIN,' + domain + ',' + fin.region
      )
    }
  }

  /* ============================================================
   * 十四、中国大陆服务优先直连
   * ============================================================ */

  for (const name of DIRECT_SETS) {
    rules.push(
      'RULE-SET,' +
      addRuleSet(name) +
      ',DIRECT'
    )
  }

  /*
   * v5.1：国内 AI 域名补漏直连（VPSDance cn，classical，每日同步）。
   * coze 全系 / chatglm.cn / hailuoai.com 等未及时收录于
   * category-ai-cn / geosite-cn 时，不再落入 Final 走代理。
   * 与 DIRECT_SETS 同为直连目标，先后不影响结果。
   * 与 ClashParty.js v5.1 同步。
   */
  providers['ai-cn'] = {
    type: 'http',

    behavior: 'classical',

    format: 'yaml',

    url: AI_CN,

    interval: 86400
  }

  rules.push('RULE-SET,ai-cn,DIRECT')

  /* ============================================================
   * 十五、广告拦截
   * ============================================================ */

  if (BLOCK_ADS) {
    rules.push(
      'RULE-SET,' +
      addRuleSet('category-ads-all') +
      ',REJECT'
    )

    rules.push(
      'RULE-SET,' +
      addRuleSet('tracker') +
      ',REJECT'
    )
  }

  /* ============================================================
   * 十六、业务分流
   * ============================================================ */

  /*
   * v5.1：海外 AI 聚合补充（VPSDance ai-global，classical，
   * 每日同步）。补齐 geosite 未收录的海外 AI 域名，自动更新，
   * 不再依赖手工补域名。与 category-ai-!cn 同指 AI服务 组，
   * 两者先后不影响结果；置于业务大类之前，保证 AI 域名
   * （含 copilot.cloud.microsoft 等 GitHub / Microsoft 双收录项）
   * 维持既有 AI服务 归属。与 ClashParty.js v5.1 同步。
   */
  providers['ai-global'] = {
    type: 'http',

    behavior: 'classical',

    format: 'yaml',

    url: AI_GLOBAL,

    interval: 86400
  }

  rules.push('RULE-SET,ai-global,AI服务')

  /*
   * v5.5：QuixoticHeart 四个 domain mrs（ai / gits / forum /
   * socialmedia）与 szkane Developer classical text。
   * 与 ClashParty.js v5.5 同步。
   */
  providers['qx-ai'] = {
    type: 'http',

    behavior: 'domain',

    format: 'mrs',

    url: QX_DOMAIN + 'ai.mrs',

    interval: 86400
  }

  providers['qx-gits'] = {
    type: 'http',

    behavior: 'domain',

    format: 'mrs',

    url: QX_DOMAIN + 'gits.mrs',

    interval: 86400
  }

  providers['qx-forum'] = {
    type: 'http',

    behavior: 'domain',

    format: 'mrs',

    url: QX_DOMAIN + 'forum.mrs',

    interval: 86400
  }

  providers['qx-socialmedia'] = {
    type: 'http',

    behavior: 'domain',

    format: 'mrs',

    url: QX_DOMAIN + 'socialmedia.mrs',

    interval: 86400
  }

  providers['developer'] = {
    type: 'http',

    behavior: 'classical',

    format: 'text',

    url: DEV_LIST,

    interval: 86400
  }

  for (const [group, nameList] of CATEGORY_MAP) {
    for (const name of nameList) {
      rules.push(
        'RULE-SET,' +
        addRuleSet(name) +
        ',' +
        group
      )
    }
  }

  rules.push(
    'RULE-SET,qx-ai,AI服务',
    'RULE-SET,qx-gits,GitHub',
    'RULE-SET,developer,开发者',
    'RULE-SET,qx-forum,论坛',
    'RULE-SET,qx-socialmedia,社交媒体'
  )

  rules.push(
    'DOMAIN-SUFFIX,stability.ai,AI服务',
    'DOMAIN-SUFFIX,replicate.com,AI服务',
    'DOMAIN-SUFFIX,together.ai,AI服务',
    'DOMAIN-SUFFIX,suno.ai,AI服务',
    'DOMAIN-SUFFIX,suno.com,AI服务',
    'DOMAIN-SUFFIX,runpod.io,AI服务'
  )

  rules.push(
    'RULE-SET,' +
    addRuleSet('tiktok') +
    ',TikTok'
  )

  providers['crypto-dler'] = {
    type: 'http',

    behavior: 'classical',

    format: 'yaml',

    url: CRYPTO_DLER,

    interval: 604800
  }

  rules.push('RULE-SET,crypto-dler,加密货币')

  rules.push(
    'RULE-SET,' +
    addRuleSet('telegram') +
    ',Telegram'
  )

  rules.push(
    'RULE-SET,' +
    addGeoIP('telegram') +
    ',Telegram,no-resolve'
  )

  /* ============================================================
   * 十七、中国大陆直连
   * ============================================================ */

  rules.push(
    'RULE-SET,' +
    addRuleSet('tencent') +
    ',DIRECT'
  )

  rules.push(
    'RULE-SET,' +
    addRuleSet('cn') +
    ',DIRECT'
  )

  rules.push(
    'RULE-SET,' +
    addGeoIP('cn') +
    ',DIRECT,no-resolve'
  )

  if (BLOCK_QUIC) {
    rules.push(
      'AND,((NETWORK,udp),(DST-PORT,443)),REJECT'
    )
  }

  /* ============================================================
   * 十八、最终兜底
   * ============================================================ */

  rules.push(
    'MATCH,Final'
  )

  /* ============================================================
   * 十九、DNS
   * ============================================================ */

  const dns = {
    enable: true,

    'cache-algorithm': 'arc',

    ipv6: false,

    'enhanced-mode': 'fake-ip',

    'fake-ip-range': '198.18.0.1/16',

    'prefer-h3': false,

    nameserver: [
      'https://dns.alidns.com/dns-query',
      'https://doh.pub/dns-query'
    ],

    'nameserver-policy': {
      '+.lan': 'system',
      '+.local': 'system',
      '+.localdomain': 'system',
      '+.home.arpa': 'system',

      'rule-set:geosite-cn': [
        'https://dns.alidns.com/dns-query',
        'https://doh.pub/dns-query'
      ],

      'rule-set:geosite-tencent': [
        'https://dns.alidns.com/dns-query',
        'https://doh.pub/dns-query'
      ],

      ['rule-set:' + addRuleSet('geolocation-!cn')]: [
        'https://1.1.1.1/dns-query',
        'https://8.8.8.8/dns-query'
      ]
    },

    fallback: [
      'https://1.1.1.1/dns-query',
      'https://8.8.8.8/dns-query'
    ],

    'fallback-lazy-query': true,

    'fallback-filter': {
      geoip: true,

      'geoip-code': 'CN',

      ipcidr: [
        '240.0.0.0/4',
        '0.0.0.0/32',
        '127.0.0.1/32',
        '100.64.0.0/10'
      ],

      domain: [
        '+.google.com',
        '+.youtube.com',
        '+.facebook.com',
        '+.twitter.com',
        '+.openai.com',
        '+.anthropic.com',
        '+.claude.com',
        '+.x.ai',
        '+.perplexity.ai',
        '+.github.com'
      ]
    },

    'default-nameserver': [
      'tls://223.5.5.5',
      'tls://120.53.53.53'
    ],

    'proxy-server-nameserver': [
      'https://223.5.5.5/dns-query',
      'https://120.53.53.53/dns-query',
      'tls://223.6.6.6'
    ],

    'direct-nameserver': [
      'https://223.5.5.5/dns-query',
      'https://120.53.53.53/dns-query'
    ],

    'direct-nameserver-follow-policy': false,

    'fake-ip-filter': [
      'localhost',
      '*.lan',
      '*.local',
      '*.localhost',
      '*.localdomain',
      '*.home.arpa',
      '+.msftconnecttest.com',
      '+.msftncsi.com',
      '+.pool.ntp.org',
      'time.*.com',
      'time.*.gov',
      'time.*.edu.cn',
      'time.*.apple.com',
      'ntp.*.com',
      'stun.*.*',
      'stun.*.*.*',
      '*.stun.*.*',
      '*.stun.*.*.*',
      'localhost.ptlogin2.qq.com',
      'localhost.sec.qq.com',
      'lancache.steamcontent.com',
      '+.srv.nintendo.net',
      '+.stun.playstation.net',
      'xbox.*.microsoft.com',
      '+.xboxlive.com',
      '+.logon.battlenet.com.cn',
      '+.logon.battle.net',
      '+.market.xiaomi.com',
      '+.qq.com',
      '+.wechat.com',
      '+.weixinbridge.com',
      '+.todesk.com',
      '+.teamviewer.com',
      '+.anydesk.com',
      '+.rustdesk.com',
      '+.oray.com',
      '+.sunlogin.com',
      '+.tailscale.com',
      '+.zerotier.com'
    ],

    'respect-rules': true
  }

  /* ============================================================
   * 二十、域名嗅探
   * ============================================================ */

  const sniffer = {
    enable: true,

    'force-dns-mapping': true,

    'parse-pure-ip': true,

    'override-destination': false,

    sniff: {
      TLS: {
        ports: [
          443,
          8443
        ]
      },

      HTTP: {
        ports: [
          80,
          '8080-8880'
        ]
      },

      QUIC: {
        ports: [
          443,
          8443
        ]
      }
    },

    'skip-domain': [
      '+.push.apple.com',
      'Mijia Cloud',
      '+.oray.com',
      '+.oray.net'
    ]
  }

  /* ============================================================
   * 二十一、写回配置
   * ============================================================ */

  return Object.assign(
    {},
    config,
    {
      ipv6: false,

      'unified-delay': true,

      'tcp-concurrent': true,

      'keep-alive-idle': 15,

      'keep-alive-interval': 15,

      'etag-support': true,

      ntp: {
        enable: true,
        server: 'ntp.aliyun.com',
        port: 123,
        interval: 30
      },

      profile: {
        ...(config.profile || {}),
        'store-selected': true,
        'store-fake-ip': true
      },

      sniffer: sniffer,

      'proxy-groups': orderedGroups,

      rules: rules,

      'rule-providers': providers,

      dns: dns
    }
  )
}
