# Knowledge management and domain modeling — the theory

**Question:** We are designing an agentic system that must keep a *glossary* —
a shared, continuously and incrementally built vocabulary — so that the human
user and multiple AI agents stay in sync about what terms and phrases mean,
one term at a time, *as each term matters*. Our previous design failed: the
discipline of maintaining the glossary was given to interactive agents whose
attention was stretched too thin. What are the theoretical foundations —
terminology science, knowledge management, ontology engineering, CSCW — on
which to rebuild it?

**Date:** 2026-10-26. Researched against primary and authoritative sources:
ISO terminology standards, NISO/W3C vocabulary standards, the knowledge
management literature (Nonaka et al.), CSCW field studies, and current
(preprint) scholarship on shared language in human-AI and multi-agent
systems. Companion file: `knowledge-management-practice.md` (how real systems
do this in practice).

Citation style: Author (year), *Title*, publisher/venue — with clause or page
where the claim is specific, and URL for standards and preprints.

---

## 1. What a shared vocabulary actually is

### The objects: term, concept, definition

- **Terminology is designations plus concepts, not just words.**
  ISO 1087:2019, 3.1.7 defines *terminology* as the "set of designations …
  and concepts … belonging to one domain … or subject"
  (ISO 1087:2019, *Terminology work and terminology science — Vocabulary*,
  ISO/TC 37; browsable at https://www.iso.org/obp/ui/#iso:std:iso:1087:en).
  ISO 704:2022 puts the same point in workflow terms: "Objects are perceived
  or conceived and abstracted into concepts. Concepts are represented by
  designations and/or definitions. The set of designations and concepts
  belonging to one special language constitutes the terminology of a specific
  domain or subject" (ISO 704:2022, *Terminology work — Principles and
  methods*, Introduction §0.1; https://www.iso.org/standard/79077.html).
- **A concept is a unit of knowledge, distinct from the word that names it.**
  ISO 1087:2019, 3.2.7: a *concept* is a "unit of knowledge created by a
  unique combination of characteristics" — i.e., a concept is defined by its
  intension (the set of characteristics), not by its name. ISO 704:2022, §5.1
  restates for the practitioner: "In terminology work, concepts shall be
  considered units of knowledge that correspond to objects or groups of
  objects", and stresses the abstraction step: "The link between an object
  and its corresponding designation or definition is made through the
  concept, a higher level of abstraction" — a designation is assigned to the
  concept, not to the objects themselves.
- **A term is a verbal designation of a concept, in a subject field.**
  ISO 1087:2019, 3.4.2: a *term* is a "verbal designation of a general
  concept in a specific subject field" (designations also come as appellations,
  proper names, and non-linguistic symbols — 3.4.1, 3.4.4, 3.4.5). Note the
  "specific subject field" qualifier: the standard assumes terms mean
  something *within a domain*, not globally.
- **A definition is a representation of a concept that delimits it.**
  ISO 1087:2019, 3.3.1: a *definition* is a "representation of a concept by an
  expression that describes it and differentiates it from related concepts".
  Differentiation is the job: a definition states the delimiting
  characteristic(s) — "the essential characteristic used for distinguishing a
  concept from related concepts" (ISO 1087:2019, 3.2.5).
- **The term/concept/definition triad is the fixed schema of a glossary
  entry.** The standard term record (a "terminological entry") is a
  "collection of terminological data related to only one concept"
  (ISO 704:2022, 3.4) and carries, per entry: preferred term(s), admitted
  term(s), definition, and note(s) (ISO 1087:2019, Foreword/entry layout;
  data-model detail in ISO 26162-1:2019, *Management of terminology
  resources — Part 1: Design*), i.e. one concept per record — a design
  constraint worth stealing directly.

### Controlled vocabulary, thesaurus, ontology, conceptual model

- **A controlled vocabulary is a maintained list of terms with preferred
  forms and rules for use.** ANSI/NISO Z39.19-2005 (R2010), *Guidelines for
  the Construction, Format, and Management of Monolingual Controlled
  Vocabularies*, National Information Standards Organization, covers content,
  relationships, "construction, testing, maintenance, and management"
  of vocabularies (abstract at https://www.niso.org/publications/ansiniso-z3919-2005-r2010).
- **A thesaurus is a controlled vocabulary with an explicit relationship
  network** (equivalence, hierarchy, association). ISO 25964-1:2011,
  *Thesauri and interoperability with other vocabularies — Part 1:
  Thesauri for information retrieval*; the W3C SKOS recommendation exists
  specifically to publish such vocabularies as machine-readable data (Miles,
  A. & Bechhofer, S. (eds.) (2009), *SKOS Simple Knowledge Organization
  System Reference*, W3C Recommendation 18 August 2009,
  https://www.w3.org/TR/skos-reference/ — "a common data model for sharing
  and linking knowledge organization systems via the Web").
- **An ontology is a formalized conceptualization meant to be shared.**
  T. R. Gruber (1993), "A translation approach to portable ontology
  specifications", *Knowledge Acquisition* 5(2):199–220: an ontology is "an
  explicit specification of a conceptualization." Studer, Benjamins &
  Fensel (1998), "Knowledge engineering: principles and methods", *Data &
  Knowledge Engineering* 25(1–2):161–197, tighten the definition in two ways
  that matter for us: an ontology is "a formal, explicit specification of a
  shared conceptualisation" — *formal* (machine-checkable) and *shared*
  (agreed by a group). An informal glossary is an ontology missing those two
  properties.
- **A concept system / conceptual model is the relationship structure the
  terms hang on.** ISO 1087:2019, 3.2.28: a *concept system* is a "set of
  concepts structured in one or more related domains according to the
  concept relations among its concepts"; ISO 704:2022 rows concepts into
  hierarchical (generic, partitive) and associative relations (§5.5) and
  builds concept systems from concept fields (§5.6).
- **In software design, the shared vocabulary is the "ubiquitous language."**
  E. Evans (2003), *Domain-Driven Design*, Addison-Wesley: a team's model is
  expressed in a single language spoken consistently in code, conversation,
  and documents — "one team, one language" — and each bounded context owns
  its own dialect; costs come from translation between models. This is the
  software-engineering home of the same idea the terminology standards
  formalize.

### When it pays off, and when it costs more than it gives

- **Codification (writing terms down) has costs and benefits; it pays only
  where knowledge is reused.** R. Cowan & D. Foray (1997), "The economics of
  codification and the diffusion of knowledge", *Industrial and Corporate
  Change* 6(3):595–622: codified knowledge diffuses, but codification itself
  consumes resources (memory, communication, learning costs) and can
  ossify mistaken knowledge — the argument for codifying only what will
  actually be reused, on demand, not everything up front.
- **The strategy choice is codification vs. personalization.** M. Hansen,
  N. Nohria & T. Tierney (1999), "What's your strategy for managing
  knowledge?", *Harvard Business Review* 77(2):106–116: organizations should
  pick one dominant strategy; codify knowledge that will be used by many
  people, personalize (connect people to experts) where context is rich —
  a glossary is a small, cheap codification layer; it is wrong to treat it
  as a full codification program.
- **There is no single correct ontology; scope follows purpose.**
  N. Noy & D. McGuinness (2001), "Ontology Development 101: A Guide to
  Creating Your First Ontology", Stanford KSL Technical Report KSL-01-05
  (https://protege.stanford.edu/publications/ontology_development/ontology101.html):
  there is always more than one viable way to model a domain; the right
  granularity is set by the applications and questions the ontology must
  support; development is iterative. Over-modeling is a known failure mode.
- **Common ground is bought, not free.** H. Clark & S. Brennan (1991),
  "Grounding in communication", in Resnick, Levine & Teasley (eds.),
  *Perspectives on Socially Shared Cognition*, APA: mutual understanding
  ("grounding") carries measurable costs (formulation, production,
  understanding, repair…), and H. Clark & D. Wilkes-Gibbs (1986),
  "Referring as a collaborative process", *Cognition* 22(1):1–39, found
  partners follow a *principle of least collaborative effort* — they invest
  only the mutual effort the current purpose warrants. Klein, Feltovich,
  Bradshaw & Woods (2005), "Common Ground and Coordination in Joint
  Activity", in *Organizational Simulation*, Wiley, pp. 139–184, make the
  same point for teams and human–agent joint activity: building and
  maintaining common ground is expensive; teams buy only what the joint
  activity requires and repair gaps as they surface. The economic lesson:
  a vocabulary that no one needs to share is pure overhead; capture terms
  when the shared need appears, not because they exist.
- **A term earns its place by warrant.** ANSI/NISO Z39.19-2005, §5
  ("warrant"): justification for admitting a term comes from *literary
  warrant* (it appears in the domain's working literature), *user warrant*
  (users request it), and *organizational warrant* (the organization's
  needs require it). This is the standard's answer to "does this term
  matter?": each admitted term needs one of these justifications.
- **From the economics side, codified knowledge only pays when someone
  else actually reuses it.** M. L. Markus (2001), "Toward a theory of
  knowledge reuse: types of knowledge reuse situations and factors in reuse
  success", *Journal of Management Information Systems* 18(1):57–93:
  knowledge producers and consumers are different people with different
  incentives; the cost of capture is borne by producers, the benefit lands
  on consumers — so capture work is systematically under-supplied unless
  reuse is real and demonstrable.

---

## 2. How vocabularies are built and maintained incrementally

### The standard terminology work process

- **Terminology work is a defined, systematic activity.** ISO 1087:2019,
  3.5.1: *terminology work* is "work concerned with the systematic
  collection, description, processing and presentation of concepts and
  their designations" (cited from ISO 704:2022, Introduction §0.1, which
  says the goal is "clarification and standardization of terminology for
  communication between humans").
- **The per-term method is terminological analysis.** ISO 704:2022, §5.4.2
  lists its steps explicitly: identify the domain/subject → identify the
  properties of objects → determine which properties abstract into
  characteristics → determine how characteristics combine into the concept →
  identify relations to other concepts → write/identify and analyse
  definitions → assign a designation to the concept. This is a one-term-at-a-
  time pipeline, exactly the granularity our system needs; note the standard
  assumes per-term *analysis* (research of content about the domain) and
  explicitly says an experienced terminologist does it quickly for familiar
  concepts.
- **Characteristics are selected for purpose, because distinguishing
  properties are effectively infinite.** ISO 704:2022, §5.4.2: "In selecting
  properties and characteristics, these purposes need to be borne in mind,
  since the number of properties that distinguish one object from another is
  effectively infinite" — the standard's own justification for *purpose-
  limited* modeling, not exhaustive description.
- **Intension determines extension.** ISO 704:2022, §5.4.3: "The set of
  characteristics that make up the concept is the intension of the concept.
  The set of objects conceptualized as a concept is the extension of the
  concept. The intension determines the extension." A definition that lists
  the right characteristics is therefore *testable* against instances —
  the basis for machine-checkable glossary entries.
- **Essential vs. non-essential vs. delimiting characteristics.**
  ISO 704:2022, §5.4.4–5.4.5: essential characteristics are those "whose
  absence leads to poor or even erroneous understanding of the concept";
  delimiting characteristics distinguish the concept from its neighbors;
  shared characteristics mark the family resemblance. Definitions should be
  built from these, in that priority order.

### Definitions: the quality grammar

- **Intensional definitions are the norm and are preferable.**
  ISO 704:2022, 3.3 and §6.2: an intensional definition "conveys the
  intension of a concept by stating the immediate superordinate concept and
  the delimiting characteristic(s)", e.g. *optical mouse* = computer mouse
  in which movement is detected by light sensors; "they should be used
  whenever possible" (Note 1 to 3.3). Extensional definitions (enumerate
  members) exist but are weaker, per §6.3/6.4.5.
- **The standard names the failure classes of definitions.**
  ISO 704:2022, §6.5: *circular* definitions (§6.5.2), *inaccurate*
  definitions (§6.5.3), *negative* definitions (§6.5.4), and the
  substitution principle for testing them (§6.4.4). These are mechanical,
  machine-auditable checks — a validator agent can enforce them.

### Lifecycle: proposal, rating, retirement

- **Terms carry an explicit acceptability rating.** ISO 1087:2019,
  3.4.19–3.4.22, with the scale stated in the entry for *rated term*:
  "preferred term, admitted term, deprecated term" (plus *obsolete*,
  3.4.22: "term which is no longer in common use"). A term never has to
  be deleted to be demoted — deprecation demotes *the designation*, not
  the concept. ISO 704:2022 lists this as "acceptability rating"
  (§7.7.7) alongside synonymy (§7.7.2) and harmonization (§7.7.6).
- **Candidates are distinct from accepted terms.** ANSI/NISO
  Z39.19-2005 defines *candidate terms* ("proposed descriptors that have
  not gone through all acceptance procedures", §8.6 area; the standard
  includes a Sample Candidate Term Form — Appendix E) — a proposal stage
  separated from entry into the vocabulary.
- **Vocabularies must be continuously maintained, not finished.**
  ANSI/NISO Z39.19-2005, §8 (maintenance): vocabularies "must be kept
  current"; new candidate terms are collected and reviewed on a schedule
  as warranted. The standard treats the maintenance organization (who
  reviews, approves) as part of the vocabulary's specification.
- **Governance is itself standardized.** ISO 29383:2020, *Terminology
  policies — Development and implementation* (ISO/TC 37/SC 1;
  https://www.iso.org/standard/71971.html): a standard for policy makers
  in "governments, administration, non-profit and profit organizations"
  defining key concepts, scenarios that call for terminology policies, and
  methodology — i.e., the standards body has codified the question "who may
  define and change a term, and how."

### Conflict and drift

- **One term ↔ one concept in a domain is the ideal; the standard names
  the failure modes.** ISO 704:2022, §7.7.1 "Mononymy and monosemy"; the
  violations are spelled out in ISO 1087:2019: *homonymy* (3.4.29 — one
  designation, unrelated concepts: "bark"), *polysemy* (3.4.28 — one
  designation, related-but-distinct senses: "bridge"), *synonymy* (3.4.23 —
  several designations for one concept: "deuterium"/"heavy hydrogen").
  When two meanings fight for one term, terminology practice requires
  disambiguating the *concepts* and re-designating, rating synonyms
  preferred/admitted/deprecated — the standardized way to end a term fight.
- **The same objects get different concepts in different domains, by
  design.** ISO 704:2022, §5.1: "Different domains or subjects view the
  same objects differently", with the worked example of 'water' defined
  differently in chemistry, physics, and biology — cross-context
  homonymy is legitimate and is handled with domain-qualified entries,
  which is the terminology-standard twin of Evans' bounded contexts.
- **Harmonization is a named activity.** ISO 704:2022, §7.7.6,
  "Harmonization": reducing minor differences between concepts/terms (the
  ISO 1087 entries define *concept harmonization* and *term harmonization*)
  — the maintenance task of reconciling near-duplicate meanings.
- **Codified knowledge drifts and goes stale; memory is negotiated, not a
  store.** M. Ackerman & C. Halverson (2000), "Reexamining organizational
  memory", *Communications of the ACM* 43(1):58–63: field study of a
  telephone hotline showed organizational memory (definitions, procedures)
  is continuously *negotiated* against the work context; and (2004),
  "Organizational memory as objects, processes, and trajectories: an
  examination of organizational memory in use", *Computer Supported
  Cooperative Work* 13(2):155–189: memory lives in objects-plus-the-
  processes-that-use-them. A glossary whose terms are never re-touched
  against real use drifts from meaning in the field.
- **Classification systems drift unless someone keeps them.** G. Bowker &
  S. L. Star (1999), *Sorting Things Out: Classification and Its
  Consequences*, MIT Press: all working classification systems require
  ongoing, largely invisible maintenance work, and their categories encode
  negotiated social decisions.

### How an organization decides "this term now matters"

- **Warrant is the gate.** ANSI/NISO Z39.19-2005, §5: literary warrant
  (the term is being used in the actual work/corpus), user warrant (people
  are asking what it means / how to use it), organizational warrant (a
  decision or standard needs it). A term "matters" when one of these fires —
  this is the canonical, checkable criterion for proposal.
- **Terminology work is demand-driven, in service of communication.**
  ISO 704:2022, §4: "Attention should be focused on how one deals with
  objects for the purposes of communication"; the Introduction frames
  terminology work as serving "unambiguous communication in natural
  language" (§0.1). The standard's workflow starts from content that
  already exists in the domain (§5.4.2: "A terminologist … can begin by
  analysing content that describes objects by means of designations") —
  capture is triggered by encountered use, not by abstract taxonomizing.
- **Teams buy common ground as the joint activity demands it.** Klein,
  Feltovich, Bradshaw & Woods (2005), op. cit.: common ground is defined
  relative to the joint activity (the "basic compact": parties enter with
  shared understanding of the activity basics), and the team's management of
  it — establishing, checking, repairing — happens around activities where
  coordination is required, not as an up-front total inventory.

---

## 3. Knowledge capture "as it matters" — just-in-time vs. up-front

### Tacit and explicit: what capture can and cannot do when

- **Tacit knowledge is the part that resists telling.** M. Polanyi (1966),
  *The Tacit Dimension*, Doubleday: "we can know more than we can tell"
  (p. 4) — the foundation of the tacit/explicit distinction, picked up by
  Nonaka (below) and by the computer-science "knowledge acquisition
  bottleneck" literature.
- **The canonical model of the two kinds is Nonaka's.** I. Nonaka (1994),
  "A dynamic theory of organizational knowledge creation", *Organization
  Science* 5(1):14–37: tacit knowledge has cognitive and technical elements
  and "the key to acquiring tacit knowledge is experience"; explicit
  knowledge "is discrete or 'digital'" — articulable, storable, transmittable.
  A glossary entry is a pure unit of explicit knowledge; the tacit part
  (why this term matters, what the field really does) is what makes writing
  the entry hard.
- **The SECI spiral: the four conversions.** Nonaka (1994), op. cit.
  (with the full model in I. Nonaka & H. Takeuchi (1995), *The
  Knowledge-Creating Company*, Oxford University Press): Socialization
  (tacit→tacit), Externalization (tacit→explicit), Combination
  (explicit→explicit), Internalization (explicit→tacit). Glossary-writing
  is Externalization and Combination: Nonaka is explicit that
  "concept creation involves a difficult process of externalization, i.e.,
  converting tacit knowledge (which by nature is hard to articulate) into
  an explicit concept" — writing a real definition is a knowledge-creation
  act, not transcription, and it fails when performed away from the
  experience.
- **Externalization happens at the moment of articulation, in a context
  (ba).** Nonaka (1994), op. cit.: "Organizations continuously create new
  knowledge by reconstructing existing perspectives, frameworks, or premises
  on a day-to-day basis", and individuals accumulate the raw material
  "through direct 'hands-on' experience". I. Nonaka & N. Konno (1998),
  "The concept of 'ba'", *California Management Review* 40(3):40–54: the
  shared context/space where this conversion happens. Implication: capture
  must be *situated at the point where the term is actually being used and
  deployed* — today's design question of WHERE in the workflow — not in a
  detached review pass.
- **Situated learning: knowledge is inseparable from the practice.**
  J. Lave & E. Wenger (1991), *Situated Learning: Legitimate Peripheral
  Participation*, Cambridge University Press: knowing is distributed in
  activity; abstractions taught out of context don't stick. Definitions
  must stay anchored to the concrete work that spawned them.

### Just-in-time capture and delivery

- **The named KM strategy is just-in-time.** T. H. Davenport & J. Glaser
  (2002), "Just-in-time delivery comes to knowledge management",
  *Harvard Business Review* 80(7):107–111,126: from the Partners HealthCare
  experience, the viable pattern is knowledge delivered *where and when the
  work happens* — embedded into the transaction/workflow (e.g., decision
  support in the order-entry screen) rather than collected in a separate
  library. Captured at the moment of use it is cheap and accurate; captured
  anywhere else it is expensive and low-quality — the same lever applies
  symmetrically to *writing* terms.
- **Performance support is the older name for the same principle.**
  G. Gery (1991), *Electronic Performance Support Systems*, Weingarten
  Publications: provide task-specific knowledge at the moment of need,
  integrated into the work system.
- **The knowledge acquisition bottleneck is why up-front modeling fails.**
  E. Feigenbaum & P. McCorduck (1983), *The Fifth Generation*,
  Addison-Wesley: the dominant cost and blocker of expert systems was
  extracting and formalizing experts' knowledge (the "knowledge acquisition
  bottleneck"); CYC's decades-long attempt to hand-encode common sense
  is the canonical demonstration of the cost of exhaustive up-front capture
  (D. Lenat & R. Guha (1990), *Building Large Knowledge-Based Systems:
  Representation and Inference in the Cyc Project*, Addison-Wesley).
  Transfer: don't pre-enumerate the domain; harvest terms as they become
  load-bearing.
- **Ontology engineering converged on the same answer: iterate, driven by
  competency questions.** M. Uschold & M. Grüninger (1996), "Ontologies:
  principles, methods and applications", *Knowledge Engineering Review*
  11(2):93–136: scope an ontology by the *competency questions* it must
  answer; recommend a middle-out (core-first, then extend) strategy.
  Noy & McGuinness (2001), op. cit.: development is iterative and
  purpose-bound. A. Gómez-Pérez, M. Fernández-López & O. Corcho (2004),
  *Ontological Engineering*, Springer: methodology (METHONTOLOGY) with a
  lifecycle incl. re-specification and re-modeling phases — modeling admits
  change as normal, not as anomaly.
- **Only codify when reuse is expected.** Cowan & Foray (1997), op. cit.;
  Markus (2001), op. cit. (see §1) — combined, they predict the failure we
  had: capture that is decoupled from a real, proximate reuse prospect is
  never performed, because the producer bears all cost and sees no benefit.

---

## 4. What makes vocabulary maintenance succeed or fail in practice

### The attention budget

- **The binding constraint on every glossary design is attention.**
  H. A. Simon (1971), "Designing organizations for an information-rich
  world", in Greenberger (ed.), *Computers, Communications, and the Public
  Interest*, Johns Hopkins Press: "in an information-rich world, the
  wealth of information means a dearth of something else: a scarcity of
  whatever it is that information consumes. What information consumes is
  rather obvious: it consumes the attention of its recipients. Hence a
  wealth of information creates a poverty of attention and a need to
  allocate that attention efficiently among the overabundance of
  information sources that might consume it." Our failure — assigning
  glossary discipline to interactive agents whose attention is spent on the
  conversation — is this scarcity in miniature; every glossary request
  competes with the task at hand and loses.

### Why distributed casual maintenance fails

- **The work/benefit disparity is the canonical groupware killer.**
  J. Grudin (1994), "Groupware and social dynamics: eight challenges for
  developers", *Communications of the ACM* 37(1):92–105: "Most groupware
  requires some people to do additional work to enter or process
  information that the application requires or produces"; when the person
  who must do the extra work is not the beneficiary, adoption fails — with
  the shared-calendar and project-management field examples. His contrast
  is precisely the fix: in organizational information systems "doing the
  additional work becomes someone's explicit job" (same paper). A glossary
  maintained as a side duty of everyone (or of every agent) is the
  textbook failure configuration; a glossary maintained as someone's
  designated job is the textbook fix.
- **The commons metaphor is literal.** G. Hardin (1968), "The tragedy of
  the commons", *Science* 162(3859):1243–1248: a shared resource that
  everyone may enrich and no one is accountable for degrades ("freedom in
  a commons brings ruin to all"). Knowledge is formally a commons in this
  sense — C. Hess & E. Ostrom (eds.) (2007), *Understanding Knowledge as
  a Commons*, MIT Press (subtractive only in some aspects, but provision
  incentives fail the same way: contributors pay, free-riders read).
- **The field evidence on organizational memory matches.**
  Ackerman & Halverson (2000), op. cit.: the hotline study — memory kept in
  repositories that were divorced from the social context of the work went
  stale and unused; people preferred asking each other. The lesson is not
  "don't codify": memory systems fail when detached from the workflow where
  the knowledge forms and is used.
- **Knowledge sharing needs motivation, not just technology.**
  M. Alavi & D. Leidner (2001), "Review: knowledge management and
  knowledge management systems — conceptual foundations and research
  issues", *MIS Quarterly* 25(1):107–136 (survey finding: KMS adoption
  requires incentives and culture; T. H. Davenport & L. Prusak (1998),
  *Working Knowledge*, Harvard Business School Press, on why KM programs
  fail when divorced from work).
- **Transactive memory: groups need a directory, and the directory needs a
  language.** D. Wegner (1987), "Transactive memory: a contemporary
  analysis of the group mind", in Mullen & Goethals (eds.), *Theories of
  Group Behavior*, Springer: groups store knowledge distributed across
  members plus a shared directory of "who knows what" — for our system the
  glossary *is* the directory's indexing scheme, and it must be cheap to
  update or the directory rots. E. Hutchins (1995), *Cognition in the
  Wild*, MIT Press: cognition is distributed across people and artifacts —
  the glossary is a designed cognitive artifact whose real customer is the
  distributed system, not any single reader.

### Governance: who may define and change a term

- **The profession distinguishes the role from the side job.**
  ISO 704:2022, 3.6 vs 3.7: a *terminologist* is "an expert who performs
  terminology work as a main function of a professional activity", a
  *terminology worker* is "a person whose role is to perform terminology
  work as an ancillary function of other professional activities" — the
  standard itself recognizes that ancillary performance is a different
  (weaker) regime, which is exactly our prior design.
- **Governance is a standards topic.** ISO 29383:2020, op. cit.: a
  terminology policy documents what gets standardized, by whom, in what
  lifecycle — the institutional skeleton our design lacks.
- **Ostrom's design principles for a commons apply directly to a shared
  vocabulary.** E. Ostrom (1990), *Governing the Commons: The Evolution of
  Institutions for Collective Action*, Cambridge University Press, ch. 3:
  (1) clearly defined boundaries of the resource and who may use/provide;
  (2) congruence between rules and local conditions; (3) those affected
  participate in modifying the rules (collective-choice arrangements);
  (4) monitoring by monitors accountable to the users; (5) graduated
  sanctions; (6) low-cost conflict-resolution arenas; (7) minimal
  recognition of rights to organize; (8) nested enterprises. Mapped:
  (1) who may propose/edit a term; (3) users can correct terms they use;
  (4) an accountable maintainer — not the interactive agents; (5)
  deprecate, don't delete (ISO 1087's rating scale is a graduated sanction
  system); (6) a cheap place for "two meanings fight for one term" (the
  standard's answer: split concepts, re-rate designations; ISO 704 §7.7).

### Workflow-embedding vs. leaving it to generalists

- **Embed the discipline at work points; it will not survive as a general
  duty.** Grudin (1994), op. cit. (disparity + "explicit job"); Davenport &
  Glaser (2002), op. cit. (embed in the transaction); Gery (1991), op. cit.
  (performance support at moment of need); Nonaka & Konno (1998), op. cit.
  (capture needs a ba — a situated context).
- **The vocabulary is infrastructure: expect invisible work, and pay for
  it.** S. L. Star & K. Ruhleder (1996), "Steps toward an ecology of
  infrastructure: design and access for large information spaces",
  *Information Systems Research* 7(1):111–134: infrastructure is
  transparent in use, part of the background, and becomes visible on
  breakdown; Bowker & Star (1999), op. cit.: maintaining classification
  systems is invisible, unglamorous, endlessly required work. A glossary is
  precisely such infrastructure: its budget must include the standing
  maintenance work, not just founding the file.
- **Conceptual integrity needs a designated arbiter.** F. Brooks (1995),
  *The Mythical Man-Month*, anniversary edition, Addison-Wesley, ch. 4
  ("Aristocracy, democracy, and system design"): a system's design must
  proceed from one mind (or a small coherent group) to have conceptual
  integrity — the design-engineering argument for a single accountable
  glossary owner rather than consensus-by-committee.

---

## 5. Shared language in multi-agent and human-AI systems

### Classical agent standards: naming the shared vocabulary in the protocol

- **Agent communication standards demand that senders name the ontology
  they are speaking.** FIPA, *FIPA ACL Message Structure Specification*,
  document SC00061G (Foundation for Intelligent Physical Agents, Geneva,
  2002-12-03; archived at http://www.fipa.org/specs/fipa00061/): each ACL
  message carries a mandatory performative plus message parameters that
  include `:ontology`, `:language`, and `:encoding` — the protocol assumes
  messages are interpretable only relative to a *named, shared
  vocabulary*; the content itself is a formal language, *FIPA SL Content
  Language Specification*, document SC00008I (2002): a first-order-logic
  content language ("fipa-sl") that gives agent utterances a checkable
  semantics. Multidecade precedent for our design: the glossary must be a
  named, addressable artifact agents can cite in what they say to each
  other.
- **Semantic mismatch between agent vocabularies is a studied field, not a
  solved one.** J. Euzenat & P. Shvaiko (2013), *Ontology Matching*, 2nd
  ed., Springer: the discipline of computing and maintaining alignments
  (correspondences) between independently developed ontologies/vocabularies
  — evidence that even with standards, independent systems drift apart
  semantically, and that keeping a *shared local* glossary is cheaper than
  perpetual alignment.

### Today's protocol vocabularies (first-party specifications)

- **MCP is a shared, versioned vocabulary for agent–tool interaction.**
  Anthropic, *Model Context Protocol*: open protocol "to standardize how
  applications provide context to LLMs", introduced Nov 2024 (Anthropic
  announcement 2024-11-25, https://www.anthropic.com/news/model-context-protocol),
  with a versioned specification (current dated releases, e.g.
  https://modelcontextprotocol.io/specification/2025-06-18 and later
  2025-11-25 / 2026-07-28 releases per the MCP blog). Its primitives
  (tools/resources/prompts, schemas, capability negotiation) are a
  *protocol vocabulary*: fixed, nameable, versioned meanings shared by
  heterogeneous parties.
- **A2A is explicitly a "common language for agents", with version
  negotiation.** The Agent2Agent Protocol: "A2A aims to provide a common
  language for agents" (project README,
  https://github.com/a2aproject/A2A); created by Google April 2025, donated
  to the Linux Foundation June 2025, spec v1.0 at
  https://a2a-protocol.org/latest/specification/; per the Linux Foundation
  one-year press release (2026-04-09, https://www.linuxfoundation.org/press/),
  "A2A removes that bottleneck by providing a common semantic model and
  version negotiation that standardize how agents discover, communicate,
  and transact with each other", positioned as complementary to MCP. Two
  design facts worth taking: (a) the industry builds shared semantics as a
  *versioned negotiated artifact*; (b) coordination between heterogeneous
  agents is treated as the bottleneck a shared vocabulary removes.
- **Standards for vocabularies-as-data already exist and should be the
  interchange format.** W3C SKOS (Miles & Bechhofer 2009, op. cit.) for
  concept schemes with preferred labels, definitions, and notes; W3C OWL 2
  (W3C OWL Working Group, *OWL 2 Web Ontology Language Document Overview*,
  W3C Recommendation 2012, https://www.w3.org/TR/owl2-overview/) for
  formal ontologies. If the glossary is to be consumed by agents and
  tooling, publishing it in such a format makes the term/concept/definition
  schema machine-addressable (following the ISO entry schema, §1).
- **Domain protocol vocabularies run full term lifecycles.**
  HL7 FHIR, *Terminology Module* (health standards body HL7, first-party
  specification, https://www.hl7.org/fhir/terminology-module.html):
  vocabularies are modeled as CodeSystem/ValueSet/ConceptMap resources with
  explicit versioning and a code *status* lifecycle including retirement
  — a production example of deprecation governance at the intersection of
  a protocol and a human-facing vocabulary. (Example of the same shape in
  open-source engineering docs: the Kubernetes glossary — "a comprehensive,
  standardized list of Kubernetes terminology", maintained by SIG Docs in
  the first-party documentation, https://kubernetes.io/docs/reference/glossary/.)

### Common ground: the psycholinguistic and HCI foundations

- **Grounding: contributions are only "in" once accepted.**
  H. Clark & E. Schaefer (1989), "Contributing to discourse",
  *Cognitive Science* 13(2):259–294, and Clark & Brennan (1991), op. cit.:
  communication consists of *contributions* — presentation plus
  acceptance — and partners close the loop with explicit or implicit
  acknowledgments; grounding theories say mutual belief of understanding
  to the criterion "sufficient for current purposes" is what must be
  achieved. For a human–agent glossary: a term is only *in the shared
  vocabulary* once its definition has been accepted/registered, not when
  somebody wrote it.
- **Conversationalists converge on pacts — provisional, partner-specific
  agreements.** S. Brennan & H. Clark (1996), "Conceptual pacts and
  lexical choice in conversation", *Journal of Experimental Psychology:
  Learning, Memory, and Cognition* 22(6):1482–1493: partners "establish,
  track, and update conceptual pacts (i.e., provisional agreements about
  how they are to conceptualize things)", which let them refer with minimal
  effort later; pacts are tied to the specific partner (Experiment 3) and
  are provisional/updateable. A glossary is a mechanism for *generalizing
  conceptual pacts across partners* (human plus many agents) — without it,
  each agent pair forms its own divergent pact. The finding that pacts
  simplify repeated reference is the payoff story for a glossary in a
  multi-agent system; the finding that they are provisional is the reason
  entries must be re-rating-able, not carved in stone.
- **Alignment in dialogue is automatic but shallow unless grounded.**
  M. Pickering & S. Garrod (2004), "Toward a mechanistic psychology of
  dialogue", *Behavioral and Brain Sciences* 27(2):169–190: interlocutors
  align representations and lexical choices automatically; this predicts
  that LLM-style interlocutors will happily *imitate* terms without
  sharing their meanings — alignment ≠ agreement — the precise hazard a
  glossary exists to catch.
- **The joint-activity framework: common ground is bought for the
  activity, and its gaps are handled by repair.** Klein, Feltovich,
  Bradshaw & Woods (2005), op. cit. — the standard framework for
  human–agent teaming: parties enter a "basic compact" of shared
  activity-level expectations; common ground is achieved, maintained, and
  updated through coordination devices; breakdowns are expected and are
  managed via repair. Design consequence: the system needs an explicit
  *detect-and-repair* loop for meaning disagreements (the glossary's
  conflict process), not an assumption of preexisting shared meaning.

### Current scholarship on LLM/multi-agent shared language (2025–2026, mostly preprints)

- **Common ground in human-AI collaboration is now benchmarkable.**
  C. Poelitz, F. Doshi-Velez & S. Lindley (2026), "A Benchmark to Assess
  Common Ground in Human-AI Collaboration", arXiv:2602.21337 (preprint,
  not yet peer-reviewed): effective human-AI collaboration "depends on
  establishing and maintaining common ground: shared beliefs, assumptions,
  goals, and situational awareness that enable coordinated action and
  efficient repair of misunderstandings"; their benchmark reproduces
  known human-human grounding findings and reveals "clear divergences in
  human-AI interaction" — early measurable evidence that AI partners do
  not by default maintain common ground the way humans do.
- **The NLP field has systematized grounding in dialogue.**
  T. Anikina, A. Leippert & S. Ostermann (2025), "Building Common Ground
  in Dialogue: A Survey", *Proceedings of the 2nd LUHME Workshop*,
  ACL Anthology 2025.luhme-1.2: a survey of 448 papers; common ground in
  human–LM interaction is identified as a source of systematic issues when
  absent (misinterpretation, wrong referents), and representations range
  from personal/domain-specific shared experience to general knowledge —
  evidence of both the problem and the current patchwork of approaches.
- **Multi-agent communication is being surveyed as a discipline.**
  Y. Fang, J. Hou, P. Pitre, G. Srivastava, S. Ding & X. Wang (2026),
  "Toward the Science of Multi-Agent Communication: A Comprehensive
  Survey", Preprints.org 202609.1298 / arXiv (preprint, not yet
  peer-reviewed): producers deploying heterogeneous LLM agents treat
  "communication [as] load-bearing"; the survey catalogs the mechanisms by
  which agents exchange meaning (message protocols, structured outputs,
  shared vs. local semantics).
- **The field's own history lesson: failure modes follow where you place
  the semantic effort.** T. Petrova, B. Bliznioukov, A. Puzikov &
  R. State (2025, v4 2026), "From Multi-Agent Systems and the Semantic Web
  to Agentic AI: A Unified Narrative of the Web of Agents",
  arXiv:2507.10644 (preprint): three generations moved "semantic effort"
  from platform-side coordination (MAS ontologies), to data-side
  annotation (Semantic Web), to model-side interpretation (LLMs — shared
  understanding "emerges" from model interpretation of natural language);
  and "each generation's failure modes and current open problems follow
  from where that generation located its semantic effort". For our
  design: in-model semantics are cheap to use and impossible to govern —
  an explicit, addressable glossary places the semantic effort where it
  can be shared, checked, and versioned, which is the lesson the survey
  draws for Generation III.

---

## Transferable principles

Numbered principles our design should test against, each tied to its source.

1. **One concept per entry; term, definition, and rating are the schema.**
   Model each glossary entry as a terminological entry — one concept with
   preferred/admitted terms, an intensional definition (superordinate +
   delimiting characteristics), and an acceptability rating — never as a
   free-form note. (ISO 704:2022, 3.3, 3.4; ISO 1087:2019, 3.3.1, 3.4.19–22)
2. **Definitions must be machine-checkable against the standard's failure
   classes.** Reject circular, negative, and inaccurate definitions; test by
   substitution; require the definition to name the superordinate concept.
   (ISO 704:2022, §6.4.4, §6.5)
3. **Admit a term only on warrant, at the moment it matters.** Gate
   proposals on literary warrant (used in the work), user warrant (someone
   asked what it means), or organizational warrant (a decision requires it);
   do not pre-enumerate the domain. (ANSI/NISO Z39.19-2005, §5;
   ISO 704:2022, §4, §5.4.2; Davenport & Glaser 2002)
4. **Capture at the point of articulation (externalization), not by later
   recall.** The tacit→explicit conversion happens where the term is used
   and reified; capture in a situated context (the conversation/work event
   that made the term matter) or accept low-quality entries. (Nonaka 1994;
   Nonaka & Konno 1998; Lave & Wenger 1991)
5. **Make maintenance someone's designated job.** The work/benefit disparity
   guarantees failure when glossary upkeep is an extra duty of busy
   generalists — human or agent. A named maintainer (the system's
   terminologist role) does the work; contributors propose. (Grudin 1994;
   ISO 704:2022, 3.6–3.7)
6. **Respect the attention budget: glossary tasks must be cheap and
   non-interruptive.** Every maintenance request competes for the scarce
   attention of the same agents doing the work; make capture a one-shot,
   local, low-cost operation embedded in the workflow, not a research task
   dropped on an interactive agent mid-conversation. (Simon 1971;
   Davenport & Glaser 2002; Gery 1991)
7. **Own the commons with Ostrom's rules.** Define who may propose/change
   entries (boundaries); let users see and correct terms (collective
   choice); have an accountable monitor; enforce with graduated sanctions —
   i.e., demote via the rating scale, never unclear deletion; provide a
   cheap conflict-resolution path for two-meanings-one-term fights
   (consensus or split-and-re-designate). (Ostrom 1990; Hess & Ostrom 2007;
   ISO 1087:2019, 3.4.28–29; ISO 704:2022, §7.7.6–7.7.7)
8. **Re-rating, not rewriting: treat drift and disputes as lifecycle
   events.** Preferred → admitted → deprecated → obsolete is a standing
   procedure; retired words live on in `_Avoid_`-style pointers; entries
   are re-checked against real use, because codified meaning drifts.
   (ISO 1087:2019, 3.4.19–22; NISO Z39.19-2005, §8;
   Ackerman & Halverson 2000/2004)
9. **Treat common ground as bought, scoped, and provisional — like
   conceptual pacts.** Invest in a term only when joint activity needs it;
   expect entries to start provisional; make each entry explicit and
   versioned where one would otherwise have a private pact per agent pair.
   (Brennan & Clark 1996; Clark & Brennan 1991; Klein et al. 2005)
10. **A term is in the vocabulary when it is accepted, not when it is
    written.** Apply the contribution model: proposals are contributions
    needing acceptance/grounding with the human (the source of truth for
    meaning) before they become shared. (Clark & Schaefer 1989;
    Clark & Brennan 1991)
11. **Watch out for surface alignment.** Interlocutors (and LLMs
    especially) align on wording automatically, without aligning on meaning;
    the glossary's conflict-detection (polysemy/homonymy/`_Avoid_` checking)
    is the repair loop for this. (Pickering & Garrod 2004;
    ISO 1087:2019, 3.4.28–29; Klein et al. 2005)
12. **Make the glossary a named, addressable, versioned artifact agents
    can cite.** Follow FIPA's `:ontology` precedent and A2A/MCP's versioned
    semantic model: agents should refer to glossary entries and vocabulary
    version in their exchanges; the glossary must be machine-readable
    (SKOS-shaped: concept + preferred label + definition + status).
    (FIPA SC00061G/SC00008I; A2A spec; MCP spec; SKOS 2009)
13. **Price capture by reuse; let the system see the reuse.** Codification
    pays only when someone reads it back; cheap capture + visible reuse
    (in agent messages, specs, and docs) converts glossary upkeep from pure
    cost into tooling for the next conversation. (Cowan & Foray 1997;
    Markus 2001; Hansen, Nohria & Tierney 1999)
14. **Budget the invisible work; treat the glossary as infrastructure.**
    Its health is invisible until breakdown (a term means two things in two
    agents); schedule standing maintenance — re-rating, conflict hunts,
    orphan cleanup — rather than one-off founding. (Star & Ruhleder 1996;
    Bowker & Star 1999)
15. **Keep one arbiter of conceptual integrity.** A single accountable
    owner (with the human as the final court for meaning) resists the
    accretion of contradictory definitions; consensus-by-all-proposing is
    how glossaries rot. (Brooks 1995, ch. 4; ISO 29383:2020)

---

## Sourcing notes and gaps

- **Primary standards consulted in full or in official preview/OBP text:**
  ISO 704:2022 (Introduction and clauses 3–5.4 verified against the
  official preview PDF; clauses 6–7 cited from the official table of
  contents and clause numbers, with their definitions cross-verified in
  ISO 1087:2019's published vocabulary); ISO 1087:2019 (definitions via the
  ISO Online Browsing Platform and the OMG's published ISO 1087 RDF
  vocabulary; concept definition confirmed also in NIST CSRC's glossary,
  which sources ISO 1087:2019).
- **Not fully accessible:** ISO 704:2022 clauses 6 (writing definitions)
  and 7.7 (synonymy/polysemy/harmonization) beyond the free preview — the
  corresponding mechanisms are cited through ISO 1087:2019's normative
  definitions, which agree. ISO 25964-1 and ISO 26162-1 were cited only
  for their existence and scope, not interior claims.
- **Multi-agent/LLM shared-vocabulary scholarship is thin and mostly
  preprint.** The 2025–2026 sources cited in §5 (Poelitz et al.;
  Anikina et al.; Fang et al.; Petrova et al.) are workshop or preprint
  literature, not yet peer-reviewed; there is currently no
  peer-reviewed, controlled evidence on glossary maintenance inside
  live multi-agent systems — the closest anchors remain FIPA/KQML
  standards (2002) and the HCI/CSCW grounding literature
  (Clark; Brennan & Clark; Klein et al.).
- **No empirical study was found that directly measures "glossary
  maintenance by interactive agents vs. a designated maintainer."**
  That design question is answerable by Grudin's disparity principle and
  Simon's attention economics, but a controlled evaluation would be new
  work.