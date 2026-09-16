# Clash-Overwrite

适用于 **Clash Party / Mihomo Party / FlClash** 的个人 Mihomo 覆写脚本。

当前提供两套配置：

```text
Clash-Overwrite/
├── ClashParty.js    # Clash Party / Mihomo Party
├── FlClash.js       # FlClash
└── README.md
```

两份脚本采用基本一致的分流规则，并针对 Clash Party 与 FlClash 的配置加载方式分别优化。

> 本仓库不提供任何节点、机场或订阅服务，仅用于个人学习、Mihomo 配置研究与网络配置整理。

## 功能

主要包含：

* 自动节点测速与选择
* 香港、台湾、日本、新加坡、韩国、美国自动分组
* AI 服务独立分流
* 加密货币 / Web3 独立分流
* 国内外流媒体分流
* Apple / Google / Microsoft / GitHub 独立分流
* 中国大陆流量直连
* Fake-IP DNS
* 国内 DNS + 国外 DoH Fallback
* DNS Respect Rules
* Sniffer 域名嗅探
* TCP Concurrent
* Fake-IP 持久化
* MetaCubeX MRS 规则集
* 规则集自动更新
* 自动过滤机场流量、到期时间等信息节点

---

# Clash Party

使用文件：

```text
ClashParty.js
```

远程地址：

```text
https://raw.githubusercontent.com/ijmu/Clash-Overwrite/main/ClashParty.js
```

## 添加方法

进入：

```text
Clash Party
→ 覆写
→ 新建
→ 类型：远程
→ 格式：JavaScript
```

填入：

```text
https://raw.githubusercontent.com/ijmu/Clash-Overwrite/main/ClashParty.js
```

保存并开启全局覆写。

订阅更新后，脚本会根据当前节点重新生成 Mihomo 配置。

> 如果同时启用其他全局覆写、订阅转换脚本或 DNS 覆写，可能出现策略组、规则或 DNS 相互覆盖的问题。

---

# FlClash

使用文件：

```text
FlClash.js
```

远程地址：

```text
https://raw.githubusercontent.com/ijmu/Clash-Overwrite/main/FlClash.js
```

## 添加方法

进入 FlClash 的 Script / Override 功能，将：

```text
https://raw.githubusercontent.com/ijmu/Clash-Overwrite/main/FlClash.js
```

作为 JavaScript 覆写脚本使用。

推荐客户端设置：

```text
DNS 覆写：关闭
追加系统 DNS：关闭
IPv6：关闭
运行模式：Rule
```

`FlClash.js` 已经完整配置 DNS，建议避免 FlClash 再次修改脚本生成的 DNS 配置。

---

# ClashParty.js 与 FlClash.js 的区别

## ClashParty.js

Clash Party 版本主要读取：

```javascript
config.proxies
```

脚本分析订阅展开后的具体节点名称，然后：

```text
读取节点
↓
过滤机场信息节点
↓
识别节点地区
↓
生成地区组
↓
生成业务策略组
↓
写入规则与 DNS
```

没有对应节点的地区组会自动隐藏。

## FlClash.js

FlClash 版本主要利用 Mihomo 原生：

```yaml
include-all: true
filter:
exclude-filter:
```

动态加载：

```text
proxies
proxy-providers
```

因此机场增加或删除节点后，Mihomo 可以自动将节点纳入对应策略组。

---

# 策略组

| 策略组       | 类型       | 用途                                      |
| --------- | -------- | --------------------------------------- |
| 自动选择      | url-test | 从所有真实节点直接选择延迟较优节点                       |
| 手动选择      | select   | 手动选择地区组或具体节点                            |
| AI服务      | select   | ChatGPT、Claude、Gemini、Grok、Perplexity 等 |
| 加密货币      | select   | Crypto、交易所、Web3 服务                      |
| 国外媒体      | select   | YouTube、Netflix、Disney+、HBO、Spotify 等   |
| 国内媒体      | select   | Bilibili、爱奇艺、优酷                         |
| Apple     | select   | Apple / iCloud                          |
| Google    | select   | Google 服务                               |
| Microsoft | select   | Microsoft / Bing                        |
| GitHub    | select   | GitHub                                  |
| Final     | select   | 未匹配流量最终出口                               |

地区组：

```text
香港节点
台湾节点
日本节点
新加坡节点
韩国节点
美国节点
```

节点根据名称中的国家、地区、缩写和 Emoji 自动识别。

---

# 自动选择

当前版本的 `自动选择` 直接测试所有真实节点：

```text
自动选择
    ↓
所有真实节点
```

地区策略组则独立工作：

```text
香港节点
    ↓
所有香港节点

日本节点
    ↓
所有日本节点

美国节点
    ↓
所有美国节点
```

因此不会形成：

```text
自动选择
↓
地区 url-test
↓
节点 url-test
```

这种双层自动测速结构。

---

# 自动测速参数

当前默认：

```yaml
url: https://www.gstatic.com/generate_204
expected-status: 204

interval: 300
timeout: 3000
tolerance: 150
lazy: true
max-failed-times: 2
```

参数说明：

| 参数               |    当前值 | 作用              |
| ---------------- | -----: | --------------- |
| interval         |   300s | 每 5 分钟测速        |
| timeout          | 3000ms | 单节点测速超时         |
| tolerance        |  150ms | 减少小幅延迟变化导致的节点切换 |
| lazy             |   true | 策略组实际使用时才执行周期测速 |
| max-failed-times |      2 | 减少单次网络抖动触发重选    |
| expected-status  |    204 | 检查测速服务器返回状态     |

这套参数主要平衡：

```text
节点速度
+
节点稳定性
+
故障恢复
+
减少频繁切换
```

---

# DNS

当前采用：

```text
Fake-IP
+
国内公共 DNS
+
国外 DoH Fallback
+
DNS Respect Rules
```

## 国内 DNS

```text
223.5.5.5
119.29.29.29
```

主要用于正常 DNS 查询以及机场节点域名解析。

## 国外 Fallback DNS

```text
Cloudflare DoH
Google DoH
```

用于满足 Fallback 条件的查询。

## 节点 DNS

`proxy-server-nameserver`：

```text
223.5.5.5
119.29.29.29
```

这里没有混入：

```text
system
```

用于减少不同操作系统、路由器或网络环境 DNS 不一致造成的解析波动。

---

# DNS Fallback

ClashParty.js 使用并行查询：

```yaml
fallback-lazy-query: false
```

主 DNS 与备用 DNS 同时查询，结果仍由 `fallback-filter` 决定。主 DNS 结果符合要求时即可返回；需要备用结果时可减少串行等待。未命中缓存时，备用 DNS 查询量会增加。

FlClash.js 保持延迟查询设置：

```yaml
fallback-lazy-query: true
```

它先检查主 DNS 结果，满足 Fallback 条件时才查询备用 DNS，境外查询量较少。

参数语义见 [Mihomo DNS 文档](https://wiki.metacubex.one/config/dns/#fallback-lazy-query)。

---

# Fake-IP

启用：

```yaml
enhanced-mode: fake-ip
```

Fake-IP 地址池：

```text
198.18.0.1/16
```

同时开启：

```yaml
store-fake-ip: true
```

用于保存 Fake-IP 映射，提高客户端重启后的连续性。

部分特殊服务会排除 Fake-IP，例如：

```text
LAN / Local
NTP
STUN
Apple 部分服务
Microsoft 网络检测
部分国内影音服务
部分 IoT 服务
```

---

# DNS Cache

启用：

```yaml
cache-algorithm: arc
```

用于 Mihomo DNS 缓存管理。

---

# Sniffer

默认开启：

```text
TLS
HTTP
QUIC
```

主要作用是从连接中识别域名，提高规则匹配能力。

当前使用：

```yaml
force-dns-mapping: true
parse-pure-ip: true
override-destination: false
```

`override-destination` 保持关闭，配置相对保守，可以减少部分特殊 App、游戏或证书固定应用的兼容性问题。

Apple Push：

```text
+.push.apple.com
```

默认跳过 Sniffer。

---

# TCP Concurrent

开启：

```yaml
tcp-concurrent: true
```

一个域名解析得到多个 IP 时，Mihomo 可以并发尝试建立 TCP 连接，并采用较快建立成功的地址。

对 CDN、多 IP 域名的首连速度可能有所改善。

同时开启：

```yaml
unified-delay: true
```

统一节点延迟计算方式。

---

# AI 服务

境外 AI 使用：

```text
category-ai-!cn
```

根据 MetaCubeX 上游规则自动覆盖相关 AI 服务，例如：

```text
OpenAI
ChatGPT
Claude
Gemini
Grok
Perplexity
Poe
HuggingFace
```

实际覆盖范围以 MetaCubeX 当前规则为准。

默认候选：

```text
自动选择
美国节点
新加坡节点
日本节点
手动选择
```

对于 ChatGPT、Claude、Gemini 等账号型服务，更推荐长期使用稳定的固定出口，减少国家和 IP 频繁变化。

---

# 国内 AI

使用：

```text
category-ai-cn
```

强制：

```text
DIRECT
```

主要用于中国大陆 AI 服务。

具体覆盖范围由 MetaCubeX 上游规则维护。

---

# 加密货币

使用：

```text
category-cryptocurrency
```

用于匹配：

```text
加密货币交易所
行情网站
Crypto 服务
Web3 服务
```

默认候选：

```text
自动选择
台湾节点
日本节点
新加坡节点
手动选择
```

具体覆盖范围取决于 MetaCubeX 上游规则。

---

# 国外媒体

独立分流：

```text
Netflix
YouTube
Disney+
Prime Video
HBO
TikTok
Spotify
```

默认可在：

```text
自动选择
香港
美国
台湾
日本
新加坡
手动选择
```

之间切换。

对于存在地区版权限制的服务，可以手动固定对应地区。

---

# 国内媒体

当前包括：

```text
Bilibili
爱奇艺
优酷
```

默认：

```text
DIRECT
```

也可以手动切换代理。

---

# Apple

中国大陆 Apple 相关规则优先：

```text
DIRECT
```

例如：

```text
apple-cn
icloud@cn
```

其他 Apple / iCloud 流量进入：

```text
Apple
```

策略组。

Apple 策略组默认优先 DIRECT。

---

# Google

Google 服务进入：

```text
Google
```

策略组。

YouTube 已提前进入：

```text
国外媒体
```

策略组。

---

# GitHub

GitHub 使用独立：

```text
GitHub
```

策略组。

GitHub 规则位于 Microsoft 规则之前，减少部分相关域名被 Microsoft 大类提前匹配的情况。

---

# Microsoft

中国大陆 Microsoft 服务：

```text
microsoft@cn
```

强制：

```text
DIRECT
```

其他：

```text
Microsoft
Bing
```

进入 `Microsoft` 策略组。

默认优先 DIRECT，也可以手动切换代理。

---

# 中国大陆流量

业务规则匹配完成后，使用：

```text
geosite-cn
geoip-cn
```

处理中国大陆流量。

默认：

```text
DIRECT
```

未匹配任何规则的连接最终进入：

```text
Final
```

---

# 规则顺序

当前主要匹配顺序：

```text
局域网
↓
规则/CDN
↓
Apple 中国大陆服务
↓
Microsoft 中国大陆服务
↓
中国大陆 AI
↓
国内媒体
↓
Apple
↓
AI 服务
↓
加密货币
↓
国外媒体
↓
Google
↓
GitHub
↓
Microsoft
↓
中国大陆
↓
Final
```

规则遵循从上到下匹配，因此顺序会影响最终分流结果。

---

# 机场信息节点过滤

脚本会过滤常见机场信息节点，例如名称中包含：

```text
剩余
流量
到期
重置
官网
套餐
电报
频道
群组
expire
traffic
```

防止这些伪节点进入：

```text
自动选择
地区测速
手动节点列表
```

---

# 广告拦截

`ClashParty.js` 预留：

```javascript
const BLOCK_ADS = false
```

默认关闭。

如果修改为：

```javascript
const BLOCK_ADS = true
```

则启用相关广告和 Tracker 拦截规则。

部分网站或 App 的广告 SDK、统计 SDK、登录流程可能依赖相关域名，因此默认关闭以优先保证兼容性。

---

# 自定义 ClashParty.js

主要修改区域：

```text
REGION_DEFS
GROUPS_BUILD
CATEGORY_MAP
DIRECT_SETS
urlTest
BLOCK_ADS
```

例如：

### 增加地区

修改：

```javascript
REGION_DEFS
```

### 修改业务组候选地区

修改：

```javascript
GROUPS_BUILD
```

### 修改分流规则

修改：

```javascript
CATEGORY_MAP
DIRECT_SETS
```

### 修改测速参数

修改：

```javascript
urlTest
```

---

# 自定义 FlClash.js

FlClash 版本主要可以修改：

```text
地区正则 filter
策略组 proxies
测速参数
DNS 参数
Rule Provider
业务分流规则
```

FlClash 通过：

```yaml
include-all: true
```

动态纳入订阅节点，因此通常不需要手动维护节点名称。

---

# Rule Provider

规则主要来自：

[MetaCubeX/meta-rules-dat](https://github.com/MetaCubeX/meta-rules-dat)

使用 Mihomo MRS 格式：

```yaml
format: mrs
```

默认更新周期：

```yaml
interval: 86400
```

即每天检查一次规则更新。

---

# 上游项目

规则集：

[MetaCubeX/meta-rules-dat](https://github.com/MetaCubeX/meta-rules-dat)

Mihomo：

[MetaCubeX/mihomo](https://github.com/MetaCubeX/mihomo)

FlClash：

[chen08209/FlClash](https://github.com/chen08209/FlClash)

图标：

[lige47/lige_icon](https://github.com/lige47/lige_icon)

---

# 更新

Clash Party：

```text
https://raw.githubusercontent.com/ijmu/Clash-Overwrite/main/ClashParty.js
```

FlClash：

```text
https://raw.githubusercontent.com/ijmu/Clash-Overwrite/main/FlClash.js
```

客户端使用以上 Raw 地址后，以后更新 GitHub 中对应脚本即可。

通常只需要：

```text
更新 GitHub 脚本
↓
客户端刷新远程覆写 / 订阅
↓
加载最新版
```

无需重新添加 Raw 地址。

---

# 文件说明

| 文件              | 客户端                        | 用途                   |
| --------------- | -------------------------- | -------------------- |
| `ClashParty.js` | Clash Party / Mihomo Party | Clash Party 专用 JS 覆写 |
| `FlClash.js`    | FlClash                    | FlClash 专用 JS 覆写     |
| `README.md`     | GitHub                     | 项目说明                 |

请根据客户端选择对应脚本，避免两个覆写同时使用。

---

# 免责声明

本仓库仅供个人学习、研究与配置整理使用，不提供任何节点、订阅链接或网络服务。

脚本按当前状态提供，不对正确性、可用性、兼容性或稳定性作任何明示或默示保证。

使用者自行添加的订阅、节点以及由此产生的网络行为，由使用者自行负责。

请遵守所在地适用的法律法规以及所使用网络服务、网站和平台的相关条款。

因使用本仓库产生的服务中断、账号限制、数据问题、网络异常、财产损失或其他直接及间接后果，由使用者自行承担。

下载、复制、修改或使用本仓库内容，即代表使用者已自行评估并接受相关风险。
