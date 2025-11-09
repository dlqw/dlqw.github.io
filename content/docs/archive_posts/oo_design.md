---
title: "聊聊面向对象和其设计原则"
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
tags: ["OOP", "设计原则", "SOLID"]
---

> 本文为 2024 年寒假 SAST 游戏组 WOC 授课资料留档

## 重温面向对象

- 封装：隐藏内部实现  
- 继承：复用现有代码  
- 多态：改写对象行为  


## 面向对象的目的

现实问题（复杂度） → 类 → 实例 (?)

```csharp
Object myObj = new Object();
````

### 封装

假设你是军队指挥官，你手下统帅了数十种上万人的军队。当你命令部下向地方发起进攻的时候——

你是会：

* A 营的小陆向前走三步，向你的 11 点钟方向射击
* B 连的小宋向左转 35 度，前进 5 步，3 分钟瞄准时间，炮口倾角 15 度，开火 3 分钟
* ……

还是会说：

* A 营向甲点缓慢推进
* B 连火力掩护
* “给老子啃下***高地（乐）”

显然，身为一军之长的你（作为最高层调用者）对军队中每个单位进行原子级微操是不合适的。军中各单位构成的复杂网络应当被抽象成高级命令。

```csharp
int main()
{
    move("小陆", 3);
    fire("小陆", -30);
    rotate("小宋", -35);
    move("小宋", 5);
    artillery_fire(3, 15, 3);
}
```

对象化后：

```csharp
public class Army
{
    public enum AdvanceSpeed
    {
        Slow, Quick, Normal
    }

    public enum ArmyType
    {
        Infantry, Artillery
    }

    public void Advance(AdvanceSpeed speed, City targetPos) { ... }

    public void Shield(Army target) { ... }
}

int Main()
{
    Army A = new Army(...);
    Army B = new Army(...);

    A.Advance(AdvanceSpeed.Normal, city_jia);
    B.Shield(A);
}
```

再上一个层级：

```csharp
public class CollectiveArmy
{
    List<Army> Armys = new List<Army>();

    public void Attack(Area targetPos) { ... }
}

int Main()
{
    CollectiveArmy collectiveArmy = new CollectiveArmy(...);
    collectiveArmy.Attack(area);
}
```

通过封装，我们并没有减少现实的复杂性，但让代码更**易读、易扩展、易维护**。

> 代码是写给人看的。

---

## 哪里能用到面向对象

面向对象真好使啊——那是不是**啥都用 OOP**呢？

例如在“学生管理系统”这种简单逻辑的练习中，其实没必要搞太多类与接口。如果只是打印 `"Hello World"`，你不会先 `class Person` 然后 `me.Talk("Hello World")` 吧（笑）。

面向对象适合复杂系统；面向过程适合时序逻辑。实际项目往往结合使用。

> 他在这里合适才用他。
> **No Silver Bullet（没有银弹）**

---

# 面向对象的设计原则

## 单一责任原则

**定义：**

一个类只允许有一个职责，即只有一个导致该类变更的原因。

不仅是类，函数也应如此。

### 不好的设计

```csharp
public class CardDisplay : MonoBehaviour
{
    public Card card;
    public TextMeshProUGUI nameText;
    public TextMeshProUGUI descriptionText;
    public TextMeshProUGUI attackText;
    public TextMeshProUGUI healthText;
    public Image artworkImage;

    void Start() { Draw(); }

    public void Draw()
    {
        nameText.text = card.name;
        descriptionText.text = card.description;
        attackText.text = card.attack.ToString();
        healthText.text = card.health.ToString();
        artworkImage.sprite = card.artwork;
    }

    public void ChangeCardHP(int hp)
    {
        card.health = hp;
        healthText.text = card.health.ToString();
    }
}
```

### 更好的设计

```csharp
public class CardDisplay : MonoBehaviour
{
    public TextMeshProUGUI nameText;
    public TextMeshProUGUI descriptionText;
    public TextMeshProUGUI attackText;
    public TextMeshProUGUI healthText;
    public Image artworkImage;

    public void Draw(Card card)
    {
        nameText.text = card.name;
        descriptionText.text = card.description;
        attackText.text = card.attack.ToString();
        healthText.text = card.health.ToString();
        artworkImage.sprite = card.artwork;
    }

    public void ChangeHealthText(int amount)
    {
        healthText.text = amount.ToString();
    }
}

public class CardController : MonoBehaviour
{
    public Card card;
    public CardDisplay cardDisplay;

    void Start()
    {
        cardDisplay.Draw(card);
    }

    public void ChangeHealth(int amount)
    {
        card.health += amount;
        cardDisplay.ChangeHealthText(card.health);
    }
}
```

> ✅ **总结：**
> Do one thing, and do it well.

---

## 开闭原则

**定义：**

软件实体应对扩展开放，对修改关闭。

### 不好的设计

```csharp
public class HealthPotion
{
    public void Use() => Debug.Log("生命值恢复了100点!");
}

public class ManaPotion
{
    public void Use() => Debug.Log("魔法值恢复了100点!");
}

public class Player
{
    public void UseHealthPotion()
    {
        HealthPotion healthPotion = new HealthPotion();
        healthPotion.Use();
    }

    public void UseManaPotion()
    {
        ManaPotion manaPotion = new ManaPotion();
        manaPotion.Use();
    }
}
```

### 更好的设计

```csharp
public interface IPotion
{
    void Use();
}

public class HealthPotion : IPotion
{
    public void Use() => Debug.Log("生命值恢复了100点!");
}

public class ManaPotion : IPotion
{
    public void Use() => Debug.Log("魔法值恢复了100点!");
}

public class Player
{
    private IPotion potion;

    public void UsePotion()
    {
        potion.Use();
    }
}
```

> ✅ 使用抽象（接口 / 继承 / 组合）来扩展，不修改原有代码。

---

## 接口隔离原则

**定义：**

不应强迫客户端依赖它不使用的方法。

### 不好的设计

```csharp
public interface IEquipment
{
    void Attack();
    void Defend();
    void Repair();
    void Upgrade();
}
```

### 更好的设计

```csharp
public interface IAttackable { void Attack(); }
public interface IDefendable { void Defend(); }
public interface IRepairable { void Repair(); }
public interface IUpgradeable { void Upgrade(); }
```

---

## 里氏替换原则 (继承)

**定义：**

子类实例必须能替换所有父类实例。

### 不好的设计

```csharp
public class Rectangle
{
    public virtual int Width { get; set; }
    public virtual int Height { get; set; }
    public virtual int Area() => Width * Height;
}

public class Square : Rectangle
{
    public override int Width { get; set; }
    public override int Height
    {
        get => Width;
        set => Width = value;
    }
    public override int Area() => Width * Width;
}
```

### 更好的设计

```csharp
public abstract class Quadrangle
{
    public abstract int Width { get; set; }
    public abstract int Height { get; set; }
    public abstract int Area();
}

public class Rectangle : Quadrangle
{
    public override int Width { get; set; }
    public override int Height { get; set; }
    public override int Area() => Width * Height;
}

public class Square : Quadrangle
{
    public override int Width { get; set; }
    public override int Height { get => Width; set => Width = value; }
    public override int Area() => Width * Width;
}
```

> ✅ “正方形是一种长方形”，但行为上却不同。
> 以行为为导向的抽象才能避免滥用继承。

---

## 最少知识原则

**定义：**

每个对象应只了解与其紧密相关的对象。

### 不好的设计

```csharp
public class Player
{
    public void JoinTeam(Guild guild)
    {
        Team team = guild.FindTeam();
        team.AddPlayer(this);
    }
}
```

### 更好的设计

```csharp
public class Player
{
    public void JoinTeam(Guild guild)
    {
        guild.AddPlayer(this);
    }
}
```

> ✅ 减少依赖链，只与直接相关对象交互。

---

## 依赖倒置原则

**定义：**

高层模块不应依赖于低层模块，二者都应依赖抽象。

### 不好的设计

```csharp
public class Player
{
    public void SpellFireBall() => Console.WriteLine("Fireball!");
    public void SpellFrostBall() => Console.WriteLine("Frostball!");
}

public class Game
{
    public static void Main()
    {
        Player player = new Player();
        player.SpellFireBall();
        player.SpellFrostBall();
    }
}
```

### 更好的设计

```csharp
public interface ISpell { void Cast(); }

public class FireBall : ISpell
{
    public void Cast() => Console.WriteLine("Fireball!");
}

public class FrostBall : ISpell
{
    public void Cast() => Console.WriteLine("Frostball!");
}

public class Player
{
    public void Spell(ISpell spell)
    {
        spell.Cast();
    }
}

public class Game
{
    public static void Main()
    {
        Player player = new Player();
        player.Spell(new FireBall());
        player.Spell(new FrostBall());
    }
}
```

---

# 雪中送炭与锦上添花——设计模式

参考资料：

1. 《设计模式：可复用面向对象软件的基础》
2. 《游戏设计模式》
3. 《设计模式与完美游戏开发》
