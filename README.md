# Clash-Overwrite

个人使用的 Clash Party / Mihomo Party 远程 JS 覆写脚本。

> 使用前请阅读文末**免责声明** — 本仓库不提供任何节点或订阅服务,仅供个人学习与配置整理使用。

## 使用方法

1. Clash Party → 覆写 → 新建 → 类型**远程**、格式 **JavaScript**
2. 地址填:

   ```
   https://raw.githubusercontent.com/ijmu/Clash-Overwrite/main/Demo.js
   ```

3. 保存后开启覆写开关(全局),订阅更新时会自动重新生成配置

> ⚠️ 如果同时使用其他全局覆写(如订阅转换脚本),请注意组会叠加冲突,建议二选一。

## 生成的组结构

| 组 | 类型 | 说明 |
|---|---|---|
| 自动选择 | url-test | 候选=各地区组,组内再自动选最快节点(300s 测速 / 100ms 容差 / lazy) |
| 手动选择 | select | 先地区组、后全部单节点(含未归类节点) |
| AI服务 | select | 候选:美国 → 新加坡 → 日本;分流:`category-ai-!cn` 聚合规则,自动覆盖 OpenAI / Claude / Gemini / Grok / Perplexity / HuggingFace 等全部境外 AI,上游每日更新 |
| 加密货币 | select | 候选:台湾 → 日本 → 新加坡;分流:category-cryptocurrency |
| 国外媒体 | select | 候选:香港 → 美国 → 台湾 → 日本 → 新加坡;分流:Netflix / YouTube / Disney / PrimeVideo / HBO / TikTok / Spotify |
| 国内媒体 | select | 默认 DIRECT(B站/爱奇艺/优酷直连),可切手动/自动 |
| Apple | select | 默认 DIRECT,可切各地区;分流:apple / icloud |
| Final | select | 兜底:自动 / 手动 / 各地区 / DIRECT,规则最后 MATCH 进它 |
| 地区分组 | url-test | 香港 / 台湾 / 日本 / 新加坡 / 韩国 / 美国,按节点名正则自动归类,空地区自动隐藏 |

规则顺序:局域网直连 → 苹果国内服务/国内 AI 直连 → 国内媒体 → Apple → AI服务 → 加密货币 → 国外媒体 → 中国大陆直连 → Final 兜底

国内 AI(DeepSeek、通义千问、Kimi 等)走 `category-ai-cn` 规则强制直连,不会被误分到 AI服务 组,不影响访问速度。

## 自定义

脚本顶部的可调区改几行即可:

- **加减地区**:改 `REGION_DEFS`(正则匹配节点名)
- **某组候选地区**:改 `GROUPS_BUILD` 里的 `lists`
- **规则覆盖面**:改 `CATEGORY_MAP`(进代理组)与 `DIRECT_SETS`(强制直连),规则集名见 [MetaCubeX/meta-rules-dat](https://github.com/MetaCubeX/meta-rules-dat/tree/meta/geo/geosite)
- **测速频率/容差**:改 `urlTest`

## 致谢

- 规则集:[MetaCubeX/meta-rules-dat](https://github.com/MetaCubeX/meta-rules-dat)
- 图标:[lige47/lige_icon](https://github.com/lige47/lige_icon)
- 分组结构参考:[powerfullz/override-rules](https://github.com/powerfullz/override-rules)

## 免责声明

本仓库仅供个人学习、研究与配置整理使用,不提供任何节点、订阅链接或网络服务,脚本本身不连接任何服务器。脚本按"现状"提供,作者不对其正确性、可用性或稳定性作任何明示或默示担保;使用本脚本时添加的订阅、节点及由此产生的全部网络行为由使用者本人负责,请遵守所在国家/地区的法律法规,一切直接或间接后果(包括但不限于服务中断、账号封禁、法律风险与财产损失)均由使用者自行承担,与仓库作者无关。下载、复制或使用本仓库任何内容,即视为已阅读并同意接受本声明全部条款;不同意请立即停止使用并删除相关内容。
