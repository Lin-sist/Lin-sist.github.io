---
title:
date:
tags: [一刷苍穹外卖]
---

## 1. 模块目标
实现员工登录和Token验证。

## 2. 技术要点
- Spring Boot + MyBatis
- JWT 实现登录状态保持
- 全局异常处理

## 3. 实现流程
1. 前端请求 /employee/login
2. Controller 调用 Service 处理逻辑
3. Service 查询数据库验证用户
4. 返回 JWT Token

## 4. 学到的知识
- 如何使用JWT
- Spring MVC 的数据流转过程