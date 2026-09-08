# Clash-Overwrite

个人使用的 Clash Party / Mihomo Party 远程 JS 覆写脚本。

> **使用前请阅读 [免责声明 (Disclaimer)](./DISCLAIMER.md)** — 本仓库不提供任何节点或订阅服务,仅供个人学习与配置整理使用。

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
| 手动选择 | select | 先地区组、后全部单节点 |
| AI服务 | select | 候选:美国 → 新加坡 → 日本;规则集:openai / anthropic / google-gemini |
| 加密货币 | select | 候选:台湾 → 日本 → 新加坡;规则集:category-cryptocurrency |
| 国内媒体 | select | 默认 DIRECT(B站/爱奇艺/优酷直连),可切手动/自动 |
| 国外媒体 | select | 候选:香港 → 美国 → 台湾 → 日本 → 新加坡;规则集:Netflix/YouTube/Disney/PrimeVideo/HBO/TikTok/Spotify |
| Final | select | 兜底:自动 / 手动 / 各地区 / DIRECT,规则最后 MATCH 进它 |
| 地区分组 | url-test | 香港 / 台湾 / 日本 / 新加坡 / 韩国 / 美国,按节点名正则归类;空地区自动隐藏,未匹配节点进「其他节点」 |

规则顺序:局域网 → 国内媒体 → AI → 加密货币 → 国外媒体 → 中国大陆直连 → Final 兜底

## 自定义

脚本顶部的可调区改几行即可:

- **加减地区**:改 `REGION_DEFS`(正则匹配节点名)
- **某组候选地区**:改 `GROUPS_BUILD` 里的 `lists`
- **规则覆盖面**:改 `CATEGORY_MAP` 对应的规则集列表
- **测速频率/容差**:改 `urlTest`

## 致谢

- 规则集:[MetaCubeX/meta-rules-dat](https://github.com/MetaCubeX/meta-rules-dat)
- 分组结构参考:[powerfullz/override-rules](https://github.com/powerfullz/override-rules)
- 图标:[Koolson/Qure](https://github.com/Koolson/Qure)

## License

仅供个人学习使用,详见[免责声明](./DISCLAIMER.md)。
