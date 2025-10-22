---
name: logic-to-code
description: This skill converts natural language calculation logic and business rules into production-ready Python and TypeScript implementations. Use this when the user describes computational logic, formulas, or algorithms in plain language (especially Japanese) and needs them translated into typed, tested code. Ideal for scaffolding calculations, estimation logic, and domain-specific business rules in the ScaffAI project.
---

# Logic to Code

## Overview

Convert natural language descriptions of calculation logic, formulas, and business rules into production-ready Python and TypeScript implementations with automatic test generation, type safety, and edge case handling.

## When to Use This Skill

Use this skill when:
- User describes calculation logic in natural language (Japanese or English)
- Need to implement mathematical formulas or business rules
- Converting domain-specific logic (e.g., scaffolding calculations, quotation formulas)
- Require both Python (backend) and TypeScript (frontend) implementations
- Need automatic test coverage and edge case handling

**Trigger examples:**
- "壁の長さを1.8で割って切り上げて、高さを1.5で割った値を掛ける"
- "平米数に単価を掛けて、消費税10%を加算する"
- "足場の段数が5段以上なら安全ネットが必要"

## Core Workflow

### Step 1: Parse Natural Language Logic

Extract the computational logic from the user's description:

1. Identify input variables and their types
2. Extract mathematical operations (division, multiplication, rounding, etc.)
3. Detect conditional logic and business rules
4. Determine output type and format

**Example:**
```
Input: "壁の長さを1.8で割って切り上げて、高さを1.5で割った値を掛ける"

Parsed:
- Inputs: wall_length (float), height (float)
- Operations:
  1. wall_length / 1.8 → ceiling
  2. height / 1.5
  3. result1 * result2
- Output: integer (unit count)
```

### Step 2: Analyze Edge Cases

Automatically identify potential edge cases based on the logic:

**Common edge cases to check:**
- Division by zero
- Negative numbers
- Zero inputs
- Very large numbers (overflow)
- Very small numbers (precision)
- Type mismatches
- Null/undefined values

**Decision matrix:**
- If division exists → check for zero divisor
- If multiplication exists → check for overflow
- If negative numbers are invalid → add validation
- If rounding is used → check precision requirements

### Step 3: Generate Python Implementation

Create a Python function with:
- Type hints (using `typing` module)
- Docstring (Google or NumPy style, in Japanese)
- Input validation
- Edge case handling
- Clear variable names
- Inline comments in Japanese

**Template structure:**
```python
from typing import Union
import math


def function_name(param1: float, param2: float) -> int:
    """
    関数の説明（日本語）

    引数:
        param1: パラメータ1の説明
        param2: パラメータ2の説明

    戻り値:
        結果の説明

    例外:
        ValueError: 無効な入力の場合
    """
    # 入力値の検証
    if param1 <= 0 or param2 <= 0:
        raise ValueError("パラメータは正の数である必要があります")

    # 計算ロジック
    step1 = math.ceil(param1 / 1.8)
    step2 = param2 / 1.5
    result = step1 * step2

    return int(result)
```

### Step 4: Generate TypeScript Implementation

Create a TypeScript function with:
- Type annotations
- JSDoc comments (in Japanese)
- Input validation
- Edge case handling
- Error throwing with custom error types
- Clear variable names

**Template structure:**
```typescript
/**
 * 関数の説明（日本語）
 *
 * @param param1 - パラメータ1の説明
 * @param param2 - パラメータ2の説明
 * @returns 結果の説明
 * @throws {Error} 無効な入力の場合
 */
export function functionName(param1: number, param2: number): number {
  // 入力値の検証
  if (param1 <= 0 || param2 <= 0) {
    throw new Error('パラメータは正の数である必要があります');
  }

  // 計算ロジック
  const step1 = Math.ceil(param1 / 1.8);
  const step2 = param2 / 1.5;
  const result = step1 * step2;

  return Math.floor(result);
}
```

### Step 5: Generate Test Code

Create comprehensive test suites for both languages:

**Python tests (pytest):**
```python
import pytest
from module_name import function_name


def test_normal_case():
    """正常系: 標準的な入力値でのテスト"""
    result = function_name(10.0, 5.0)
    assert result == expected_value


def test_edge_case_zero():
    """異常系: ゼロ入力のテスト"""
    with pytest.raises(ValueError):
        function_name(0, 5.0)


def test_edge_case_negative():
    """異常系: 負の数入力のテスト"""
    with pytest.raises(ValueError):
        function_name(-10.0, 5.0)


def test_boundary_values():
    """境界値テスト"""
    # 実装に応じた境界値テスト
    pass
```

**TypeScript tests (Vitest):**
```typescript
import { describe, it, expect } from 'vitest';
import { functionName } from './module';

describe('functionName', () => {
  it('正常系: 標準的な入力値でのテスト', () => {
    const result = functionName(10.0, 5.0);
    expect(result).toBe(expected_value);
  });

  it('異常系: ゼロ入力のテスト', () => {
    expect(() => functionName(0, 5.0)).toThrow();
  });

  it('異常系: 負の数入力のテスト', () => {
    expect(() => functionName(-10.0, 5.0)).toThrow();
  });

  it('境界値テスト', () => {
    // 実装に応じた境界値テスト
  });
});
```

## Output Format

Provide the complete implementation in the following structure:

```markdown
## 📋 ロジック概要
[自然言語ロジックの要約]

## 🐍 Python実装

### 関数コード
[Python実装コード]

### テストコード
[pytest テストコード]

## 📘 TypeScript実装

### 関数コード
[TypeScript実装コード]

### テストコード
[Vitest テストコード]

## ⚠️ エッジケース分析
- [検出されたエッジケース1]
- [検出されたエッジケース2]
- [実装された対策]

## 📝 使用例
### Python
[使用例コード]

### TypeScript
[使用例コード]
```

## Best Practices

1. **Type Safety First**: Always use type hints (Python) and type annotations (TypeScript)
2. **Japanese Comments**: All docstrings and comments in Japanese for ScaffAI project
3. **Fail Fast**: Validate inputs at function entry, throw exceptions early
4. **Consistent Naming**: Use snake_case (Python) and camelCase (TypeScript)
5. **Test Coverage**: Aim for >90% code coverage with edge case tests
6. **Domain Context**: Include industry-specific validation (e.g., scaffolding safety standards)
7. **Readable Math**: Break complex calculations into named intermediate variables
8. **Error Messages**: Provide clear, actionable Japanese error messages

## Common ScaffAI Use Cases

### Scaffolding Unit Calculation
```
Input: "壁の長さを1800mm単位で割って、高さを1500mm単位で割って、それを掛ける"
Output: Python + TypeScript functions for calculating scaffold units
```

### Quotation Total Calculation
```
Input: "平米数に単価を掛けて、10%の消費税を加算する"
Output: Price calculation functions with tax handling
```

### Safety Rule Validation
```
Input: "高さが5m以上なら安全ネットが必要、10m以上なら手すりも必要"
Output: Conditional logic functions for safety equipment requirements
```

## Integration with ScaffAI

This skill is designed to work seamlessly with the ScaffAI project structure:

- **Backend**: Generate Python code for `scaffai-backend/services/`
- **Frontend**: Generate TypeScript code for `frontend/lib/` or `frontend/utils/`
- **Shared Logic**: Ensure Python and TypeScript implementations are functionally equivalent
- **Testing**: Follow ScaffAI testing conventions (pytest for backend, Vitest for frontend)
