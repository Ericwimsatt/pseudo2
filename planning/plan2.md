Project Vision

The application is a local web application for exploring source code through alternate representations.

The first representation is Plain pseudocode.

Rather than opening a single file, users open an entire repository. The application indexes the repository, parses its files, and lets users navigate through multiple views of the code.

The goal is to build a reusable translation engine that can support many languages and many visualizations.

Examples of future renderers:

Plain Pseudocode
Beginner explanations
Architecture diagrams
Variable dependency graphs
Function call graphs
Object lifecycle visualization
AI annotations
Documentation generation

These should all consume the same semantic model.

Core Architecture
                    React Application
                           │
                     Controllers
                           │
               Repository Semantic Model
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
  Language Parser     Semantic Engine     Renderers
        │                  │                  │
   TypeScript AST     Cross-file Graph     PseudoCode
                                          Future Views

The React application never directly talks to the parser.

Everything goes through controllers.

Layers
Presentation

    React
    Components
    Layouts
    Panels

↓

Controllers

    RepositoryController
    FileController
    TranslationController
    NavigationController

↓

Domain

    Repository
    SourceFile
    SemanticNode
    SymbolGraph

↓

Language

    TypeScript Parser
    AST Visitors
    Node Adapters

↓

Infrastructure

    File System
    Project Loading
    Caching

Notice every layer only depends on the layer below it.

Repository Model

Instead of

File

the root object becomes

Repository

    Files

    Symbol Graph

    Semantic Graph

    Metadata

    Language Services

Every panel reads from this model.

Translation Pipeline
Repository

↓

File

↓

Language Parser

↓

Language AST

↓

Semantic IR

↓

Renderer

↓

PseudoCode Lines

Notice the renderer never sees a TypeScript AST.

It only receives semantic nodes.

That allows Python, Go, Rust, etc. to reuse every renderer.

Semantic IR

The semantic model becomes the heart of the application.

TypeScript AST

↓

Semantic Nodes

↓

Relationships

↓

Renderers

Example node types

Function

Class

Method

Variable

Loop

Conditional

Return

Assignment

Expression

Import

Export

Every language maps into these nodes.

Repository Layout
repo/

    src/

    package.json

    tsconfig.json

↓

Project Loader

↓

Repository Model

↓

Navigation Tree
UI Layout
+--------------------------------------------------------------+
| Toolbar                                                      |
+--------------------------------------------------------------+

| Repo Tree | PseudoCode View | Inspector | Development Tabs      |

|            |              |           |                       |
|            |              |           |                       |
|            |              |           |                       |

+--------------------------------------------------------------+
Repository Tree

The left sidebar behaves similarly to VSCode.

Repository

▼ src

    ▼ parser

        parser.ts

        visitor.ts

    ▼ renderer

        pseudo.ts

    main.ts

Selecting a file updates every other panel.

Pseudo View

The center panel is the primary product.


Each line corresponds to one or more semantic nodes.

Each line is a reusable React component.

<Line />
Inspector Panel

Selecting a line reveals metadata.

Pseudo

↓

Semantic Node

↓

Source Range

↓

Relationships

↓

Original AST Node

Useful information

Function

Source Lines

Parent

Children

Variable references

Definition

Documentation

Future AI notes
##Development Panels

Instead of constantly logging to the console, expose every intermediate representation.

Source

AST

Semantic IR

PseudoCode

Diagnostics

Logs

Performance

Each panel should update live.

Source

Original source code.

AST

Tree view of the TypeScript AST.

Collapsible.

Selecting a node highlights

source
semantic node
PseudoCode line
Semantic IR

Probably the most important debugging tool.

Displays the intermediate representation.

Function

id

children

relationships

metadata

location

If something is wrong with PseudoCode generation, you'll immediately know whether the parser or renderer is at fault.

PseudoCode

Shows exactly what the renderer produced before any React formatting.

Useful when debugging formatting.

Diagnostics
Parser warnings

Unknown nodes

Unsupported syntax

Renderer warnings
Logs

Structured logs instead of console spam.

Loaded repository

Indexed 83 files

Parsed parser.ts

Generated 247 semantic nodes
Performance

Track timing.

Repository Load

AST Parse

Semantic Generation

Rendering

Caching

Total

Makes optimization easy later.

Controllers

I'd keep controllers intentionally small.

RepositoryController

Loads repositories

Indexes files

Coordinates updates
NavigationController

Tracks selected file

Tracks expanded folders

Search
TranslationController

AST

↓

Semantic

↓

PseudoCode
InspectorController

Selection

↓

Metadata

↓

Relationships
Suggested File Structure
packages/

    app/
        src/

            components/

                layout/

                sidebar/

                pseudo/

                    Line.tsx

                inspector/

                devtools/

            panels/

                RepositoryTree/

                PseudoCodeView/

                Inspector/

                SourcePanel/

                AstPanel/

                SemanticPanel/

                DiagnosticsPanel/

                LogsPanel/

                PerformancePanel/

            controllers/

                RepositoryController.ts

                NavigationController.ts

                TranslationController.ts

                InspectorController.ts

            hooks/

            pages/

            App.tsx

    translator-core/

        semantic/

            nodes/

            relationships/

            metadata/

        controllers/

        model/

        renderers/

            pseudo/

        visitors/

    language-typescript/

        parser/

        adapters/

        visitors/

        symbols/

    shared/

        types/

        utils/

        events/
##Data Flow
###Guiding Design Principles
The repository is the model. Individual files are simply focused views into a larger semantic graph.
The semantic graph is the source of truth. No renderer should consume a language-specific AST directly.
Language parsers only parse. They should not contain UI or rendering logic.
Renderers only render. They transform semantic nodes into a particular representation (Pseudocode today, diagrams or documentation tomorrow).
Controllers orchestrate, components display. React components should remain as stateless and presentation-focused as possible.
Every intermediate stage should be inspectable. If something goes wrong, you should be able to determine whether the issue lies in parsing, semantic modeling, or rendering without adding temporary logging.