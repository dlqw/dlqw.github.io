---
title: "前缀、后缀，中缀表达式"
weight: 1
# bookFlatSection: false
# bookToc: true
bookHidden: true
# bookCollapseSection: false
# bookComments: false
# bookSearchExclude: false
# bookHref: ''
# bookIcon: ''
date: 2023-10-23
tags: ["数据结构"]
---

## 中缀表达式

中缀表达式就是我们通常所写的表达式,如:`1+2*3`、`1+(2+3)*4-5`、`1+2*(3+4*(5+6))` 等等。

## 后缀表达式及其求值方法

后缀表达式又称为逆波兰表达式,它的特点是运算符在操作数的后面,如:`123*+`、`123+4*+5-`、`123456+*+*+` 等等。

### 后缀表达式的求值方法

后缀表达式的求值方法是:从左到右遍历表达式的每个数字和符号,遇到是数字就进栈,遇到是符号,就将处于栈顶两个数字出栈,进行运算,运算结果进栈,一直到最终获得结果。

例如:`123*+` 的求值过程如下:

| 读入字符 | 当前栈 | 说明 |
|---------|--------|------|
| 1 | 1 | 读入 1,进栈 |
| 2 | 1 2 | 读入 2,进栈 |
| 3 | 1 2 3 | 读入 3,进栈 |
| * | 1 6 | 读入 *,出栈 3 和 2,计算 2 * 3 = 6,将 6 进栈 |
| + | 7 | 读入 +,出栈 6 和 1,计算 1 + 6 = 7,将 7 进栈 |

### C++ 实现后缀表达式的求值

用C++实现后缀表达式的求值。要求有简单的控制台UI,并且要对用户的危险行为进行检查和警告。控制台输出的语句要求是中英文对照,并且在用户进行错误操作的时候告知他进行了什么错误操作。

```cpp
#include <iostream>
#include <stack>
#include <string>
#include <sstream>
#include <cctype>

using namespace std;

// 函数声明
bool isOperator(char c);
double performOperation(char op, double operand1, double operand2);
bool evaluatePostfixExpression(const string& postfix, double& result);

int main() {
    cout << "欢迎使用后缀表达式计算器!" << endl;
    cout << "请输入一个后缀表达式,使用空格分隔操作数和操作符,输入'q'退出:" << endl;

    while (true) {
        string input;
        getline(cin, input);

        if (input == "q") {
            cout << "感谢使用后缀表达式计算器,再见!" << endl;
            break;
        }

        // 检查输入中的非法字符
        bool validInput = true;
        for (char c : input) {
            if (!isspace(c) && !isdigit(c) && !isOperator(c)) {
                validInput = false;
                cout << "错误:输入包含非法字符 '" << c << "'" << endl;
                break;
            }
        }

        if (validInput) {
            double result;
            if (evaluatePostfixExpression(input, result)) {
                cout << "结果: " << result << endl;
            }
            else {
                cout << "错误:无效的后缀表达式" << endl;
            }
        }

        cout << "请输入另一个后缀表达式,或输入'q'退出:" << endl;
    }

    return 0;
}

bool isOperator(char c) {
    return c == '+' || c == '-' || c == '*' || c == '/';
}

double performOperation(char op, double operand1, double operand2) {
    switch (op) {
    case '+':
        return operand1 + operand2;
    case '-':
        return operand1 - operand2;
    case '*':
        return operand1 * operand2;
    case '/':
        if (operand2 != 0) {
            return operand1 / operand2;
        }
        else {
            cout << "错误:除数不能为零" << endl;
            exit(1);
        }
    default:
        cout << "错误:未知的操作符 '" << op << "'" << endl;
        exit(1);
    }
}

bool evaluatePostfixExpression(const string& postfix, double& result) {
    stack<double> operandStack;

    istringstream iss(postfix);
    string token;
    while (iss >> token) {
        if (isdigit(token[0])) {
            double operand = stod(token);
            operandStack.push(operand);
        }
        else if (isOperator(token[0])) {
            if (operandStack.size() < 2) {
                cout << "错误:操作数不足" << endl;
                return false;
            }
            double operand2 = operandStack.top();
            operandStack.pop();
            double operand1 = operandStack.top();
            operandStack.pop();
            double result = performOperation(token[0], operand1, operand2);
            operandStack.push(result);
        }
        else {
            cout << "错误:无效的标记 '" << token << "'" << endl;
            return false;
        }
    }

    if (operandStack.size() == 1) {
        result = operandStack.top();
        return true;
    }
    else {
        cout << "错误:操作数不足或操作符过多" << endl;
        return false;
    }
}
```

### C 实现后缀表达式的求值

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>

#define MAX_STACK_SIZE 100
#pragma warning(disable : 4996)

// 栈结构和操作
typedef struct {
    double data[MAX_STACK_SIZE];
    int top;
} Stack;

void initialize(Stack* stack) {
    stack->top = -1;
}

int isEmpty(Stack* stack) {
    return stack->top == -1;
}

void push(Stack* stack, double value) {
    if (stack->top < MAX_STACK_SIZE - 1) {
        stack->data[++stack->top] = value;
    }
    else {
        printf("错误:栈已满\n");
        exit(1);
    }
}

double pop(Stack* stack) {
    if (!isEmpty(stack)) {
        return stack->data[stack->top--];
    }
    else {
        printf("错误:栈为空\n");
        exit(1);
    }
}

// 函数声明
int isOperator(char c);
double performOperation(char op, double operand1, double operand2);
int evaluatePostfixExpression(const char* postfix, double* result);

int main() {
    printf("欢迎使用后缀表达式计算器!\n");
    printf("请输入一个后缀表达式,使用空格分隔操作数和操作符,输入'q'退出:\n");

    while (1) {
        char input[100];
        fgets(input, sizeof(input), stdin);
        input[strcspn(input, "\n")] = '\0'; // 去掉换行符

        if (strcmp(input, "q") == 0) {
            printf("感谢使用后缀表达式计算器,再见!\n");
            break;
        }

        // 检查输入中的非法字符
        int validInput = 1;
        for (int i = 0; input[i] != '\0'; i++) {
            if (!isspace(input[i]) && !isdigit(input[i]) && !isOperator(input[i])) {
                validInput = 0;
                printf("错误:输入包含非法字符 '%c'\n", input[i]);
                break;
            }
        }

        if (validInput) {
            double result;
            if (evaluatePostfixExpression(input, &result)) {
                printf("结果: %g\n", result);
            }
            else {
                printf("错误:无效的后缀表达式\n");
            }
        }

        printf("请输入另一个后缀表达式,或输入'q'退出:\n");
    }

    return 0;
}

int isOperator(char c) {
    return c == '+' || c == '-' || c == '*' || c == '/';
}

double performOperation(char op, double operand1, double operand2) {
    switch (op) {
    case '+':
        return operand1 + operand2;
    case '-':
        return operand1 - operand2;
    case '*':
        return operand1 * operand2;
    case '/':
        if (operand2 != 0) {
            return operand1 / operand2;
        }
        else {
            printf("错误:除数不能为零\n");
            exit(1);
        }
    default:
        printf("错误:未知的操作符 '%c'\n", op);
        exit(1);
    }
}

int evaluatePostfixExpression(const char* postfix, double* result) {
    Stack operandStack;
    initialize(&operandStack);

    char* token = strtok((char*)postfix, " ");
    while (token != NULL) {
        if (isdigit(token[0])) {
            double operand = atof(token);
            push(&operandStack, operand);
        }
        else if (isOperator(token[0])) {
            if (operandStack.top < 1) {
                printf("错误:操作数不足\n");
                return 0;
            }
            double operand2 = pop(&operandStack);
            double operand1 = pop(&operandStack);
            double result = performOperation(token[0], operand1, operand2);
            push(&operandStack, result);
        }
        else {
            printf("错误:无效的标记 '%s'\n", token);
            return 0;
        }

        token = strtok(NULL, " ");
    }

    if (operandStack.top == 0) {
        *result = operandStack.data[0];
        return 1;
    }
    else {
        printf("错误:操作数不足或操作符过多\n");
        return 0;
    }
}
```

### 后缀表达式的转换方法(中缀转后缀)

将中缀表达式转换为后缀表达式的方法是:从左到右遍历中缀表达式的每个数字和符号,若是数字就输出,若是符号,则判断其与栈顶符号的优先级,是右括号或优先级不高于栈顶符号(乘除优先加减)则栈顶元素依次出栈并输出,并将当前符号进栈,一直到最终输出后缀表达式为止。

例如:`1+(2+3)*4-5` 的转换过程如下:

| 读入字符 | 当前栈 | 说明 |
|---------|--------|------|
| 1 | 1 | 读入 1,输出 |
| + | + | 读入 +,进栈 |
| ( | + ( | 读入 (,进栈 |
| 2 | + ( 2 | 读入 2,输出 |
| + | + ( + | 读入 +,进栈 |
| 3 | + ( + 3 | 读入 3,输出 |
| ) | + | 读入 ),依次出栈 + 和 (,输出 |
| * | * | 读入 *,进栈 |
| 4 | * 4 | 读入 4,输出 |
| - | - | 读入 -,进栈 |
| 5 | - 5 | 读入 5,输出 |
| 空 | - | 依次出栈 - 和 *,输出 |

转换后的后缀表达式为:`123+4*+5-`。

### C++ 实现中缀表达式转后缀表达式

```cpp
#include <iostream>
#include <stack>
#include <string>

using namespace std;

// 函数声明
int getOperatorPrecedence(char op);
bool isOperator(char c);
string infixToPostfix(const string& infix);

int main() {
    cout << "欢迎使用中缀表达式转后缀表达式程序!" << endl;
    cout << "请输入一个中缀表达式,输入'q'退出:" << endl;

    while (true) {
        string infixExpression;
        getline(cin, infixExpression);

        if (infixExpression == "q") {
            cout << "感谢使用中缀表达式转后缀表达式程序,再见!" << endl;
            break;
        }

        string postfixExpression = infixToPostfix(infixExpression);
        cout << "后缀表达式:" << postfixExpression << endl;

        cout << "请输入另一个中缀表达式,或输入'q'退出:" << endl;
    }

    return 0;
}

int getOperatorPrecedence(char op) {
    switch (op) {
    case '+':
    case '-':
        return 1;
    case '*':
    case '/':
        return 2;
    default:
        return 0;
    }
}

bool isOperator(char c) {
    return c == '+' || c == '-' || c == '*' || c == '/';
}

string infixToPostfix(const string& infix) {
    stack<char> operatorStack;
    string postfixExpression;

    for (char c : infix) {
        if (isspace(c)) {
            continue;
        }
        else if (isdigit(c) || isalpha(c)) {
            postfixExpression += c;
        }
        else if (isOperator(c)) {
            while (!operatorStack.empty() &&
                getOperatorPrecedence(operatorStack.top()) >= getOperatorPrecedence(c)) {
                postfixExpression += operatorStack.top();
                operatorStack.pop();
            }
            operatorStack.push(c);
        }
        else if (c == '(') {
            operatorStack.push(c);
        }
        else if (c == ')') {
            while (!operatorStack.empty() && operatorStack.top() != '(') {
                postfixExpression += operatorStack.top();
                operatorStack.pop();
            }
            if (!operatorStack.empty() && operatorStack.top() == '(') {
                operatorStack.pop();
            }
            else {
                cout << "错误:括号不匹配" << endl;
                exit(1);
            }
        }
        else {
            cout << "错误:无效的字符 '" << c << "'" << endl;
            exit(1);
        }
    }

    while (!operatorStack.empty()) {
        if (operatorStack.top() == '(') {
            cout << "错误:括号不匹配" << endl;
            exit(1);
        }
        postfixExpression += operatorStack.top();
        operatorStack.pop();
    }

    return postfixExpression;
}
```

### C 实现中缀表达式转后缀表达式

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>

#define MAX_STACK_SIZE 100

// 栈结构和操作
typedef struct {
    char data[MAX_STACK_SIZE];
    int top;
} Stack;

void initialize(Stack* stack) {
    stack->top = -1;
}

int isEmpty(Stack* stack) {
    return stack->top == -1;
}

int isFull(Stack* stack) {
    return stack->top == MAX_STACK_SIZE - 1;
}

void push(Stack* stack, char value) {
    if (!isFull(stack)) {
        stack->data[++stack->top] = value;
    }
    else {
        printf("错误:栈已满\n");
        exit(1);
    }
}

char pop(Stack* stack) {
    if (!isEmpty(stack)) {
        return stack->data[stack->top--];
    }
    else {
        printf("错误:栈为空\n");
        exit(1);
    }
}

char peek(Stack* stack) {
    if (!isEmpty(stack)) {
        return stack->data[stack->top];
    }
    else {
        return '\0';
    }
}

// 函数声明
int getOperatorPrecedence(char op);
int isOperator(char c);
void infixToPostfix(const char* infix, char* postfix);

int main() {
    printf("欢迎使用中缀表达式转后缀表达式程序!\n");
    printf("请输入一个中缀表达式,输入'q'退出:\n");

    while (1) {
        char infixExpression[100];
        fgets(infixExpression, sizeof(infixExpression), stdin);
        infixExpression[strcspn(infixExpression, "\n")] = '\0'; // 去掉换行符

        if (strcmp(infixExpression, "q") == 0) {
            printf("感谢使用中缀表达式转后缀表达式程序,再见!\n");
            break;
        }

        char postfixExpression[100];
        infixToPostfix(infixExpression, postfixExpression);
        printf("后缀表达式:%s\n", postfixExpression);

        printf("请输入另一个中缀表达式,或输入'q'退出:\n");
    }

    return 0;
}

int getOperatorPrecedence(char op) {
    switch (op) {
    case '+':
    case '-':
        return 1;
    case '*':
    case '/':
        return 2;
    default:
        return 0;
    }
}

int isOperator(char c) {
    return c == '+' || c == '-' || c == '*' || c == '/';
}

void infixToPostfix(const char* infix, char* postfix) {
    Stack operatorStack;
    initialize(&operatorStack);

    int i = 0;
    int j = 0;

    while (infix[i] != '\0') {
        if (isspace(infix[i])) {
            i++;
            continue;
        }
        else if (isdigit(infix[i]) || isalpha(infix[i])) {
            postfix[j++] = infix[i];
        }
        else if (isOperator(infix[i])) {
            while (!isEmpty(&operatorStack) && getOperatorPrecedence(peek(&operatorStack)) >= getOperatorPrecedence(infix[i])) {
                postfix[j++] = pop(&operatorStack);
            }
            push(&operatorStack, infix[i]);
        }
        else if (infix[i] == '(') {
            push(&operatorStack, infix[i]);
        }
        else if (infix[i] == ')') {
            while (!isEmpty(&operatorStack) && peek(&operatorStack) != '(') {
                postfix[j++] = pop(&operatorStack);
            }
            if (!isEmpty(&operatorStack) && peek(&operatorStack) == '(') {
                pop(&operatorStack); // 弹出 '('
            }
            else {
                printf("错误:括号不匹配\n");
                exit(1);
            }
        }
        else {
            printf("错误:无效的字符 '%c'\n", infix[i]);
            exit(1);
        }

        i++;
    }

    while (!isEmpty(&operatorStack)) {
        if (peek(&operatorStack) == '(') {
            printf("错误:括号不匹配\n");
            exit(1);
        }
        postfix[j++] = pop(&operatorStack);
    }

    postfix[j] = '\0'; // 添加字符串终止符
}
```

## 前缀表达式及其求值方法

前缀表达式又称为波兰表达式,它的特点是运算符在操作数的前面,如:`+1*23`、`-+1*+2345`、`+1*2+3*4+56` 等等。

### 前缀表达式的求值方法

前缀表达式的求值方法是:从右到左遍历表达式的每个数字和符号,遇到是数字就进栈,遇到是符号,就将处于栈顶两个数字出栈,进行运算,运算结果进栈,一直到最终获得结果。

例如:`+1*23` 的求值过程如下:

| 读入字符 | 当前栈 | 说明 |
|---------|--------|------|
| 3 | 3 | 读入 3,进栈 |
| 2 | 3 2 | 读入 2,进栈 |
| * | 6 | 读入 *,出栈 2 和 3,计算 2 * 3 = 6,将 6 进栈 |
| 1 | 6 1 | 读入 1,进栈 |
| + | 7 | 读入 +,出栈 1 和 6,计算 1 + 6 = 7,将 7 进栈 |

### C++ 实现前缀表达式的求值

```cpp
#include <iostream>
#include <stack>
#include <sstream>
#include <vector>
#include <cctype>

using namespace std;

// 函数声明
bool isOperator(const string& token);
bool isNumeric(const string& token);
double evaluatePrefixExpression(const vector<string>& tokens);

int main() {
    cout << "欢迎使用前缀表达式求值程序!" << endl;

    while (true) {
        cout << "请输入前缀表达式,操作符和操作数之间用空格分隔,支持+、-、*、/:" << endl;
        cout << "输入 q 退出程序" << endl;
        string input;
        getline(cin, input);

        if (input == "q") {
            break; // 用户输入了"q",退出程序
        }

        istringstream iss(input);
        vector<string> tokens;

        string token;
        while (iss >> token) {
            tokens.push_back(token);
        }

        if (tokens.empty()) {
            cout << "错误:输入为空,请重新输入表达式。" << endl;
            cout << "输入 q 退出程序" << endl;
            continue; // 继续下一次循环
        }

        double result = evaluatePrefixExpression(tokens);

        if (!isnan(result)) {
            cout << "表达式结果为:" << result << endl;
        }
        else {
            cout << "错误:无法计算表达式结果,请检查表达式是否正确。" << endl;
        }
    }

    cout << "感谢使用前缀表达式求值程序!" << endl;
    return 0;
}

bool isOperator(const string& token) {
    return (token == "+" || token == "-" || token == "*" || token == "/");
}

bool isNumeric(const string& token) {
    for (char c : token) {
        if (!isdigit(c) && c != '.' && c != '-') {
            return false;
        }
    }
    return true;
}

double evaluatePrefixExpression(const vector<string>& tokens) {
    stack<double> operandStack;

    for (int i = tokens.size() - 1; i >= 0; i--) {
        const string& token = tokens[i];

        if (isNumeric(token)) {
            operandStack.push(stod(token));
        }
        else if (isOperator(token)) {
            if (operandStack.size() < 2) {
                cout << "错误:操作数不足,无法进行操作。" << endl;
                return NAN;
            }

            double operand1 = operandStack.top();
            operandStack.pop();
            double operand2 = operandStack.top();
            operandStack.pop();

            if (token == "+") {
                operandStack.push(operand1 + operand2);
            }
            else if (token == "-") {
                operandStack.push(operand1 - operand2);
            }
            else if (token == "*") {
                operandStack.push(operand1 * operand2);
            }
            else if (token == "/") {
                if (operand2 == 0) {
                    cout << "错误:除数为零,无法进行除法操作。" << endl;
                    return NAN;
                }
                operandStack.push(operand1 / operand2);
            }
        }
        else {
            cout << "错误:无效的表达式元素 \"" << token << "\",请检查表达式是否正确。" << endl;
            return NAN;
        }
    }

    if (operandStack.size() != 1) {
        cout << "错误:操作数和操作符数量不匹配,无法计算表达式结果。" << endl;
        return NAN;
    }

    return operandStack.top();
}
```

### C 实现前缀表达式的求值

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>
#include <ctype.h>
#include <math.h>

#define MAX_EXPRESSION_SIZE 100
#pragma warning(disable : 4996)

// 函数声明
bool isOperator(const char token);
bool isNumeric(const char* token);
double evaluatePrefixExpression(const char** tokens, int numTokens);

int main() {
    printf("欢迎使用前缀表达式求值程序!\n");

    while (1) {
        printf("请输入前缀表达式,操作符和操作数之间用空格分隔,支持+、-、*、/:\n");
        printf("输入 q 退出程序。\n");

        char input[MAX_EXPRESSION_SIZE];
        fgets(input, sizeof(input), stdin);
        input[strcspn(input, "\n")] = '\0'; // 移除末尾的换行符

        if (strcmp(input, "q") == 0) {
            break; // 用户输入了"q",退出程序
        }

        const char* delimiters = " ";
        char* token = strtok(input, delimiters);
        const char* tokens[MAX_EXPRESSION_SIZE];
        int numTokens = 0;

        while (token != NULL && numTokens < MAX_EXPRESSION_SIZE) {
            tokens[numTokens] = token;
            numTokens++;
            token = strtok(NULL, delimiters);
        }

        if (numTokens == 0) {
            printf("错误:输入为空,请重新输入表达式。\n");
            printf("输入 q 退出程序。\n");
            continue; // 继续下一次循环
        }

        double result = evaluatePrefixExpression(tokens, numTokens);

        if (!isnan(result)) {
            printf("表达式结果为:%g\n", result);
        }
        else {
            printf("错误:无法计算表达式结果,请检查表达式是否正确。\n");
        }
    }

    printf("感谢使用前缀表达式求值程序!\n");
    return 0;
}

bool isOperator(const char token) {
    return (token == '+' || token == '-' || token == '*' || token == '/');
}

bool isNumeric(const char* token) {
    for (int i = 0; token[i] != '\0'; i++) {
        if (!isdigit(token[i]) && token[i] != '.' && token[i] != '-') {
            return false;
        }
    }
    return true;
}

double evaluatePrefixExpression(const char** tokens, int numTokens) {
    double operandStack[MAX_EXPRESSION_SIZE];
    int top = -1;

    for (int i = numTokens - 1; i >= 0; i--) {
        const char* token = tokens[i];

        if (isNumeric(token)) {
            operandStack[++top] = atof(token);
        }
        else if (isOperator(token[0])) {
            if (top < 1) {
                printf("错误:操作数不足,无法进行操作。\n");
                return NAN;
            }

            double operand1 = operandStack[top--];
            double operand2 = operandStack[top--];

            switch (token[0]) {
            case '+':
                operandStack[++top] = operand1 + operand2;
                break;
            case '-':
                operandStack[++top] = operand1 - operand2;
                break;
            case '*':
                operandStack[++top] = operand1 * operand2;
                break;
            case '/':
                if (operand2 == 0) {
                    printf("错误:除数为零,无法进行除法操作。\n");
                    return NAN;
                }
                operandStack[++top] = operand1 / operand2;
                break;
            default:
                printf("错误:无效的操作符 \"%s\",请检查表达式是否正确。\n", token);
                return NAN;
            }
        }
        else {
            printf("错误:无效的表达式元素 \"%s\",请检查表达式是否正确。\n", token);
            return NAN;
        }
    }

    if (top != 0) {
        printf("错误:操作数和操作符数量不匹配,无法计算表达式结果。\n");
        return NAN;
    }

    return operandStack[top];
}
```

### 前缀表达式的转换方法(中缀转前缀)

将中缀表达式转换为前缀表达式的方法是:从右到左遍历中缀表达式的每个数字和符号,若是数字就输出,若是符号,则判断其与栈顶符号的优先级,是右括号或优先级不高于栈顶符号(乘除优先加减)则栈顶元素依次出栈并输出,并将当前符号进栈,一直到最终输出前缀表达式为止。

例如:`1+(2+3)*4-5` 的转换过程如下:

| 读入字符 | 当前栈 | 说明 |
|---------|--------|------|
| 5 | 5 | 读入 5,进栈 |
| - | - | 读入 -,进栈 |
| 4 | - 4 | 读入 4,进栈 |
| * | * | 读入 *,进栈 |
| + | + | 读入 +,进栈 |
| 3 | + 3 | 读入 3,进栈 |
| + | + | 读入 +,进栈 |
| 2 | + 2 | 读入 2,进栈 |
| ( | + ( | 读入 (,进栈 |
| 1 | + ( 1 | 读入 1,输出 |
| 空 | + | 依次出栈 + 和 (,输出 |

转换后的前缀表达式为:`-*+12345`。

### C++ 实现中缀表达式转前缀表达式

```cpp
#include <iostream>
#include <stack>
#include <string>
#include <algorithm>

using namespace std;

// 函数声明
int getOperatorPrecedence(char op);
bool isOperator(char token);
bool isOperand(char token);
string infixToPrefix(const string& infixExpression);

int main() {
    cout << "欢迎使用中缀表达式转前缀表达式程序!" << endl;

    while (true) {
        cout << "请输入中缀表达式或输入 'q' 退出:" << endl;

        string input;
        getline(cin, input);

        if (input == "q") {
            break; // 用户输入了'q',退出程序
        }

        string prefixExpression = infixToPrefix(input);

        if (!prefixExpression.empty()) {
            cout << "前缀表达式为:" << prefixExpression << endl;
        }
        else {
            cout << "错误:无法转换表达式,请检查表达式是否正确。" << endl;
        }
    }

    cout << "感谢使用中缀表达式转前缀表达式程序!" << endl;
    return 0;
}

int getOperatorPrecedence(char op) {
    switch (op) {
    case '+':
    case '-':
        return 1;
    case '*':
    case '/':
        return 2;
    default:
        return 0;
    }
}

bool isOperator(char token) {
    return (token == '+' || token == '-' || token == '*' || token == '/');
}

bool isOperand(char token) {
    return isalnum(token);
}

string infixToPrefix(const string& infixExpression) {
    string prefixExpression;
    stack<char> operatorStack;

    // 反转中缀表达式,方便从右到左处理
    string reversedInfix = infixExpression;
    reverse(reversedInfix.begin(), reversedInfix.end());

    for (char token : reversedInfix) {
        if (isOperand(token)) {
            prefixExpression = token + prefixExpression;
        }
        else if (isOperator(token)) {
            while (!operatorStack.empty() && getOperatorPrecedence(token) < getOperatorPrecedence(operatorStack.top())) {
                prefixExpression = operatorStack.top() + prefixExpression;
                operatorStack.pop();
            }
            operatorStack.push(token);
        }
        else if (token == ')') {
            operatorStack.push(token);
        }
        else if (token == '(') {
            while (!operatorStack.empty() && operatorStack.top() != ')') {
                prefixExpression = operatorStack.top() + prefixExpression;
                operatorStack.pop();
            }
            if (!operatorStack.empty()) {
                operatorStack.pop(); // 弹出匹配的右括号
            }
            else {
                return ""; // 括号不匹配
            }
        }
    }

    while (!operatorStack.empty()) {
        if (operatorStack.top() == '(' || operatorStack.top() == ')') {
            return ""; // 括号不匹配
        }
        prefixExpression = operatorStack.top() + prefixExpression;
        operatorStack.pop();
    }

    return prefixExpression;
}
```

### C 实现中缀表达式转前缀表达式

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>

#define MAX_SIZE 100
#pragma warning(disable : 4996)

typedef struct {
    char arr[MAX_SIZE];
    int top;
} Stack;

void initStack(Stack* s) {
    s->top = -1;
}

bool isEmpty(Stack s) {
    return s.top == -1;
}

bool isFull(Stack s) {
    return s.top == MAX_SIZE - 1;
}

void push(Stack* s, char ch) {
    if (isFull(*s)) {
        printf("Stack overflow!\n");
        exit(1);
    }
    s->arr[++(s->top)] = ch;
}

char pop(Stack* s) {
    if (isEmpty(*s)) {
        printf("Stack underflow!\n");
        exit(1);
    }
    return s->arr[(s->top)--];
}

char peek(Stack s) {
    return s.arr[s.top];
}

bool isOperator(char ch) {
    return ch == '+' || ch == '-' || ch == '*' || ch == '/';
}

int precedence(char ch) {
    switch (ch) {
    case '+':
    case '-':
        return 1;
    case '*':
    case '/':
        return 2;
    default:
        return -1;
    }
}

void infixToPrefix(char* infix, char* prefix) {
    Stack operators;
    initStack(&operators);
    int j = 0;

    for (int i = strlen(infix) - 1; i >= 0; i--) {
        char ch = infix[i];

        if ((ch >= '0' && ch <= '9') || (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z')) {
            prefix[j++] = ch;
        }
        else if (ch == ')') {
            push(&operators, ch);
        }
        else if (ch == '(') {
            while (!isEmpty(operators) && peek(operators) != ')') {
                prefix[j++] = pop(&operators);
            }
            if (!isEmpty(operators) && peek(operators) == ')') {
                pop(&operators);
            }
        }
        else if (isOperator(ch)) {
            while (!isEmpty(operators) && precedence(ch) <= precedence(peek(operators))) {
                prefix[j++] = pop(&operators);
            }
            push(&operators, ch);
        }
    }

    while (!isEmpty(operators)) {
        prefix[j++] = pop(&operators);
    }

    prefix[j] = '\0';

    _strrev(prefix);
}

int main() {
    char infix[MAX_SIZE], prefix[MAX_SIZE];
    while (1) {
        printf("请输入中缀表达式[不要留空格] (输入q退出): ");
        scanf("%s", infix);

        if (strcmp(infix, "q") == 0) {
            printf("退出计算器。\n");
            break;
        }

        infixToPrefix(infix, prefix);
        printf("前缀表达式: %s\n", prefix);
    }

    return 0;
}
```