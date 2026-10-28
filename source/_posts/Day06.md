---
title: "HttpClient 与微信登录：课程笔记"
description: "记录 HTTP 请求的基本步骤，以及微信登录和菜品查询的学习线索。"
tags: [一刷苍穹外卖]
date: 2026-01-21
---

## 🎥 Day06-01到04 HttpClient入门概述

### 🧩 本节概述
> **一句话总结**：  

**主要内容关键词**："HttpClient"

---

### 🔄 实现流程
1. 创建HttpClient对象
2. 创建HTTP请求对象
3. 调用HttpClient的execute方法发送请求

---
 
### 📘 学到的知识
- HttpClient: 一个支持HTTP协议的客户端编程工具包

---
## 🎥 Day06-13到18 微信登录

### 🧠 模块目标
**小程序微信登录功能**
- 基于微信登录实现小程序的登录功能
- 如果用户是新用户则需要自动完成注册

> 接口
- 登录请求接口，POST；

---

### 🔄 报错
微信小程序编译后控制台显示登录失败，但status是200，问题是否在secret和appid上面？


---

## 🎥 Day06-19到20 导入商品浏览功能
**导入商品浏览功能**
- 有菜品分类列表
- 点击可以看到相应的菜品

> 接口
- 查询分类，GET;
- 根据分类id查询菜品,GET;
- 根据分类id查询套餐,GET;
- 根据套餐id查询包含的菜品,GET;

---


### 🗂️ 关联文件
```
sky-server/src/main/java/com/sky/controller/user/UserController.java
sky-server/src/main/java/com/sky/service/UserService.java
sky-pojo/src/main/java/com/sky/dto/UserLoginDTO.java
sky-pojo/src/main/java/com/sky/vo/UserLoginVO.java

```

---

### 🏁 一句话复盘
> 

---

