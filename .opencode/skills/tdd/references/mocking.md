# When to mock

Mock at **system boundaries** only: external APIs (payment, email), databases
(prefer a test database), time and randomness, the filesystem (sometimes).

Do not mock your own modules, internal collaborators, or anything you
control.

## Designing for mockability

At system boundaries, design interfaces that are easy to mock.

**Pass dependencies in rather than creating them internally:**

```typescript
// easy to mock
function processPayment(order, paymentClient) {
  return paymentClient.charge(order.total)
}

// hard to mock
function processPayment(order) {
  const client = new StripeClient(process.env.STRIPE_KEY)
  return client.charge(order.total)
}
```

**Prefer SDK-style interfaces over one generic fetcher.** Specific
functions per operation make each mock return one shape, with no
conditional logic in the setup.