"use client"

import { useMemo, useCallback } from "react"
import {
    ReactFlow,
    Controls,
    MiniMap,
    Background,
    BackgroundVariant,
    useNodesState,
    useEdgesState,
    type Node,
    type Edge,
    type NodeTypes,
    Handle,
    Position,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"

// ── Types ───────────────────────────────────────────────────

interface FieldDef {
    name: string
    type: string
    required: boolean
    ref?: string
    isArray: boolean
    defaultValue?: string
    enumValues?: string[]
}

interface ModelDef {
    name: string
    filePath: string
    fields: FieldDef[]
}

interface ModelNodeData {
    label: string
    fields: FieldDef[]
    filePath: string
    [key: string]: unknown
}

// ── Constants ───────────────────────────────────────────────

const CARD_WIDTH = 280
const FIELD_H = 32
const HEADER_H = 44
const PADDING = 8
const GAP_X = 120
const GAP_Y = 60

// ── Type colors ─────────────────────────────────────────────

const TYPE_COLORS: Record<string, string> = {
    string: "#22c55e",
    number: "#3b82f6",
    decimal128: "#3b82f6",
    boolean: "#f59e0b",
    date: "#a855f7",
    objectid: "#ec4899",
    buffer: "#6366f1",
    mixed: "#94a3b8",
    map: "#94a3b8",
    uuid: "#06b6d4",
    bigint: "#14b8a6",
}

function getTypeColor(type: string): string {
    return TYPE_COLORS[type.toLowerCase()] || "#64748b"
}

// ── Custom Node ─────────────────────────────────────────────

function ModelNode({ data }: { data: ModelNodeData }) {
    const { label, fields } = data

    return (
        <div
            className="rounded-xl border shadow-lg overflow-hidden bg-card"
            style={{ width: CARD_WIDTH, minHeight: 60 }}
        >
            {/* Handles for edges */}
            <Handle
                type="target"
                position={Position.Left}
                className="!w-2 !h-2 !bg-primary !border-0"
            />
            <Handle
                type="source"
                position={Position.Right}
                className="!w-2 !h-2 !bg-primary !border-0"
            />

            {/* Header */}
            <div
                className="px-4 flex items-center justify-between bg-primary text-primary-foreground"
                style={{ height: HEADER_H }}
            >
                <span className="font-semibold text-sm tracking-wide">
                    {label}
                </span>
                <span className="text-xs opacity-70">
                    {fields.length} fields
                </span>
            </div>

            {/* Fields */}
            <div className="divide-y divide-border">
                {fields.map((field) => (
                    <div
                        key={field.name}
                        className="flex items-center justify-between px-3 hover:bg-accent/40 transition-colors"
                        style={{ height: FIELD_H }}
                    >
                        <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-xs font-medium text-foreground truncate">
                                {field.name}
                            </span>
                            {field.required && (
                                <span className="text-destructive text-[10px] font-bold">
                                    *
                                </span>
                            )}
                        </div>
                        <FieldTypeBadge field={field} />
                    </div>
                ))}
            </div>
        </div>
    )
}

function FieldTypeBadge({ field }: { field: FieldDef }) {
    const color = getTypeColor(field.type)
    const label = field.ref
        ? `→ ${field.ref}`
        : field.isArray
            ? `[${field.type}]`
            : field.type

    return (
        <span
            className="text-[10px] font-mono px-1.5 py-0.5 rounded-md shrink-0"
            style={{
                color,
                backgroundColor: `${color}15`,
            }}
        >
            {label}
        </span>
    )
}

// ── Layout ──────────────────────────────────────────────────

function layoutNodes(models: ModelDef[]): Node<ModelNodeData>[] {
    const cols = Math.max(1, Math.ceil(Math.sqrt(models.length)))

    return models.map((model, i) => {
        const col = i % cols
        const row = Math.floor(i / cols)
        const height = HEADER_H + model.fields.length * FIELD_H + PADDING

        return {
            id: model.name,
            type: "model",
            position: {
                x: col * (CARD_WIDTH + GAP_X),
                y: row * (height + GAP_Y),
            },
            data: {
                label: model.name,
                fields: model.fields,
                filePath: model.filePath,
            },
        }
    })
}

function buildEdges(models: ModelDef[]): Edge[] {
    const modelNames = new Set(models.map((m) => m.name))
    const edges: Edge[] = []

    for (const model of models) {
        for (const field of model.fields) {
            if (field.ref && modelNames.has(field.ref)) {
                edges.push({
                    id: `${model.name}-${field.name}-${field.ref}`,
                    source: model.name,
                    target: field.ref,
                    animated: true,
                    label: field.name,
                    style: { stroke: "#a855f7", strokeWidth: 2 },
                    labelStyle: {
                        fontSize: 10,
                        fill: "#a855f7",
                        fontWeight: 500,
                    },
                    labelBgStyle: {
                        fill: "var(--color-card, #fff)",
                        fillOpacity: 0.8,
                    },
                })
            }
        }
    }

    return edges
}

// ── Node types registry ─────────────────────────────────────

const nodeTypes: NodeTypes = {
    model: ModelNode,
}

// ── Main component ──────────────────────────────────────────

export function DiagramRenderer({ models }: { models: ModelDef[] }) {
    const initialNodes = useMemo(() => layoutNodes(models), [models])
    const initialEdges = useMemo(() => buildEdges(models), [models])

    const [nodes, , onNodesChange] = useNodesState(initialNodes)
    const [edges, , onEdgesChange] = useEdgesState(initialEdges)

    const onInit = useCallback(() => {
        // React Flow is ready
    }, [])

    return (
        <div
            className="rounded-xl border bg-card shadow-sm overflow-hidden"
            style={{ height: "calc(100vh - 210px)", minHeight: 500 }}
        >
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onInit={onInit}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                minZoom={0.1}
                maxZoom={2}
                proOptions={{ hideAttribution: true }}
                className="diagram-flow"
            >
                <Controls
                    className="!bg-card !border !shadow-md !rounded-lg"
                    showInteractive={false}
                />
                <MiniMap
                    className="!bg-card !border !shadow-md !rounded-lg"
                    nodeColor="hsl(var(--primary))"
                    maskColor="hsl(var(--background) / 0.7)"
                    pannable
                    zoomable
                />
                <Background
                    variant={BackgroundVariant.Dots}
                    gap={20}
                    size={1}
                    className="!bg-background"
                />
            </ReactFlow>
        </div>
    )
}
