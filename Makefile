SHELL := /bin/bash

.PHONY: launch status doctor readiness skills agent config

launch:
	./scripts/oc-launch

status:
	./scripts/oc-status

doctor:
	./scripts/oc-doctor

readiness:
	./scripts/oc-readiness

skills:
	./scripts/oc-skills

agent:
	./scripts/oc-agent

config:
	./scripts/oc config validate

