---
title: 关于Java连接MySQL数据库
date: 2025-06-25 19:01:01
tags: [Java,MySQL,JDBC]
categories: [项目记录]
cover: /img/jdbc2.png
---

# JDBC连接一般流程

1.**加载/注册驱动**（`DriverManager`负责）
2.**获取连接**（`DriverManager`的`getConnection`方法返回`Connection`对象）
3.**创建Statement/PrepareStatement**(`Connection`对象的方法)
4.**执行SQL语句**（`Statement`或`PreparedStatement`对象的方法）
5.**处理结果集**（如果SQL语句返回结果）
6.**关闭资源**（按照`ResultSet` -> `Statement` -> `Connection` 的顺序关闭，确保资源释放，通常在`finally`块完成）
7.**处理异常**（`SQLException`用于捕获和处理上述过程中可能出现的任何数据库相关的错误）

# 代码展示

    package com.linsist;

    import java.sql.*;

    public class MyTest {
      public static void main(String[] args) {
        String url = "jdbc:mysql://localhost:3306/test";
        String user = "root";
        String password = "123456";

        try (Connection conn = DriverManager.getConnection(url, user, password);
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery("SELECT * FROM mess")) {

            while (rs.next()) {
                String number = rs.getString("number");
                String name = rs.getString("name");
                Date birthday = rs.getDate("birthday");
                double height = rs.getDouble("height");

                System.out.println(number + " - " + name + " - " + birthday + " - " + height);
            }

            } catch (SQLException e) {
                e.printStackTrace();
            }
        }
    }

