/*
 * Demo.js —— 个人覆写模板（Clash Party / Mihomo Party 远程 JS 覆写）
 *
 * 用法：Clash Party → 覆写 → 新建 → 远程 → 填本文件的 GitHub raw 地址
 *      （raw.githubusercontent.com/.../Demo.js）
 *      订阅自动更新／覆写更新时，每次生成配置都会执行本脚本
 *
 * 组结构：
 *   1. 自动选择  url-test 自动测速（地区组间选最快 → 组内再选最快节点，120s 测速 / 3s 超时 / 200ms 容差 / 失败即重选）
 *   2. 手动选择  select   手动挑节点（先地区组、后全部单节点；含未归类的冷门节点）
 *   3. AI服务    select   自动/手动 → 美国 / 新加坡 / 日本 地区组
 *   4. 加密货币  select   自动/手动 → 台湾 / 日本 / 新加坡 地区组
 *   5. 国内媒体  select   默认 DIRECT（可切自动/手动），国内视频站走它＝直连
 *   6. 国外媒体  select   自动/手动 → 香港 / 美国 / 台湾 / 日本 / 新加坡 地区组
 *   7. Apple     select   默认 DIRECT，可切自动/手动或各地区
 *   8. Google    select   自动/手动 → 香港 / 美国 地区组
 *   9. Microsoft select   默认 DIRECT，可切自动/手动或香港/美国
 *  10. GitHub    select   自动/手动 → 香港 / 美国 地区组
 *  11. Final     select   兜底：自动 / 手动 / 各地区 / DIRECT，规则最后 MATCH 进它
 *  12. 地区分组  香港/台湾/日本/新加坡/韩国/美国节点（按节点名正则自动归类，空地区自动隐藏）
 *               未匹配任何地区的节点只出现在「手动选择」里，不再单独建组
 *
 * 规则顺序：局域网 → jsdelivr/Cloudflare R2 直连（下载不占代理） → 苹果/微软国内服务、国内AI直连 → 国内媒体 → Apple → AI服务 →
 *         加密货币 → 国外媒体 → Google → GitHub → Microsoft → 中国大陆直连 → 兜底 Final
 *         （GitHub 必须在 Microsoft 之前：microsoft 规则集含 github，否则会被吞进直连）
 *
 * AI 分流说明：采用 MetaCubeX 聚合规则集 category-ai-!cn（自动收录 OpenAI/Claude/Gemini/Grok/
 *             Perplexity/HuggingFace/Poe 等全部非国内 AI，上游每天更新），国内 AI（deepseek/qwen/kimi 等）
 *             走 category-ai-cn 直连，分流既全面又不误伤
 *
 * 想改哪里：
 *   - 加减地区 → 改 REGION_DEFS
 *   - 某组的候选节点地区 → 改 GROUPS_BUILD 里对应 lists
 *   - 规则覆盖面 → 改 CATEGORY_MAP / DIRECT_SETS（规则集名见 MetaCubeX meta-rules-dat geosite 目录）
 *   - 测速频率 → 改 urlTest
 *   - 广告拦截 → 改 BLOCK_ADS（默认关闭，true 时广告/跟踪域名直接拒绝，还能提速）
 */
function main(config) {
  if (!config || typeof config !== 'object') return config
  if (!Array.isArray(config.proxies) || config.proxies.length === 0) {
    throw new Error('[Demo.js] 配置中缺少有效的 proxies 字段')
  }

  const ICON = 'https://cdn.jsdelivr.net/gh/lige47/lige_icon@main/icon/'
  const RSET = 'https://cdn.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/'

  /* ---------------- 一、可调参数 ---------------- */
  const urlTest = {
    url: 'http://www.gstatic.com/generate_204', // 与机场同款测速端点，对拥堵节点判定更稳
    interval: 120, // 秒；2 分钟一轮。配合 3 秒超时，半死节点（能挤过 5 秒检查但传不动真实流量）会被及时识破
    timeout: 3000, // 毫秒；健康检查超时收紧到 3 秒——拥堵节点响应 4-6 秒，5 秒阈值会误判为健康
    'max-failed-times': 1, // 健康检查真失败 1 次立即全组重选——这是故障恢复，不是漂移
    tolerance: 200, // 毫秒；只有明显更快（>200ms）才切换，压掉抖动引起的漂移
    lazy: true // 只在组被真正使用时测速
  }

  // 地区识别正则（按数组顺序匹配，先命中先归类）
  const REGION_DEFS = [
    { name: '香港节点', icon: '01Country/Hongkong.png', regex: /香港|Hong ?Kong|\bHK\b|🇭🇰/i },
    { name: '台湾节点', icon: '01Country/taiwan.png', regex: /台湾|臺灣|Taiwan|\bTW\b|🇹🇼/i },
    { name: '日本节点', icon: '01Country/Japan(1).png', regex: /日本|东京|大阪|Japan|\bJP\b|🇯🇵/i },
    { name: '新加坡节点', icon: '01Country/singapore.png', regex: /新加坡|狮城|獅城|Singapore|\bSG\b|🇸🇬/i },
    { name: '韩国节点', icon: '01Country/Korea.png', regex: /韩国|韓國|首尔|Korea|\bKR\b|🇰🇷/i },
    { name: '美国节点', icon: '01Country/US.png', regex: /美国|美國|洛杉矶|圣何塞|西雅图|凤凰城|United ?States|America|\bUS\b|\bUSA\b|🇺🇸/i }
  ]

  // 业务组候选（可填：地区组名 / 自动选择 / 手动选择 / DIRECT；地区不存在时自动剔除）
  const GROUPS_BUILD = [
    { name: 'AI服务', icon: '04ProxySoft/chatgpt4.0.png', type: 'select', lists: ['自动选择', '手动选择', '美国节点', '新加坡节点', '日本节点'] },
    { name: '加密货币', icon: '04ProxySoft/Bitcoin.png', type: 'select', lists: ['自动选择', '手动选择', '台湾节点', '日本节点', '新加坡节点'] },
    { name: '国外媒体', icon: '05icon/play.png', type: 'select', lists: ['自动选择', '手动选择', '香港节点', '美国节点', '台湾节点', '日本节点', '新加坡节点'] },
    { name: '国内媒体', icon: '03CNSoft/bilibili.png', type: 'select', lists: ['DIRECT', '自动选择', '手动选择'] },
    { name: 'Apple', icon: '03CNSoft/apple.png', type: 'select', lists: ['DIRECT', '自动选择', '手动选择', '香港节点', '美国节点', '台湾节点', '日本节点', '新加坡节点'] },
    { name: 'Google', icon: '04ProxySoft/google.png', type: 'select', lists: ['自动选择', '手动选择', '香港节点', '美国节点'] },
    { name: 'Microsoft', icon: '03CNSoft/microsoft.png', type: 'select', lists: ['DIRECT', '自动选择', '手动选择', '香港节点', '美国节点'] },
    { name: 'GitHub', icon: '04ProxySoft/github.png', type: 'select', lists: ['自动选择', '手动选择', '香港节点', '美国节点'] }
  ]
  const FINAL_LISTS = ['自动选择', '手动选择', '香港节点', '台湾节点', '日本节点', '新加坡节点', '美国节点', 'DIRECT']

  // 业务域规则：规则集名 → 进哪个组（MetaCubeX geosite 类别，缺哪个删哪行）
  const CATEGORY_MAP = [
    ['国内媒体', ['bilibili', 'iqiyi', 'youku']],
    ['Apple', ['apple', 'icloud']],
    ['AI服务', ['category-ai-!cn']],
    ['加密货币', ['category-cryptocurrency']],
    ['国外媒体', ['netflix', 'youtube', 'disney', 'primevideo', 'hbo', 'tiktok', 'spotify']],
    ['Google', ['google']],
    // 注意：GitHub 必须排在 Microsoft 之前！v2fly 的 microsoft 大类包含 github（微软收购），
    // 若 microsoft 在前，github.com 会被吞进 Microsoft 组（默认直连）导致无法访问
    ['GitHub', ['github']],
    ['Microsoft', ['microsoft', 'bing']]
  ]
  const BLOCK_ADS = false // true 时启用广告/跟踪拦截（category-ads-all + tracker → REJECT），个别站点可能异常

  // 无条件直连的规则集（苹果/微软国内服务、国内 AI），排在业务组规则之前
  const DIRECT_SETS = ['apple-cn', 'icloud@cn', 'category-ai-cn', 'microsoft@cn']

  /* ---------------- 二、节点清洗与地区归类 ---------------- */
  // 订阅附带的“剩余流量／套餐到期／官网”等信息条目不是真节点，剔除
  const INFO_RE = /剩余|到期|重置|官网|套餐|流量|expire|traffic|电报|频道|群组/i
  const usable = config.proxies.filter((p) => p && p.name && !INFO_RE.test(p.name))
  if (usable.length === 0) {
    throw new Error('[Demo.js] 剔除信息条目后没有可用节点')
  }
  const proxyNames = usable.map((p) => p.name)
  const pools = REGION_DEFS.map((def) => ({ ...def, nodes: [] }))
  for (const n of proxyNames) {
    const pool = pools.find((p) => p.regex.test(n))
    if (pool) pool.nodes.push(n)
    // 未匹配任何地区的节点不建组，仅保留在手动选择里
  }
  const regionGroups = pools.filter((p) => p.nodes.length > 0)

  /* ---------------- 三、组 = 区域组 + 业务组 ---------------- */
  // 注意：mihomo 内核 proxy-groups.proxies 只接受字符串数组，不能放 {name} 内联对象

  const regionGroupDefs = regionGroups.map((p) => ({
    name: p.name,
    icon: ICON + p.icon,
    type: 'url-test',
    proxies: p.nodes,
    ...urlTest
  }))

  const autoList = regionGroups.map((p) => p.name)
  const manualList = regionGroups.map((p) => p.name).concat(proxyNames)

  const groups = []
  groups.push({ name: '自动选择', icon: ICON + '05icon/lightning.png', type: 'url-test', proxies: autoList, ...urlTest })
  groups.push({ name: '手动选择', icon: ICON + '05icon/rocket.png', type: 'select', proxies: manualList })

  for (const def of GROUPS_BUILD) {
    const candidates = []
    for (const item of def.lists) {
      if (item === 'DIRECT') { candidates.push('DIRECT'); continue }
      if (regionGroups.some((p) => p.name === item) || item === '自动选择' || item === '手动选择') {
        candidates.push(item)
      }
    }
    groups.push({ name: def.name, icon: ICON + def.icon, type: 'select', proxies: candidates })
  }

  groups.push({
    name: 'Final',
    icon: ICON + '05icon/quanqiu.png',
    type: 'select',
    proxies: FINAL_LISTS.filter((item) => {
      if (item === 'DIRECT' || item === '自动选择' || item === '手动选择') return true
      return regionGroups.some((p) => p.name === item)
    })
  })

  const orderedGroups = groups.concat(regionGroupDefs)

  /* ---------------- 四、规则与规则集 ---------------- */
  const providers = {}
  const rules = []

  const addRS = (ns) => {
    const key = 'geosite-' + ns
    providers[key] = {
      type: 'http',
      behavior: 'domain',
      format: 'mrs',
      url: RSET + 'geosite/' + ns + '.mrs',
      interval: 86400
    }
    return key
  }
  const addGeo = (ns) => {
    const key = 'geoip-' + ns
    providers[key] = {
      type: 'http',
      behavior: 'ipcidr',
      format: 'mrs',
      url: RSET + 'geoip/' + ns + '.mrs',
      interval: 86400
    }
    return key
  }

  rules.push('RULE-SET,' + addRS('private') + ',DIRECT')
  rules.push('RULE-SET,' + addGeo('private') + ',DIRECT,no-resolve')

  // 规则集/图标 CDN 与 Cloudflare 存储桶强制直连：
  // 1) jsdelivr 有国内 PoP，直连稳定且更快，规则集更新不再受节点拥塞影响
  // 2) r2.dev / cloudflare-r2.com 是 CF 对象存储公共域名，直连后下载速度不再受机场带宽/限流牵连
  rules.push('DOMAIN-SUFFIX,jsdelivr.net,DIRECT')
  rules.push('DOMAIN-SUFFIX,r2.dev,DIRECT')
  rules.push('DOMAIN-SUFFIX,cloudflare-r2.com,DIRECT')

  for (const ns of DIRECT_SETS) {
    rules.push('RULE-SET,' + addRS(ns) + ',DIRECT')
  }

  if (BLOCK_ADS) {
    rules.push('RULE-SET,' + addRS('category-ads-all') + ',REJECT')
    rules.push('RULE-SET,' + addRS('tracker') + ',REJECT')
  }

  for (const [group, nsList] of CATEGORY_MAP) {
    for (const ns of nsList) {
      rules.push('RULE-SET,' + addRS(ns) + ',' + group)
    }
  }

  rules.push('RULE-SET,' + addRS('cn') + ',DIRECT')
  rules.push('RULE-SET,' + addGeo('cn') + ',DIRECT,no-resolve')
  rules.push('MATCH,Final')

  /* ---------------- 五、DNS 与基础参数 ---------------- */
  const dns = {
    enable: true,
    ipv6: false,
    'enhanced-mode': 'fake-ip',
    'fake-ip-range': '198.18.0.1/16',
    'prefer-h3': false,
    nameserver: ['223.5.5.5', '119.29.29.29'], // 公共域名只用公共 DNS；由器 DNS 有广告劫持（解析到 127.0.0.1），不能混用
    'nameserver-policy': {
      '+.lan': 'system',
      '+.local': 'system',
      '+.localdomain': 'system',
      '+.home.arpa': 'system'
    }, // 仅局域网域名交给路由器解析
    fallback: ['https://dns.cloudflare.com/dns-query', 'https://dns.google/dns-query'],
    'fallback-filter': { geoip: true, 'geoip-code': 'CN' },
    'default-nameserver': ['223.5.5.5', '119.29.29.29'],
    'proxy-server-nameserver': ['223.5.5.5', '119.29.29.29', 'system'],
    'fake-ip-filter': [
      '*.lan', '*.local', '*.localhost', '*.localdomain', '*.home.arpa',
      '+.msftconnecttest.com', '+.msftncsi.com', '+.pool.ntp.org',
      'ntp.*.com', 'ntp1.*.com', 'ntp2.*.com', 'ntp3.*.com', 'ntp4.*.com',
      'time.*.com', 'time.*.gov', 'time.*.edu.cn', 'time.*.apple.com', 'time1.*.com',
      'time2.*.com', 'time3.*.com', 'time4.*.com', 'time5.*.com', 'time6.*.com', 'time7.*.com',
      'stun.*.*', 'stun.*.*.*', '*.stun.*.*', '*.stun.*.*.*',
      'swscan.apple.com', 'mesu.apple.com',
      '*.music.163.com', 'music.163.com', 'y.qq.com', '*.y.qq.com',
      '*.bilibili.com', 'api.bilibili.com', 'www.douyu.com', 'activityapi.huya.com',
      'localhost.ptlogin2.qq.com', 'Mijia Cloud', 'dig.io.mi.com'
    ],
    'respect-rules': true
  }

  /* ---------------- 六、域名嗅探（直连 IP 的应用也能精确命中规则） ---------------- */
  const sniffer = {
    enable: true,
    'force-dns-mapping': true,
    'parse-pure-ip': true,
    'override-destination': false, // 不改写目标，避免个别证书固定的应用异常
    sniff: {
      TLS: { ports: [443, 8443] },
      HTTP: { ports: [80, '8080-8880'] },
      QUIC: { ports: [443, 8443] }
    },
    'skip-domain': ['+.push.apple.com']
  }

  return Object.assign({}, config, {
    proxies: usable,
    'unified-delay': true, // 延迟显示去掉握手耗时，更真实
    'tcp-concurrent': true, // 同时尝试 IPv4／IPv6 连接节点，选快的用
    profile: { 'store-selected': true, 'store-fake-ip': true }, // 记住分组选择与 fake-ip 映射，重启不断连
    sniffer: sniffer,
    'proxy-groups': orderedGroups,
    rules: rules,
    'rule-providers': providers,
    dns: dns
  })
}
