# 照护手记 Care Notes

**在没人能可靠记录的时候，仍然把“发生了什么”重建出来。**

[English](../README.md) · [架构](ARCHITECTURE.md) · [产品方向](PRODUCT_VISION.md) · [开发路线](ROADMAP.md) · [隐私模型](PRIVACY_MODEL.md)

Care Notes 是一个早期开源项目，面向家庭照护者：当被照护者无法、拒绝或不能可靠主动记录时，把家属观察和设备留下的碎片证据整理成**可追溯、可核对、保留冲突和未知的事件时间线**。

最需要被记录的时候，往往没人能够记录。现实中留下的可能只是几块碎片：一句家属记录、一段睡眠数据、夜间活动、门锁事件、摄像头事件编号、手机活动、离线的传感器，或者两位家属对同一件事互相矛盾的说法。

> **当前状态：** v0.3 正在开发。它不是临床验证产品，不负责诊断、治疗、药物决策或危机预测。

## 核心方向：Zero-input Episode Reconstruction

“Zero-input / 零主动记录”不是偷偷监控，也不是完全不需要人参与，而是：

**整个流程不能依赖患者在最难受、最混乱的那段时间里自己坚持填日记。**

目前 v0.3 开发版已经实现：

- 统一的 **Care Evidence Schema**，每条证据有稳定 ID、来源、时间和 provenance；
- 一套完整虚构的 7 天多来源家庭证据流；
- 用中位数 / MAD 做透明的个人基线；
- 只比较“这个人和平时相比有没有变化”，不直接套人口诊断阈值；
- **Care Evidence Graph**，包含 `same_episode`、`baseline_deviation`、`conflicts_with`、`uncertain_about` 等关系；
- 明确区分传感器离线、权限不可用、未同步、没有观察到事件；
- 多位家属冲突时保留双方说法，不自动判谁对；
- 推导结论必须绑定真实 evidence ID；
- 不匹配证据语义的结论会被确定性校验拒绝；
- Health Connect、Home Assistant、Frigate 元数据、家属观察的适配器接口；
- 中英文 **“发生了什么？”** 演示页面，可以从结论点回原始证据。

## 系统怎么工作

```text
家属记录 / Health Connect / Home Assistant / Frigate
                    ↓
              Evidence Adapters
                    ↓
             Care Evidence Schema
                    ↓
        个人基线 + Care Evidence Graph
                    ↓
         Episode Reconstruction Engine
                    ↓
             确定性校验
                    ↓
          家属可核对的时间线 / 复诊材料
```

一句话：

> **别人负责感知，Care Notes 负责理解“这些碎片可能属于哪一段变化”，同时把证据、冲突和不知道的地方都留下来。**

详细见 [ARCHITECTURE.md](ARCHITECTURE.md)、[EVIDENCE_SCHEMA.md](EVIDENCE_SCHEMA.md)、[DEVICE_INTEGRATIONS.md](DEVICE_INTEGRATIONS.md)。

## 有些话系统必须禁止自己乱说

| 真实证据 | 不能直接升级成 |
| --- | --- |
| 半夜手机有活动 | 失眠 |
| 药盒信号缺失 | 没吃药 |
| 厨房没有检测到运动 | 没吃饭 |
| 来回走动次数增加 | 躁狂发作 |
| 家属说“看起来情绪很低” | 抑郁症诊断 |

现在的重建引擎会检查：结论引用的 evidence ID 是否存在、结论类型和证据是否匹配、冲突和未知有没有被偷偷抹掉。

## 怎么运行演示

网页部分无需安装依赖：

```sh
python3 -m http.server 8000 --directory dist
```

然后打开：

- `http://localhost:8000/episode-demo.html`：v0.3 的 **“发生了什么？”** 7 天虚构重建演示；
- `http://localhost:8000/`：之前的本地照护笔记流程。

因为使用 ES modules，需要通过 HTTP 打开，不能简单双击 HTML 文件。

## 之前的照护笔记功能还保留着

v0.2 已经支持：

- 一整段话 → 自动拆成草稿 → 每条人工确认后保存；
- 保存原始段落和精确摘录位置；
- 不同说法手动关联、并排查看；
- 复诊摘要、文本导出、浏览器打印 PDF；
- 虚构示例和个人记录分离；
- 备份 / 恢复 / 更正历史；
- 中英文界面；
- 本地规则，不调用模型、不产生 API 费用。

长期产品形态已经确定：

> **Android App 是主要成品，网页是公开 Demo / 管理与展示界面，Evidence / Reconstruction Core 是底层开源技术。**

## 设备接入现在做到哪里

`dist/adapters.js` 已经有第一版适配器契约：

- Health Connect 睡眠区间 → `sleep_duration` 低层证据；
- Home Assistant 状态变化 → 家庭环境事件；
- Frigate review/event 元数据 → 房间活动证据，默认不上传连续原始视频；
- 家属记录 → 保留原话的人类观察证据；
- 数据源状态 → 明确记录 `sensor_offline`、`permission_unavailable`、`not_synced`、`no_event_observed`。

这代表**接口和数据规则已经开始实现**，不代表真实手机权限、Home Assistant 登录或 Frigate 连接已经完成。真正的 Android Health Connect 接入仍然是后续阶段。

## AI 不是聊天机器人中心

现有仓库里仍保留一个可选的 OpenAI 服务端适配器，但它和 Episode Reconstruction 核心分开。

长期方向是 Provider-independent / BYOK：OpenAI、Anthropic、Gemini、DeepSeek、OpenRouter/OpenAI-compatible 以及本地模型都可以成为后端候选。

AI 只能做“受约束的建议者”：

```text
已有 evidence IDs
      ↓
模型建议标签 / 关系 / 文字
      ↓
确定性校验
      ↓
家属确认
```

没有 evidence ID、制造事实、消除冲突或把弱信号升级成医学结论，都应该被拒绝或标记。

v0.3 的虚构重建 Demo 完全不需要付费 API。

## 测试状态

运行：

```sh
npm test
```

当前 v0.3 开发分支在 GitHub Actions 中 **49 项自动检查全部通过**。测试范围包括原来的记录/备份/AI 适配器保护，以及新增的 evidence adapter、个人基线、数据源缺口、Evidence Graph、Episode Reconstruction、家属冲突、错误 evidence ID、不符合语义的结论拒绝，以及静态移动端/无障碍保护。

这些测试只能证明软件契约行为，不证明临床正确性。现在还没有真实模型准确率、真实穿戴设备、真实摄像头或 Android 端到端验证结论。

## 隐私

默认方向是 local-first。摄像头接入优先使用 Frigate 这类本地系统产生的结构化事件元数据，不把连续原始视频作为默认上传路径，也不设计隐蔽监控功能。

当前旧版网页的个人记录仍存在浏览器 localStorage，没有应用层加密；v0.3 Episode Demo 使用的全部是虚构数据。真正 Android 版本的加密存储、权限和设备接入还没有完成。

详细见 [PRIVACY_MODEL.md](PRIVACY_MODEL.md)。

## 开源维护

维护者：Neil-Moonvale。许可证：MIT。

公开反馈请尽量使用虚构数据。项目不宣称全球首创、不宣称已经广泛使用，也不宣称有医疗效果。

后续开发继续通过 feature branch → Pull Request → GitHub Actions → review → merge → Release 进行。任何 OpenAI 开源支持申请都只使用真实代码、真实维护记录和真实外部反馈，不制造 Star、用户、Issue 或背书。
