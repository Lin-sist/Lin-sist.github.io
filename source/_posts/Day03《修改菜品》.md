---
title: Day03《》
tags:
  - 一刷苍穹外卖
date: 2025-12-02
---

## 🎥 day 03
[[Day03《修改菜品》]]

###🧩 本节概述
> **一句话总结**： 通过编写三个接口及相关方法，实现对菜品的添加上传和更新。

**主要内容关键词**：`阿里云OSS`

---

### 🧠 模块目标
- 菜品名称唯一
- 菜品必须属于某个分类下，不能单独存在
- 新增菜品可根据情况选择口味
- 每个菜品必须对应一张图片（测试时未成功，是否和阿里云OSS配置文件内容有关？）

---

- 根据类型查询分类接口（已完成）
- 文件上传接口
- 新增菜品接口

---

### 🔄 实现流程
1. 配置AliOSS文件上传需要的信息
2. 创建配置类OssConfiguration，用于创建AliOssUtil对象
3. 编写CommonController类中文件上传方法
4. 编写DishController类中菜品管理方法，创建DishService接口和DishServiceIml实现类
5. 编写并调用DishMapper的方法，需要先配置DishMapper.xml文件
6. 定义DishFlavorMapper接口，操作口味表数据，同样需配置xml文件


---

### 📘 学到的知识
- 阿里云OSS：
- 

---

### 🗂️ 关联文件
```
sky-server/src/main/java/com/sky/controller/admin/CommonController.java

sky-server/src/main/resources/application.yml

sky-common/src/main/java/com/sky/properties/AliOssProperties.java

sky-common/src/main/java/com/sky/utils/AliOssUtil.java

sky-server/src/main/java/com/sky/config/OssConfiguration.java

sky-server/src/main/java/com/sky/controller/admin/DishController.java

sky-server/src/main/java/com/sky/service/DishService.java

sky-server/src/main/java/com/sky/service/impl/DishServiceImpl.java

sky-server/src/main/java/com/sky/mapper/DishFlavorMapper.java

```

---

### 🏁 一句话复盘
> 

---

## 🎥 day 03

### 🧩 本节概述
> **一句话总结**：  

**主要内容关键词**：`类名1`、`类名2`、`技术点1`

---

### 🧠 模块目标
- 根据页码展示菜品信息
- 每页展示10条数据
- 分页查询时可根据需要输入菜品名称，菜品分类，菜品状态进行查询

**删除菜品**
- 可以一次删除一个菜品，也可以批量删除
- 起售中的菜品不能删除
- 被套餐关联的菜品不能删除
- 删除菜品后关联的口味数据也需要删除掉

---

### 🧰 关键技术 / 类
| 类型 | 名称 | 说明 |
|------|------|------|
| 控制层 | DishController |  |
| 业务层 | DishService, DishServiceImpl |  |
| 工具类 |  |  |
| 技术栈 |  |  |

---

### 🔄 实现流程
1. DishController -> DishService -> DishServiceImpl -> DishMapper依次编写方法
2. 三个表：dish, dish_flavor, setmeal_dish  
3. 

---

### 📘 学到的知识
- 
- 

---

### 🗂️ 关联文件
```
sky-server/src/main/java/com/sky/controller/admin/DishController.java

sky-server/src/main/java/com/sky/service/DishService.java

sky-server/src/main/java/com/sky/service/impl/DishServiceImpl.java

sky-server/src/main/resources/mapper/DishMapper.xml

sky-server/src/main/java/com/sky/mapper/SetmealDishMapper.java

sky-server/src/main/java/com/sky/service/impl/SetmealServiceImpl.java

```

---

### 🏁 一句话复盘
> 删除选中菜品，一次删一个，不能删除与套餐关联菜品，可以批量删除菜品及其相关口味信息。

---


## 🎥 dayXX-XX 模块名称

### 🧩 本节概述
> **一句话总结**：  

**主要内容关键词**：`类名1`、`类名2`、`技术点1`

---

### 🧠 模块目标
- 根据id查询菜品
- 根据类型查询分类（已实现）
- 文件上传（已实现）
- 修改菜品

---

### 🧰 关键技术 / 类
| 类型 | 名称 | 说明 |
|------|------|------|
| 控制层 |  |  |
| 业务层 |  |  |
| 工具类 |  |  |
| 技术栈 |  |  |

---

### 🔄 实现流程
1. 编写根据id查询菜品的接口，涉及controller层，service层，service的实现层，mapper层。
2. 编写修改菜品接口，需要操作“菜品表”和“口味表”，因为口味是关联菜品的，这里采"先统一删除口味，再根据当前菜品来重新设置口味。"
3. 修改DishMapper.xml的动态SQL
4. 

---

### 📘 学到的知识
- 
- 

---

### 🗂️ 关联文件
```
sky-server/src/main/java/com/sky/controller/admin/DishController.java

sky-pojo/src/main/java/com/sky/vo/DishVO.java

sky-server/src/main/java/com/sky/service/DishService.java

sky-server/src/main/java/com/sky/service/impl/DishServiceImpl.java

sky-server/src/main/java/com/sky/mapper/DishFlavorMapper.java

sky-server/src/main/java/com/sky/mapper/DishMapper.java

sky-server/src/main/resources/mapper/DishMapper.xml
```

---

### 🏁 一句话复盘
> 

---

