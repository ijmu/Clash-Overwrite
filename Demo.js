/*
 * demo.js —— 个人覆写模板(Clash Party / Mihomo Party 远程 JS 覆写)
 *
 * 用法:Clash Party → 覆写 → 新建 → 远程 → 填本文件的 GitHub raw 地址(raw.githubusercontent.com/.../demo.js)
 *      订阅自动更新/覆写更新时,每次生成配置都会执行本脚本
 *
 * 组结构(按需求):
 *   1. 自动选择  url-test 自动测速(选最快地区组 → 地区组内再选最快节点)
 *   2. 手动选择  select   手动挑节点(先地区组、后单节点)
 *   3. AI服务    select   候选:美国 / 新加坡 / 日本 地区组
 *   4. 加密货币  select   候选:台湾 / 日本 / 新加坡 地区组
 *   5. 国内媒体  select   默认 DIRECT(可切手动/自动),国内视频站走它 = 直连
 *   6. 国外媒体  select   候选:香港 / 美国 / 台湾 / 日本 / 新加坡 地区组
 *   7. Final     select   兜底:自动/手动/各地区/DIRECT,规则最后 MATCH 进它
 *   8. 地区分组  香港/台湾/日本/新加坡/韩国/美国节点(自动按订阅节点名正则归类,
 *               空地区自动隐藏,剩下的进「其他节点」)
 *
 * 规则顺序:私网/局域网 → 国内媒体 → AI → 加密货币 → 国外媒体 → 中国大陆直连 → 兜底 Final
 *
 * 想改哪里:
 *   - 加减地区 → 改 REGION_DEFS
 *   - 某组的候选节点地区 → 改 GROUPS_BUILD 里对应 lists
 *   - AI/加密货币/国外媒体覆盖面 → 改 CATEGORY_MAP 对应 RULE-SET 列表
 *   - 测速频率 → 改 urlTest 字段
 */
function main(config) {
  if (!config || typeof config !== 'object') return config
  if (!Array.isArray(config.proxies) || config.proxies.length === 0) {
    throw new Error('[demo.js] 配置中缺少有效的 proxies 字段')
  }

  const ICON = 'https://cdn.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/'
  const RSET = 'https://cdn.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/'

  /* ---------------- 一、可调参数 ---------------- */
  const urlTest = {
    url: 'https://cp.cloudflare.com',
    interval: 300, // 秒;300 = 每5分钟测一次,别学模板的 60(每分钟测=频繁切节点=断流)
    tolerance: 100, // 毫秒;延迟差 <100ms 不切换
    lazy: true // 只在组被真正使用时测速
  }

  // 地区识别正则(按数组顺序匹配,先命中先归类)
  const REGION_DEFS = [
    { name: '香港节点', icon: 'Hong_Kong', regex: /香港|Hong ?Kong|\bHK\b|🇭🇰/i },
    { name: '台湾节点', icon: 'Taiwan', regex: /台湾|臺灣|Taiwan|\bTW\b|🇹🇼/i },
    { name: '日本节点', icon: 'Japan', regex: /日本|东京|大阪|Japan|\bJP\b|🇯🇵/i },
    { name: '新加坡节点', icon: 'Singapore', regex: /新加坡|狮城|獅城|Singapore|\bSG\b|🇸🇬/i },
    { name: '韩国节点', icon: 'Korea', regex: /韩国|韓國|首尔|Korea|\bKR\b|🇰🇷/i },
    { name: '美国节点', icon: 'United_States', regex: /美国|美國|洛杉矶|圣何塞|西雅图|凤凰城|United ?States|America|\bUS\b|\bUSA\b|🇺🇸/i }
  ]

  // 业务组候选(只填想放进去的地区组名;地区不存在时自动剔除)
  const GROUPS_BUILD = [
    { name: 'AI服务', icon: 'Artificial_Intelligence', type: 'select', lists: ['美国节点', '新加坡节点', '日本节点'] },
    { name: '加密货币', icon: 'Cryptocurrency', type: 'select', lists: ['台湾节点', '日本节点', '新加坡节点'] },
    { name: '国外媒体', icon: 'Media', type: 'select', lists: ['香港节点', '美国节点', '台湾节点', '日本节点', '新加坡节点'] },
    { name: '国内媒体', icon: 'Media_CN', type: 'select', lists: ['DIRECT', '手动选择', '自动选择'] }
  ]
  const FINAL_LISTS = ['自动选择', '手动选择', '香港节点', '台湾节点', '日本节点', '新加坡节点', '美国节点', 'DIRECT']

  // 业务域规则:规则集名 → 进哪个组(规则集取 MetaCubeX geosite,缺哪个删哪行即可)
  const CATEGORY_MAP = [
    ['国内媒体', ['bilibili', 'iqiyi', 'youku']],
    ['AI服务', ['openai', 'anthropic', 'google-gemini']],
    ['加密货币', ['category-cryptocurrency']],
    ['国外媒体', ['netflix', 'youtube', 'disney', 'primevideo', 'hbo', 'tiktok', 'spotify']]
  ]

  /* ---------------- 二、节点清洗与地区归类 ---------------- */
  // 订阅附带的"剩余流量/套餐到期/官网"等信息条目不是真节点,剔除
  const INFO_RE = /剩余|到期|重置|官网|套餐|流量|expire|traffic|电报|频道|群组/i
  const usable = config.proxies.filter((p) => p && p.name && !INFO_RE.test(p.name))
  if (usable.length === 0) {
    throw new Error('[demo.js] 剔除信息条目后没有可用节点')
  }
  const proxyNames = usable.map((p) => p.name)
  const pools = REGION_DEFS.map((def) => ({ ...def, nodes: [] }))
  const leftovers = [] // 所有地区都匹配不上的节点
  for (const n of proxyNames) {
    const pool = pools.find((p) => p.regex.test(n))
    if (pool) pool.nodes.push(n)
    else leftovers.push(n)
  }

  const regionGroups = pools.filter((p) => p.nodes.length > 0)
  const hasOther = leftovers.length > 0

  /* ---------------- 三、组 = 区域组 + 业务组 ---------------- */
  const nodeIcon = (n) => ({ name: n, icon: ICON + 'Star.png' }) // 单节点图标统一占位

  const regionGroupDefs = regionGroups.map((p) => ({
    name: p.name,
    icon: ICON + p.icon + '.png',
    type: 'url-test',
    proxies: p.nodes,
    ...urlTest
  }))
  const otherDef = hasOther
    ? { name: '其他节点', icon: ICON + 'Global.png', type: 'url-test', proxies: leftovers, ...urlTest }
    : null

  const autoList = regionGroups.map((p) => p.name).concat(hasOther ? ['其他节点'] : [])
  const manualList = regionGroups
    .map((p) => p.name)
    .concat(hasOther ? ['其他节点'] : [])
    .concat(proxyNames.map((n) => ({ name: n })))

  const groups = []
  groups.push({ name: '自动选择', icon: ICON + 'Auto.png', type: 'url-test', proxies: autoList, ...urlTest })
  groups.push({ name: '手动选择', icon: ICON + 'Select.png', type: 'select', proxies: manualList })

  for (const def of GROUPS_BUILD) {
    const candidates = []
    for (const item of def.lists) {
      if (item === 'DIRECT') { candidates.push('DIRECT'); continue }
      const exists =
        regionGroups.some((p) => p.name === item) || (hasOther && item === '其他节点') || item === '自动选择' || item === '手动选择'
      if (exists) candidates.push(item)
    }
    groups.push({ name: def.name, icon: ICON + def.icon + '.png', type: 'select', proxies: candidates })
  }

  groups.push({ name: 'Final', icon: ICON + 'Global.png', type: 'select', proxies: FINAL_LISTS.filter((item) => {
    if (item === 'DIRECT' || item === '自动选择' || item === '手动选择') return true
    return regionGroups.some((p) => p.name === item)
  }) })

  // 区域组放最后渲染时跟随最后(顺序不影响,放业务组前更直观)
  const orderedGroups = groups.concat(regionGroupDefs).concat(otherDef ? [otherDef] : [])

  /* ---------------- 四、规则与规则集 ---------------- */
  const providers = {}
  const rules = []

  const addRS = (ns, kind, behavior) => {
    const url = RSET + kind + '/' + ns + '.mrs'
    providers['geosite-' + ns] = {
      type: 'http',
      behavior: behavior, // domain
      format: 'mrs',
      url: url,
      interval: 86400
    }
    return 'geosite-' + ns
  }
  const addGeo = (ns) => {
    providers['geoip-' + ns] = {
      type: 'http',
      behavior: 'ipcidr',
      format: 'mrs',
      url: RSET + 'geoip/' + ns + '.mrs',
      interval: 86400
    }
    return 'geoip-' + ns
  }

  rules.push('RULE-SET,' + addRS('private', 'geosite', 'domain') + ',DIRECT')
  rules.push('RULE-SET,' + addGeo('private') + ',DIRECT,no-resolve')

  for (const [group, nsList] of CATEGORY_MAP) {
    for (const ns of nsList) {
      rules.push('RULE-SET,' + addRS(ns, 'geosite', 'domain') + ',' + group)
    }
  }

  rules.push('RULE-SET,' + addRS('cn', 'geosite', 'domain') + ',DIRECT')
  rules.push('RULE-SET,' + addGeo('cn') + ',DIRECT,no-resolve')
  rules.push('MATCH,Final')

  /* ---------------- 五、DNS(沿用此前验证过的稳定配置) ---------------- */
  const dns = {
    enable: true,
    ipv6: false,
    'enhanced-mode': 'fake-ip',
    'fake-ip-range': '198.18.0.1/16',
    'prefer-h3': false,
    nameserver: ['223.5.5.5', '119.29.29.29', 'system'],
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

  return Object.assign({}, config, {
    proxies: usable,
    'proxy-groups': orderedGroups,
    rules: rules,
    'rule-providers': providers,
    dns: dns
  })
}
