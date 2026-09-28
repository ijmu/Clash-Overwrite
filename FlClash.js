/*
 * FlClash.js
 * FlClash / Mihomo 动态覆写 v3（2026-09-28）
 *
 * v3：AI 美国优先；手动组自动选择优先；移除共享 CDN 全域直连；
 * 新增 Wise / iFAST / Neverless / Speedtest 独立分流；精简 Fake-IP 排除。
 * 金融默认地区沿用个人 Egern 偏好，不代表服务商通用地区要求。
 * 已保存的策略选择优先于候选顺序，更新后请手动检查一次业务组。
 * 保留 DNS fallback、测速和 TCP 参数；测速延迟不代表吞吐或业务可用性。
 *
 * 保留 include-all 动态加载 proxies / proxy-providers。
 * FlClash：关闭客户端 DNS 覆写和追加系统 DNS，IPv6 关闭。
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
