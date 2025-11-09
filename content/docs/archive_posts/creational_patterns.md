---
title: "Creational Patterns"
weight: 1
# bookFlatSection: false
# bookToc: true
bookHidden: true
# bookCollapseSection: false
# bookComments: false
# bookSearchExclude: false
# bookHref: ''
# bookIcon: ''
date: 2024-01-23
tags: ["面向对象", "设计模式"]
---

> 本文为 2024 年寒假 SAST 游戏组 WOC 授课资料留档

抽象了实例化过程。

- 接口，抽象类
- new()

## 工厂方法 Factory Method

### 工厂方法的意图

定义一个用于创建对象的接口，让子类决定实例化哪一个类。工厂方法使一个类的实例化延迟到其子类。

### 具体实现

如果不用工厂方法,我们如何实现?

```csharp
public class Wand//产品
{
    public string Name { get; set; }
}

public class FireWand : Wand
{
    public FireWand()
    {
        Name = "Fire Wand";
    }
}

public class IceWand : Wand
{
    public IceWand()
    {
        Name = "Ice Wand";
    }
}

int main()//实例化,客户端,调用者
{
    var fireWand = new FireWand();
    var iceWand = new IceWand();
}
```

如果我们需要一个新的魔杖,我们需要实现一个新的魔杖类,然后实现一个新的方法,这样就会导致类的爆炸。

如果某一个魔杖需要求修改,那么需要全局搜索,修改所有的地方。

如果我们使用工厂方法,我们可以这样实现:

#### swtich case (简单工厂)

```csharp
public enum WandType
{
    Fire,
    Ice
}
public class Wand
{
    public string Name { get; set; }
}

public class WandFactory
{
    public Wand CreateWand(WandType type)//if else
    {
        switch (type)
        {
            case WandType.Fire:
                return new Wand { Name = "Fire Wand" };
            case WandType.Ice:
                return new Wand { Name = "Ice Wand" };
            default://缺省:默认
                throw new ArgumentOutOfRangeException(nameof(type), type, null);
        }
    }
}

int main()
{
    var factory = new WandFactory();
    var fireWand = factory.CreateWand(WandType.Fire);
    var iceWand = factory.CreateWand(WandType.Ice);
}
```

降低了客户端(调用者)和具体产品类的耦合度。然而违背了开闭原则,如果我们需要增加一个新的魔杖,我们需要修改工厂类。

#### 泛型类

```csharp
public enum WandType
{
    Fire,
    Ice
}
public class Wand
{
    protected string Name { get; set; } = "Wand";
}

public class FireWand : Wand
{
    public FireWand()
    {
        Name = "Fire Wand";
        Console.WriteLine("生产了"+Name);
    }
}

public class IceWand : Wand
{
    public IceWand()
    {
        Name = "Ice Wand";
        Console.WriteLine("生产了"+Name);
    }
}

public class WandFactory<T> where T : Wand, new()
{
    public T CreateWand()
    {
        return new T();
    }
}

public class Program
{
    public static void Main(string[] args)
    {
        var iceWandFactory = new WandFactory<IceWand>();
        var wand = iceWandFactory.CreateWand();
        var fireWandFactory = new WandFactory<FireWand>();
        var wand2 = fireWandFactory.CreateWand();
    }
}
```

可以使用 `where : Wand, new()` 来限制泛型类型。

**tips:** `new()` 限制泛型类型必须有无参构造函数。

#### 泛型方法

```csharp
interface IWandFactoryMethod
{
    Wand CreateWand<T>() where T : Wand, new();
}

public class WandFactory : IWandFactoryMethod//落实
{
    public Wand CreateWand<T>() where T : Wand, new()
    {
        return new T();
    }
}

public class Program
{
    public static void Main(string[] args)
    {
        var wandFactory = new WandFactory();
        var wand = wandFactory.CreateWand<IceWand>();
        var wand2 = wandFactory.CreateWand<FireWand>();
    }
}
```

三点好处:

1. 拥有工厂接口
2. 可以限制传入产品,并且在编译期间就可以发现
3. 免去 switch case 的判断

## 抽象工厂 Abstract Factory

### 抽象工厂的意图

提供一个接口,用于创建相关或依赖对象的家族,而不需要明确指定具体类。

### 具体实现

- 抽象工厂
- 具体工厂
- 抽象产品
- 具体产品

```csharp
public enum magicType
{
    Fire,
    Ice
}
public abstract class Wand
{
    protected string Name { get; set; } = "Wand";
}

public abstract class Sword
{
    protected string Name { get; set; } = "Sword";
}

public class FireSword : Sword
{
    public FireSword()
    {
        Name = "Fire Sword";
        Console.WriteLine("生产了"+Name);
    }
}

public class IceSword : Sword
{
    public IceSword()
    {
        Name = "Ice Sword";
        Console.WriteLine("生产了"+Name);
    }
}

public class FireWand : Wand
{
    public FireWand()
    {
        Name = "Fire Wand";
        Console.WriteLine("生产了"+Name);
    }
}

public class IceWand : Wand
{
    public IceWand()
    {
        Name = "Ice Wand";
        Console.WriteLine("生产了"+Name);
    }
}

public abstract class AbstractFactory
{
    public abstract Wand CreateWand();
    public abstract Sword CreateSword();
}

public class FireFactory : AbstractFactory
{
    public override Wand CreateWand()
    {
        return new FireWand();
    }
    public override Sword CreateSword()
    {
        return new FireSword();
    }
}

public class IceFactory : AbstractFactory
{
    public override Wand CreateWand()
    {
        return new IceWand();
    }
    public override Sword CreateSword()
    {
        return new IceSword();
    }
}

public class Program
{
    static void Main(string[] args)
    {
        AbstractFactory factory = new FireFactory();
        factory.CreateSword();
        factory.CreateWand();
    }
}
```

### 缺点

如果我们需要增加一个新的产品,比如 Shield,那么我们需要修改 AbstractFactory,这样就违背了开闭原则。

### 工厂方法的非单例实现

静态类和静态方法

参考是在设计模式与完美游戏开发的 201-202 页

## 生成器 Builder

### 生成器的意图

将一个复杂对象的构建与它的表示分离,使得同样的构建过程可以创建不同的表示。

> 当一个类的构造函数参数个数超过 4 个,而且这些参数有些是可选的参数,考虑使用构造者模式。

**流程分析安排 Director**  
**功能分开实现 Builder**

流水线,流程分析  
同样的流程,每一步做不一样的事情,结果也不同

### 生成器的具体实现

```csharp
public class Potion
{
    private List<string> parts = new List<string>();//对接口

    public Potion(){}

    public void Add(string part)
    {
        parts.Add(part);
    }

    public void Show()
    {
        Console.WriteLine("\nPotion completed as below :");
        foreach (string part in parts)
            Console.WriteLine(part);
    }
}

public class Director//流程分析安排
{
    private Potion potion;
    public Director(){}

    public void Construct(Builder theBuilder)///组装
    {
        potion = new Potion();
        theBuilder.BuildPartA(potion);
        theBuilder.BuildPartB(potion);
        theBuilder.BuildPartC(potion);
        potion = GetProduct();
    }

    public Potion GetProduct()
    {
        return potion;
    }
}

public abstract class Builder//实现功能
{
    public abstract void BuildPartA(Object part);
    public abstract void BuildPartB(Object part);
    public abstract void BuildPartC(Object part);
}

public class PotionBuilder : Builder
{
    public override void BuildPartA(Object product)
    {
        (product as Potion).Add("瓶子");

    }

    public override void BuildPartB(Object product)
    {
        (product as Potion).Add("水");
    }

    public override void BuildPartC(Object product)
    {
        (product as Potion).Add("药剂");
    }

}

public class Program
{
    public static void Main(string[] args)
    {
        Director director = new Director();
        Potion product = null;
        Builder builder = new PotionBuilder();
        director.Construct(builder);
        product = director.GetProduct();
        product.Show();
    }
}
```

## 单例 Singleton

### 单例的意图

提供一个全局访问点来获取唯一的实例。

也即其使用的范围 -> 全局 + 唯一的

### 单例的具体实现

```csharp
public class Singleton
{
    private static Singleton _instance;
    private Singleton() { }
    public static Singleton GetInstance()
    {
        if (_instance == null)
        {
            _instance = new Singleton();
        }
        return _instance;
    }
}

public class Foo
{
    public static Foo instance { get; } = new Foo();
}
```

#### Unity 中的单例值得注意的点 => monobeheviour

```csharp
public class GameManager : MonoBehaviour
{
    public static GameManager Instance;

    private void Awake()
    {
        Instance = this;//不要 new 一个新的 否则 丢失引用
    }
}
```

### 单例模板

```csharp
public class Singleton<T> where T : new()
{
    private static T _instance;
    private static readonly object _lock = new object();
    protected Singleton() { }
    public static T GetInstance()
    {
        if (_instance == null)
        {
            lock (_lock)
            {
                if (_instance == null)
                {
                    _instance = new T();
                }
            }
        }
        return _instance;
    }
}
```

## 参考

[【Sast C# Class 4.1 泛型-类型系统的万金油](https://www.bilibili.com/video/BV1dQ4y1b766)