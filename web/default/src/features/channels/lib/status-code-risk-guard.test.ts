import { describe, expect, it } from 'vitest'
import {
  collectDisallowedStatusCodeRedirects,
  collectInvalidStatusCodeEntries,
  collectNewDisallowedStatusCodeRedirects,
} from './status-code-risk-guard'

describe('status-code-risk-guard', () => {
  it('collects invalid mapping entries only from parsable objects', () => {
    expect(collectInvalidStatusCodeEntries('')).toEqual([])
    expect(collectInvalidStatusCodeEntries('{bad')).toEqual([])
    expect(
      collectInvalidStatusCodeEntries('{"abc":500,"504":"oops","200":201,"524":700}')
    ).toEqual(['504 → oops', '524 → 700', 'abc → 500'])
  })

  it('finds disallowed redirects for non-redirectable status codes', () => {
    expect(
      collectDisallowedStatusCodeRedirects('{"504":500,"524":"503","504":500,"200":201}')
    ).toEqual(['504 -> 500', '524 -> 503'])
    expect(collectDisallowedStatusCodeRedirects('{"504":504,"524":"524"}')).toEqual([])
  })

  it('returns only newly introduced risky redirects', () => {
    const original = '{"504":500}'
    const current = '{"504":500,"524":503}'
    expect(collectNewDisallowedStatusCodeRedirects(original, current)).toEqual(['524 -> 503'])
    expect(collectNewDisallowedStatusCodeRedirects('', '{"200":201}')).toEqual([])
  })

  it('deduplicates and sorts risky mappings', () => {
    expect(
      collectDisallowedStatusCodeRedirects('{"524":503,"504":500,"524":"503"}')
    ).toEqual(['504 -> 500', '524 -> 503'])
  })
})
