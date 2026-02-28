---
title: Debug能力
tags: [工程能力]
date: 
---


## 一、Debug 的核心思维（架构师视角）

很多初学者的 Debug 方式是：**哪里报错改哪里，到处加断点碰运气**。这是错的。

资深工程师的 Debug 思路是一套**固定方法论**，任何 Bug 都按这个流程走：


### 先学会 Debug 基本操作（3 分钟）

在 VS Code 中调试 Java 程序，你只需要掌握 5 个按钮：
🔴 断点 (Breakpoint)     → 在代码行号左边点一下，出现红点
▶️  启动调试 (F5)         → 以 Debug 模式启动 Spring Boot
⏭️  步过 (F10 / Step Over)  → 执行当前行，跳到下一行（不进入方法内部）
⏬  步入 (F11 / Step Into)  → 进入当前行调用的方法内部
⏫  步出 (Shift+F11 / Step Out) → 从当前方法内部跳出来，回到调用处
▶️  继续 (F5 / Continue)   → 放行，直接跑到下一个断点

### 步骤一：读报错信息（80% 的 Bug 在这一步就能定位）

Java 报错会给你一个 **Exception Stack Trace（异常栈）**，从下往上读：

```
com.sky.exception.AccountNotFoundException: 账号不存在
    at com.sky.service.impl.EmployeeServiceImpl.login(EmployeeServiceImpl.java:39)
    at com.sky.controller.admin.EmployeeController.login(EmployeeController.java:44)
    at sun.reflect.NativeMethodAccessorImpl.invoke(...)
    at org.springframework.web.servlet.DispatcherServlet.doDispatch(...)
```

**从上往下看，找到第一个 `com.sky` 开头的行**——这就是**你的代码**出问题的具体位置。上面的例子告诉你：EmployeeServiceImpl.java 第 39 行。

### 步骤二：形成假设（不要急着打断点）

看到出错位置后，**先用脑子想**：
- 这行代码在做什么？
- 什么情况下它会报这个错？
- 数据是从哪里来的？是不是上游传错了？

比如看到 `NullPointerException at line 39`，你的假设应该是：**第 39 行的某个变量是 null，是谁传进来的？**

### 步骤三：打断点验证假设（最多 2-3 个）

断点不是越多越好。根据你的假设，在**关键数据产生的位置**打断点：

```
数据从哪来？ → 在数据源头打断点
数据在哪变的？ → 在中间处理逻辑打断点  
数据在哪出错？ → 在报错行的前一行打断点
```

**核心原则：断点打在"数据流转的关键节点"，不是随便打。**

### 步骤四：观察变量，验证 or 推翻假设

程序暂停后，**悬停看变量值**，回答三个问题：
1. 这个变量的值是我预期的吗？
2. 如果不是，它是在哪一步变错的？
3. 往上追溯，谁给它赋的值？

### 完整示意图

```
报错信息 → 定位到 com.sky.xxx 的具体行号
              ↓
         形成假设："可能是 xxx 变量为 null"
              ↓
         在数据源头打 1 个断点，在出错行前打 1 个断点
              ↓
         F5 启动 → 复现 Bug → 程序停在断点
              ↓
         悬停看变量 → 确认是 null
              ↓
         F10 步过 / F11 步入 → 追踪 null 的来源
              ↓
         找到根因 → 修复
```

### 一句话总结

> **Debug 的核心不是"打断点"，而是"形成假设再验证"。** 断点只是验证工具，假设才是灵魂。

这也是为什么实验一你觉得"没有特别深的感悟"——因为你是在**已知答案的情况下操作**，没有经历"猜测→验证"的过程。等你后续真的遇到一个未知 Bug，你就会体会到这套方法论的威力了。

---

## 二、Knife4j 是怎么来的？它怎么知道你的项目？

答案就在你当前打开的文件里。来看 WebMvcConfiguration.java 中的这段代码：

```java
@Bean
public Docket docket() {
    ApiInfo apiInfo = new ApiInfoBuilder()
            .title("苍穹外卖项目接口文档")
            .version("2.0")
            .description("苍穹外卖项目接口文档")
            .build();
    Docket docket = new Docket(DocumentationType.SWAGGER_2)
            .apiInfo(apiInfo)
            .select()
            .apis(RequestHandlerSelectors.basePackage("com.sky.controller"))
            //          ↑↑↑ 关键！扫描这个包下所有 Controller ↑↑↑
            .paths(PathSelectors.any())
            .build();
    return docket;
}
```

整个链路是这样的：

```
1. 项目 pom.xml 引入了 Knife4j 依赖（它是 Swagger 的增强 UI）

2. WebMvcConfiguration 中配置了 Docket Bean
   → 指定扫描 "com.sky.controller" 包

3. Spring 启动时，Knife4j 自动扫描这个包下的所有 Controller
   → 读取 @RestController、@PostMapping、@RequestBody 等注解
   → 自动生成接口文档

4. 访问 http://localhost:8080/doc.html 就能看到
```

**所以它"知道"你的项目，是因为你在配置类里告诉了它去扫描哪个包。** 它和 Postman/Apifox 的区别是：

| 工具 | 特点 |
|------|------|
| **Knife4j/Swagger** | 自动从代码注解生成文档，接口改了文档自动更新 |
| **Postman/Apifox** | 手动填写 URL、参数、请求体，需要自己维护 |

后续你给 Controller 方法加上 `@ApiOperation("新增员工")` 这种注解，Knife4j 页面上就会显示中文说明，非常方便。

---

