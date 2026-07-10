# 09 — Seed Atlas and First Vertical Learning Route

## 1. Purpose

The seed atlas proves the product architecture. It is not a claim of exhaustive or final domain coverage.

Seed content must be clearly marked:

- `reviewed` only when deliberately curated and source-backed;
- `draft` when generated as a structural placeholder;
- `priority: now` only when relevant to the first learning route or an immediate Loura design need.

Do not generate hundreds of shallow pages. The initial application should contain a broad orientation map and one deep, useful route.

## 2. Top-level world map

## Supporting roots

### Research, reasoning, and measurement

Central question:

> How do we form, test, qualify, and revise reliable beliefs?

Initial subdomains:

- logic and argument;
- epistemology;
- scientific reasoning;
- causal reasoning;
- measurement;
- experimental design;
- research synthesis.

### Mathematical and computing foundations

Central question:

> What formal and computational tools are prerequisites for the applied branches?

Initial subdomains:

- discrete mathematics;
- probability and statistics;
- graph theory;
- optimization;
- dynamical systems;
- algorithms and data structures;
- networking and databases.

These are supporting roots. Concepts should be pulled into active learning paths only when needed.

## Core branches

### 1. Systems, control, and decision sciences

Central question:

> How do complex systems behave, decide, remain stable, and move toward desired states?

Subdomains:

- systems thinking;
- general systems theory;
- cybernetics;
- dynamical systems;
- control theory;
- complexity and emergence;
- decision theory;
- operations research;
- information theory;
- reliability and resilience.

Key seed concepts:

```text
system
boundary
environment
state
state variable
state transition
goal
desired state
input
output
disturbance
observation
measurement
uncertainty
model
feedback
feedforward
control
controller
actuation
observability
controllability
delay
stability
adaptation
optimization
constraint
trade-off
risk
reliability
resilience
```

### 2. Organizations, coordination, and operational work

Central question:

> How do people, teams, technologies, responsibilities, and incentives combine to produce coordinated action?

Subdomains:

- organizational theory;
- sociotechnical systems;
- division of labor;
- authority and decision rights;
- delegation and accountability;
- coordination mechanisms;
- commitments and obligations;
- organizational communication;
- workflow management;
- business process management;
- case management;
- knowledge work;
- exception-driven work;
- organizational learning.

Key seed concepts:

```text
actor
role
authority
responsibility
accountability
decision right
delegation
commitment
coordination
dependency
handoff
workflow
case
process
procedure
exception
escalation
information asymmetry
incentive
shared context
organizational memory
```

### 3. Information, data, and knowledge systems

Central question:

> How can operational reality be represented, stored, retrieved, related, and kept trustworthy?

Subdomains:

- data modeling;
- database systems;
- information architecture;
- state and event modeling;
- temporal data;
- knowledge representation;
- taxonomies and ontologies;
- knowledge graphs;
- metadata and provenance;
- uncertainty representation;
- search and information retrieval;
- process mining;
- digital twins;
- context modeling.

Key seed concepts:

```text
data
information
knowledge
schema
entity
attribute
relation
event
event log
temporal model
metadata
provenance
traceability
ontology
taxonomy
knowledge graph
embedding
index
retrieval
hybrid search
context
source
claim
evidence
```

### 4. Artificial intelligence, reasoning, and agentic systems

Central question:

> How can computational systems interpret situations, reason under uncertainty, plan, use tools, act, evaluate results, and learn?

Subdomains:

- machine-learning foundations;
- language-model foundations;
- representation and reasoning;
- search and planning;
- decision-making under uncertainty;
- tool use and function calling;
- retrieval and memory;
- agent architectures;
- multi-agent systems;
- human-agent collaboration;
- evaluation, grounding, and robustness.

Key seed concepts:

```text
representation
reasoning
learning
policy
planning
action space
tool use
function call
agent
agency
autonomy
agent state
context window
memory
retrieval
grounding
hallucination
calibration
evaluation
multi-agent coordination
human oversight
guardrail
```

### 5. Software, distributed systems, and enterprise integration

Central question:

> How can Loura be implemented as a dependable system across unreliable, heterogeneous environments?

Subdomains:

- software architecture;
- domain-driven design;
- distributed systems;
- state machines;
- workflow and orchestration engines;
- messaging and event streaming;
- persistence and transactions;
- APIs and integration patterns;
- identity and authorization;
- cloud/edge systems;
- observability;
- reliability engineering;
- testing and release engineering.

Key seed concepts:

```text
module
service
bounded context
state machine
distributed system
concurrency
partial failure
message
event stream
queue
transaction
consistency
idempotency
retry
timeout
deduplication
compensating action
orchestration
choreography
API
connector
authentication
authorization
observability
telemetry
fault tolerance
```

### 6. Human–AI systems, safety, security, and governance

Central question:

> How can humans retain appropriate authority and situational awareness while using AI safely and securely?

Subdomains:

- human-computer interaction;
- cognitive ergonomics;
- decision support;
- levels of automation;
- authority allocation;
- trust and reliance;
- explainability;
- intervention and override;
- error recovery;
- safety engineering;
- AI risk management;
- cybersecurity;
- privacy and data governance;
- auditability and accountability.

Key seed concepts:

```text
human-in-the-loop
human-on-the-loop
automation level
authority allocation
trust calibration
over-reliance
under-reliance
situational awareness
explainability
override
intervention
hazard
safety constraint
risk control
least privilege
auditability
accountability
privacy
data governance
```

### 7. Systems engineering, product design, deployment, and adoption

Central question:

> How is knowledge translated into a system that solves a real problem in a real operating environment?

Subdomains:

- problem framing;
- stakeholder and workflow research;
- requirements engineering;
- capability modeling;
- functional decomposition;
- system architecture;
- model-based systems engineering;
- trade studies;
- prototyping;
- technical risk management;
- integration;
- verification and validation;
- transition and rollout;
- organizational change;
- training and adoption;
- outcome/value measurement;
- continuous improvement.

Key seed concepts:

```text
stakeholder
need
job
outcome
requirement
constraint
capability
function
architecture
interface
trade study
prototype
integration
verification
validation
acceptance criterion
operational environment
deployment
adoption
change management
value measurement
```

## Vertical overlay

### 8. Manufacturing and industrial operations

Central question:

> How do industrial organizations plan, execute, monitor, maintain, and improve production and assets?

Subdomains:

- manufacturing system types;
- production flow;
- planning and scheduling;
- inventory and material flow;
- quality management;
- maintenance and reliability;
- asset management;
- supply chain and logistics;
- lean and continuous improvement;
- industrial safety;
- operational technology;
- enterprise manufacturing systems;
- enterprise-control integration;
- industrial cybersecurity.

Key seed concepts:

```text
production order
work center
routing
schedule
dispatch
work-in-process
bottleneck
quality deviation
nonconformance
maintenance work order
failure mode
downtime
asset
sensor
PLC
SCADA
historian
ERP
MES/MOM
CMMS/EAM
ISA-95
industrial control system
```

## 3. Cross-domain conceptual trunk

The following vocabulary is reused across domains. Canonical homes must still be assigned.

### System

- entity;
- system;
- boundary;
- environment;
- structure;
- capability.

### Intent

- purpose;
- goal;
- value;
- requirement;
- policy.

### Change

- state;
- variable;
- event;
- transition;
- process;
- time.

### Agency

- actor;
- agent;
- role;
- authority;
- responsibility;
- decision;
- plan;
- action.

### Information

- observation;
- signal;
- data;
- information;
- knowledge;
- model;
- context;
- uncertainty.

### Limitation

- constraint;
- resource;
- dependency;
- trade-off;
- risk;
- failure.

### Regulation

- feedback;
- feedforward;
- control;
- coordination;
- monitoring;
- escalation.

### Assurance

- evidence;
- traceability;
- verification;
- validation;
- reliability;
- safety;
- resilience.

### Adaptation

- memory;
- learning;
- updating;
- improvement.

## 4. First learning path: Closed-loop operational execution

## Purpose

Develop the conceptual foundation required to reason about systems that detect operational gaps, coordinate action across humans and software, act through unreliable systems, collect evidence, validate outcomes, and learn.

## Target outcome

The learner can design and critique a closed-loop operational execution architecture for Loura, including state representation, observation, decisions, commitments, agent/tool actions, failure handling, evidence, human authority, and outcome validation.

## Path steps

### Step 1 — System and boundary

Canonical domain: Systems, control, and decision sciences  
Target mastery: Explain (1) or Apply (2)

Learning objective:

- distinguish a system from its environment;
- choose a useful boundary for an operational problem;
- identify actors, resources, interfaces, and excluded conditions.

Prerequisites:

- none beyond basic orientation.

Loura exercise:

Define the boundary of one operational exception that Loura may coordinate. State what is inside, outside, and crossing the boundary.

### Step 2 — Goal, desired state, and requirement

Canonical domain: Systems engineering / systems science  
Target mastery: Apply (2)

Learning objective:

- distinguish purpose, goal, desired state, requirement, and acceptance criterion;
- express an operational objective in observable terms.

Prerequisites:

- system and boundary.

Loura exercise:

Rewrite “resolve the issue” as desired state, constraints, and acceptance criteria.

### Step 3 — State, event, and transition

Canonical domain: Systems / information systems  
Target mastery: Design (3)

Learning objective:

- model current state;
- distinguish event from state;
- represent valid state transitions;
- identify temporal state and lifecycle concerns.

Prerequisites:

- system;
- desired state.

Loura exercise:

Create a state machine for an exception from detection through closure/reopening.

### Step 4 — Observation, measurement, and uncertainty

Canonical domain: Control / measurement  
Target mastery: Apply (2)

Learning objective:

- distinguish actual state from observed/estimated state;
- identify noise, latency, missing data, and confidence;
- specify what is observable and what remains latent.

Prerequisites:

- state;
- model.

Loura exercise:

List evidence sources for the exception and identify what each can and cannot establish.

### Step 5 — Feedback, control, delay, and stability

Canonical domain: Control theory  
Target mastery: Apply (2)

Learning objective:

- explain closed-loop feedback;
- understand why delay and poor observation can destabilize action;
- distinguish feedback from feedforward.

Prerequisites:

- state;
- observation;
- desired state.

Loura exercise:

Map the operational exception as a feedback loop. Identify the controller, plant/process, sensor, actuator, disturbance, and delay.

### Step 6 — Decision, policy, and plan

Canonical domain: Decision science / AI  
Target mastery: Apply (2)

Learning objective:

- distinguish decision, rule/policy, plan, and action;
- reason under constraints and uncertainty;
- identify when replanning is required.

Prerequisites:

- goal;
- observation;
- uncertainty;
- control.

Loura exercise:

Define which decisions can be policy-driven and which require contextual judgment.

### Step 7 — Authority, responsibility, and commitment

Canonical domain: Organizations and coordination  
Target mastery: Design (3)

Learning objective:

- distinguish authority, responsibility, accountability, assignment, and commitment;
- define human/agent decision rights;
- represent ownership without assuming task completion.

Prerequisites:

- actor;
- decision;
- action.

Loura exercise:

Create a responsibility/authority model for the exception, including approval and escalation boundaries.

### Step 8 — Workflow, dependency, and coordination

Canonical domain: Organizational/workflow systems  
Target mastery: Design (3)

Learning objective:

- model dependent and parallel work;
- distinguish workflow from case management and exception handling;
- represent blocked states and handoffs.

Prerequisites:

- commitment;
- state transition;
- plan.

Loura exercise:

Model a multi-actor resolution flow with dependencies, blocked work, and changed conditions.

### Step 9 — Agent, tool use, and bounded autonomy

Canonical domain: Artificial intelligence and agents  
Target mastery: Design (3)

Learning objective:

- distinguish model, agent, workflow, and deployed system capability;
- define tool permissions and action boundaries;
- identify where autonomy is appropriate.

Prerequisites:

- decision;
- plan;
- authority;
- workflow.

Loura exercise:

Classify each workflow step as observe, recommend, approve, execute, verify, or escalate, then assign human/agent responsibility.

### Step 10 — Partial failure, retry, and idempotency

Canonical domain: Distributed systems  
Target mastery: Design (3)

Learning objective:

- understand partial failure and uncertain execution;
- distinguish retry safety from delivery guarantees;
- design idempotent or compensatable actions.

Prerequisites:

- distributed system;
- action;
- state;
- tool use.

Loura exercise:

Design the action protocol for an agent that may time out after sending an external command. Define operation ID, status check, retry, deduplication, and compensation.

### Step 11 — Evidence, provenance, and traceability

Canonical domain: Information and knowledge systems  
Target mastery: Design (3)

Learning objective:

- distinguish assertion from evidence;
- preserve origin and transformation history;
- define traceability from action to source and outcome.

Prerequisites:

- observation;
- action;
- source;
- claim.

Loura exercise:

Define the evidence package required to close the exception and trace each piece to its origin.

### Step 12 — Verification, validation, and closure

Canonical domain: Systems engineering  
Target mastery: Design (3)

Learning objective:

- distinguish action completion, verification, validation, and operational closure;
- define acceptance criteria and reopening conditions;
- avoid false closure.

Prerequisites:

- requirement;
- evidence;
- desired state;
- state transition.

Loura exercise:

Specify what proves the assigned work occurred and what separately proves the operational problem is resolved.

### Step 13 — Escalation, override, and human control

Canonical domain: Human–AI systems / organizations  
Target mastery: Design (3)

Learning objective:

- identify confidence, risk, authority, and time thresholds;
- design intervention and override;
- avoid over-reliance and under-reliance.

Prerequisites:

- authority;
- uncertainty;
- risk;
- validation.

Loura exercise:

Define escalation triggers and exactly what context/evidence must accompany escalation.

### Step 14 — Learning, adaptation, and operational memory

Canonical domain: Systems / organizational learning / AI memory  
Target mastery: Apply (2)

Learning objective:

- distinguish event history from learned policy;
- identify which models, rules, or expectations should update;
- prevent one incident from becoming an unjustified universal rule.

Prerequisites:

- outcome;
- provenance;
- policy;
- validation.

Loura exercise:

Specify what should be remembered after resolution: incident facts, reusable knowledge, policy changes, and unresolved uncertainty.

### Step 15 — Industrial application and integration

Canonical domain: Manufacturing overlay / enterprise integration  
Target mastery: Apply (2) initially

Learning objective:

- map the loop onto ERP/MES/CMMS/SCADA and human communication boundaries;
- identify system-of-record and system-of-action responsibilities;
- account for safety and operational technology constraints.

Prerequisites:

- all core route concepts;
- basic industrial system architecture.

Loura exercise:

Map the exception loop across actual industrial systems and identify every read/write interface, authority boundary, and evidence source.

## 5. Initial relation examples

```text
system ─prerequisite_for→ state
state ─prerequisite_for→ state transition
goal ─prerequisite_for→ desired state
observation ─enables→ state estimation
uncertainty ─constrains→ decision
feedback ─depends_on→ observation
delay ─influences→ feedback
authority ─constrains→ action
commitment ─part_of→ coordination
workflow ─implemented_by→ orchestration engine
partial failure ─explains→ retry ambiguity
idempotency ─enables→ safe retry
evidence ─enables→ verification
verification ─contrasts_with→ validation
validation ─enables→ operational closure
risk ─influences→ escalation
provenance ─enables→ traceability
agent autonomy ─governed_by→ human oversight
```

Use only relation keys present in the configured grammar; adjust labels during seed implementation if needed.

## 6. Initial Loura application examples

These are application links, not canonical definitions.

### Operational state model

Type: component

Linked concepts:

- state;
- event;
- observation;
- uncertainty;
- temporal model;
- provenance.

Relevance:

Loura needs a defensible distinction between actual state, observed state, inferred state, and desired state.

### Agent action protocol

Type: component

Linked concepts:

- partial failure;
- timeout;
- retry;
- idempotency;
- deduplication;
- compensating action;
- auditability.

Relevance:

Loura actions through external systems require explicit semantics for uncertain execution and repeated attempts.

### Human authority model

Type: decision

Linked concepts:

- authority allocation;
- responsibility;
- decision right;
- human-in-the-loop;
- override;
- risk.

Relevance:

Loura must know which actions it may perform, recommend, or escalate under specific conditions.

### Outcome validation mechanism

Type: component

Linked concepts:

- requirement;
- acceptance criterion;
- evidence;
- verification;
- validation;
- closure.

Relevance:

The system must distinguish work completion from achievement of the intended operational result.

## 7. Seed content quality policy

- Definitions should cite at least one canonical or primary source before review status.
- Cross-disciplinary concepts may have a short canonical definition plus domain-specific notes.
- Do not duplicate concepts such as “state” for every branch unless the meanings are genuinely distinct.
- Use aliases and qualified relations for domain usage.
- Mark contested concepts or competing definitions explicitly.
- Do not fabricate bibliographic metadata.
- The seed importer should permit concept placeholders but visually label them draft.

