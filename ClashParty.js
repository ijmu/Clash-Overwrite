/*
 * ClashParty.js
 * Clash Party / Mihomo Party 个人覆写 v4.1（2026-09-28）
 *
 * v4.1：图标本地化——30 个图标打包进本仓库 icons/，与配置同源加载
 *   （raw.githubusercontent.com），不再依赖第三方图标 CDN，
 *   解决部分组图标间歇缺失；Wise / Speedtest 等改用库内专属图标。
 *
 * v4：对齐个人 Egern 分流（Tools/Egern/Egern.yaml）：
 *   - 新增香港银行与券商分流（ZA / Livi / 中银 / 汇丰 / 恒生 / 花旗 / 天星 /
 *     交银 / 富邦 / MOX / Tap&Go / 渣打 / 信银国际 / WeLab / 富途·moomoo /
 *     Clubsim）→ 香港节点；域名取自 Egern 引用的 LeiyuG HongKong.list，
 *     仅保留明确域名，不采用关键词；
 *   - 新增 IBKR → 美国、Kraken → 英国、N26 → 德国、Maya → 菲律宾；
 *   - 加密货币候选补齐 香港 / 美国（对齐 Egern Crypto 顺序）；
 *   - Google 组补 土耳其 / 尼日利亚 候选（对齐 Egern Google 组）；
 *   - 新增 TikTok 独立组（美国 / 日本 / 新加坡），自国外媒体拆出；
 *   - 新增 菲律宾 / 土耳其 / 尼日利亚 地区组，无节点时自动隐藏；
 *   - 个人直连域名对齐 Egern Direct_Own（rilipro / liangxin / ipix.ink /
 *     skk.moe / duolingo 等；jsDelivr 沿用 v3 决定，不整域直连）；
 *   - DNS 上游改为国产加密 DoH（alidns / doh.pub），fallback 过滤域名补充 AI 站点；
 *   - 新增 geosite google@cn / douyin 直连；
 *   - 对齐 Egern block_quic: true：默认拒绝 UDP 443，强制回落 TCP
 *     （BLOCK_QUIC 可关闭；Egern 未移植项：SSID 规则、脚本、模块）；
 *   - 对齐 Egern：96110 关键词与 gjfzpt.cn 反诈平台 REJECT。
 * 地区组不存在时相关规则自动跳过。
 * 已保存的策略选择优先于候选顺序，更新后请手动检查一次业务组。
 * 保留 DNS fallback、测速和 TCP 参数；测速延迟不代表吞吐或业务可用性。
 *
 * Clash Party → 覆写 → 远程 → 本文件 GitHub Raw 地址
 */

function main(config) {
  if (!config || typeof config !== 'object') {
    return config
  }

  if (!Array.isArray(config.proxies) || config.proxies.length === 0) {
    throw new Error('[ClashParty.js] 配置中缺少有效的 proxies 字段')
  }

  /* ============================================================
   * 一、基础地址
   * ============================================================ */

  const ICON =
    'https://raw.githubusercontent.com/ijmu/Clash-Overwrite/main/icons/'

  const RSET =
    'https://cdn.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/'

  /* dler-io Crypto 规则集（classical，含交易所/行情/Web3 域名） */
  const CRYPTO_DLER =
    'https://cdn.jsdelivr.net/gh/dler-io/Rules@main/Clash/Provider/Crypto.yaml'

  /* ============================================================
   * 二、测速参数
   * ============================================================ */

  const urlTest = {
    url: 'https://www.gstatic.com/generate_204',
    'expected-status': 204,

    // 5 分钟测速一次
    interval: 300,

    // 单节点测速最多等待 3 秒
    timeout: 3000,

    // 两次失败才触发强制重测
    'max-failed-times': 2,

    // 健康节点间的切换容差；当前节点测速不存活时另行切换。
    tolerance: 80,

    // 只有策略组真正被使用时才测速
    lazy: true
  }

  /* ============================================================
   * 三、地区识别
   * ============================================================ */

  const REGION_DEFS = [
    {
      name: '香港节点',
      icon: 'hk.png',
      regex: /香港|Hong ?Kong|\bHK\b|\bHKG\b|🇭🇰/i
    },

    {
      name: '台湾节点',
      icon: 'tw.png',
      regex: /台湾|臺灣|Taiwan|\bTW\b|🇹🇼/i
    },

    {
      name: '日本节点',
      icon: 'jp.png',
      regex: /日本|东京|東京|大阪|Japan|\bJP\b|🇯🇵/i
    },

    {
      name: '新加坡节点',
      icon: 'sg.png',
      regex: /新加坡|狮城|獅城|Singapore|\bSG\b|🇸🇬/i
    },

    {
      name: '韩国节点',
      icon: 'kr.png',
      regex: /韩国|韓國|首尔|首爾|Korea|\bKR\b|🇰🇷/i
    },

    {
      name: '美国节点',
      icon: 'us.png',
      regex:
        /美国|美國|洛杉矶|洛杉磯|圣何塞|聖荷西|西雅图|西雅圖|凤凰城|鳳凰城|United ?States|America|\bUS\b|\bUSA\b|🇺🇸/i
    },

    /*
     * 英 / 德 / 法组仅在实际存在对应节点时才会生成，
     * 无节点时自动隐藏，不影响显示。
     */
    {
      name: '英国节点',
      icon: 'uk.png',
      regex: /英国|英國|伦敦|倫敦|United ?Kingdom|\bUK\b|🇬🇧/i
    },

    {
      name: '德国节点',
      icon: 'de.png',
      regex: /德国|德國|法兰克福|法蘭克福|Germany|\bDE\b|🇩🇪/i
    },

    {
      name: '法国节点',
      /*
       * 法国国旗两个图标库都没有，
       * 已从外部源打包为本仓库 fr.png。
       */
      icon: 'fr.png',
      regex: /法国|法國|巴黎|France|\bFR\b|🇫🇷/i
    },

    /*
     * v4：菲律宾 / 土耳其 / 尼日利亚，对齐 Egern 的 PH / TR / NG 组。
     * 用途：Maya 分流与 Google 组的地区候选；
     * 无对应节点时自动隐藏。图标已打包进本仓库 icons/。
     */
    {
      name: '菲律宾节点',
      icon: 'ph.png',
      regex: /菲律宾|菲律賓|马尼拉|馬尼拉|Philippines|Manila|\bPH\b|\bMNL\b|🇵🇭/i
    },

    {
      name: '土耳其节点',
      icon: 'tr.png',
      regex: /土耳其|伊斯坦布尔|伊斯坦堡|Turkey|Türkiye|\bTR\b|\bIST\b|🇹🇷/i
    },

    {
      name: '尼日利亚节点',
      icon: 'ng.png',
      regex: /尼日利亚|尼日利亞|拉各斯|Lagos|Nigeria|\bNG\b|🇳🇬/i
    }
  ]

  /* ============================================================
   * 四、策略组定义
   * ============================================================ */

  /*
   * REF 即顶层"节点选择"。
   *
   * 通用业务跟随节点选择，AI 和金融组优先指定地区。
   * 地区组仍会自动换节点；需要固定 IP 时在手动选择中选具体节点。
   */

  const REF = '节点选择'

  const GROUPS_BUILD = [
    {
      name: 'Wise',
      icon: 'wise.png',
      type: 'select',
      lists: ['英国节点', REF, '手动选择', 'DIRECT']
    },
    {
      name: 'iFAST',
      icon: 'quanqiu.png',
      type: 'select',
      lists: ['英国节点', REF, '手动选择', 'DIRECT']
    },
    {
      name: 'Neverless',
      icon: 'quanqiu-1.png',
      type: 'select',
      lists: ['美国节点', REF, '手动选择', 'DIRECT']
    },
    {
      name: 'Speedtest',
      icon: 'speedtest.png',
      type: 'select',
      lists: ['DIRECT', REF, '手动选择']
    },
    {
      name: 'AI服务',
      icon: 'chatgpt4.0.png',
      type: 'select',
      lists: [
        '美国节点',
        '新加坡节点',
        '日本节点',
        REF,
        '手动选择'
      ]
    },

    {
      name: 'Telegram',
      icon: 'telegram.png',
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
      icon: 'Bitcoin.png',
      type: 'select',
      /*
       * v4：候选顺序对齐 Egern Crypto（HK, US, TW, JP, SG）。
       * 已保存的选择优先于候选顺序。
       */
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

    {
      name: '国外媒体',
      icon: 'play.png',
      type: 'select',
      lists: [
        REF,
        '香港节点',
        '美国节点',
        '台湾节点',
        '日本节点',
        '新加坡节点',
        '手动选择'
      ]
    },

    {
      name: 'TikTok',
      /*
       * v4：自国外媒体拆出，对齐 Egern TikTok 组（US, JP, SG）。
       * TikTok 对出口 IP 地区敏感，独立控制。
       */
      icon: 'tiktok.png',
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
      icon: 'bilibili.png',
      type: 'select',
      lists: [
        'DIRECT',
        REF
      ]
    },

    {
      name: 'Apple',
      icon: 'apple.png',
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
      icon: 'google.png',
      type: 'select',
      /*
       * v4：补 土耳其 / 尼日利亚 候选，对齐 Egern Google 组（HK, US, TR, NG），
       * 用于订阅区域相关操作；无节点时自动隐藏。
       */
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
      icon: 'microsoft.png',
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
      icon: 'github.png',
      type: 'select',
      lists: [
        REF,
        '香港节点',
        '美国节点',
        '手动选择'
      ]
    }
  ]

  /* ============================================================
   * 五、Final 候选
   * ============================================================ */

  const FINAL_LISTS = [
    REF,
    '香港节点',
    '台湾节点',
    '日本节点',
    '新加坡节点',
    '美国节点',
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

    /*
     * 非中国大陆 AI：
     * OpenAI / Claude / Gemini / Grok / Perplexity / Poe / HuggingFace 等
     */
    [
      'AI服务',
      [
        'category-ai-!cn'
      ]
    ],

    /*
     * 加密货币双规则集：
     * MetaCubeX category-cryptocurrency + dler-io Crypto。
     * Kraken 等指定地区的精确规则位于其前，优先生效。
     */
    [
      '加密货币',
      [
        'category-cryptocurrency'
      ]
    ],

    [
      '国外媒体',
      [
        'netflix',
        'youtube',
        'disney',
        'primevideo',
        'hbo',
        'spotify'
      ]
    ],

    [
      'Google',
      [
        'google'
      ]
    ],

    /*
     * GitHub 必须位于 Microsoft 前面，
     * Microsoft 大类会覆盖部分 GitHub 域名。
     */
    [
      'GitHub',
      [
        'github'
      ]
    ],

    [
      'Microsoft',
      [
        'microsoft',
        'bing'
      ]
    ]
  ]

  /* ============================================================
   * 七、广告拦截
   * ============================================================ */

  /*
   * 默认关闭。
   * true 时启用 MetaCubeX 广告与 tracker 规则。
   */
  const BLOCK_ADS = false

  /* ============================================================
   * 八、QUIC 屏蔽
   * ============================================================ */

  /*
   * 对齐 Egern block_quic: true。
   * 拒绝 UDP 443 使 QUIC 回落 TCP：
   * TUN 下 QUIC 难以正确代理，且嗅探与分流对 TCP 更可靠。
   * 浏览器与主流 App 会自动回落，个别游戏如异常可改为 false。
   */
  const BLOCK_QUIC = true

  /* ============================================================
   * 九、强制直连规则
   * ============================================================ */

  /*
   * v4：新增 google@cn（dl.google.com / fonts / update 等大陆可达域名，
   * 同时覆盖 Egern Unbreak 中的 Google 项）与 douyin。
   */
  const DIRECT_SETS = [
    'apple-cn',
    'icloud@cn',
    'category-ai-cn',
    'microsoft@cn',
    'google@cn',
    'douyin'
  ]

  /* ============================================================
   * 十、过滤机场信息节点
   * ============================================================ */

  /*
   * 只过滤明确的信息条目，避免“支持 / 时间 / 应急”等宽泛词误删节点。
   */
  const INFO_RE =
    /套餐|订阅|到期|重置|剩余|续费|官网|网址|流量|频道|公告|失联|过期|有效期|到期时间|客户端|交流群|电报群|expire|traffic/i

  const usable = config.proxies.filter((proxy) => {
    if (!proxy) return false
    if (!proxy.name) return false
    if (INFO_RE.test(proxy.name)) return false

    return true
  })

  if (usable.length === 0) {
    throw new Error(
      '[ClashParty.js] 剔除机场信息条目后没有可用节点'
    )
  }

  const proxyNames = usable.map((proxy) => proxy.name)

  /* ============================================================
   * 十一、节点地区归类
   * ============================================================ */

  const pools = REGION_DEFS.map((def) => ({
    ...def,
    nodes: []
  }))

  for (const nodeName of proxyNames) {
    const pool = pools.find((item) =>
      item.regex.test(nodeName)
    )

    if (pool) {
      pool.nodes.push(nodeName)
    }
  }

  /*
   * 没有节点的地区不创建策略组。
   */
  const regionGroups = pools.filter(
    (item) => item.nodes.length > 0
  )

  const regionExists = (name) =>
    regionGroups.some((item) => item.name === name)

  /* ============================================================
   * 十二、地区 url-test
   * ============================================================ */

  const regionGroupDefs = regionGroups.map((region) => ({
    name: region.name,

    /*
     * 完整 URL 直接使用；否则拼接 ICON 前缀。
     */
    icon: region.icon.startsWith('http')
      ? region.icon
      : ICON + region.icon,

    type: 'url-test',

    proxies: region.nodes,

    ...urlTest
  }))

  /* ============================================================
   * 十三、生成策略组
   * ============================================================ */

  const groups = []

  /*
   * 顶层入口。
   * 默认自动选择；换节点只改这里。
   */
  groups.push({
    name: REF,
    icon: ICON + 'rocket.png',

    type: 'select',

    proxies: [
      '自动选择',
      '手动选择',
      'DIRECT',
      ...regionGroups.map((item) => item.name)
    ]
  })

  /*
   * 自动选择：直接测试全部真实节点，
   * 不经过地区组二次 url-test，避免双层测速抖动。
   */
  groups.push({
    name: '自动选择',
    icon: ICON + 'lightning.png',

    type: 'url-test',

    proxies: proxyNames,

    ...urlTest
  })

  /*
   * 手动选择：自动选择 + 地区组 + 全部真实节点 + 直连。
   */
  groups.push({
    name: '手动选择',
    icon: ICON + 'jichang.png',

    type: 'select',

    proxies: [
      '自动选择',
      ...regionGroups.map((item) => item.name),
      ...proxyNames,
      'DIRECT'
    ]
  })

  /*
   * 业务组：
   * 按各业务指定顺序选择默认候选，
   * 地区组仅在存在对应节点时加入。
   */
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

      if (regionExists(item)) {
        candidates.push(item)
      }
    }

    groups.push({
      name: def.name,
      icon: ICON + def.icon,

      type: 'select',

      proxies: candidates
    })
  }

  /* ============================================================
   * 十四、Final
   * ============================================================ */

  groups.push({
    name: 'Final',
    icon: ICON + 'quanqiu-2.png',

    type: 'select',

    proxies: FINAL_LISTS.filter((item) => {
      if (
        item === 'DIRECT' ||
        item === REF
      ) {
        return true
      }

      return regionExists(item)
    })
  })

  /*
   * 显示顺序：
   * 节点选择 / 自动选择 / 手动选择 / 业务组 / Final / 地区组
   */
  const orderedGroups =
    groups.concat(regionGroupDefs)

  /* ============================================================
   * 十五、Rule Provider
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
   * 十六、局域网直连
   * ============================================================ */

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
   * 十七、反诈与 QUIC（对齐 Egern）
   * ============================================================ */

  /*
   * 反诈热线域名与国家反诈平台：直接拒绝（对齐 Egern 首两条规则）。
   */
  rules.push(
    'DOMAIN-KEYWORD,96110,REJECT',
    'DOMAIN-SUFFIX,gjfzpt.cn,REJECT'
  )

  if (BLOCK_QUIC) {
    rules.push(
      'AND,((NETWORK,udp),(DST-PORT,443)),REJECT'
    )
  }

  /* ============================================================
   * 十八、个人业务精确规则
   * 不强制直连 jsDelivr / R2 整个后缀，交由常规分流和 Final。
   * 金融域名参考 Egern 引用规则，仅保留明确域名，不采用关键词。
   * ============================================================ */

  /*
   * 个人直连域名，对齐 Egern Direct_Own.yaml。
   * 其中 cdn.jsdelivr.net 在 Egern 里直连，
   * 本覆写自 v3 起不整域直连 jsDelivr，维持不变。
   */
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

  /* ============================================================
   * 十九、地区金融分流（对齐 Egern，地区组缺失时整组跳过）
   * 域名取自 Egern 引用的 LeiyuG/Surge 规则集，
   * 仅保留明确域名；宽泛条目（tealiumiq / appsflyer 一类 CDN 除外）
   * 与 DOMAIN-KEYWORD 一律不收录。
   * ============================================================ */

  const REGION_FINANCE = [
    {
      region: '香港节点',
      /*
       * ZA众安 / Livi理慧 / 中银香港 / 汇丰 / 恒生 / 花旗香港 /
       * HKMU / 天星 / 交银香港 / 富邦 / MOX / Tap&Go / 渣打 /
       * 信银国际 / WeLab / 富途·moomoo / Clubsim
       */
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
      /* 盈透证券（Egern: IBKR → US） */
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
      /* Kraken（Egern: Kraken → UK） */
      suffixes: [
        'kraken.com'
      ],
      exacts: []
    },
    {
      region: '德国节点',
      /* N26（Egern: N26 → DE） */
      suffixes: [
        'n26.com',
        'tech26.de',
        'number26.de'
      ],
      exacts: []
    },
    {
      region: '菲律宾节点',
      /* Maya / PayMaya（Egern: Maya → PH） */
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
    if (!regionExists(fin.region)) {
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
   * 二十、中国大陆服务优先直连
   * ============================================================ */

  for (const name of DIRECT_SETS) {
    rules.push(
      'RULE-SET,' +
      addRuleSet(name) +
      ',DIRECT'
    )
  }

  /* ============================================================
   * 二十一、广告拦截
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
   * 二十二、业务分流
   * ============================================================ */

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

  /*
   * v4：TikTok 独立分流（原属国外媒体）。
   */
  rules.push(
    'RULE-SET,' +
    addRuleSet('tiktok') +
    ',TikTok'
  )

  /*
   * 加密货币补充规则集（dler-io，classical）。
   * 与 MetaCubeX category 并行使用。
   */
  providers['crypto-dler'] = {
    type: 'http',

    behavior: 'classical',

    format: 'yaml',

    url: CRYPTO_DLER,

    interval: 604800
  }

  rules.push('RULE-SET,crypto-dler,加密货币')

  /*
   * Telegram 独立分流。
   * geoip-telegram 覆盖 TG 数据中心 IP 段。
   */
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
   * 二十三、中国大陆直连
   * ============================================================ */

  /*
   * 腾讯系域名显式直连（微信头像 / 图片 / 支付）。
   * geosite-cn 不完全包含，缺失时命中 Final 走代理会挂起。
   */
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

  /* ============================================================
   * 二十四、最终兜底
   * ============================================================ */

  rules.push(
    'MATCH,Final'
  )

  /* ============================================================
   * 二十五、DNS
   * ============================================================ */

  const dns = {
    enable: true,

    'cache-algorithm': 'arc',

    ipv6: false,

    'enhanced-mode': 'fake-ip',

    'fake-ip-range': '198.18.0.1/16',

    'prefer-h3': false,

    /*
     * 国内 DNS：负责绝大部分解析。
     * v4：改为国产加密 DoH（对齐 Egern Domestic-Encrypted-DNS），
     * 自身域名由 default-nameserver 纯 IP 引导。
     */
    nameserver: [
      'https://dns.alidns.com/dns-query',
      'https://doh.pub/dns-query'
    ],

    'nameserver-policy': {
      '+.lan': 'system',
      '+.local': 'system',
      '+.localdomain': 'system',
      '+.home.arpa': 'system'
    },

    /*
     * 境外备用 DNS 改为纯 IP DoH：
     * 不依赖自身域名解析，但仍依赖 DNS 服务器及出口链路可用。
     * 请求遵守分流规则（respect-rules），是否代理取决于命中策略。
     */
    fallback: [
      'https://1.1.1.1/dns-query',
      'https://8.8.8.8/dns-query'
    ],

    /*
     * 先判定主 DNS 结果，满足 fallback-filter 才查询境外 DoH。
     * true 减少备用查询；需要 fallback 时可能增加等待主查询的时间。
     */
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

      /*
       * 这些域名视为易污染，直接使用 fallback 结果。
       * v4：补充 AI 站点新域名。
       */
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

    /*
     * 用于解析 DNS 服务器自身域名。
     */
    'default-nameserver': [
      '223.5.5.5',
      '119.29.29.29'
    ],

    /*
     * 节点域名解析三路冗余：
     * 阿里 / 腾讯公共 DNS + 腾讯 DoT。
     * 提供解析冗余，不保证节点连接或现有会话不中断。
     */
    'proxy-server-nameserver': [
      '223.5.5.5',
      '119.29.29.29',
      'tls://120.53.53.53'
    ],

    /*
     * 仅对局域网、联网检测、时间同步和部分游戏服务返回真实 IP。
     */
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
      '+.logon.battle.net'
    ],

    /*
     * DNS 请求遵守 Clash 分流规则。
     * 开启时必须存在 proxy-server-nameserver。
     */
    'respect-rules': true
  }

  /* ============================================================
   * 二十六、域名嗅探
   * ============================================================ */

  const sniffer = {
    enable: true,

    'force-dns-mapping': true,

    'parse-pure-ip': true,

    /*
     * 不直接改写原始目标地址，
     * 对银行 App / 游戏 / 证书固定应用兼容性更好。
     */
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

    /*
     * Apple Push 不嗅探。
     */
    'skip-domain': [
      '+.push.apple.com'
    ]
  }

  /* ============================================================
   * 二十七、写回配置
   * ============================================================ */

  return Object.assign(
    {},
    config,
    {
      /*
       * 去除机场流量信息等伪节点。
       */
      proxies: usable,

      /*
       * 顶层 IPv6 关闭：
       * 物理网络无公网 IPv6 时，TUN 接管 IPv6 默认路由会形成黑洞。
       * 注意：Mihomo Party 接管配置优先级更高，需同步保持 ipv6: false。
       */
      ipv6: false,

      'unified-delay': true,

      'tcp-concurrent': true,

      /*
       * TCP keep-alive：
       * 长连接在 NAT 下更不容易被静默断开，
       * 降低微信 / TG / 下载任务"连着连着就断"的概率。
       */
      'keep-alive-idle': 15,

      'keep-alive-interval': 15,

      /*
       * 保留策略组选择与 Fake-IP 映射。
       */
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
