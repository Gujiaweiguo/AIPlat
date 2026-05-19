import { describe, expect, it } from 'vitest'
import {
  MATCH_CONTAINS,
  MATCH_EQ,
  MATCH_EXISTS,
  MATCH_GTE,
  MATCH_GT,
  MATCH_LT,
  MATCH_LTE,
  MATCH_RANGE,
  SOURCE_HEADER,
  SOURCE_PARAM,
  SOURCE_TIME,
  TIME_FUNCS,
  buildRequestRuleExpr,
  combineBillingExpr,
  createEmptyCondition,
  createEmptyRuleGroup,
  createEmptyTimeCondition,
  createEmptyTimeRuleGroup,
  getRequestRuleMatchOptions,
  normalizeCondition,
  splitBillingExprAndRequestRules,
  tryParseRequestRuleExpr,
} from './billing-expr'

describe('billing-expr request rules', () => {
  it('parses request rule expressions for headers, params and time conditions', () => {
    expect(TIME_FUNCS).toContain('hour')
    const parsed = tryParseRequestRuleExpr(
      '(header("x-env") != "" && param("tier") == "pro" ? 2 : 1) * ((hour("UTC") >= 22 || hour("UTC") < 6) ? 3 : 1)'
    )
    expect(parsed).toEqual([
      {
        conditions: [
          { source: 'header', path: 'x-env', mode: MATCH_EXISTS, value: '' },
          { source: 'param', path: 'tier', mode: MATCH_EQ, value: 'pro' },
        ],
        multiplier: '2',
      },
      {
        conditions: [
          {
            source: 'time',
            timeFunc: 'hour',
            timezone: 'UTC',
            mode: MATCH_RANGE,
            value: '',
            rangeStart: '22',
            rangeEnd: '6',
          },
        ],
        multiplier: '3',
      },
    ])
    expect(tryParseRequestRuleExpr('(unknown ? 2 : 1)')).toBeNull()
    expect(tryParseRequestRuleExpr('')).toEqual([])
  })

  it('splits and combines billing and request-rule expressions', () => {
    expect(
      splitBillingExprAndRequestRules('(tier("base", p * 1 + c * 2)) * (header("x") != "" ? 2 : 1)')
    ).toEqual({
      billingExpr: 'tier("base", p * 1 + c * 2)',
      requestRuleExpr: '(header("x") != "" ? 2 : 1)',
    })
    expect(splitBillingExprAndRequestRules('tier("base", p * 1 + c * 2)')).toEqual({
      billingExpr: 'tier("base", p * 1 + c * 2)',
      requestRuleExpr: '',
    })
    expect(combineBillingExpr('tier("base", p * 1 + c * 2)', '(param("tier") == "pro" ? 2 : 1)')).toBe(
      '(tier("base", p * 1 + c * 2)) * (param("tier") == "pro" ? 2 : 1)'
    )
    expect(combineBillingExpr('', '(param("tier") == "pro" ? 2 : 1)')).toBe('')
  })

  it('creates empty editor states and returns correct match options', () => {
    expect(createEmptyCondition()).toEqual({ source: SOURCE_PARAM, path: '', mode: MATCH_EQ, value: '' })
    expect(createEmptyTimeCondition()).toEqual({
      source: SOURCE_TIME,
      timeFunc: 'hour',
      timezone: 'Asia/Shanghai',
      mode: MATCH_GTE,
      value: '',
      rangeStart: '',
      rangeEnd: '',
    })
    expect(createEmptyRuleGroup()).toEqual({ conditions: [createEmptyCondition()], multiplier: '' })
    expect(createEmptyTimeRuleGroup()).toEqual({ conditions: [createEmptyTimeCondition()], multiplier: '' })
    expect(getRequestRuleMatchOptions(SOURCE_TIME).map((option) => option.value)).toEqual([MATCH_EQ, MATCH_GTE, MATCH_LT, MATCH_RANGE])
    expect(getRequestRuleMatchOptions(SOURCE_HEADER).map((option) => option.value)).toEqual([MATCH_EQ, MATCH_CONTAINS, MATCH_EXISTS])
    expect(getRequestRuleMatchOptions(SOURCE_PARAM).map((option) => option.value)).toEqual([MATCH_EQ, MATCH_CONTAINS, MATCH_EXISTS, MATCH_GT, MATCH_GTE, MATCH_LT, MATCH_LTE])
  })

  it('normalizes conditions and rebuilds valid rule expressions', () => {
    expect(normalizeCondition({ source: 'header', mode: 'unsupported', path: 1 as never, value: 2 as never })).toEqual({
      source: 'header',
      path: 1,
      mode: MATCH_EQ,
      value: '2',
    })
    expect(normalizeCondition({ source: 'time', timeFunc: 'bad' as never, mode: MATCH_RANGE, timezone: '', rangeStart: 22 as never, rangeEnd: 6 as never })).toEqual({
      source: 'time',
      timeFunc: 'hour',
      timezone: 'Asia/Shanghai',
      mode: MATCH_RANGE,
      value: '',
      rangeStart: '22',
      rangeEnd: '6',
    })

    const expr = buildRequestRuleExpr([
      {
        multiplier: '2',
        conditions: [
          { source: 'param', path: 'tier', mode: MATCH_CONTAINS, value: 'pro' },
          { source: 'time', timeFunc: 'hour', timezone: 'UTC', mode: MATCH_RANGE, value: '', rangeStart: '22', rangeEnd: '6' },
        ],
      },
      {
        multiplier: '1.5',
        conditions: [{ source: 'header', path: 'x-env', mode: MATCH_EXISTS, value: '' }],
      },
    ])
    expect(expr).toBe('(param("tier") != nil && has(param("tier"), "pro") && (hour("UTC") >= 22 || hour("UTC") < 6) ? 2 : 1) * (header("x-env") != "" ? 1.5 : 1)')
    expect(buildRequestRuleExpr([{ multiplier: 'oops', conditions: [createEmptyCondition()] }])).toBe('')
  })

  it('builds numeric and equality request conditions through parser roundtrip', () => {
    const expr = buildRequestRuleExpr([
      {
        multiplier: '2',
        conditions: [
          { source: 'param', path: 'count', mode: MATCH_GT, value: '3' },
          { source: 'header', path: 'x-mode', mode: MATCH_EQ, value: 'fast' },
        ],
      },
    ])
    expect(expr).toBe('(param("count") != nil && param("count") > 3 && header("x-mode") == "fast" ? 2 : 1)')
    expect(tryParseRequestRuleExpr(expr)).toBeNull()
  })
})
