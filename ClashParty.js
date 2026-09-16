/*
 * Demo.js
 * Clash Party / Mihomo Party 个人覆写优化版
 *
 * 目标：
 * 1. 提高日常访问速度
 * 2. 减少节点抖动导致的频繁切换
 * 3. 减少机场节点短暂波动造成的断流
 * 4. 优化 DNS 响应与 Fake-IP 稳定性
 * 5. 保留原有 AI、加密货币、媒体、Apple、Google、Microsoft、GitHub 分流
 *
 * 使用：
 * Clash Party → 覆写 → 新建 → 远程
 * 填写本文件 GitHub Raw 地址
 *
 * 核心设计：
 *
 * 自动选择
 *   直接测试全部真实节点
 *   不再经过地区组二次 url-test
 *
 * 地区组
 *   香港 / 台湾 / 日本 / 新加坡 / 韩国 / 美国
 *   每个地区组内部独立 url-test
 *
 * 手动选择
 *   地区组 + 全部真实节点
 *
 * 业务组
 *   AI服务
 *   加密货币
 *   国外媒体
 *   国内媒体
 *   Apple
 *   Google
 *   Microsoft
 *   GitHub
 *   Final
 *
 * DNS：
 *   Fake-IP
 *   国内公共 DNS
 *   国外 DoH fallback
 *   DNS 遵循分流规则
 *   独立节点域名解析
 *
 * 规则顺序：
 *   局域网
 *   CDN / R2
 *   国内 Apple / Microsoft / AI
 *   国内媒体
 *   Apple
 *   AI
 *   加密货币
 *   国外媒体
 *   Google
 *   GitHub
 *   Microsoft
 *   腾讯系直连（微信头像 / 图片等）
 *   中国大陆
 *   Final
 */

function main(config) {
  if (!config || typeof config !== 'object') {
    return config
  }

  if (!Array.isArray(config.proxies) || config.proxies.length === 0) {
    throw new Error('[Demo.js] 配置中缺少有效的 proxies 字段')
  }

  /* ============================================================
   * 一、基础地址
   * ============================================================ */

  const ICON =
    'https://cdn.jsdelivr.net/gh/lige47/lige_icon@main/icon/'

  const RSET =
    'https://cdn.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/'

  /* ============================================================
   * 二、测速参数
   * ============================================================ */

  const urlTest = {
    // HTTPS 测速地址
    url: 'https://www.gstatic.com/generate_204',

    // 明确要求返回 204
    'expected-status': 204,

    // 5 分钟测速一次
    interval: 300,

    // 单节点测速最多等待 3 秒
    timeout: 3000,

    /*
     * 最大失败次数
     *
     * 原配置为 1
     *
     * 改成 2 可以降低 WiFi 抖动、机场瞬时丢包、
     * 网络切换造成的无意义强制重测。
     */
    'max-failed-times': 2,

    /*
     * 节点延迟差距低于 150ms 时保持当前节点
     *
     * 防止：
     * A 80ms
     * B 120ms
     * C 95ms
     *
     * 这种小幅波动不断切节点。
     */
    tolerance: 150,

    /*
     * 只有策略组真正被使用时才测速
     *
     * 可减少：
     * CPU 占用
     * 网络探测
     * 机场测速请求
     */
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
      regex: /日本|东京|大阪|Japan|\bJP\b|🇯🇵/i
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
    }
  ]

  /* ============================================================
   * 四、业务策略组
   * ============================================================ */

  const GROUPS_BUILD = [
    {
      name: 'AI服务',
      icon: '04ProxySoft/chatgpt4.0.png',
      type: 'select',

      /*
       * AI 建议长期固定一个稳定出口。
       *
       * 默认仍放自动选择第一位，
       * 如果你长期使用 ChatGPT，
       * 可以手动固定美国节点。
       */
      lists: [
        '自动选择',
        '手动选择',
        '美国节点',
        '新加坡节点',
        '日本节点'
      ]
    },

    {
      name: '加密货币',
      icon: '04ProxySoft/Bitcoin.png',
      type: 'select',
      lists: [
        '自动选择',
        '手动选择',
        '台湾节点',
        '日本节点',
        '新加坡节点'
      ]
    },

    {
      name: '国外媒体',
      icon: '05icon/play.png',
      type: 'select',
      lists: [
        '自动选择',
        '手动选择',
        '香港节点',
        '美国节点',
        '台湾节点',
        '日本节点',
        '新加坡节点'
      ]
    },

    {
      name: '国内媒体',
      icon: '03CNSoft/bilibili.png',
      type: 'select',
      lists: [
        'DIRECT',
        '自动选择',
        '手动选择'
      ]
    },

    {
      name: 'Apple',
      icon: '03CNSoft/apple.png',
      type: 'select',
      lists: [
        'DIRECT',
        '自动选择',
        '手动选择',
        '香港节点',
        '美国节点',
        '台湾节点',
        '日本节点',
        '新加坡节点'
      ]
    },

    {
      name: 'Google',
      icon: '04ProxySoft/google.png',
      type: 'select',
      lists: [
        '自动选择',
        '手动选择',
        '香港节点',
        '美国节点'
      ]
    },

    {
      name: 'Microsoft',
      icon: '03CNSoft/microsoft.png',
      type: 'select',
      lists: [
        'DIRECT',
        '自动选择',
        '手动选择',
        '香港节点',
        '美国节点'
      ]
    },

    {
      name: 'GitHub',
      icon: '04ProxySoft/github.png',
      type: 'select',
      lists: [
        '自动选择',
        '手动选择',
        '香港节点',
        '美国节点'
      ]
    }
  ]

  /* ============================================================
   * 五、Final 候选
   * ============================================================ */

  const FINAL_LISTS = [
    '自动选择',
    '手动选择',
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
     * 非中国大陆 AI
     *
     * 包括：
     * OpenAI
     * Claude
     * Gemini
     * Grok
     * Perplexity
     * Poe
     * HuggingFace
     * 等
     */
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
     * GitHub 必须位于 Microsoft 前面。
     *
     * Microsoft 大类可能覆盖部分 GitHub 域名。
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
   *
   * true：
   * 启用 MetaCubeX 广告和 tracker 规则。
   *
   * 某些 App / 网站可能因为 tracker 被拦截出现异常。
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

  const INFO_RE =
    /剩余|到期|重置|官网|套餐|流量|expire|traffic|电报|频道|群组/i

  const usable = config.proxies.filter((proxy) => {
    if (!proxy) return false
    if (!proxy.name) return false
    if (INFO_RE.test(proxy.name)) return false

    return true
  })

  if (usable.length === 0) {
    throw new Error(
      '[Demo.js] 剔除机场信息条目后没有可用节点'
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
   * 十二、自动选择
   * ============================================================ */

  /*
   * 关键优化：
   *
   * 原方案：
   *
   * 自动选择
   * → 香港节点
   * → 香港具体节点
   *
   * 属于两层 url-test。
   *
   *
   * 当前方案：
   *
   * 自动选择
   * → 所有具体节点
   *
   * 直接从全部节点选择最快节点。
   *
   * 地区组仍然独立保留，
   * 供 AI、媒体和手动指定地区使用。
   */

  const autoList = proxyNames

  /* ============================================================
   * 十三、手动选择
   * ============================================================ */

  /*
   * 地区组优先放在前面。
   *
   * 后面追加全部节点，
   * 包括未识别地区的冷门节点。
   */
  const manualList = regionGroups
    .map((item) => item.name)
    .concat(proxyNames)

  /* ============================================================
   * 十四、生成策略组
   * ============================================================ */

  const groups = []

  groups.push({
    name: '自动选择',
    icon: ICON + '05icon/lightning.png',

    type: 'url-test',

    proxies: autoList,

    ...urlTest
  })

  groups.push({
    name: '手动选择',
    icon: ICON + '05icon/rocket.png',

    type: 'select',

    proxies: manualList
  })

  /* ============================================================
   * 十五、生成业务策略组
   * ============================================================ */

  for (const def of GROUPS_BUILD) {
    const candidates = []

    for (const item of def.lists) {
      if (item === 'DIRECT') {
        candidates.push('DIRECT')
        continue
      }

      if (
        item === '自动选择' ||
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
   * 十六、Final
   * ============================================================ */

  groups.push({
    name: 'Final',
    icon: ICON + '05icon/quanqiu.png',

    type: 'select',

    proxies: FINAL_LISTS.filter((item) => {
      if (
        item === 'DIRECT' ||
        item === '自动选择' ||
        item === '手动选择'
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
   *
   * 自动选择
   * 手动选择
   * 业务组
   * Final
   * 地区组
   */
  const orderedGroups =
    groups.concat(regionGroupDefs)

  /* ============================================================
   * 十七、Rule Provider
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
   * 十八、局域网直连
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
   * 十九、CDN 与规则下载直连
   * ============================================================ */

  /*
   * jsDelivr：
   * 图标和规则下载。
   *
   * Cloudflare R2：
   * 对象存储。
   *
   * 直接访问可以避免机场限速影响规则下载。
   */

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

  /* ============================================================
   * 二十三、中国大陆直连
   * ============================================================ */

  /*
   * 腾讯系域名显式直连。
   *
   * geosite-cn 不包含以下腾讯自有域名：
   *   qlogo.cn      微信头像
   *   qpic.cn       聊天图片 / 朋友圈图片
   *   gtimg.cn      静态资源
   *   wechatpay.cn  微信支付
   *
   * 缺失时这些流量会命中 MATCH,Final 走代理，
   * 腾讯 CDN 对境外出口拒绝或挂起，
   * 表现为微信群聊头像无法显示。
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

    /*
     * ARC 对热点 DNS 缓存通常比简单 LRU 更合适。
     */
    'cache-algorithm': 'arc',

    ipv6: false,

    'enhanced-mode': 'fake-ip',

    'fake-ip-range': '198.18.0.1/16',

    /*
     * respect-rules 与 H3 同时使用没有明显必要。
     */
    'prefer-h3': false,

    /*
     * 国内 DNS。
     *
     * 负责绝大部分正常解析。
     */
    nameserver: [
      '223.5.5.5',
      '119.29.29.29'
    ],

    /*
     * 局域网域名交给系统 DNS。
     */
    'nameserver-policy': {
      '+.lan': 'system',
      '+.local': 'system',
      '+.localdomain': 'system',
      '+.home.arpa': 'system'
    },

    /*
     * 境外备用 DNS。
     */
    fallback: [
      'https://dns.cloudflare.com/dns-query',
      'https://dns.google/dns-query'
    ],

    /*
     * 主 DNS 与备用 DNS 并行查询。
     *
     * 仍按 fallback-filter 选择结果。
     *
     * 需要备用结果时可减少串行等待；未命中缓存时查询量会增加。
     */
    'fallback-lazy-query': false,

    'fallback-filter': {
      geoip: true,

      'geoip-code': 'CN',

      ipcidr: [
        '240.0.0.0/4',
        '0.0.0.0/32',
        '127.0.0.1/32'
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
     * 专门解析机场节点域名。
     *
     * 不再加入 system。
     *
     * 避免：
     * 系统 DNS
     * 路由器 DNS
     * 公共 DNS
     *
     * 多来源解析造成行为不一致。
     */
    'proxy-server-nameserver': [
      '223.5.5.5',
      '119.29.29.29'
    ],

    /*
     * 以下域名返回真实 IP。
     *
     * 主要解决：
     * 局域网
     * NTP
     * STUN
     * Apple 部分服务
     * 国内影音服务
     * 部分 IoT 服务
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

      'swscan.apple.com',
      'mesu.apple.com',

      '*.music.163.com',
      'music.163.com',

      'y.qq.com',
      '*.y.qq.com',

      '*.bilibili.com',
      'api.bilibili.com',

      'www.douyu.com',

      'activityapi.huya.com',

      'localhost.ptlogin2.qq.com',

      'Mijia Cloud',

      'dig.io.mi.com'
    ],

    /*
     * DNS 请求遵守 Clash 分流规则。
     *
     * 开启此参数时必须存在：
     * proxy-server-nameserver
     */
    'respect-rules': true
  }

  /* ============================================================
   * 二十六、域名嗅探
   * ============================================================ */

  const sniffer = {
    enable: true,

    /*
     * Fake-IP 与嗅探域名映射。
     */
    'force-dns-mapping': true,

    /*
     * 对纯 IP 连接尝试嗅探域名。
     */
    'parse-pure-ip': true,

    /*
     * 不直接改写原始目标地址。
     *
     * 对部分：
     * 银行 App
     * 游戏
     * 证书固定 App
     *
     * 兼容性更好。
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
       * 顶层 IPv6 关闭。
       *
       * 物理网络没有公网 IPv6 时，
       * TUN 接管 IPv6 默认路由会形成黑洞：
       * 微信等客户端通过 HTTPDNS 拿到 IPv6 地址后
       * 全部进入 TUN 且无法拨出，
       * 头像、朋友圈等流量反复重试失败。
       *
       * 关闭后系统在 IPv4 上正常回退。
       *
       * 注意：Mihomo Party 接管配置优先级更高，
       * 需在 接管配置 中同步保持 ipv6: false。
       */
      ipv6: false,

      /*
       * 统一延迟计算逻辑。
       */
      'unified-delay': true,

      /*
       * DNS 返回多个 IP 时，
       * Mihomo 可以并发建立 TCP 连接，
       * 使用最快成功的连接。
       *
       * 与 IPv4 / IPv6 Happy Eyeballs
       * 不是完全相同概念。
       */
      'tcp-concurrent': true,

      /*
       * 保留策略组选择与 Fake-IP 映射。
       *
       * 客户端重启后体验更稳定。
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
