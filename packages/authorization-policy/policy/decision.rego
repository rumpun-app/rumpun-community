package rumpun.authz.decision

import future.keywords.if

default allow := false

reason_code := "authentication_required" if {
    not input.actor.authenticated
}

reason_code := "membership_required" if {
    input.actor.authenticated == true
    not input.membership.active
}

reason_code := "action_not_allowed" if {
    input.actor.authenticated == true
    input.membership.active == true
    not data.rumpun.authz.allow
}

policy_revision := "dev-revision-001"
