# Pseudo2 - Code Explorer

A local web application for exploring source code through alternate representations, starting with plain pseudocode.

## Architecture

The application uses a semantic translation engine that can support multiple languages and visualizations.

### Core Layers

```
React Application
       │
  Controllers
       │
Repository Semantic Model
       │
┌──────┼──────┐
│      │      │
Parser Semantic Renderers
```

### Packages

- **@pseudo2/app** - React application with UI components and panels
- **@pseudo2/translator-core** - Semantic model, renderers, and core translation logic
- **@pseudo2/language-typescript** - TypeScript parser and AST visitors
- **@pseudo2/shared** - Shared types, utilities, and event system

## Features

### Main Panels

- **Repository Tree** - VSCode-like file explorer
- **PseudoCode View** - Center panel showing pseudocode representation
- **Inspector** - Right panel showing semantic node metadata

### Development Panels

- **Source** - Original source code with line numbers
- **AST** - Collapsible TypeScript AST tree view
- **Semantic IR** - Intermediate representation for debugging
- **Diagnostics** - Parser and renderer warnings
- **Logs** - Structured application logs
- **Performance** - Timing metrics for operations

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Type check
npm run typecheck
```

Open http://localhost:3000 and click "Load Sample Repository" to explore.

## Translation Pipeline

```
Repository
    ↓
  File
    ↓
Language Parser (TypeScript AST)
    ↓
Semantic IR (Language-agnostic nodes)
    ↓
Renderer (PseudoCode)
    ↓
React Components
```

The renderer never sees language-specific ASTs. It only receives semantic nodes, enabling future support for Python, Go, Rust, etc.

## Semantic Node Types

- Function, Class, Method
- Variable, Parameter, Property
- Loop, Conditional, Return
- Import, Export
- Interface, Type
- Call, Assignment, Expression
- And more...

## Future Renderers

The semantic model supports many visualization types:

- Beginner explanations
- Architecture diagrams
- Variable dependency graphs
- Function call graphs
- Object lifecycle visualization
- AI annotations
- Documentation generation

## Design Principles

1. **Repository is the model** - Files are views into a semantic graph
2. **Semantic graph is source of truth** - Renderers consume semantic nodes, not ASTs
3. **Separation of concerns** - Parsers parse, renderers render, controllers orchestrate
4. **Inspectable intermediates** - Every stage visible in development panels
5. **Language agnostic** - Same renderers work for any language with a parser

## Project Structure

```
packages/
  app/
    src/
      components/     # Reusable UI components
      panels/         # Main application panels
      controllers/    # Business logic orchestration
      hooks/          # React hooks for controllers
  translator-core/
    semantic/         # Semantic node factories
    model/            # Repository and graph models
    renderers/        # PseudoCode and future renderers
  language-typescript/
    parser/           # TypeScript AST parser
    visitors/         # AST to semantic node conversion
    adapters/         # Language-specific adapters
    symbols/          # Symbol extraction
  shared/
    types/            # TypeScript interfaces
    utils/            # Utility functions
    events/           # Event bus system
```

## License

MIT
