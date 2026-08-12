package rumpun.authz

import future.keywords.if
import future.keywords.in

default allow := false

reason_code := "default_deny" if { not allow }

allow if {
    input.actor.authenticated == true
    input.membership.active == true
    "administrator" in input.membership.roles
}

allow if {
    input.actor.authenticated == true
    input.membership.active == true
    "editor" in input.membership.roles
    editor_allowed_actions[input.action]
}

allow if {
    input.actor.authenticated == true
    input.membership.active == true
    "contributor" in input.membership.roles
    contributor_allowed_actions[input.action]
}

allow if {
    input.actor.authenticated == true
    input.membership.active == true
    "viewer" in input.membership.roles
    viewer_allowed_actions[input.action]
}

editor_allowed_actions := {
    "tree.read",
    "tree.update",
    "person.read",
    "person.list",
    "person.create",
    "person.update",
    "source.read",
    "source.list",
    "source.create",
    "source.update",
    "citation.create",
    "citation.delete",
    "relationship.create",
    "relationship.update",
}

contributor_allowed_actions := {
    "tree.read",
    "person.read",
    "person.list",
    "source.read",
    "source.list",
}

viewer_allowed_actions := {
    "tree.read",
    "person.read",
    "person.list",
}
