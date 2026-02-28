---
title: RAG前端开发Bug
tags: [RAG]
date: 
---

## 项目启动遇到报错：端口占用

```bash
Ran terminal command: netstat -ano | findstr ":8080" | findstr "LISTENING"
```

```bash
Ran terminal command: Get-Process -Id 12560 -ErrorAction SilentlyContinue | Select-Object Id, ProcessName, StartTime, @{N='CmdLine';E={(Get-CimInstance Win32_Process -Filter "ProcessId=$($_.Id)").CommandLine.Substring(0, [Math]::Min(200, (Get-CimInstance Win32_Process -Filter "ProcessId=$($_.Id)").CommandLine.Length))}} | Format-List
```

找到了！是之前用 `java -jar` 命令行启动的后端进程（PID 12560），还在后台跑着。你在 IDEA 里点"停止"只会关掉 IDEA 启动的那个实例，命令行启动的不受影响。 

```bash
Ran terminal command: Stop-Process -Id 12560 -Force; Start-Sleep -Seconds 2; $check = netstat -ano | findstr ":8080" | findstr "LISTENING"; if ($check) { Write-Host "端口仍被占用: $check" } else { Write-Host "端口 8080 已释放，可以启动了" }
```

端口已释放，现在可以正常启动了。

**原因**：之前我们排查 500 错误时，用命令行 `java -jar rag-admin-1.0.0-SNAPSHOT.jar` 在后台启动了一个 Java 进程（PID 12560，启动于 22:13:10）。你后来在 IDEA 里点"停止"，关的是 IDEA 管理的进程，但命令行那个进程不归 IDEA 管，一直在后台占着 8080 端口。

> 🍼 **类比**：你开了两个外卖 App 点了同一家店，取消了 App A 的订单，但 App B 的订单还在——它们是独立的。

**以后遇到端口占用，一行命令搞定**：
```powershell
# 查谁占了8080
netstat -ano | findstr ":8080" | findstr "LISTENING"
# 杀掉它（把PID换成实际的）
Stop-Process -Id <PID> -Force
```