# Good and bad tests

## Good tests

**Integration-style:** through real interfaces, not mocks of internal parts.

```typescript
// GOOD: tests observable behavior
test("user can checkout with valid cart", async () => {
  const cart = createCart()
  cart.add(product)
  const result = await checkout(cart, paymentMethod)
  expect(result.status).toBe("confirmed")
})
```

- Tests behavior users and callers care about
- Uses the public API only
- Survives internal refactors
- Describes WHAT, not HOW
- One logical assertion per test

## Bad tests

**Implementation-detail tests:** coupled to internal structure.

```typescript
// BAD: tests implementation details
test("checkout calls paymentService.process", async () => {
  const mockPayment = mock(paymentService)
  await checkout(cart, mockPayment)
  expect(mockPayment.process).toHaveBeenCalledWith(cart.total)
})
```

Red flags: mocking internal collaborators; testing private methods;
asserting on call counts or order; a test that breaks on refactor while
behavior is unchanged; a name that describes HOW not WHAT; verifying through
a side channel instead of the interface.

**Tautological tests:** the expected value restates the implementation, so
the test passes by construction.

```typescript
// BAD: expected value recomputed the way the code computes it
test("calculateTotal sums line items", () => {
  const items = [{ price: 10 }, { price: 5 }]
  const expected = items.reduce((sum, i) => sum + i.price, 0)
  expect(calculateTotal(items)).toBe(expected)
})

// GOOD: an independent, known literal
test("calculateTotal sums line items", () => {
  expect(calculateTotal([{ price: 10 }, { price: 5 }])).toBe(15)
})
```