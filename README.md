# Clash-Overwrite

个人使用的 Clash Party / Mihomo Party / FlClash 覆写脚本。

当前仓库包含：

```text
Clash-Overwrite
├── Demo.js
├── FlClash.js
└── README.md
```

其中：

```text
Demo.js
适用于 Clash Party / Mihomo Party

FlClash.js
适用于 FlClash
```

两份脚本使用基本一致的分流规则，但针对不同客户端采用不同的节点加载方式。

> 本仓库不提供任何节点、机场或订阅服务，仅用于个人学习、网络配置整理和 Mihomo 配置研究。

## 功能

主要功能包括：

```text
自动节点测速
地区自动分组
AI 服务分流
加密货币服务分流
国内外媒体分流
Apple 分流
Google 分流
Microsoft 分流
GitHub 分流
中国大陆直连
Fake-IP DNS
DNS fallback
Sniffer 域名嗅探
TCP Concurrent
规则集自动更新
```

使用的核心规则来源：

```text
MetaCubeX/meta-rules-dat
```

规则格式采用 Mihomo 支持的 MRS。

## Clash Party

使用：

```text
Demo.js
```

远程地址：

```text
https://raw.githubusercontent.com/ijmu/Clash-Overwrite/main/Demo.js
```

### 添加方法

进入：

```text
Clash Party
→ 覆写
→ 新建
→ 远程覆写
```

类型选择：

```text
JavaScript
```

填入：

```text
https://raw.githubusercontent.com/ijmu/Clash-Overwrite/main/Demo.js
```

保存并启用。

订阅更新后，脚本会重新生成 Mihomo 配置。

如果同时使用其他全局覆写脚本，可能产生策略组或规则冲突，建议只保留一套主要覆写。

## FlClash

使用：

```text
FlClash.js
```

远程地址：

```text
https://raw.githubusercontent.com/ijmu/Clash-Overwrite/main/FlClash.js
```

### 添加方法

进入 FlClash 的配置覆写或 Script 功能。

添加 JavaScript 脚本：

```text
https://raw.githubusercontent.com/ijmu/Clash-Overwrite/main/FlClash.js
```

然后将该脚本作为订阅配置的 Script Override 使用。

建议 FlClash 内：

```text
DNS 覆写：关闭

追加系统 DNS：关闭

IPv6：关闭

运行模式：Rule
```

DNS 由 `FlClash.js` 统一管理，避免客户端再次修改 DNS 配置。

## Clash Party 与 FlClash 的区别

### Clash Party

`Demo.js` 会读取订阅中已经展开的：

```text
config.proxies
```

然后自动分析节点名称并生成地区策略组。

适合 Clash Party / Mihomo Party 的覆写运行方式。

### FlClash

`FlClash.js` 优先使用 Mihomo 原生：

```text
include-all
filter
exclude-filter
```

自动读取：

```text
proxies
proxy-providers
```

因此机场后续增加或删除节点时，一般无需修改脚本。

## 策略组

默认生成：

| 策略组       | 类型       | 用途                                     |
| --------- | -------- | -------------------------------------- |
| 自动选择      | url-test | 从全部真实节点中自动选择延迟较优节点                     |
| 手动选择      | select   | 手动选择地区或具体节点                            |
| AI服务      | select   | OpenAI、Claude、Gemini、Grok、Perplexity 等 |
| 加密货币      | select   | Crypto / Exchange / Web3               |
| 国外媒体      | select   | YouTube、Netflix、Disney、HBO、Spotify 等   |
| 国内媒体      | select   | Bilibili、爱奇艺、优酷                        |
| Apple     | select   | Apple / iCloud                         |
| Google    | select   | Google 服务                              |
| Microsoft | select   | Microsoft / Bing                       |
| GitHub    | select   | GitHub                                 |
| Final     | select   | 未匹配流量最终出口                              |

地区组默认包括：

```text
香港节点
台湾节点
日本节点
新加坡节点
韩国节点
美国节点
```

地区通过节点名称自动识别。

## 自动测速

当前默认参数：

```yaml
interval: 300
timeout: 3000
tolerance: 150
lazy: true
max-failed-times: 2
```

含义：

```text
300 秒进行一次自动测速

测速超时 3000ms

节点延迟差距小于 150ms 时尽量保持当前节点

策略组实际使用时才执行测速

连续失败达到阈值后重新判断节点
```

该设置主要考虑：

```text
减少频繁节点切换
降低机场瞬时抖动影响
减少 Wi-Fi / 移动网络波动导致的断流
兼顾故障节点恢复速度
```

## 自动选择逻辑

新版自动选择直接测试真实节点。

结构：

```text
自动选择
    ↓
所有真实节点
```

地区组独立工作：

```text
香港节点
    ↓
香港真实节点

日本节点
    ↓
日本真实节点
```

这样避免：

```text
自动选择
→ 地区 url-test
→ 具体节点 url-test
```

形成双层测速。

## DNS

当前使用：

```text
Fake-IP
IPv6 关闭
国内公共 DNS
国外 DoH fallback
DNS respect-rules
proxy-server-nameserver
Fake-IP 持久化
ARC DNS Cache
```

默认国内 DNS：

```text
223.5.5.5
119.29.29.29
```

Fallback：

```text
Cloudflare DoH
Google DoH
```

机场节点域名解析使用：

```text
223.5.5.5
119.29.29.29
```

没有加入 `system`，尽量减少不同系统 DNS 环境导致的解析差异。

## DNS Fallback

开启：

```yaml
fallback-lazy-query: true
```

正常情况下优先使用主 DNS。

当解析结果满足 fallback 条件时，再使用境外 DoH。

主要目的：

```text
降低额外 DNS 请求
减少不同 DNS 同时返回造成的结果波动
降低移动网络下 DNS 请求开销
```

## Fake-IP

启用：

```yaml
enhanced-mode: fake-ip
```

Fake-IP 网段：

```text
198.18.0.1/16
```

并排除部分：

```text
局域网域名
NTP
STUN
Apple 特殊服务
部分国内影音服务
部分 IoT 服务
```

以提高兼容性。

## Sniffer

默认开启：

```text
TLS
HTTP
QUIC
```

用于从连接中识别真实域名，提高规则命中率。

同时使用较保守的：

```yaml
override-destination: false
```

降低部分：

```text
银行 App
游戏
证书固定 App
特殊网络程序
```

出现兼容性问题的概率。

## TCP Concurrent

开启：

```yaml
tcp-concurrent: true
```

当 DNS 返回多个 IP 时，Mihomo 可以并发尝试建立 TCP 连接，并优先使用较快建立成功的地址。

对部分 CDN 和多 IP 服务可以改善首连速度。

## 规则顺序

主要顺序：

```text
局域网
↓
规则 CDN
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

顺序会影响匹配结果，因此建议不要随意调整。

## AI 分流

境外 AI 使用：

```text
category-ai-!cn
```

主要覆盖：

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

具体覆盖范围取决于 MetaCubeX 上游规则。

国内 AI 使用：

```text
category-ai-cn
```

强制 DIRECT。

例如：

```text
DeepSeek
通义千问
Kimi
```

因此不会因为 AI 大类规则而全部走代理。

## AI 节点建议

AI 服务默认支持：

```text
自动选择
美国节点
新加坡节点
日本节点
手动选择
```

对于 ChatGPT、Claude、Gemini 等账号型服务，更建议长期固定一个质量稳定的出口节点。

频繁切换国家或出口 IP 可能影响登录状态或风控判断。

## 加密货币

使用：

```text
category-cryptocurrency
```

主要用于：

```text
交易所
行情网站
Crypto 服务
Web3 服务
```

默认可选择：

```text
自动选择
台湾
日本
新加坡
手动选择
```

具体域名覆盖范围由 MetaCubeX 上游规则维护。

## 国外媒体

目前包括：

```text
Netflix
YouTube
Disney+
Prime Video
HBO
TikTok
Spotify
```

可以根据实际解锁情况手动指定地区。

## 国内媒体

包括：

```text
Bilibili
爱奇艺
优酷
```

默认：

```text
DIRECT
```

## Apple

Apple 中国大陆相关服务优先 DIRECT。

其他 Apple / iCloud 服务进入：

```text
Apple
```

策略组。

默认同样优先：

```text
DIRECT
```

## Microsoft

Microsoft 中国大陆服务：

```text
microsoft@cn
```

强制 DIRECT。

其他 Microsoft / Bing 服务进入：

```text
Microsoft
```

策略组。

## GitHub

GitHub 使用独立策略组：

```text
GitHub
```

GitHub 规则放在 Microsoft 前面，避免部分域名被更大的 Microsoft 分类提前匹配。

## 中国大陆流量

最后使用：

```text
geosite-cn
geoip-cn
```

进行大陆流量直连。

未命中的流量进入：

```text
Final
```

## 广告拦截

Clash Party 脚本中预留：

```javascript
const BLOCK_ADS = false
```

默认关闭。

改为：

```javascript
const BLOCK_ADS = true
```

后可以启用：

```text
category-ads-all
tracker
```

广告和跟踪域名会被直接 REJECT。

开启后部分 App 或网站可能因为广告 SDK、统计 SDK 或登录依赖被拦截而出现异常，因此默认保持关闭。

## 自定义

### 修改地区

Clash Party：

```text
REGION_DEFS
```

FlClash：

修改地区：

```text
filter
```

对应正则。

### 修改测速

调整：

```text
interval
timeout
tolerance
lazy
max-failed-times
```

### 修改业务策略

修改：

```text
AI服务
加密货币
国外媒体
Apple
Google
Microsoft
GitHub
```

等策略组候选列表。

### 修改规则

规则来源：

```text
MetaCubeX/meta-rules-dat
```

可以根据需要添加或删除 Geosite / GeoIP 分类。

## 上游项目

规则：

[MetaCubeX/meta-rules-dat](https://github.com/MetaCubeX/meta-rules-dat)

图标：

[lige47/lige_icon](https://github.com/lige47/lige_icon)

Mihomo：

[MetaCubeX/mihomo](https://github.com/MetaCubeX/mihomo)

FlClash：

[chen08209/FlClash](https://github.com/chen08209/FlClash)

## 更新方式

如果你直接使用本仓库 Raw 地址：

```text
https://raw.githubusercontent.com/ijmu/Clash-Overwrite/main/Demo.js

https://raw.githubusercontent.com/ijmu/Clash-Overwrite/main/FlClash.js
```

以后只需要更新 GitHub 仓库里的脚本。

客户端重新更新远程覆写或订阅后即可获取新版。

因此正常情况下无需更换客户端中的 URL。

## 文件用途

```text
Demo.js
Clash Party / Mihomo Party

FlClash.js
FlClash

README.md
使用说明
```

建议不要把两个脚本混用。

## 免责声明

本仓库仅供个人学习、研究与配置整理使用，不提供任何节点、订阅链接或网络服务。

脚本按当前状态提供，不对正确性、可用性、兼容性或稳定性作任何明示或默示保证。

使用者自行添加的订阅、节点以及产生的网络行为，由使用者自行负责。

请遵守所在地适用的法律法规以及所使用服务的相关条款。

因使用本仓库产生的服务中断、账号限制、数据问题、网络异常、财产损失或其他直接及间接后果，由使用者自行承担。

下载、复制或使用本仓库内容，即代表使用者自行评估并接受相关风险。
