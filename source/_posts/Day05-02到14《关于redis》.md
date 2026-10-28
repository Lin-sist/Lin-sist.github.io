---
title: "Redis 入门：数据类型与常用命令"
description: "从基础概念到命令索引，整理课程中的 Redis 入门内容。"
date: 2026-01-17
tags: [一刷苍穹外卖]

---

## 🎥 dayXX-XX 模块名称


### 📘 学到的知识
Redis存储的是key-value结构的数据，其中key是字符串类型，value有5钟常用数据类型。

**redis的数据类型**:
- 字符串String ，redis中最简单的数据类型
- 哈希 hash ，类似Java的HashMap结构
- 列表 list ，按照插入顺序排序，可以有重复元素，类似Java中的LinkedList
- 集合 set ， 无序集合，没有重复元素，类似Java中的HashSet
- 有序集合 sorted set / zest ， 集合中每个元素关联一个分数，根据分数升序排序，没有重复元素


**redis常用命令**

字符串类型：
- *SET key value*       *设置指定key的值*
- GET key             获取指定key的值
- SETEX key seconds value     设置key的值，并将key的过期时间设为seconds秒
- SETNX key value             只有在key不存在时设置key的值

哈希操作命令：（redis hash 是string类型的field和value的映射表）
- HSET key field value        将哈希表key中的字段field的值设为value
- HGET key field              获取存储在哈希表中指定字段的值
- HDEL key field              删除存储在哈希表中的指定字段
- HKEYS key                   获取哈希表中所有字段
- HVALS key                   获取哈希表中所有值

列表操作命令：（redis 列表是字符串列表，按照插入顺序排序）
- LPUSH key value1 [ value2 ]   将一个或多个值插入到列表头部
- LRANGE key start stop         获取列表指定范围内的元素
- RPOP key                      移除并获取列表最后一个元素
- LLEN key                      获取列表长度 

集合操作命令：（redis set是string类型的无序集合，集合成员唯一，不能出现重复数据）
- SADD key member1 [ member2 ]  向集合添加一个或多个成员 
- SMEMBERS key                  返回集合中的所有成员
- SCARD key                     获取集合的成员数
- SINTER key1 [ key2 ]          返回给定所有集合的交集
- SUNION key1 [ key2 ]          返回所有给定集合的并集
- SREM key member1 [ member2 ]  删除集合中一个或多个成员

有序集合操作命令： （redis有序集合是string类型元素的集合，不允许有重复成员，每个元素关联一个double类型分数）
- ZADD key score1 member1 [ score2 member2 ]    向有序集合添加一个或多个成员
- ZRANGE key start stop [ WITHSCORES ]          通过索引区间返回有序集合中指定区间内的成员 
- ZINCRBY key increment member                  有序集合中对指定成员的分数加上增量increment
- ZREM key member [ member… ]                   移除有序集合中的一个或多个成员

通用命令：（不分数据类型，都可以使用的命令）
- KEYS pattern            查找所有符合给定模式（pattern）的key
- EXISTS key              检查给定key是否存在
- TYPE key                返回key所储存的值的类型
- DEL key                 该命令用于在key存在时删除key

---

### 🏁 一句话复盘
> 数据类型：字符串，哈希，列表，集合，有序集合；
> SET,GET;  HSET,HGET;  LPUSH,LRANGE;  SADD,SCARD; ZADD,ZRANGE;

---

