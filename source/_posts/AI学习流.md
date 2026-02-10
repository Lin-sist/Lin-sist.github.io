#### **推荐流程：The "Active Reconstruction" Loop (主动重构环)**

**准备工作：** 左屏 IDEA（你的代码），右屏 VS Code（源码 + Copilot）。

1. **Step 1: 建立蓝图 (Blueprint) —— 使用 `Plan` 或 `Agent`**
    
    - **操作：** 在 VS Code Copilot 中提问：“针对‘订单支付’模块，请列出核心业务逻辑的执行步骤。”
        
    - **目的：** 脑子里先有流程图（1.校验 -> 2.调用微信 -> 3.改状态）。
        
2. **Step 2: 费曼审计 (Feynman Audit)**
    
    - **操作：** 你看完 AI 的回复后，立刻把对话框清空（或遮住），**口头**（或者在草稿纸上）说一遍逻辑。
        
    - **关键：** 必须说出**技术关键词**（例如：“这里要用 `@Transactional` 保证原子性”、“这里要用 Redis 的 `SETNX` 做锁”）。
        
3. **Step 3: 盲写与偷看 (The Peek-a-Boo Method) —— 核心优化点**
    
    - **动作：**
        
        - 在 IDEA 里把 Service 层的核心代码删掉。
            
        - **不要打开 VS Code 对照抄！** 尝试凭刚才的记忆去写。
            
        - **卡住了？** 允许打开 VS Code **看一眼（5秒钟）**，看懂那句调用的 API 是什么，然后**关掉/最小化 VS Code**，切回 IDEA 凭记忆补全。
            
    - **原理：** “看一眼 -> 关掉 -> 写” 这个短暂的记忆提取过程，是建立神经连接的关键。单纯的“左看右抄”没有这个过程。
        
4. **Step 4: 它是怎么跑起来的？ (Debug 视角)**
    
    - **操作：** 写完后，打一个断点，启动 Debug 模式跑一遍。看着变量在内存里怎么变，比写十遍代码都管用。

#### 实操步骤（Ubuntu 终端执行）

**1. 确认现状并创建“安全网”分支** 在项目根目录下打开终端：

Bash

```
# 1. 查看当前状态（如果有红色的修改文件，先不管）
git status

# 2. 创建并切换到一个新分支，命名为 ubuntu-study
git checkout -b ubuntu-study

# 3. 将当前 Ubuntu 环境下能跑的代码全部提交（这就是你的第一个存档点）
git add .
git commit -m "feat: init project in ubuntu environment"
```

_执行完这一步，你就拥有了第一个不可磨灭的存档点。_

**2. 学习过程中的“回溯”操作（后悔药）**

场景 A：**小搞砸**（刚写了几行代码，觉得写得太烂了，想回到刚打开文件时的样子）

Bash

```
# 丢弃工作区中某个文件的修改
git checkout -- src/main/java/com/sky/service/impl/OrderServiceImpl.java

# 或者丢弃当前目录下所有文件的修改（慎用，会全变回上一次 commit 的状态）
git checkout .
```

场景 B：**大搞砸**（删了很多文件，或者改乱了配置，项目跑不起来了，想回到今天早上刚 commit 完的状态）

Bash

```
# 强制重置到上一次 commit 的状态（核弹级后悔药）
git reset --hard HEAD
```

场景 C：**临时想切去做别的**（现在写的代码还没跑通，不想 commit，但想切回原来的分支看看）

Bash

```
# 把当前的烂摊子“暂存”起来（放入抽屉）
git stash

# 等你忙完了，再把烂摊子拿出来继续写
git stash pop
```

**3. 每天结束时的动作（推送到远程）** 虽然你在本地有了分支，最好也推送到 Github 上，防止虚拟机崩了。

Bash

```
# 第一次推送这个新分支
git push -u origin ubuntu-study
```

这样，你的 Github 仓库里就会多一个 `ubuntu-study` 分支。以后你在 Windows 上也不会受影响，在 Ubuntu 上可以随便造作。只要不执行 `git push`，所有的烂代码都只在你本地；就算 push 了，也只是在你的分支上，随时可以删掉分支重来。