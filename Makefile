.PHONY: ledger ledger.stale record help
help:
	@echo 'targets: ledger ledger.stale record'
ledger:
	@bun tools/ledger/query.ts green
ledger.stale:
	@bun tools/ledger/query.ts stale
record:
	@bun tools/ledger/record.ts $(GATE) -- $(CMD)
