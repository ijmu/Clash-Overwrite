/*
 * FlClash.js
 * FlClash / Mihomo 专用覆写优化版
 *
 * 设计目标：
 * 1. 网速优先
 * 2. 减少测速抖动造成的节点频繁切换
 * 3. 减少机场短暂丢包造成的断流
 * 4. Fake-IP + DNS 分流
 * 5. 自动兼容 proxies / proxy-providers
 * 6. 订阅增加、删除节点后自动更新策略组
 * 7. 不需要 JS 枚举具体节点名称
 *
 * 与 Clash Party Demo.js 保持相同业务逻辑：
 *
 * 自动选择
 * 手动选择
 * AI服务
 * 加密货币
 * 国外媒体
 * 国内媒体
 * Apple
 * Google
 * Microsoft
 * GitHub
 * Final
 *
 * 地区：
 * 香港
 * 台湾
 * 日本
 * 新加坡
 * 韩国
 * 美国
 *
 * ==========================================
 *
 * FlClash 设置建议：
 *
 * DNS 覆写：关闭
 * 追加系统 DNS：关闭
 * IPv6：关闭
 *
 * 让本脚本完整接管 DNS。
 *
 * ==========================================
 */

function main(config) {
  if (!config || typeof config !== 'object') {
    return config
  }

  /* ============================================================
   * 一、基础地址
   * ============================================================ */

  const ICON =
    'https://cdn.jsdelivr.net/gh/lige47/lige_icon@main/icon/'

  const RSET =
    'https://cdn.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/'

  /* ============================================================
   * 二、节点排除
   * ============================================================ */

  /*
   * 排除机场常见信息节点。
   *
   * 例如：
   * 剩余流量
   * 套餐到期
   * 官网
   * 电报群
   * 重置时间
   *
   * FlClash 版不删除原配置中的节点。
   *
   * 只在策略组动态加载时排除。
   */

  const INFO_FILTER =
    '(?i)剩余|流量|到期|重置|官网|套餐|电报|频道|群组|expire|traffic'

  /* ============================================================
   * 三、地区正则
   * ============================================================ */

  const HK =
    '(?i)香港|Hong ?Kong|\\bHK\\b|🇭🇰'

  const TW =
    '(?i)台湾|臺灣|Taiwan|\\bTW\\b|🇹🇼'

  const JP =
    '(?i)日本|东京|東京|大阪|Japan|\\bJP\\b|🇯🇵'

  const SG =
    '(?i)新加坡|狮城|獅城|Singapore|\\bSG\\b|🇸🇬'

  const KR =
    '(?i)韩国|韓國|首尔|首爾|Korea|\\bKR\\b|🇰🇷'

  const US =
    '(?i)美国|美國|洛杉矶|洛杉磯|圣何塞|聖荷西|西雅图|西雅圖|凤凰城|鳳凰城|United ?States|America|\\bUS\\b|\\bUSA\\b|🇺🇸'

  /* ============================================================
   * 四、测速公共参数
   * ============================================================ */

  const TEST_URL =
    'https://www.gstatic.com/generate_204'

  const TEST_INTERVAL = 300

  const TEST_TIMEOUT = 3000

  const TEST_TOLERANCE = 150

  /* ============================================================
   * 五、动态节点组公共参数
   * ============================================================ */

  /*
   * include-all:
   *
   * 同时自动加载：
   *
   * proxies
   * proxy-providers
   *
   * 这是 FlClash 版本与 Clash Party 版本
   * 最大的结构区别。
   */

  function dynamicBase() {
    return {
      'include-all': true,

      /*
       * 防止 DIRECT 被 url-test 当成最快节点。
       */
      'exclude-type': 'direct',

      /*
       * 排除机场信息条目。
       */
      'exclude-filter': INFO_FILTER
    }
  }

  /* ============================================================
   * 六、地区自动测速组
   * ============================================================ */

  function regionTestGroup(name, filter, icon) {
    return Object.assign(
      {
        name: name,

        type: 'url-test',

        icon: ICON + icon,

        filter: filter,

        url: TEST_URL,

        'expected-status': 204,

        interval: TEST_INTERVAL,

        timeout: TEST_TIMEOUT,

        tolerance: TEST_TOLERANCE,

        lazy: true,

        'max-failed-times': 2
      },

      dynamicBase()
    )
  }

  /* ============================================================
   * 七、策略组
   * ============================================================ */

  const groups = []

  /* ============================================================
   * 自动选择
   * ============================================================ */

  /*
   * 自动选择直接测试所有真实节点。
   *
   * 不经过：
   *
   * 自动选择
   * → 香港组
   * → 香港具体节点
   *
   * 这种双层 url-test。
   */

  groups.push(
    Object.assign(
      {
        name: '自动选择',

        type: 'url-test',

        icon:
          ICON +
          '05icon/lightning.png',

        url: TEST_URL,

        'expected-status': 204,

        interval: TEST_INTERVAL,

        timeout: TEST_TIMEOUT,

        tolerance: TEST_TOLERANCE,

        lazy: true,

        'max-failed-times': 2
      },

      dynamicBase()
    )
  )

  /* ============================================================
   * 手动选择
   * ============================================================ */

  /*
   * 这里：
   *
   * proxies
   *
   * 负责把地区组排在最前面。
   *
   * include-all
   *
   * 负责在后面自动加入所有真实节点。
   */

  groups.push(
    Object.assign(
      {
        name: '手动选择',

        type: 'select',

        icon:
          ICON +
          '05icon/rocket.png',

        proxies: [
          '香港节点',
          '台湾节点',
          '日本节点',
          '新加坡节点',
          '韩国节点',
          '美国节点'
        ]
      },

      dynamicBase()
    )
  )

  /* ============================================================
   * AI
   * ============================================================ */

  groups.push({
    name: 'AI服务',

    type: 'select',

    icon:
      ICON +
      '04ProxySoft/chatgpt4.0.png',

    proxies: [
      '自动选择',
      '美国节点',
      '新加坡节点',
      '日本节点',
      '手动选择'
    ]
  })

  /* ============================================================
   * 加密货币
   * ============================================================ */

  groups.push({
    name: '加密货币',

    type: 'select',

    icon:
      ICON +
      '04ProxySoft/Bitcoin.png',

    proxies: [
      '自动选择',
      '台湾节点',
      '日本节点',
      '新加坡节点',
      '手动选择'
    ]
  })

  /* ============================================================
   * 国外媒体
   * ============================================================ */

  groups.push({
    name: '国外媒体',

    type: 'select',

    icon:
      ICON +
      '05icon/play.png',

    proxies: [
      '自动选择',
      '香港节点',
      '美国节点',
      '台湾节点',
      '日本节点',
      '新加坡节点',
      '手动选择'
    ]
  })

  /* ============================================================
   * 国内媒体
   * ============================================================ */

  groups.push({
    name: '国内媒体',

    type: 'select',

    icon:
      ICON +
      '03CNSoft/bilibili.png',

    proxies: [
      'DIRECT',
      '自动选择',
      '手动选择'
    ]
  })

  /* ============================================================
   * Apple
   * ============================================================ */

  groups.push({
    name: 'Apple',

    type: 'select',

    icon:
      ICON +
      '03CNSoft/apple.png',

    proxies: [
      'DIRECT',
      '自动选择',
      '香港节点',
      '美国节点',
      '台湾节点',
      '日本节点',
      '新加坡节点',
      '手动选择'
    ]
  })

  /* ============================================================
   * Google
   * ============================================================ */

  groups.push({
    name: 'Google',

    type: 'select',

    icon:
      ICON +
      '04ProxySoft/google.png',

    proxies: [
      '自动选择',
      '香港节点',
      '美国节点',
      '手动选择'
    ]
  })

  /* ============================================================
   * Microsoft
   * ============================================================ */

  groups.push({
    name: 'Microsoft',

    type: 'select',

    icon:
      ICON +
      '03CNSoft/microsoft.png',

    proxies: [
      'DIRECT',
      '自动选择',
      '香港节点',
      '美国节点',
      '手动选择'
    ]
  })

  /* ============================================================
   * GitHub
   * ============================================================ */

  groups.push({
    name: 'GitHub',

    type: 'select',

    icon:
      ICON +
      '04ProxySoft/github.png',

    proxies: [
      '自动选择',
      '香港节点',
      '美国节点',
      '手动选择'
    ]
  })

  /* ============================================================
   * Final
   * ============================================================ */

  groups.push({
    name: 'Final',

    type: 'select',

    icon:
      ICON +
      '05icon/quanqiu.png',

    proxies: [
      '自动选择',
      '手动选择',
      '香港节点',
      '台湾节点',
      '日本节点',
      '新加坡节点',
      '美国节点',
      'DIRECT'
    ]
  })

  /* ============================================================
   * 八、地区自动测速
   * ============================================================ */

  groups.push(
    regionTestGroup(
      '香港节点',
      HK,
      '01Country/Hongkong.png'
    )
  )

  groups.push(
    regionTestGroup(
      '台湾节点',
      TW,
      '01Country/taiwan.png'
    )
  )

  groups.push(
    regionTestGroup(
      '日本节点',
      JP,
      '01Country/Japan(1).png'
    )
  )

  groups.push(
    regionTestGroup(
      '新加坡节点',
      SG,
      '01Country/singapore.png'
    )
  )

  groups.push(
    regionTestGroup(
      '韩国节点',
      KR,
      '01Country/Korea.png'
    )
  )

  groups.push(
    regionTestGroup(
      '美国节点',
      US,
      '01Country/US.png'
    )
  )

  /* ============================================================
   * 九、Rule Provider
   * ============================================================ */

  const providers = {}

  const rules = []

  function addRuleSet(name) {
    const key =
      'geosite-' + name

    if (!providers[key]) {
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
    }

    return key
  }

  function addGeoIP(name) {
    const key =
      'geoip-' + name

    if (!providers[key]) {
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
    }

    return key
  }

  function addGeositeRule(
    setName,
    policy
  ) {
    rules.push(
      'RULE-SET,' +
      addRuleSet(setName) +
      ',' +
      policy
    )
  }

  /* ============================================================
   * 十、局域网
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
   * 十一、基础 CDN
   * ============================================================ */

  /*
   * 用于规则和图标下载。
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
   * 十二、中国大陆特殊服务
   * ============================================================ */

  addGeositeRule(
    'apple-cn',
    'DIRECT'
  )

  addGeositeRule(
    'icloud@cn',
    'DIRECT'
  )

  addGeositeRule(
    'category-ai-cn',
    'DIRECT'
  )

  addGeositeRule(
    'microsoft@cn',
    'DIRECT'
  )

  /* ============================================================
   * 十三、国内媒体
   * ============================================================ */

  addGeositeRule(
    'bilibili',
    '国内媒体'
  )

  addGeositeRule(
    'iqiyi',
    '国内媒体'
  )

  addGeositeRule(
    'youku',
    '国内媒体'
  )

  /* ============================================================
   * 十四、Apple
   * ============================================================ */

  addGeositeRule(
    'apple',
    'Apple'
  )

  addGeositeRule(
    'icloud',
    'Apple'
  )

  /* ============================================================
   * 十五、AI
   * ============================================================ */

  /*
   * MetaCubeX category-ai-!cn
   *
   * 用于非中国大陆 AI 服务。
   */

  addGeositeRule(
    'category-ai-!cn',
    'AI服务'
  )

  /* ============================================================
   * 十六、加密货币
   * ============================================================ */

  addGeositeRule(
    'category-cryptocurrency',
    '加密货币'
  )

  /* ============================================================
   * 十七、国外媒体
   * ============================================================ */

  addGeositeRule(
    'netflix',
    '国外媒体'
  )

  addGeositeRule(
    'youtube',
    '国外媒体'
  )

  addGeositeRule(
    'disney',
    '国外媒体'
  )

  addGeositeRule(
    'primevideo',
    '国外媒体'
  )

  addGeositeRule(
    'hbo',
    '国外媒体'
  )

  addGeositeRule(
    'tiktok',
    '国外媒体'
  )

  addGeositeRule(
    'spotify',
    '国外媒体'
  )

  /* ============================================================
   * 十八、Google
   * ============================================================ */

  addGeositeRule(
    'google',
    'Google'
  )

  /* ============================================================
   * 十九、GitHub
   * ============================================================ */

  /*
   * GitHub 放 Microsoft 前。
   */

  addGeositeRule(
    'github',
    'GitHub'
  )

  /* ============================================================
   * 二十、Microsoft
   * ============================================================ */

  addGeositeRule(
    'microsoft',
    'Microsoft'
  )

  addGeositeRule(
    'bing',
    'Microsoft'
  )

  /* ============================================================
   * 二十一、中国大陆
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
  addGeositeRule(
    'tencent',
    'DIRECT'
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
   * 二十二、Final
   * ============================================================ */

  rules.push(
    'MATCH,Final'
  )

  /* ============================================================
   * 二十三、DNS
   * ============================================================ */

  const dns = {
    enable: true,

    /*
     * Adaptive Replacement Cache
     */
    'cache-algorithm': 'arc',

    ipv6: false,

    'enhanced-mode': 'fake-ip',

    'fake-ip-range':
      '198.18.0.1/16',

    /*
     * DoH 默认不强制 HTTP/3。
     *
     * 对移动网络和网络切换场景
     * 通常更稳定。
     */
    'prefer-h3': false,

    /*
     * 国内 DNS
     */
    nameserver: [
      '223.5.5.5',
      '119.29.29.29'
    ],

    /*
     * 局域网域名使用系统 DNS。
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
     * 先查询 nameserver。
     *
     * 只有满足 fallback-filter
     * 时才启动备用 DNS 查询。
     */
    'fallback-lazy-query': true,

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
     * DNS 服务器自身域名解析。
     */
    'default-nameserver': [
      '223.5.5.5',
      '119.29.29.29'
    ],

    /*
     * 机场节点域名专用解析。
     */
    'proxy-server-nameserver': [
      '223.5.5.5',
      '119.29.29.29'
    ],

    /*
     * Fake-IP 排除。
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
     * DNS 请求遵循分流规则。
     *
     * respect-rules 开启时必须存在
     * proxy-server-nameserver。
     */
    'respect-rules': true
  }

  /* ============================================================
   * 二十四、Sniffer
   * ============================================================ */

  const sniffer = {
    enable: true,

    'force-dns-mapping': true,

    'parse-pure-ip': true,

    /*
     * 保守模式。
     *
     * 可以降低银行、游戏、
     * 证书固定 App 出现异常的概率。
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

    'skip-domain': [
      '+.push.apple.com'
    ]
  }

  /* ============================================================
   * 二十五、基础 Mihomo 参数
   * ============================================================ */

  config.mode = 'rule'

  config.ipv6 = false

  /*
   * 统一延迟统计。
   */
  config['unified-delay'] = true

  /*
   * 一个域名解析到多个 IP 时，
   * 并发尝试 TCP 建连并采用最快成功连接。
   */
  config['tcp-concurrent'] = true

  /* ============================================================
   * 二十六、状态持久化
   * ============================================================ */

  /*
   * 保留用户之前的 profile 设置，
   * 然后覆盖必要字段。
   */

  config.profile =
    config.profile || {}

  config.profile['store-selected'] =
    true

  config.profile['store-fake-ip'] =
    true

  /* ============================================================
   * 二十七、写入配置
   * ============================================================ */

  config.dns = dns

  config.sniffer = sniffer

  config['proxy-groups'] = groups

  config.rules = rules

  config['rule-providers'] =
    providers

  return config
}
