---
title: "Java 中 int 与 Integer 的区别：从一个 RAG 请求参数说起"
date: "2026-11-16T19:43:09+08:00"
tags: []
description: ''
---
# 1. int和Integer在Java中有什么区别？

## **基本数据类型 vs 包装类型**

定义： Java的基本数据类型直接表示对应类型的值，而包装类型是将基本类型对应的值封装在对象中的引用类型。

```Java
int a = 0;
Integer b = null;
```

| 对比         | `int` | `Integer`        |
| ---------- | ----- | ---------------- |
| 类型         | 基本类型  | 引用类型             |
| 可以为 `null` | 否     | 是                |
| 成员变量默认值    | `0`   | `null`           |
| 可用于泛型      | 否     | 是                |
| 拆箱风险       | 无     | 值为 `null` 时可能抛异常 |

总的来说，基本数据类型如int属于基本类型，而包装类型如Integer属于引用类型。
### 什么是引用类型？

[[Java类型.png]]

定义：引用类型是Java类型系统中的一大类型。引用类型的变量可以保存只想对象的引用，也可以保存null。

```Java
StringBuilder a = new StringBuilder("Hello");
StringBuilder b = a;

b.append(" World");

System.out.println(a); // Hello World
```

为什么修改 `b`，`a` 的输出也发生了变化？

因为 `a` **和** `b` **保存了指向同一个对象的引用**。调用 `b.append()` 修改了这个对象，所以通过 `a` 访问时也能看到修改后的内容。
这种情况通常叫作**多个变量引用同一个对象**。

## 什么是自动拆箱？

定义：自动拆箱是Java编译器将包装类自动转换为对应基本数据类型的机制。

```Java
Integer a = 10;
int b = a;          //代码完全合法
```

编译器会做如下转换：

```Java
Integer a = 10;
int b = a.intValue();          //intValue() 是 Integer类提供的方法，用来取得它所表示的 int 值。
```

### 看一个题目

```Java
Integer topK = null;

int result = topK;

System.out.println(result);
```

这个程序最后会**抛出NullPointerException**，原因是 `topK` 为 `null`，调用 `topK.intValue()` 就会触发空指针异常。

**编译阶段**：Java 允许从 `Integer` 到 `int` 的自动拆箱。
**运行阶段**：如果被拆箱的包装类型引用为 `null`，就会抛出 `NullPointerException`。

## 什么是自动装箱？

定义：自动装箱是将基本类型自动转换为对应包装类型的机制。

```Java
int a = 10;
Integer b = a;
```

编译器会自动完成以下操作：

```Java
Integer b = Integer.valueOf(a);
```

## 自动拆箱VS自动装箱

|转换方向|机制|示例|
|---|---|---|
|`int` → `Integer`|自动装箱|`Integer a = 10;`|
|`Integer` → `int`|自动拆箱|`int b = a;`|

# **回到 RAG 项目：为什么 topK 要关注 null？**

如果设计一个问答接口：

```java
record AskRequest(Integer topK) {}
```

在 JSON 请求体正确解析的前提下：

|用户提交|Java 中的值|业务处理|
|---|---|---|
|`{}`|`null`|使用默认值 5|
|`{"topK": null}`|`null`|使用默认值 5|
|`{"topK": 0}`|`0`|保留 0|
|`{"topK": 8}`|`8`|保留 8|

其中，最重要的区别就是：

`null` **代表没有可用的数值，**`0` **是一个明确的整数值。**

可以编写一个简单的方法：
```java
int resolveTopk(Integer topK) {
	int Default_TopK = 5;
	return topK != null ? topK : Default_TopK;
}
```

这里的三元运算中，若返回topk，这里实际上发生了自动拆箱，也就是将Integer转换成int，底层调用了intValue()方法，把代表的int数值拿出来了。

# 面试表达

如果提问：**Java 中自动装箱和拆箱是什么？有什么风险？**

> [!表达]
> Java的自动装箱和拆箱是基本数据类型与包装类型之间的自动转换机制，比如int转Integer是自动装箱，底层使用了Integer.valueOf()方法；Integer转int是自动拆箱，会调用intValue()。因为Integer包装类型允许为null，所以在自动拆箱场景下容易发送空指针异常，需要提前做非空验证。
