---
title: JWT登录认证复盘
tags: [苍穹外卖, JWT]
date: 2026-02-11
---

[[JWT登录认证]]

非常好！用费曼学习法来验证理解，说明你已经在认真消化知识了。我逐条给你纠正和补充：

---

## **✅ 你理解正确的部分**
整体职责划分方向是对的，但有一些**错误理解**和**关键遗漏**需要纠正。
1. 关于JwtProperties类，通过@ConfigurationProperties(prefix = "sky.jwt")注解，将application.yml的sky.jwt中的数据读取出来，这些数据在EmployeeController和UserController用于生成jwt令牌，在JwtTokenAdminInterceptor和JwtTokenUserInterceptor用于校验令牌;
2. 关于JwtUtil类，用于生成和解析校验jwt令牌，主要用到两个方法createJWT和parseJWT;
3. JwtClaimsConstant类，一个常量类，统一claims字段名EMP_ID="empId", USER_ID="userId"，与数据库字段对应;
4. BaseContext类，一个工具类，提供了一个ThreadLocal变量来存储当前线程的用户id；
5. EmployeeController类，在该模块主要用到login方法，用于管理员登录，UserController类也是一样，只不过是微笑小程序端登录；
6. WebMvcConfiguration类，一个注册类，注册拦截器，定义管理端和用户端的拦截器的路径配置；
7. JwtTokenAdminInterceptor类和JwtTokenUserInterceptor类，在用户登录后，如果用户操作调用的是controller层方法，都需要经过jwt令牌校验才可以后续操作。

---

## **❌ 逐条纠正与补充**

### **1. JwtProperties类 - 基本正确，但有重要遗漏**

**你的理解：**
> 通过@ConfigurationProperties(prefix = "sky.jwt")注解，将application.yml的sky.jwt中的数据读取出来，这些数据在EmployeeController和UserController用于生成jwt令牌，在JwtTokenAdminInterceptor和JwtTokenUserInterceptor用于校验令牌。

**纠正与补充：**
- ✅ 正确：通过`@ConfigurationProperties`绑定配置
- ⚠️ **遗漏**：还需要`@Component`注解才能被Spring容器管理，才能被`@Autowired`注入
- ⚠️ **遗漏**：具体包含**两套独立配置**（重要！）：
  - 管理端：`adminSecretKey`、`adminTtl`、`adminTokenName`
  - 用户端：`userSecretKey`、`userTtl`、`userTokenName`
- 💡 **关键点**：为什么要两套配置？**实现权限隔离**，管理员的token不能用于C端，反之亦然。

**标准回答模板：**
> JwtProperties通过`@Component`和`@ConfigurationProperties(prefix="sky.jwt")`从配置文件读取JWT相关参数，包含管理端和用户端两套独立配置（密钥、过期时间、Header名称），分别用于生成和校验对应端的JWT，实现权限隔离。

---

### **2. JwtUtil类 - 正确但太笼统**

**你的理解：**
> 用于生成和解析校验jwt令牌，主要用到两个方法createJWT和parseJWT。

**纠正与补充：**
- ✅ 正确：确实是生成和解析JWT
- ⚠️ **表述不准确**：parseJWT不仅是"解析"，更重要的是**验证签名和过期时间**
- ⚠️ **遗漏**：
  - `createJWT(secretKey, ttlMillis, claims)` 三个参数含义
    - `secretKey`：签名密钥
    - `ttlMillis`：过期时间（毫秒）
    - `claims`：自定义载荷（Map，包含用户信息）
  - 使用**HS256**签名算法
  - 返回的是一个Base64编码的字符串（header.payload.signature）
- ⚠️ **遗漏**：这是一个**静态工具类**，方法都是`static`

**标准回答模板：**
> JwtUtil是一个静态工具类，提供createJWT和parseJWT两个方法。createJWT使用HS256算法，根据密钥、过期时间和claims生成JWT字符串；parseJWT验证签名和过期时间，解析出claims返回，验证失败抛出异常。

---

### **3. JwtClaimsConstant类 - ❌ 有错误理解**

**你的理解：**
> 一个常量类，统一claims字段名EMP_ID="empId", USER_ID="userId"，与数据库字段对应。

**❌ 错误：**
- **与数据库字段对应** ← 这个说法是错的！
- 数据库员工表的主键字段是`id`，但JWT的claims中我们存的key是`"empId"`
- 这些常量是**JWT的payload字段名**，不是数据库字段名

**正确理解：**
- 这是一个常量类，定义JWT的claims中使用的**键名**
- 作用是**避免硬编码字符串**，提高代码可维护性
- 包含：`EMP_ID="empId"`、`USER_ID="userId"`、`PHONE`、`USERNAME`、`NAME`

**举例说明：**
```java
// 错误写法（硬编码）
claims.put("empId", employee.getId());  
Long empId = claims.get("empId");  // 如果拼写错误，编译期不报错

// 正确写法（使用常量）
claims.put(JwtClaimsConstant.EMP_ID, employee.getId());  
Long empId = claims.get(JwtClaimsConstant.EMP_ID);  // IDE可以自动提示，拼写错误编译期报错
```

**标准回答模板：**
> JwtClaimsConstant是一个常量类，统一定义JWT的claims中使用的键名，如EMP_ID、USER_ID等，避免硬编码字符串，提高代码可维护性和减少拼写错误。

---

### **4. BaseContext类 - 基本正确，但遗漏核心原理**

**你的理解：**
> 一个工具类，提供了一个ThreadLocal变量来存储当前线程的用户id。

**纠正与补充：**
- ✅ 正确：确实使用ThreadLocal存储用户ID
- ⚠️ **遗漏核心原理**：为什么要用ThreadLocal？
  - **线程隔离**：多个请求同时到达，每个请求在不同线程处理，ThreadLocal确保用户ID互不干扰
  - **跨层传递**：拦截器和Service不在同一个调用链，无法通过方法参数传递，ThreadLocal可以在同一线程内随时获取
- ⚠️ **遗漏方法**：提供三个方法
  - `setCurrentId(id)` - 拦截器中设置
  - `getCurrentId()` - Service/Mapper中获取
  - `removeCurrentId()` - **请求结束后清理（防止内存泄漏）**
- ⚠️ **刚修复的漏洞**：必须在拦截器的`afterCompletion`中调用`remove()`

**标准回答模板：**
> BaseContext是基于ThreadLocal的上下文工具类，用于在同一请求的不同处理层之间传递当前用户ID。拦截器解析JWT后调用setCurrentId写入，Service层调用getCurrentId获取，请求结束后必须调用removeCurrentId清理，防止线程池复用时的内存泄漏和数据串号。

---

### **5. EmployeeController和UserController - 正确但太简略**

**你的理解：**
> 在该模块主要用到login方法，用于管理员登录，UserController类也是一样，只不过是微信小程序端登录。

**纠正与补充：**
- ✅ 正确：确实是登录入口
- ⚠️ **遗漏完整流程**：
  1. 接收登录DTO（账号密码 / 微信code）
  2. 调用Service验证（employeeService.login / userService.wxLogin）
  3. 验证成功后，构建claims（`put("empId", id)`）
  4. 调用`JwtUtil.createJWT`生成token
  5. 构建VO对象（包含token字段）
  6. 返回给前端
- ⚠️ **关键差异**：
  - EmployeeController：传统账号密码登录
  - UserController：微信授权登录（需要调用微信API换取openid）

**标准回答模板：**
> EmployeeController和UserController是登录接口的入口，接收登录请求后调用Service验证身份，验证成功后生成包含用户ID的JWT并返回给前端。前者是管理端账号密码登录，后者是C端微信授权登录。

---

### **6. WebMvcConfiguration - 表述不够准确**

**你的理解：**
> 一个注册类，注册拦截器，定义管理端和用户端的拦截器的路径配置。

**纠正与补充：**
- ⚠️ **更准确的说法**：这是一个Spring MVC配置类（继承`WebMvcConfigurationSupport`）
- ⚠️ **遗漏关键方法**：`addInterceptors(InterceptorRegistry registry)`
- ⚠️ **遗漏路径规则**（面试必问！）：
  - 管理端：拦截`/admin/**`，**放行**`/admin/employee/login`
  - 用户端：拦截`/user/**`，**放行**`/user/user/login`和`/user/shop/status`
- 💡 **关键问题**：为什么要放行登录接口？
  - **因为登录时还没有token**，如果拦截会陷入死循环
  - 登录成功后才会生成token，后续请求才携带token

**标准回答模板：**
> WebMvcConfiguration是Spring MVC配置类，在addInterceptors方法中注册两个JWT拦截器，配置拦截路径和放行规则。管理端拦截/admin/**但放行登录接口，用户端拦截/user/**但放行登录和查询店铺状态接口。

---

### **7. JwtTokenAdminInterceptor和JwtTokenUserInterceptor - ❌ 理解有偏差**

**你的理解：**
> 在用户登录后，如果用户操作调用的是controller层方法，都需要经过jwt令牌校验才可以后续操作。

**❌ 错误理解：**
- **"在用户登录后"** ← 不准确！拦截器是**每次HTTP请求都执行**，不是只在登录后执行一次
- **"如果用户操作调用的是controller层方法"** ← 应该说"每次请求到达Controller之前"

**正确理解（核心流程）：**
```java
// 拦截器执行流程（每次请求都走这个流程）
1. 判断handler是否是Controller方法（instanceof HandlerMethod）
   - 不是 → 直接放行（静态资源等）
2. 从请求头读取token（header名称来自JwtProperties）
3. 调用JwtUtil.parseJWT(secretKey, token)验证
   - 验证签名
   - 检查过期时间
4. 解析出用户ID（empId 或 userId）
5. 写入BaseContext.setCurrentId(id)
6. 放行请求（return true）

// 如果验证失败
1. catch异常
2. response.setStatus(401)
3. 拦截请求（return false）

// 请求结束后（刚刚修复的）
1. afterCompletion中调用BaseContext.removeCurrentId()
2. 清理ThreadLocal，防止内存泄漏
```

**标准回答模板：**
> 拦截器在每次HTTP请求到达Controller之前执行，从请求头读取token并调用JwtUtil验证签名和过期时间，验证成功后解析出用户ID写入ThreadLocal，失败则返回401。请求结束后在afterCompletion中清理ThreadLocal防止内存泄漏。

---

## **🎯 费曼学习法检验结果**

**你的理解程度：70分**
- ✅ **优点**：抓住了每个类的核心职责，整体流程方向正确
- ❌ **问题**：
  1. 对**执行时机**理解不够（拦截器是每次请求都执行，不是登录后执行一次）
  2. 对**ThreadLocal原理**理解肤浅（为什么用？什么时候清理？）
  3. 对**JwtClaimsConstant**的作用理解错误（不是对应数据库字段）
  4. 遗漏了很多**关键细节**（放行路径、双套配置的意义等）

---

## **📝 完整串联（标准答案）**

让我给你一个完整的业务流程串联，你可以用这个来重新理解：

### **流程1：登录生成JWT**
```
前端发起登录请求 
→ WebMvcConfiguration放行/login接口（因为此时还没有token）
→ EmployeeController.login接收请求
→ 调用Service验证账号密码
→ 验证成功后，从JwtProperties读取secretKey和ttl
→ 构建claims（put("empId", id)，key名来自JwtClaimsConstant）
→ 调用JwtUtil.createJWT生成token
→ 封装到VO返回给前端
→ 前端保存token到localStorage
```

### **流程2：携带JWT访问受保护接口**
```
前端发起业务请求，Header携带token
→ WebMvcConfiguration拦截/admin/**
→ JwtTokenAdminInterceptor.preHandle()执行
→ 判断是否是Controller方法（是才继续，否则放行）
→ 从请求头读取token（header名称来自JwtProperties.adminTokenName）
→ 调用JwtUtil.parseJWT验证签名和过期时间
→ 验证成功，解析出empId（key名来自JwtClaimsConstant）
→ 调用BaseContext.setCurrentId写入ThreadLocal
→ 放行请求
→ Controller/Service通过BaseContext.getCurrentId()获取当前用户
→ 业务处理完成，返回响应
→ JwtTokenAdminInterceptor.afterCompletion()执行
→ 调用BaseContext.removeCurrentId()清理ThreadLocal
```

---

## **🔥 面试必问追问题（用来自测）**

你现在可以用这些问题来检验自己是否真正理解：

1. **为什么需要两套JWT配置（admin和user）？** <details><summary>答案</summary>实现权限隔离，管理员token不能访问C端接口，反之亦然。如果用同一套配置，管理员可以伪造用户端token。</details>

2. **为什么登录接口要放行？** <details><summary>答案</summary>因为登录时前端还没有token，如果拦截会导致永远无法登录。只有登录成功后才会生成token。</details>

3. **拦截器什么时候执行？是登录后执行一次，还是每次请求都执行？** <details><summary>答案</summary>每次HTTP请求都执行！不是登录后执行一次。每次请求都要验证token。</details>

4. **为什么要在afterCompletion中清理ThreadLocal？** <details><summary>答案</summary>防止内存泄漏和数据串号。Tomcat使用线程池，线程会被复用，如果不清理，下次请求可能读到上次请求的用户ID。</details>

5. **JwtClaimsConstant中的常量是对应数据库字段吗？** <details><summary>答案</summary>不是！是对应JWT的payload字段名。数据库字段是id，JWT的claims的key是empId。</details>

---

**你现在可以用自己的话，重新完整讲一遍JWT登录模块的流程，确保没有遗漏和错误理解。准备好了告诉我，我来检验！** 🎓