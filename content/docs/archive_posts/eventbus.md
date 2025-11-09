---
title: "Eventbus"
weight: 1
# bookFlatSection: false
# bookToc: true
bookHidden: true
# bookCollapseSection: false
# bookComments: false
# bookSearchExclude: false
# bookHref: ''
# bookIcon: ''
date: 2024-07-19
tags: ["EventBus", "设计模式", "发布订阅", "Unity"]
---


# EventBus 设计分享
## 回顾原理
无论事件总线支持怎样的拓展功能，内部实现怎样优雅，其设计基本上还是基于发布-订阅模型。  

该模型总是包含用于存贮消息映射到回调的数据集合，事件的分发方法，事件的订阅和取消订阅方法。（以下的事件总线，事件系统，事件中心皆指该模型的实际实现）

发布订阅模型可以轻松支持事件广播，即单一的消息发布者可以把消息传递给多个关心其发送的消息的听众，这些听众会在监听到自己关心的消息时做出相对应的反应。

在类的依赖关系中，听众和消息发布者都无需关心对方，他们共同依赖事件模块而不是相互耦合。优点是利于代码的维护，复用。这也遵循了迪米特法则。
下面举一个例子来对比接入事件总线前后类的依赖关系
```csharp
public class VTuber
{
    private readonly List<Fans> fansList;

    public VTuber(List<Fans> fansList)
    {
        this.fansList = fansList;
    }

    public void Sing()
    {
        fansList.ForEach(fans => fans.OnVTuberSing());
    }
}

public class Fans
{
    public readonly Action OnVTuberSing;

    protected Fans(Action onVTuberSing)
    {
        OnVTuberSing = onVTuberSing;
    }
}
```
上面的代码描述了在 VTuber 唱歌后 Fans 表态的场景。VTuber 不得不了解其所有的粉丝，并在唱歌后逐一通知他们。然而，VTuber 和 Fans 紧密耦合在了一起，只要有一个缺失或者发生更改，代码就无法通过编译或必须紧跟着更新另一个类。  

当不止粉丝来关心 VTuber 的时候，事情就变得更加复杂了。VTuber 必须了解关注 ta 的所有人：粉丝、网警、平台、乐子人，以便在自己有所举动时他们能发出正常的反馈——这很可笑不是吗？哪怕以显示的眼光去看，依赖关系也完全倒置了。事实上是后者关心前者，前者往往完全不了解后者，甚至不清楚后者的存在。
或许熟悉抽象的你已经有了相对应的优化思路，但不要着急，我们再来看看事件总线介入后的局面。
```csharp
public class VTuber
{
    public void Sing()
    {
        EventCenter.Instance.PublishEvent("Sing");
    }
}

public class Fans
{
    private readonly Action onVTuberSing;

    protected Fans(Action onVTuberSing)
    {
        this.onVTuberSing = onVTuberSing;
        EventCenter.Instance.RegisterEvent("Sing", onVTuberSing);
    }

    ~Fans()
    {
        EventCenter.Instance.UnregisterEvent("Sing", onVTuberSing);
    }
}
```
现在 VTuber 完全不再关心关心 ta 的人，仅在 Sing 对外传递了消息，ta 并不关心这条消息会传递给谁。  

Fans 仍然关注于 Sing 消息本身。实际上，原本 Fans 就不是关注 VTuber，而是关心 Sing 消息。对于 Sing 这条消息，有些人会商检，有些人会置之不理，有些人会关心其歌词是否涉政涉黄。  

从整体来看，VTuber 和 Fans 再也不是不可分割的。虽然代码中引入了新的模块，并且让原本的两者都依赖于这个模块，但从代码的可维护性和可复用性上来看，仍然是一个进步。再者，实际开发中的业务模型不会像示例中的这么简单，消息的发布者和订阅者都不止一个，其关心的消息和二者本身也都被要求是可轻松拓展的。

在引入消息模块之前，或许会有人想到可以利用接口抽象消息的发布者（VTuber 一类）和消息的订阅者（Fans 一类）。从而可以消弭业务对象过多导致消息的发布者成员数量爆炸。
```csharp
public interface IDispatcher
{
    public List<ISubscriber> Subscribers { get; }
    void DoSth();
}

public class VTuber : IDispatcher
{
    public VTuber(List<ISubscriber> subscribers)
    {
        Subscribers = subscribers;
    }

    public List<ISubscriber> Subscribers { get; }

    public void DoSth()
    {
        Subscribers.ForEach(suber => suber.OnDoSth());
    }
}

public interface ISubscriber
{
    public Action OnDoSth { get; }
}

public class Fans : ISubscriber
{
    public Fans(Action onDoSth)
    {
        OnDoSth = onDoSth;
    }

    public Action OnDoSth { get; }
}
```
在这个实现中，我们让事件的发布者去关心订阅者的抽象集合。我们无需担心关注者过多的问题了，但是仍然存在问题，我们默认事件的发布者都只去做一件事，VTuber 只去唱歌，游戏博主只发教程视频，广播只会播放眼保健操。显然，在这种实现下，当我们想让发布者去做更多事情的时候，我们就只能增加 DoSth 的数量，相对的每一个关注者都要添加一个 OnDoSthN。相信没有人愿意去堆砌这样的矢山。  

前面我们说过，订阅者关注的是消息本身，而消息的数量和传递的信息都是未知的。显然，面对这样的情况，我们更需要一个方法接收消息并注入面对该消息的回调，而不是为每一个潜在的消息编写 Action。我们可以使用一个`<String，Action>`的字典来存贮注入的消息和处理方法。
```csharp
public interface IDispatcher
{
    public List<ISubscriber> Subscribers { get; }
    void Dispatch(string eventName);
}

public class VTuber : IDispatcher
{
    public VTuber(List<ISubscriber> subscribers)
    {
        Subscribers = subscribers;
    }

    public List<ISubscriber> Subscribers { get; }

    public void Dispatch(string eventName)
    {
        foreach (var subscriber in Subscribers)
        {
            subscriber.EventDict[eventName].Invoke();
        }
    }
}

public interface ISubscriber
{
    Dictionary<string, Action> EventDict { get; }
    void Subscribe(string eventName, Action action);
    void Unsubscribe(string eventName, Action action);
}

public class Fans : ISubscriber
{
    public Fans(Dictionary<string, Action> eventDict)
    {
        EventDict = eventDict;
    }

    public Dictionary<string, Action> EventDict { get; }

    public void Subscribe(string eventName, Action action)
    {
        EventDict[eventName] += action;
    }

    public void Unsubscribe(string eventName, Action action)
    {
        EventDict[eventName] -= action;
    }
}
```
在这个模型下，消息的两端都依赖于抽象，订阅者从构造函数或订阅方法中注入了其关心的事件和处理方法的集合，而发布者关心订阅者的抽象，并在消息发布时遍历他们的事件集合。一切看似很美好，问题在于，就像上面说过的，消息的发布者往往不清楚，甚至完全不了解消息的订阅者。然而要是在消息的订阅者处向消息的发布者注入自己的话，又违背了关心消息本身而不关心消息的发布者的原则。 

一个简单的处理办法是建立一个中介（第三者），来存放消息到处理方法的映射表的合集。所有订阅者都把自己的 eventDict 存在那里。消息的发布者在发布时去访问这个统一的字典，这样就避免了“关心关心 ta 的人”的麻烦。
好的，到这里，恭喜你重新回到了发布订阅模型。  

事实上，你只要把消息发布者遍历统一字典的这一步封装起来放到中介类里（为了维护 DoSth 的单一职责），你就立刻拥有了一个通用且简单的发布订阅模型。
## CodeList
可以先跳过这一节，往下看。
### EventCenter
```csharp
using System;
using System.Collections.Generic;
using Framework.Utility.ClassTemplate.Singleton;
using Sirenix.OdinInspector;

namespace Framework.EventSystem
{
    public class EventCenter : EagerSingleton<EventCenter>
    {
        [ShowInInspector] private readonly Dictionary<string, List<Action>> eventDict = new(32);
        private readonly List<string> eventCacheDict = new(16);

        private readonly Dictionary<string, Action<object[]>[]> parametricEventDict = new(32);

        #region 注册事件

        public void RegisterEvent(string eventName, Action action)
        {
            if (!eventDict.ContainsKey(eventName))
            {
                eventDict[eventName] = new List<Action>();
            }

            eventDict[eventName].Add(action);
        }

        public void RegisterEvent(string eventName, Action<object[]> action)
        {
            if (!parametricEventDict.ContainsKey(eventName))
            {
                parametricEventDict[eventName] = new Action<object[]>[32];
            }

            var value = parametricEventDict[eventName];
            for (var i = 0; i < value.Length; i++)
            {
                if (value[i] == null)
                {
                    value[i] = action;
                    break;
                }
            }
        }

        #endregion

        #region 取消注册事件

        public void UnregisterEvent(string eventName, Action action)
        {
            if (!eventDict.TryGetValue(eventName, out var value))
            {
                return;
            }

            value.Remove(action);
        }

        public void UnregisterEvent(string eventName, Action<object[]> action)
        {
            if (!parametricEventDict.TryGetValue(eventName, out var value))
            {
                return;
            }

            for (var i = 0; i < value.Length; i++)
            {
                if (value[i] == action)
                {
                    value[i] = null;
                    break;
                }
            }
        }

        public void UnregisterEvent(string eventName)
        {
            if (!eventDict.TryGetValue(eventName, out var value))
            {
                return;
            }

            value.Clear();
        }

        public void UnregisterAllEvent()
        {
            eventDict.Clear();
        }

        #endregion

        #region 分发事件

        public void PublishEvent(string eventName, bool addToCache = false)
        {
            if (addToCache)
            {
                eventCacheDict.Add(eventName);
                return;
            }

            if (!eventDict.TryGetValue(eventName, out var value))
            {
                return;
            }

            foreach (var action in value)
            {
                action();
            }
        }

        public void PublishEvent(string eventName, object[] args, bool addToCache = false)
        {
            if (addToCache)
            {
                eventCacheDict.Add(eventName);
                return;
            }

            if (!parametricEventDict.TryGetValue(eventName, out var value))
            {
                return;
            }

            foreach (var action in value)
            {
                action?.Invoke(args);
            }
        }

        #endregion

        #region 延迟分发事件

        public void PublishCache(string eventName)
        {
            if (!eventCacheDict.Contains(eventName))
            {
                return;
            }

            PublishEvent(eventName);
            eventCacheDict.Remove(eventName);
        }

        #endregion
    }
}
```

### IEventRegister
```csharp
namespace Framework.EventSystem
{
    public interface IEventRegister
    {
        public void Register(object obj);
        
        public void Unregister(object obj);
    }
}
```
### AnnotatedEventRegistrar
```csharp
using Framework.EventSystem.Attr;

namespace Framework.EventSystem
{
    public class AnnotatedEventRegistrar : IEventRegister
    {
        protected AnnotatedEventRegistrar()
        {
            Register(this);
        }

        ~AnnotatedEventRegistrar()
        {
            Unregister(this);
        }

        public void Register(object obj)
        {
            EventManager.Instance.RegisterEventHandler(obj);
        }

        public void Unregister(object obj)
        {
            EventManager.Instance.UnregisterEventHandler(obj);
        }
    }
}
```
### UnityAnnotatedEventRegistrar
```csharp
using Framework.EventSystem.Attr;
using UnityEngine;

namespace Framework.EventSystem
{
    public class UnityAnnotatedEventRegistrar : MonoBehaviour, IEventRegister
    {
        public void Register(object obj)
        {
            EventManager.Instance.RegisterEventHandler(obj);
        }

        public void Unregister(object obj)
        {
            EventManager.Instance.UnregisterEventHandler(obj);
        }

        public virtual void Start()
        {
            Register(this);
        }

        public virtual void OnDestroy()
        {
            Unregister(this);
        }
    }
}
```
### EventAttribute
```csharp
using System;

namespace Framework.EventSystem.Attr
{
    /// <summary>
    /// 标记事件的提供者
    /// </summary>
    [AttributeUsage(AttributeTargets.Method)]
    public class EventAttribute : Attribute
    {
        public string EventName { get; }

        public EventAttribute(string eventName)
        {
            EventName = eventName;
        }
    }
}
```
### EventManager
```csharp
using System;
using System.Collections.Generic;
using System.Reflection;
using Framework.LambdaExt;
using Framework.Utility.ClassTemplate.Singleton;
using UnityEngine;

namespace Framework.EventSystem.Attr
{
    public class EventManager : EagerSingleton<EventManager>
    {
        private readonly Dictionary<string, List<Action>> actionDict = new Dictionary<string, List<Action>>();

        private readonly Dictionary<string, List<Action<object[]>>> parametricActionDict =
            new Dictionary<string, List<Action<object[]>>>();


        private void HandleEventOnRegister(object obj)
        {
            var classType = obj.GetType();
            var methods = classType.GetMethods();
            foreach (var method in methods)
            {
                var eventAttributes = method.GetCustomAttribute(typeof(EventAttribute), false);
                if (eventAttributes == null)
                {
                    continue;
                }

                var eventAttribute = (EventAttribute)eventAttributes;
                var parms = method.GetParameters();
                foreach (var info in parms)
                {
                    Debug.Log($"存在参数{info.Name}，类型为{info.ParameterType}");
                }

                if (parms.Length == 0)
                {
                    var action = method.CreateDelegate(typeof(Action), obj) as Action;
                    if (!actionDict.TryGetValue(eventAttribute.EventName, out var value))
                    {
                        actionDict[eventAttribute.EventName] = new List<Action>();
                    }
                    else
                    {
                        value.Add(action);
                    }

                    var eventName = eventAttribute.EventName;

                    EventCenter.Instance.RegisterEvent(eventName, action);
                }
                else
                {
                    var action = method.ToAction(obj);

                    if (parametricActionDict.TryGetValue(eventAttribute.EventName, out var value))
                    {
                        value.Add(action);
                    }
                    else
                    {
                        parametricActionDict[eventAttribute.EventName] = new List<Action<object[]>> { action };
                    }

                    EventCenter.Instance.RegisterEvent(eventAttribute.EventName, action);
                }
            }
        }


        private void HandleEventOnUnregister(object obj)
        {
            var classType = obj.GetType();
            var methods = classType.GetMethods();
            foreach (var method in methods)
            {
                var eventAttributes = method.GetCustomAttribute(typeof(EventAttribute), false);
                if (eventAttributes == null)
                {
                    continue;
                }

                var eventAttribute = (EventAttribute)eventAttributes;
                var parms = method.GetParameters();
                if (parms.Length == 0)
                {
                    var action = method.CreateDelegate(typeof(Action), obj) as Action;
                    if (actionDict.TryGetValue(eventAttribute.EventName, out var value))
                    {
                        value.Remove(action);
                    }

                    var eventName = eventAttribute.EventName;

                    EventCenter.Instance.UnregisterEvent(eventName, action);
                }
                else
                {
                    var action = method.ToAction(obj);

                    if (parametricActionDict.TryGetValue(eventAttribute.EventName, out var value))
                    {
                        value.Remove(action);
                    }

                    EventCenter.Instance.UnregisterEvent(eventAttribute.EventName, action);
                }
            }
        }


        #region 处理签入的事件类

        public void RegisterEventHandler(object obj)
        {
            HandleEventOnRegister(obj);
        }

        #endregion

        #region 处理签出的事件类

        public void UnregisterEventHandler(object obj)
        {
            HandleEventOnUnregister(obj);
        }

        #endregion

        #region 声明周期

        ~EventManager()
        {
            EventCenter.Instance.UnregisterAllEvent();
        }

        #endregion
    }
}
```
### HookAttribute
```csharp
using System;

namespace Framework.Hook
{
    [AttributeUsage(AttributeTargets.Field | AttributeTargets.Property)]
    public class HookAttribute : Attribute
    {
        public readonly string MethodName;

        public HookAttribute(string methodName)
        {
            MethodName = methodName;
        }
    }
}
```
### HookManager
```csharp
using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using Framework.EventSystem;
using Framework.LambdaExt;
using Framework.Utility;
using Framework.Utility.ClassTemplate.Singleton;
using Sirenix.OdinInspector;
using UnityEngine;
using Object = UnityEngine.Object;

namespace Framework.Hook
{
    enum HookType
    {
        Field,
        Property
    }

    struct HookInfo
    {
        public string ChangeEventName;
        public FieldInfo FieldInfo;
        public PropertyInfo PropertyInfo;
        public object LastValue;
        public HookType HookType;
        public bool IsValueType;
    }

    public class HookManager : UnitySingleton<HookManager>
    {
        const BindingFlags k_BindingFlags = BindingFlags.Instance | BindingFlags.NonPublic | BindingFlags.Public;

        [ShowInInspector]
        private readonly Dictionary<object, List<HookInfo>> registry = new Dictionary<object, List<HookInfo>>();

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.BeforeSceneLoad)]
        // ReSharper disable once Unity.IncorrectMethodSignature
        protected override void Awake()
        {
            base.Awake();
            DontDestroyOnLoad(gameObject);
            var hookables = FindObjectsByType<Object>(FindObjectsSortMode.InstanceID).Where(IsHookable);

            foreach (var hookable in hookables)
            {
                Register(hookable);
            }
        }

        void Register(Object obj)
        {
            var fields = obj.GetType().GetFields(k_BindingFlags)
                .Where(field => Attribute.IsDefined(field, typeof(HookAttribute)));

            foreach (var field in fields)
            {
                var hook = field.GetCustomAttribute<HookAttribute>();
                var hookMethodName = hook.MethodName;
                var hookMethod = obj.GetType().GetMethod(hookMethodName, k_BindingFlags);
                if (hookMethod == null)
                    throw new Exception($"找不到{obj.GetType().Name}的方法{hookMethodName}");
                if (hookMethod.GetParameters().Length == 0)
                    throw new Exception($"方法{hookMethodName}必须有参数");
                if (hookMethod.GetParameters()[0].ParameterType != field.FieldType)
                    throw new Exception($"方法{hookMethodName}的参数类型必须与字段{field.Name}的类型一致");
                var hookAction      = hookMethod.ToAction(obj);
                var changeEventName = $"hook: {obj.GetType().Name}.{field.Name} change - {obj.GetInstanceID()}";
                EventCenter.Instance.RegisterEvent(changeEventName, hookAction);
                var lastValue = ObjectTool.CraeteDeepCopyByJson(field.GetValue(obj));
                var newHookInfo = new HookInfo
                {
                    ChangeEventName = changeEventName,
                    FieldInfo = field,
                    LastValue = lastValue,
                    HookType = HookType.Field,
                    IsValueType = field.FieldType.IsValueType
                };

                if (registry.ContainsKey(obj))
                {
                    if (registry[obj].Any(info => info.FieldInfo == field))
                        throw new Exception($"已经存在{obj.GetType().Name}的字段{field.Name}的钩子");
                    registry[obj].Add(newHookInfo);
                }
                else
                {
                    registry.Add(obj, new List<HookInfo> { newHookInfo });
                }
            }

            var properties = obj.GetType().GetProperties(k_BindingFlags)
                .Where(property => Attribute.IsDefined(property, typeof(HookAttribute)));

            foreach (var property in properties)
            {
                var hook = property.GetCustomAttribute<HookAttribute>();
                var hookMethodName = hook.MethodName;
                var hookMethod = obj.GetType().GetMethod(hookMethodName, k_BindingFlags);
                if (hookMethod == null)
                    throw new Exception($"找不到{obj.GetType().Name}的方法{hookMethodName}");
                if (hookMethod.GetParameters().Length == 0)
                    throw new Exception($"方法{hookMethodName}必须有参数");
                if (hookMethod.GetParameters()[0].ParameterType != property.PropertyType)
                    throw new Exception($"方法{hookMethodName}的参数类型必须与属性{property.Name}的类型一致");
                var hookAction      = hookMethod.ToAction(obj);
                var changeEventName = $"hook: {obj.GetType().Name}.{property.Name} change - {obj.GetInstanceID()}";
                EventCenter.Instance.RegisterEvent(changeEventName, hookAction);
                var lastValue = ObjectTool.CraeteDeepCopyByJson(property.GetValue(obj));
                var newHookInfo = new HookInfo
                {
                    ChangeEventName = changeEventName,
                    PropertyInfo = property,
                    LastValue = lastValue,
                    HookType = HookType.Property,
                    IsValueType = property.PropertyType.IsValueType
                };

                if (registry.ContainsKey(obj))
                {
                    if (registry[obj].Any(info => info.PropertyInfo == property))
                        throw new Exception($"已经存在{obj.GetType().Name}的属性{property.Name}的钩子");
                    registry[obj].Add(newHookInfo);
                }
                else
                {
                    registry.Add(obj, new List<HookInfo> { newHookInfo });
                }
            }
        }

        static bool IsHookable(object obj)
        {
            return obj.GetType().GetMembers(k_BindingFlags)
                .Any(member => Attribute.IsDefined(member, typeof(HookAttribute)));
        }

        private void Update()
        {
            foreach (var (obj, hookInfos) in registry)
            {
                for (int i = 0; i < hookInfos.Count; i++)
                {
                    var info = hookInfos[i];
                    var newValue = info.HookType == HookType.Field
                        ? info.FieldInfo.GetValue(obj)
                        : info.PropertyInfo.GetValue(obj);

                    if (info.LastValue == null && newValue == null) continue;
                    if (newValue == null) continue;

                    info.LastValue ??= info.IsValueType ? newValue : ObjectTool.CraeteDeepCopyByJson(newValue);

                    if (!info.LastValue.Equals(newValue))
                    {
                        EventCenter.Instance.PublishEvent(info.ChangeEventName, new[] { newValue });
                        info.LastValue = info.IsValueType ? newValue : ObjectTool.CraeteDeepCopyByJson(newValue);
                    }

                    hookInfos[i] = info;
                }
            }
        }
    }
}
```
## 含参广播
原理到此为止，我们已经从依赖倒置的思路推演出了发布订阅模型。不过我们实现的只是一个“不含参的广播”，换言之在 C#的实现层面上，我们只能向订阅者传递一个 String 类型的消息。（实现来看，是订阅者向中介注入了自己关心的消息和处理方法的集合，在发布者发布事件时，中介会检索消息并调用其映射的所有回调方法。这个回调方法目前是无参的。含义上来看，可以认为消息是从发布者流向订阅者的，但要明确的是，无论是发布者还是订阅者，都只关心消息而非对方）
```csharp
using System;
using System.Collections.Generic;
using Framework.Utility.ClassTemplate.Singleton;
using Sirenix.OdinInspector;

namespace Framework.EventSystem
{
    public class EventCenter : EagerSingleton<EventCenter>
    {
        private readonly Dictionary<string, List<Action>> eventDict = new(32);

        #region 注册事件

        public void RegisterEvent(string eventName, Action action)
        {
            if (!eventDict.ContainsKey(eventName))
            {
                eventDict[eventName] = new List<Action>();
            }

            eventDict[eventName].Add(action);
        }


        #endregion

        #region 取消注册事件

        public void UnregisterEvent(string eventName, Action action)
        {
            if (!eventDict.TryGetValue(eventName, out var value))
            {
                return;
            }

            value.Remove(action);
        }


        public void UnregisterEvent(string eventName)
        {
            if (!eventDict.TryGetValue(eventName, out var value))
            {
                return;
            }

            value.Clear();
        }

        public void UnregisterAllEvent()
        {
            eventDict.Clear();
        }

        #endregion

        #region 分发事件

        public void PublishEvent(string eventName)
        {
            if (!eventDict.TryGetValue(eventName, out var value))
            {
                return;
            }

            foreach (var action in value)
            {
                action();
            }
        }

        #endregion
    }
}
```
当理解了消息映射的回调方法的调用原理后，我们很自然可以想到 `Action` 的调用是可以传参的。我们可以额外建立一个 String 映射到 `Action<object[]>` 的合集，在 C# 中可以表现为一个字典。
```csharp
private readonly Dictionary<string, Action<object[]>[]> parametricEventDict = new(32);
```
通过重载 RegisterEvent，我们可以期待一个 `Action<object[]>`，同时在分发事件时注入其所需的参数（需要重载 `PublishEvent`）
在此过程，不可避免的会引发因为类型转换导致的装箱。如何优化这一点留给读者和笔者思考和探索。
最后实现如下：
```csharp
namespace Framework.EventSystem
{
    public class EventCenter : EagerSingleton<EventCenter>
    {
        ...
        private readonly Dictionary<string, Action<object[]>[]> parametricEventDict = new(32);

        #region 注册事件

       ...

        public void RegisterEvent(string eventName, Action<object[]> action)
        {
            if (!parametricEventDict.ContainsKey(eventName))
            {
                parametricEventDict[eventName] = new Action<object[]>[32];
            }

            var value = parametricEventDict[eventName];
            for (var i = 0; i < value.Length; i++)
            {
                if (value[i] == null)
                {
                    value[i] = action;
                    break;
                }
            }
        }

        #endregion

        #region 取消注册事件

        ...

        public void UnregisterEvent(string eventName, Action<object[]> action)
        {
            if (!parametricEventDict.TryGetValue(eventName, out var value))
            {
                return;
            }

            for (var i = 0; i < value.Length; i++)
            {
                if (value[i] == action)
                {
                    value[i] = null;
                    break;
                }
            }
        }

        ...

        #endregion

        #region 分发事件

        ...

        public void PublishEvent(string eventName, object[] args)
        {
            if (!parametricEventDict.TryGetValue(eventName, out var value))
            {
                return;
            }

            foreach (var action in value)
            {
                action?.Invoke(args);
            }
        }

        #endregion
    }
}
```
## 延迟分发
考虑一个业务场景，你制作了一个任务面板，当玩家完成某项任务时，该面板上对应的任务条目会闪光。很幸运，应用了事件系统后，你能很轻松的让任务系统传递一个某任务完成的信号，监听他的 UI 面板在收到消息的同时忠诚的执行了闪光任务。问题在于，这一切都发生在一瞬间，如果你不想让任务面板探到玩家脸上的话，就要考虑闪光任务是否应该在任务完成的一瞬间就被执行。

延迟分发给出了一种解决思路。  

任务系统会照常分发消息，只不过对于某些不需要立刻分发的任务，他会打上一个延迟分发的 Tag，这些被打上延迟分发 Tag 的消息不会进入常规的事件集合，而是会被投入一个缓存集合。当玩家主动打开任务面板时，一个期待消息参数的缓存清理方法将会被调用，指向性的释放与当前传入详细匹配的键值对，并调用其回调方法。
```csharp
namespace Framework.EventSystem
{
    public class EventCenter : EagerSingleton<EventCenter>
    {
        ...
        private readonly List<string> eventCacheDict = new(16);
        ...

        #region 分发事件

        public void PublishEvent(string eventName, bool addToCache = false)
        {
            if (addToCache)
            {
                eventCacheDict.Add(eventName);
                return;
            }

            if (!eventDict.TryGetValue(eventName, out var value))
            {
                return;
            }

            foreach (var action in value)
            {
                action();
            }
        }

        public void PublishEvent(string eventName, object[] args, bool addToCache = false)
        {
            if (addToCache)
            {
                eventCacheDict.Add(eventName);
                return;
            }

            if (!parametricEventDict.TryGetValue(eventName, out var value))
            {
                return;
            }

            foreach (var action in value)
            {
                action?.Invoke(args);
            }
        }

        #endregion

        #region 延迟分发事件

        public void PublishCache(string eventName)
        {
            if (!eventCacheDict.Contains(eventName))
            {
                return;
            }

            PublishEvent(eventName);
            eventCacheDict.Remove(eventName);
        }

        #endregion
    }
}
```
## 使用 Attribute 快捷订阅消息
在确定一个实例需要在完整的生命周期保持对某个消息的订阅时，使用 C# 的 Attribute 是个看起来快捷且酷的选择。  
在我的实现中，原本这样的代码  
```csharp
using Framework.EventSystem;

public class Enemy
{
    private void Die()
    {
    }

    private Enemy()
    {
        EventCenter.Instance.RegisterEvent("GameEnd", Die);
    }

    ~Enemy()
    {
        EventCenter.Instance.UnregisterEvent("GameEnd", Die);
    }
}
```
可以简化为
```csharp
using Framework.EventSystem;
using Framework.EventSystem.Attr;

public class Enemy : AnnotatedEventRegistrar
{
    [Event("GameEnd")]
    public void Die()
    {
    }
}
```
甚至其还支持参数传递
```csharp
public class Enemy : AnnotatedEventRegistrar
{
    [Event("GameEnd")]
    public void Die()
    {
    }

    [Event("GameStart")]
    public void Born(Vector2 pos)
    {
    }
}
```
对一个继承自 `AnnotatedEventRegistrar` 或 `UnityAnnotatedEventRegistrar` 的类，其公开的非静态方法可以被 `Event` 修饰。

### 实现原理

`EventAttribut`e 帮助了我们实现了在构造函数/析构函数（Start/OnDestory）中自动注册/取消注册目标方法的功能，方便提高开发效率，也显著提高了代码的可读性（哪些方法会响应分发的消息一目了然）。  

父类 `AnnotatedEventRegistrar` 会在构造函数中将自身的引用传递给 `EventManager`，`EventManager` 会通过反射遍历传入引用类型的所有公开非静态方法，并找出其中所有被 `EventAttribute` 修饰的方法。这些方法会和传入的实例的引用构造成 `Action` 或 `Action<object[]>`。如果方法存在传入参数，就会构造后者。  

下面给出一种构造 `Action<object[]>` 的方法的实现
```csharp
public static Action<object[]> ToAction(this MethodInfo methodInfo, object target)
{
    // 参数: object[]
    var parameter = Expression.Parameter(typeof(object[]), "args");

    // 创建方法参数表达式
    var methodParameters = methodInfo.GetParameters();
    var arguments = new Expression[methodParameters.Length];
    for (int i = 0; i < methodParameters.Length; i++)
    {
        var index = Expression.Constant(i);
        var parameterType = methodParameters[i].ParameterType;
        var parameterAccessor = Expression.ArrayIndex(parameter, index);
        var parameterCast = Expression.Convert(parameterAccessor, parameterType);
        arguments[i] = parameterCast;
    }

    // 创建实例表达式
    var instance = Expression.Constant(target);

    // 创建方法调用表达式
    var methodCall = Expression.Call(instance, methodInfo, arguments);

    // 创建并编译 lambda 表达式
    var lambda = Expression.Lambda<Action<object[]>>(methodCall, parameter);
    return lambda.Compile();
}
```
构造出的委托会和方法名一起注册进事件系统，并存入 EventManager 自己管理的事件字典中。当需要签出事件时，会将字典中的委托和新构造委托进行比对，相同的委托将会被撤销在事件系统中的注册，并被移出事件字典。  

对于需要在 Unity 运行的部分，基于已经完成的实现，可以将原本处于 Start 和 OnDestory 的自动订阅机制拓展到所有 MonoBehavior 生命周期函数上。
一个简单的实现是
1. 为 `EventAttribute` 加入记录调用时期的字段，可以是枚举类型的。
2. 把 `UnityAnnotatedEventRegistrar` 上的自动注册撤销方法拓展到所有目标回调上。
3. 重载 `EventManager` 的签入签出方法或重构加入一个输入参数做回调时机的验证（匹配当前传入的回调类型和  `EventAttribute` 记录的回调类型）
4. 
## 基于 EventBus  实现的类 Hook 方法  

可以使用 HookAttribute 快速实现单向数据绑定，对于继承自 UnityEngine.Object 且非动态生成的实例中标记了 `[Hook]` 的字段或属性，其变化将会引起同类中参数列表仅为与其类型相同的一个参数的且方法名与注入其的字符串相匹配的非静态方法被调用，可以使用 `nameof` 优化字符串表现。  

下面是一个用例
```csharp
public class CardState
{
    public int Health;
    public CardState() { Health = 0; }
}

public class CardDisplay : MonoBehaviour
{
    public CardState State;

    [Hook(nameof(RenderHealth))] public int Health => State?.Health ?? 0;

    [SerializeField] private TextMeshProUGUI healthText;
    private void Start() { State = new CardState(); }

    private void Update() // 模拟数据更新
    {
        if (Input.GetKeyDown(KeyCode.A)) State.Health++;
    }

    public void RenderHealth(int newInput)
        => healthText.text = newInput.ToString();
}
```
当 Health 发生变化时，`RenderHealth()` 将会被调用。
`HookAttribute` 可修饰的字段或属性的类型包括基本类型， class， struct。

### 实现原理  

`HookManager` 需要挂载在场景中，其入口函数 `Awake` 由于 `[RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.BeforeSceneLoad)] `的修饰能够确保在场景加载前调用。

程序会检索所有存在成员被 `HookAttribute` 修饰的 Unity 实例，并将其注册进一个字典。改字典存贮了实例到其被 `HookAttribute` 修饰成员与其对应的方法构造的 `HookInfo`。

```csharp
struct HookInfo
{
    public string ChangeEventName;
    public FieldInfo FieldInfo;
    public PropertyInfo PropertyInfo;
    public object LastValue;
    public HookType HookType;
    public bool IsValueType;
}
```
其中被引用的方法会和被修饰的成员和实例的一同构造事件名和事件回调，他们会被注册进事件中心。  

`HookInfo` 记录了字段/属性的信息，结合作为键的实例对象，我们就可以获得目标成员的最新值。
```csharp
var newValue = info.HookType == HookType.Field
    ? info.FieldInfo.GetValue(obj)
    : info.PropertyInfo.GetValue(obj);
```
对于值类型，我们会和 `HookInfo` 中存贮的旧值进行比对，如果不同，`HookInfo` 中的旧值将会被更新，注册的事件也会被发布。  
对于引用类型，我们会创建目标成员的深拷贝与旧值进行比对，后续流程与对值类型进行的操作类似。  

在这里，我采用了 Unity 的 Json 序列化器辅助创建了对象的深拷贝。当然，我们也可以使用反射完成这件事情。  

下面给出深拷贝的创建代码  
```csharp
public static object CraeteDeepCopyByJson(object input)
{
    if (input == null)
    {
        return null;
    }

    var json = JsonUtility.ToJson(input);
    return JsonUtility.FromJson(json, input.GetType());
}
```
Hook 的事件仅作思路验证，可以在此基础上拓展对 `System.Object` 的支持和在 `HookManager` 入口方法之后生成的实例的支持。同时，被销毁的对象也需要被 `HookManager` 从 registry 中移除。