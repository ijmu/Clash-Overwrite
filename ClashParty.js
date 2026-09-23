/*
 * ClashParty.js
 * Clash Party / Mihomo Party 个人覆写 v2（2026-09-22）
 *
 * 在 v1 基础上的改动（断流治理 + 分组重构）：
 *
 * 稳定性：
 * 1. url-test tolerance 150 -> 80：
 *    150 太宽，节点劣化后长时间不切换，表现为"断流"；
 *    80 在"避免抖动"与"及时逃离劣化节点"之间取平衡。
 * 2. DNS fallback 改为纯 IP DoH（1.1.1.1 / 8.8.8.8）：
 *    原来的 dns.cloudflare.com / dns.google 域名自身需要解析，
 *    网络劣化时引导查询先死，fallback 形同虚设；
 *    纯 IP DoH 不依赖引导解析。
 * 3. fallback-lazy-query 改回 true：
 *    先判定主 DNS 结果，满足条件才查询境外 DoH，
 *    境外 DNS 抖动不再拖慢国内解析。
 * 4. proxy-server-nameserver 增加 120.53.53.53（腾讯 DNSPod DoT）：
 *    节点域名解析三路冗余，单一公共 DNS 故障时不断流。
 * 5. 新增全局 keep-alive-idle / keep-alive-interval = 15s：
 *    长连接（微信 / TG / 下载）在 NAT 环境下更不容易被静默断开。
 * 6. 信息节点过滤词库对齐 Egern 配置（套餐/订阅/续费/官网/网址/时间/应急 等）。
 *
 * 分组（参考 ClashConnectRules/Self-Configuration 结构）：
 * 1. 新增顶层"节点选择"：所有业务组默认走它，
 *    换节点只改一处，不再逐组切换。
 * 2. 业务组默认值统一指向"节点选择"；
 *    特殊业务保留独立出口（AI 偏好美国，Telegram 偏好新加坡/香港，
 *    加密货币偏好台湾/日本/新加坡，国内媒体/Apple/Microsoft 默认直连）。
 * 3. Final 默认"节点选择"，兜底逻辑集中。
 * 4. Telegram 独立分流（geosite + geoip）。
 * 5. 加密货币双规则集：MetaCubeX category + dler-io Crypto。
 * 6. fake-ip-filter 合并参考配置的游戏/音乐/NTP 真实 IP 列表。
 *
 * 使用：
 * Clash Party → 覆写 → 新建 → 远程 → 填入本文件 GitHub Raw 地址
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
    'https://cdn.jsdelivr.net/gh/lige47/lige_icon@main/icon/'

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

    /*
     * 容差 80ms：
     * 低于当前节点延迟 80ms 以上才切换。
     * v1 的 150ms 过宽，节点劣化后迟迟不切换，
     * 体感就是"断流"。
     */
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
      icon: '01Country/Hongkong.png',
      regex: /香港|Hong ?Kong|\bHK\b|🇭🇰/i
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
      icon: '01Country/US.png',
      regex:
        /美国|美國|洛杉矶|洛杉磯|圣何塞|聖荷西|西雅图|西雅圖|凤凰城|鳳凰城|United ?States|America|\bUS\b|\bUSA\b|🇺🇸/i
    },

    /*
     * 英 / 德 / 法组仅在实际存在对应节点时才会生成，
     * 无节点时自动隐藏，不影响显示。
     */
    {
      name: '英国节点',
      icon: '01Country/UK.png',
      regex: /英国|英國|伦敦|倫敦|United ?Kingdom|\bUK\b|🇬🇧/i
    },

    {
      name: '德国节点',
      icon: '01Country/Germany.png',
      regex: /德国|德國|法兰克福|法蘭克福|Germany|\bDE\b|🇩🇪/i
    },

    {
      name: '法国节点',
      icon: '01Country/France.png',
      regex: /法国|法國|巴黎|France|\bFR\b|🇫🇷/i
    }
  ]

  /* ============================================================
   * 四、策略组定义
   * ============================================================ */

  /*
   * REF 即顶层"节点选择"。
   *
   * 所有业务组默认第一项都是它：
   * 换节点只需要在"节点选择"里改一次。
   *
   * 特殊业务保留独立出口：
   * AI 固定偏好美国，Telegram 偏好新加坡/香港，
   * 加密货币偏好台湾/日本/新加坡。
   */

  const REF = '节点选择'

  const GROUPS_BUILD = [
    {
      name: 'AI服务',
      icon: '04ProxySoft/chatgpt4.0.png',
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
      name: 'Telegram',
      icon: '04ProxySoft/telegram.png',
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
      icon: '04ProxySoft/Bitcoin.png',
      type: 'select',
      lists: [
        REF,
        '台湾节点',
        '日本节点',
        '新加坡节点',
        '手动选择'
      ]
    },

    {
      name: '国外媒体',
      icon: '05icon/play.png',
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
      name: '国内媒体',
      icon: '03CNSoft/bilibili.png',
      type: 'select',
      lists: [
        'DIRECT',
        REF
      ]
    },

    {
      name: 'Apple',
      icon: '03CNSoft/apple.png',
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
      icon: '04ProxySoft/google.png',
      type: 'select',
      lists: [
        REF,
        '香港节点',
        '美国节点',
        '手动选择'
      ]
    },

    {
      name: 'Microsoft',
      icon: '03CNSoft/microsoft.png',
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
      icon: '04ProxySoft/github.png',
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
        'tiktok',
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
   * 八、强制直连规则
   * ============================================================ */

  const DIRECT_SETS = [
    'apple-cn',
    'icloud@cn',
    'category-ai-cn',
    'microsoft@cn'
  ]

  /* ============================================================
   * 九、过滤机场信息节点
   * ============================================================ */

  /*
   * 词库对齐 Egern 配置的排除列表。
   */
  const INFO_RE =
    /套餐|订阅|到期|重置|剩余|续费|官网|网址|流量|频道|公告|失联|应急|过期|有效|时间|客户端|支持|群|电报|expire|traffic/i

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
   * 十、节点地区归类
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

  /* ============================================================
   * 十一、地区 url-test
   * ============================================================ */

  const regionGroupDefs = regionGroups.map((region) => ({
    name: region.name,
    icon: ICON + region.icon,

    type: 'url-test',

    proxies: region.nodes,

    ...urlTest
  }))

  /* ============================================================
   * 十二、生成策略组
   * ============================================================ */

  const groups = []

  /*
   * 顶层入口。
   * 默认自动选择；换节点只改这里。
   */
  groups.push({
    name: REF,
    icon: ICON + '05icon/rocket.png',

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
    icon: ICON + '05icon/lightning.png',

    type: 'url-test',

    proxies: proxyNames,

    ...urlTest
  })

  /*
   * 手动选择：直连 + 地区组 + 全部真实节点。
   */
  groups.push({
    name: '手动选择',
    icon: ICON + '05icon/jichang.png',

    type: 'select',

    proxies: [
      'DIRECT',
      ...regionGroups.map((item) => item.name),
      ...proxyNames
    ]
  })

  /*
   * 业务组：
   * 第一项固定为节点选择（或直连优先类），
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

      const exists = regionGroups.some(
        (region) => region.name === item
      )

      if (exists) {
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
   * 十三、Final
   * ============================================================ */

  groups.push({
    name: 'Final',
    icon: ICON + '05icon/quanqiu.png',

    type: 'select',

    proxies: FINAL_LISTS.filter((item) => {
      if (
        item === 'DIRECT' ||
        item === REF
      ) {
        return true
      }

      return regionGroups.some(
        (region) => region.name === item
      )
    })
  })

  /*
   * 显示顺序：
   * 节点选择 / 自动选择 / 手动选择 / 业务组 / Final / 地区组
   */
  const orderedGroups =
    groups.concat(regionGroupDefs)

  /* ============================================================
   * 十四、Rule Provider
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
   * 十五、局域网直连
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
   * 十六、CDN 与规则下载直连
   * ============================================================ */

  rules.push(
    'DOMAIN-SUFFIX,jsdelivr.net,DIRECT'
  )

  rules.push(
    'DOMAIN-SUFFIX,r2.dev,DIRECT'
  )

  rules.push(
    'DOMAIN-SUFFIX,cloudflare-r2.com,DIRECT'
  )

  /* ============================================================
   * 十七、中国大陆服务优先直连
   * ============================================================ */

  for (const name of DIRECT_SETS) {
    rules.push(
      'RULE-SET,' +
      addRuleSet(name) +
      ',DIRECT'
    )
  }

  /* ============================================================
   * 十八、广告拦截
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
   * 十九、业务分流
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
   * 二十、中国大陆直连
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
   * 二十一、最终兜底
   * ============================================================ */

  rules.push(
    'MATCH,Final'
  )

  /* ============================================================
   * 二十二、DNS
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
     */
    nameserver: [
      '223.5.5.5',
      '119.29.29.29'
    ],

    'nameserver-policy': {
      '+.lan': 'system',
      '+.local': 'system',
      '+.localdomain': 'system',
      '+.home.arpa': 'system'
    },

    /*
     * 境外备用 DNS 改为纯 IP DoH：
     * 不依赖自身域名解析，网络劣化时仍然可用。
     * 请求遵守分流规则（respect-rules）经代理发出。
     */
    fallback: [
      'https://1.1.1.1/dns-query',
      'https://8.8.8.8/dns-query'
    ],

    /*
     * 先判定主 DNS 结果，满足 fallback-filter 才查询境外 DoH。
     * v1 的 false 会让境外 DNS 抖动拖慢国内解析。
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
       */
      domain: [
        '+.google.com',
        '+.youtube.com',
        '+.facebook.com',
        '+.twitter.com',
        '+.openai.com',
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
     * 单一 DNS 故障时节点仍然可解析，不断流。
     */
    'proxy-server-nameserver': [
      '223.5.5.5',
      '119.29.29.29',
      'tls://120.53.53.53'
    ],

    /*
     * 以下域名返回真实 IP（合并参考配置的游戏 / 音乐 / NTP 列表）。
     */
    'fake-ip-filter': [
      '*.lan',
      '*.local',
      '*.localhost',
      '*.localdomain',
      '*.home.arpa',

      '+.msftconnecttest.com',
      '+.msftncsi.com',

      '+.pool.ntp.org',
      'time1.cloud.tencent.com',

      'ntp.*.com',
      'ntp1.*.com',
      'ntp2.*.com',
      'ntp3.*.com',
      'ntp4.*.com',

      'time.*.com',
      'time.*.gov',
      'time.*.edu.cn',

      'time.*.apple.com',

      'time1.*.com',
      'time2.*.com',
      'time3.*.com',
      'time4.*.com',
      'time5.*.com',
      'time6.*.com',
      'time7.*.com',

      'stun.*.*',
      'stun.*.*.*',
      '*.stun.*.*',
      '*.stun.*.*.*',
      '+.stun.*.*.*',

      'swscan.apple.com',
      'swquery.apple.com',
      'swdownload.apple.com',
      'swcdn.apple.com',
      'swdist.apple.com',
      'mesu.apple.com',

      '*.music.163.com',
      'music.163.com',
      '*.126.net',

      'musicapi.taihe.com',
      'music.taihe.com',

      'songsearch.kugou.com',
      'trackercdn.kugou.com',

      '*.kuwo.cn',
      '*.music.migu.cn',
      'music.migu.cn',

      'y.qq.com',
      '*.y.qq.com',
      'streamoc.music.tc.qq.com',
      'mobileoc.music.tc.qq.com',
      'isure.stream.qqmusic.qq.com',
      'dl.stream.qqmusic.qq.com',
      'aqqmusic.tc.qq.com',
      'amobile.music.tc.qq.com',

      '*.bilibili.com',
      'api.bilibili.com',
      '*.mcdn.bilivideo.cn',

      'www.douyu.com',
      'activityapi.huya.com',

      'localhost.ptlogin2.qq.com',
      'localhost.sec.qq.com',

      'Mijia Cloud',
      'dig.io.mi.com',

      '+.srv.nintendo.net',
      '+.stun.playstation.net',
      'xbox.*.microsoft.com',
      '+.ipv6.microsoft.com',
      '+.battlenet.com.cn',
      '+.pvp.net',
      '+.media.dssott.com',

      'proxy.golang.org'
    ],

    /*
     * DNS 请求遵守 Clash 分流规则。
     * 开启时必须存在 proxy-server-nameserver。
     */
    'respect-rules': true
  }

  /* ============================================================
   * 二十三、域名嗅探
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
   * 二十四、写回配置
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
