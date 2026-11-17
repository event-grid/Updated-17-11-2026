/**
 * Shared kernel available to every module: IDs, correlation context, error model, audit and idempotency.
 * It holds no business rules. Declared OPEN so its sub-packages ({@code kernel}, {@code error},
 * {@code audit}, {@code idempotency}) can be used by all modules (BACKEND_ARCHITECTURE.md, section 3).
 */
@org.springframework.modulith.ApplicationModule(type = org.springframework.modulith.ApplicationModule.Type.OPEN)
package com.evntgrid.shared;
