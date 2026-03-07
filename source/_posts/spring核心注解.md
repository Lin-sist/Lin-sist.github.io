---
title: 《苍穹外卖》概述
tags: [苍穹外卖, spring]
date:
---
我们采用"三段式"学习法：**注解说明 → 项目实例 → 面试追问**。

[[《苍穹外卖》概述]]

---

# 🎯 第一部分：Spring 核心注解全解析

## 一、组件注册类注解（告诉Spring"这是我的Bean"）

### 1️⃣ `@Component` - 通用组件

**作用：** 标记一个类为Spring管理的Bean（组件）

**项目出处：**
- JwtTokenAdminInterceptor.java
- AutoFillAspect.java
- OrderTask.java

```java
@Component  // 注册为Spring Bean
@Slf4j
public class JwtTokenAdminInterceptor implements HandlerInterceptor {
    // 拦截器代码...
}
```

---

### 2️⃣ `@Service` - 业务层组件

**作用：** 标记业务层类，本质上等同于`@Component`，但语义更明确

**项目出处：** EmployeeServiceImpl.java

```java
@Service  // 标记为业务层Bean
public class EmployeeServiceImpl implements EmployeeService {
    // 业务逻辑...
}
```

---

### 3️⃣ `@Controller` / `@RestController` - 控制层组件

**区别：**
- `@Controller`：用于返回视图（HTML页面）
- `@RestController` = `@Controller` + `@ResponseBody`，返回JSON数据

**项目出处：** EmployeeController.java

```java
@RestController  // = @Controller + @ResponseBody
@RequestMapping("/admin/employee")
@Slf4j
@Api(tags = "员工相关接口")
public class EmployeeController {
    // Controller方法会自动把返回值转为JSON
}
```

---

### 4️⃣ `@Mapper` - MyBatis Mapper接口

**作用：** 标记MyBatis的Mapper接口，Spring会为它创建代理对象

**项目出处：** EmployeeMapper.java

```java
@Mapper  // MyBatis会为这个接口生成实现类
public interface EmployeeMapper {
    Employee getByUsername(@Param("username") String username);
}
```

---

### 5️⃣ `@Configuration` - 配置类

**作用：** 标记配置类，替代XML配置文件

**项目出处：** WebMvcConfiguration.java

```java
@Configuration  // 这是一个配置类
@Slf4j
public class WebMvcConfiguration extends WebMvcConfigurationSupport {
    // 配置Bean...
}
```

---

## 二、依赖注入类注解（告诉Spring"我需要这个Bean"）

### 6️⃣ `@Autowired` - 自动装配（最常用！）

**作用：** 自动注入依赖的Bean，可以标注在字段、构造器、setter方法上

**注入方式：** 默认按**类型（byType）**匹配

**项目出处：** EmployeeController.java

```java
public class EmployeeController {
    
    @Autowired  // Spring自动注入EmployeeService的实例
    private EmployeeService employeeService;
    
    @Autowired
    private JwtProperties jwtProperties;
}
```

---

### 7️⃣ `@Value` - 注入配置值

**作用：** 从配置文件（application.yml）中读取值

**项目出处：** OrderServiceImpl.java

```java
@Value("${sky.shop.address}")  // 读取配置文件中的值
private String shopAddress;

@Value("${sky.baidu.ak}")
private String ak;
```

对应的配置文件：
```yaml
sky:
  shop:
    address: "北京市海淀区xxx"
  baidu:
    ak: "your-api-key"
```

---

## 三、请求映射类注解（告诉Spring"什么请求找我"）

### 8️⃣ `@RequestMapping` - 通用请求映射

**作用：** 定义请求路径，可用于类和方法上

**项目出处：** EmployeeController.java

```java
@RestController
@RequestMapping("/admin/employee")  // 类级别路径
public class EmployeeController {
    
    @RequestMapping("/test")  // 方法级别路径
    public Result test() {
        // 完整路径：/admin/employee/test
    }
}
```

---

### 9️⃣ `@GetMapping` / `@PostMapping` / `@PutMapping` / `@DeleteMapping`

**作用：** `@RequestMapping` 的快捷方式，限定HTTP方法

| 注解 | HTTP方法 | 用途 | 项目出处 |
|------|----------|------|----------|
| `@GetMapping` | GET | 查询数据 | EmployeeController.java |
| `@PostMapping` | POST | 新增数据 | EmployeeController.java |
| `@PutMapping` | PUT | 修改数据 | EmployeeController.java |
| `@DeleteMapping` | DELETE | 删除数据 | （其他Controller中） |

```java
@PostMapping("/login")  // POST请求，路径 /admin/employee/login
public Result<EmployeeLoginVO> login(@RequestBody EmployeeLoginDTO dto) {
    // ...
}

@GetMapping("/page")  // GET请求，路径 /admin/employee/page
public Result<PageResult> page(EmployeePageQueryDTO dto) {
    // ...
}
```

---

## 四、参数绑定类注解（告诉Spring"参数怎么来"）

### 🔟 `@RequestBody` - 接收JSON请求体

**作用：** 把HTTP请求体中的JSON数据转换为Java对象

**项目出处：** EmployeeController.java

```java
@PostMapping("/login")
public Result<EmployeeLoginVO> login(@RequestBody EmployeeLoginDTO dto) {
    // 前端发送JSON: {"username":"admin","password":"123456"}
    // Spring自动转为 EmployeeLoginDTO 对象
}
```

**请求示例：**
```http
POST /admin/employee/login
Content-Type: application/json

{
  "username": "admin",
  "password": "123456"
}
```

---

### 1️⃣1️⃣ `@PathVariable` - 接收路径参数

**作用：** 获取URL路径中的动态参数

**项目出处：** EmployeeController.java

```java
@PostMapping("/status/{status}")
public Result startOrStop(@PathVariable Integer status, Long id) {
    // 请求：POST /admin/employee/status/1
    // status = 1
}

@GetMapping("/{id}")
public Result<Employee> getById(@PathVariable Long id) {
    // 请求：GET /admin/employee/10
    // id = 10
}
```

---

### 1️⃣2️⃣ `@RequestParam` - 接收URL参数（查询参数）

**作用：** 获取URL中的查询参数（?key=value）

```java
@GetMapping("/search")
public Result search(@RequestParam String keyword, 
                     @RequestParam(required = false, defaultValue = "1") Integer page) {
    // 请求：GET /search?keyword=admin&page=2
    // keyword = "admin", page = 2
}
```

**和不加注解的区别：** Spring会自动把参数名匹配到对象属性（如项目中的`page`方法）

```java
@GetMapping("/page")
public Result<PageResult> page(EmployeePageQueryDTO dto) {
    // 请求：GET /page?name=张三&page=1&pageSize=10
    // Spring自动把参数封装到 dto 对象中
}
```

---

## 五、配置类相关注解

### 1️⃣3️⃣ `@Bean` - 声明Bean

**作用：** 在`@Configuration`类中声明一个Bean，返回值会被Spring管理

**项目出处：** WebMvcConfiguration.java

```java
@Configuration
public class WebMvcConfiguration {
    
    @Bean  // 把Docket对象注册到Spring容器
    public Docket docket() {
        ApiInfo apiInfo = new ApiInfoBuilder()
                .title("苍穹外卖项目接口文档")
                .version("2.0")
                .build();
        return new Docket(DocumentationType.SWAGGER_2)
                .apiInfo(apiInfo)
                .select()
                .apis(RequestHandlerSelectors.basePackage("com.sky.controller"))
                .paths(PathSelectors.any())
                .build();
    }
}
```

---

### 1️⃣4️⃣ `@ConfigurationProperties` - 批量注入配置

**作用：** 把配置文件中的属性批量绑定到Java类

**项目出处：** JwtProperties.java

```java
@Component
@ConfigurationProperties(prefix = "sky.jwt")  // 绑定前缀
@Data
public class JwtProperties {
    private String adminSecretKey;  // 对应 sky.jwt.admin-secret-key
    private long adminTtl;          // 对应 sky.jwt.admin-ttl
    private String adminTokenName;  // 对应 sky.jwt.admin-token-name
}
```

对应的配置文件：
```yaml
sky:
  jwt:
    admin-secret-key: itcast
    admin-ttl: 7200000
    admin-token-name: token
```

---

## 六、启动类相关注解

### 1️⃣5️⃣ `@SpringBootApplication` - 启动类核心注解

**作用：** 这是一个**组合注解**，包含：
1. `@SpringBootConfiguration` (= `@Configuration`)
2. `@EnableAutoConfiguration` （自动配置）
3. `@ComponentScan` （组件扫描）

**项目出处：** SkyApplication.java

```java
@SpringBootApplication  // 三合一注解
@EnableTransactionManagement
@Slf4j
@EnableCaching
@EnableScheduling
public class SkyApplication {
    public static void main(String[] args) {
        SpringApplication.run(SkyApplication.class, args);
    }
}
```

---

### 1️⃣6️⃣ `@EnableTransactionManagement` - 开启事务管理

**作用：** 启用Spring的声明式事务支持

**项目出处：** SkyApplication.java

---

### 1️⃣7️⃣ `@EnableCaching` - 开启缓存支持

**作用：** 启用Spring Cache注解（`@Cacheable`, `@CacheEvict`等）

**项目出处：** SkyApplication.java

---

### 1️⃣8️⃣ `@EnableScheduling` - 开启定时任务

**作用：** 启用`@Scheduled`注解支持

**项目出处：** SkyApplication.java

---

## 七、MyBatis相关注解

### 1️⃣9️⃣ `@Param` - 指定参数名

**作用：** 在Mapper接口中指定参数名，避免多参数时混淆

**项目出处：** EmployeeMapper.java

```java
@Mapper
public interface EmployeeMapper {
    
    Employee getByUsername(@Param("username") String username);
    // 在XML中可以用 #{username} 获取参数
    
    Employee getById(@Param("id") Long id);
}
```

对应的XML：
```xml
<select id="getByUsername" resultType="com.sky.entity.Employee">
    SELECT * FROM employee WHERE username = #{username}
</select>
```

在 Spring 项目中，你需要区分代码注释（Javadoc）和框架注解（Annotation），因为它们的用途完全不同。

1. `@Param`：数据持久层参数绑定

这是 **MyBatis** 或 **Spring Data JPA** 中常用的框架注解，主要用于将接口方法的参数与 SQL 语句中的变量名进行显式绑定。 

- **MyBatis 中的作用**：
    - **多参数映射**：当 Mapper 接口方法有多个参数时，MyBatis 无法自动识别对应的 XML 变量，必须使用 `@Param` 指定名称。
    - **动态 SQL 引用**：方便在 SQL 语句中使用 `#{paramName}` 引用参数。
- **Spring Data JPA 中的作用**：
    - **命名参数绑定**：在 `@Query` 注解编写原生或 JPQL 查询时，通过 `@Param` 将方法参数映射到占位符（如 `:name`）上。 

2. `@param` 和 `@return`：代码文档说明 (Javadoc)

如果你看到的是**小写开头的标签**（位于代码上方的 `/** ... */` 注释块中），它们属于标准 Java 文档工具。 

- **`@param`**：用于描述方法的一个特定输入参数，说明该参数的含义、取值范围或约束条件。
- **`@return`**：用于描述方法的返回值，说明返回的数据代表什么。
- **主要作用**：
    - **生成 API 文档**：通过 Javadoc 工具生成 HTML 格式的说明文档。
    - **IDE 提示**：当你调用该方法时，IntelliJ IDEA 或 Eclipse 会悬浮显示这些注释内容，帮助开发者理解如何使用该方法。
3. 易混淆注解对比

|注解/标签|类型|场景|核心作用|
|---|---|---|---|
|**`@Param`**|框架注解|Mapper/Repository 接口|**绑定 SQL 参数**，解决多参数匹配问题|
|**`@RequestParam`**|框架注解|Controller 方法|**提取 HTTP 请求参数**（如 URL 中的 Query String）|
|**`@param`**|Javadoc 标签|任意方法上方注释|**描述参数含义**，仅用于生成文档或 IDE 提示|
|**`@return`**|Javadoc 标签|任意方法上方注释|**描述返回值含义**|

**注意：** Spring 本身并没有大写开头的 `@Return` 注解，通常与返回值相关的 Spring 注解是 `@ResponseBody`（表示返回 JSON 数据）

---

# 🎯 第二部分：Lombok 注解全解析

Lombok是一个**代码生成工具**，通过注解自动生成getter/setter、构造器等样板代码。

### 2️⃣0️⃣ `@Data` - 自动生成常用方法

**自动生成：**
- getter/setter
- toString()
- equals() 和 hashCode()
- 无参构造器（如果没有其他构造器）

**项目出处：** Employee.java

```java
@Data  // 自动生成所有getter/setter/toString等
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Employee implements Serializable {
    private Long id;
    private String username;
    private String name;
    // 不需要写 getId()、setId() 等方法，Lombok自动生成！
}
```

---

### 2️⃣1️⃣ `@Builder` - 构建器模式

**作用：** 生成Builder模式的代码，链式调用创建对象

**项目出处：** EmployeeLoginVO.java

```java
@Data
@Builder
public class EmployeeLoginVO {
    private Long id;
    private String userName;
    private String name;
    private String token;
}

// 使用示例（在EmployeeController中）
EmployeeLoginVO vo = EmployeeLoginVO.builder()
        .id(employee.getId())
        .userName(employee.getUsername())
        .name(employee.getName())
        .token(token)
        .build();  // 链式调用，优雅！
```

---

### 2️⃣2️⃣ `@NoArgsConstructor` / `@AllArgsConstructor`

**作用：**
- `@NoArgsConstructor`：生成无参构造器
- `@AllArgsConstructor`：生成全参构造器

**项目出处：** Employee.java

```java
@NoArgsConstructor  // 生成 public Employee() {}
@AllArgsConstructor // 生成 public Employee(Long id, String username, ...) {}
public class Employee {
    // ...
}
```

---

### 2️⃣3️⃣ `@Slf4j` - 自动生成日志对象

**作用：** 自动生成 `private static final Logger log = LoggerFactory.getLogger(当前类.class);`

**项目出处：** EmployeeController.java

```java
@RestController
@Slf4j  // 自动生成 log 对象
public class EmployeeController {
    
    @PostMapping("/login")
    public Result login(...) {
        log.info("员工登录：{}", dto);  // 直接使用 log
        // ...
    }
}
```

---

# 🎯 第三部分：Swagger 注解全解析

Swagger（Knife4j）用于**自动生成API文档**。

### 2️⃣4️⃣ `@Api` - 标记Controller

**作用：** 给Controller分组和命名

**项目出处：** EmployeeController.java

```java
@RestController
@RequestMapping("/admin/employee")
@Api(tags = "员工相关接口")  // 在文档中显示为一个分组
public class EmployeeController {
    // ...
}
```

---

### 2️⃣5️⃣ `@ApiOperation` - 标记方法

**作用：** 描述接口的功能

**项目出处：** EmployeeController.java

```java
@PostMapping
@ApiOperation("新增员工")  // 在文档中显示的接口名称
public Result save(@RequestBody EmployeeDTO dto) {
    // ...
}
```

---

### 2️⃣6️⃣ `@ApiModel` / `@ApiModelProperty` - 标记实体类

**作用：** 描述请求/响应对象

**项目出处：** EmployeeLoginVO.java

```java
@Data
@ApiModel(description = "员工登录返回的数据格式")
public class EmployeeLoginVO {
    
    @ApiModelProperty("主键值")
    private Long id;
    
    @ApiModelProperty("用户名")
    private String userName;
    
    @ApiModelProperty("jwt令牌")
    private String token;
}
```

**效果：** 在Swagger文档中会显示详细的字段说明

---

# 🔥 第四部分：Spring 注解高频面试题

## ❓ 面试题1：`@Component` 和 `@Service`、`@Controller` 有什么区别？

**答：**

**功能上完全相同**，底层都是通过`@Component`实现的。区别在于**语义**：

| 注解 | 层次 | 语义 |
|------|------|------|
| `@Component` | 通用 | 通用组件 |
| `@Service` | 业务层 | 业务逻辑 |
| `@Controller` | 控制层 | 处理请求 |
| `@Repository` | 持久层 | 数据访问（MyBatis用`@Mapper`） |

**为什么要区分？**
1. **可读性好**：看到`@Service`就知道是业务层
2. **便于AOP**：可以针对特定层做切面
3. **后续扩展**：Spring可能对不同注解做特殊处理

**面试追问：** "能不能全用`@Component`？"  
**答：** 可以，但不推荐。代码语义性差，不符合分层架构思想。

---

## ❓ 面试题2：`@Autowired` 和 `@Resource` 的区别？

| 特性 | `@Autowired` | `@Resource` |
|------|--------------|-------------|
| 来源 | Spring提供 | JDK提供（JSR-250） |
| 装配方式 | **先按类型(byType)**，再按名称(byName) | **先按名称(byName)**，再按类型(byType) |
| 必须性 | 默认必须(可用`required=false`关闭) | 默认必须 |
| 推荐 | Spring项目推荐 | JEE标准推荐 |

**代码示例：**

```java
// @Autowired - 按类型注入
@Autowired
private EmployeeService employeeService;  
// 如果有多个EmployeeService实现类，会报错！
// 解决：@Autowired + @Qualifier("employeeServiceImpl")

// @Resource - 按名称注入
@Resource(name = "employeeServiceImpl")
private EmployeeService employeeService;
```

**面试追问：** "`@Autowired`注入失败怎么办？"  
**答：**
1. 检查被注入的类是否有`@Service`等注解
2. 检查包扫描路径是否包含该类
3. 如果有多个实现类，用`@Qualifier`指定
4. 用`@Resource`按名称注入

---

## ❓ 面试题3：`@RequestBody` 和 `@RequestParam` 的区别？

| 注解 | 接收位置 | Content-Type | 使用场景 |
|------|----------|--------------|----------|
| `@RequestBody` | HTTP请求体 | `application/json` | **POST/PUT**请求，接收JSON |
| `@RequestParam` | URL参数 | `application/x-www-form-urlencoded` | **GET**请求，接收查询参数 |

**代码示例：**

```java
// @RequestBody - 接收JSON
@PostMapping("/login")
public Result login(@RequestBody EmployeeLoginDTO dto) {
    // 请求：POST /login
    // Body: {"username":"admin","password":"123456"}
}

// @RequestParam - 接收URL参数
@GetMapping("/search")
public Result search(@RequestParam String keyword) {
    // 请求：GET /search?keyword=admin
}
```

**面试追问：** "能同时用`@RequestBody`和`@RequestParam`吗？"  
**答：** 可以，但不常见。`@RequestBody`只能有一个，`@RequestParam`可以多个。

```java
@PostMapping("/submit")
public Result submit(@RequestBody OrderDTO order, 
                     @RequestParam Long userId) {
    // Body: {"dishId":1,"amount":2}
    // URL: /submit?userId=10
}
```

---

## ❓ 面试题4：`@PathVariable` 和 `@RequestParam` 的区别？

| 注解 | 参数位置 | 示例 |
|------|----------|------|
| `@PathVariable` | URL路径中 | `/user/{id}` → `/user/10` |
| `@RequestParam` | URL参数中 | `/user?id=10` |

**代码示例：**

```java
// @PathVariable - RESTful风格
@GetMapping("/{id}")
public Result getById(@PathVariable Long id) {
    // GET /employee/10  → id=10
}

// @RequestParam - 传统风格
@GetMapping("/get")
public Result get(@RequestParam Long id) {
    // GET /employee/get?id=10 → id=10
}
```

**面试追问：** "RESTful API应该用哪个？"  
**答：** `@PathVariable`，符合RESTful规范。资源路径用路径参数，筛选条件用查询参数。

```java
GET /users/{id}           // 查询某个用户（PathVariable）
GET /users?status=active  // 筛选用户（RequestParam）
```

---

## ❓ 面试题5：`@Configuration` 和 `@Component` 的区别？

| 注解 | 用途 | `@Bean`方法调用 |
|------|------|----------------|
| `@Configuration` | 配置类 | **会被CGLIB代理**，多次调用返回同一个对象 |
| `@Component` | 普通组件 | **不会被代理**，多次调用返回新对象 |

**代码示例：**

```java
@Configuration
public class AppConfig {
    
    @Bean
    public UserService userService() {
        return new UserService(dataSource());  
        // 调用dataSource()会返回同一个对象（单例）
    }
    
    @Bean
    public DataSource dataSource() {
        return new DataSource();
    }
}

// 如果用@Component，userService()中调用dataSource()会创建新对象！
```

**面试追问：** "`@Configuration`的`proxyBeanMethods`属性是什么？"  
**答：** 
- `proxyBeanMethods = true`（默认）：Full模式，CGLIB代理，保证单例
- `proxyBeanMethods = false`：Lite模式，不代理，性能更好，但Bean方法互调时不保证单例

---

## ❓ 面试题6：`@SpringBootApplication` 包含哪些注解？

**答：** 包含三个注解：

```java
@SpringBootApplication
= @SpringBootConfiguration    // = @Configuration
+ @EnableAutoConfiguration     // 自动配置
+ @ComponentScan               // 组件扫描
```

**详细解释：**
1. **`@SpringBootConfiguration`**：标记为配置类
2. **`@EnableAutoConfiguration`**：自动配置SpringBoot的各种功能（如数据源、Redis等）
3. **`@ComponentScan`**：扫描当前包及子包下的所有`@Component`等注解

**面试追问：** "为什么启动类要放在根包下？"  
**答：** `@ComponentScan`默认扫描启动类所在包及子包。如果放在深层包，扫描不到其他包的Bean！

---

## ❓ 面试题7：`@Transactional` 什么时候会失效？（超高频！）

**答：** 5种失效场景：

### 1️⃣ **自调用**（同一个类中方法互调）

```java
@Service
public class UserService {
    
    public void methodA() {
        methodB();  // 自调用，@Transactional失效！
    }
    
    @Transactional
    public void methodB() {
        // 事务不生效
    }
}
```

**原因：** Spring事务基于AOP代理，自调用不经过代理。  
**解决：** 注入自己 `@Autowired private UserService self;` 然后调用`self.methodB()`

### 2️⃣ **方法不是public**

```java
@Transactional
private void save() {  // 失效！必须是public
}
```

### 3️⃣ **异常被catch了**

```java
@Transactional
public void save() {
    try {
        // 数据库操作
    } catch (Exception e) {
        e.printStackTrace();  // 异常被吞了，事务不回滚！
    }
}
```

**解决：** 在catch中手动`throw new RuntimeException(e);`

### 4️⃣ **抛出的不是RuntimeException**

```java
@Transactional
public void save() throws Exception {  
    // 抛出Exception，默认不回滚！
}
```

**解决：** `@Transactional(rollbackFor = Exception.class)`

### 5️⃣ **数据库引擎不支持事务**

MySQL的MyISAM引擎不支持事务，必须用InnoDB。

---

## ❓ 面试题8：说说Bean的作用域

| 作用域 | 说明 | 注解 |
|--------|------|------|
| singleton（默认） | 单例，容器中只有一个对象 | `@Scope("singleton")` |
| prototype | 原型，每次获取都创建新对象 | `@Scope("prototype")` |
| request | Web环境，每次HTTP请求创建一个 | `@Scope("request")` |
| session | Web环境，每个session一个 | `@Scope("session")` |

**代码示例：**

```java
@Service
@Scope("prototype")  // 每次注入都是新对象
public class PrototypeService {
}
```

**面试追问：** "单例Bean如何注入原型Bean？"  
**答：** 用`@Lookup`注解或`ApplicationContext.getBean()`

---

# 📝 总结：注解速查表

| 分类 | 注解 | 作用 | 项目文件 |
|------|------|------|----------|
| **组件注册** | `@Component` | 通用组件 | JwtTokenAdminInterceptor.java |
| | `@Service` | 业务层 | EmployeeServiceImpl.java |
| | `@RestController` | 控制层 | EmployeeController.java |
| | `@Configuration` | 配置类 | WebMvcConfiguration.java |
| | `@Mapper` | MyBatis接口 | EmployeeMapper.java |
| **依赖注入** | `@Autowired` | 自动装配 | EmployeeController.java |
| | `@Value` | 注入配置值 | OrderServiceImpl.java |
| **请求映射** | `@RequestMapping` | 通用映射 | EmployeeController.java |
| | `@GetMapping` | GET请求 | EmployeeController.java |
| | `@PostMapping` | POST请求 | EmployeeController.java |
| **参数绑定** | `@RequestBody` | 接收JSON | EmployeeController.java |
| | `@PathVariable` | 路径参数 | EmployeeController.java |
| | `@RequestParam` | URL参数 | （其他Controller） |
| **配置** | `@Bean` | 声明Bean | WebMvcConfiguration.java |
| | `@ConfigurationProperties` | 批量注入配置 | JwtProperties.java |
| **Lombok** | `@Data` | 生成getter/setter | Employee.java |
| | `@Builder` | 构建器模式 | EmployeeLoginVO.java |
| | `@Slf4j` | 生成日志对象 | EmployeeController.java |
| **Swagger** | `@Api` | 标记Controller | EmployeeController.java |
| | `@ApiOperation` | 标记方法 | EmployeeController.java |
| | `@ApiModel` | 标记实体 | EmployeeLoginVO.java |

---

**现在你已经掌握了项目中所有的Spring注解！接下来你想：**
1. 💪 **实战练习** - 我带你从零手写一个登录功能，用上所有注解
2. 🔍 **深入原理** - 学习Spring IoC容器和Bean生命周期
3. ➡️ **下一个知识点** - 学习ThreadLocal和JWT登录认证流程

选择你想要的学习路径吧！🚀