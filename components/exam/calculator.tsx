"use client"

import { useCallback, useReducer } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

type Op = "+" | "-" | "*" | "/"

interface CalcState {
  display: string
  stored: number | null
  pendingOp: Op | null
  fresh: boolean
}

type CalcAction =
  | { type: "digit"; d: string }
  | { type: "dot" }
  | { type: "op"; op: Op }
  | { type: "eq" }
  | { type: "clear" }
  | { type: "back" }

const initialState: CalcState = {
  display: "0",
  stored: null,
  pendingOp: null,
  fresh: true,
}

function compute(a: number, b: number, op: Op): number {
  switch (op) {
    case "+":
      return a + b
    case "-":
      return a - b
    case "*":
      return a * b
    case "/":
      return b === 0 ? NaN : a / b
  }
}

function formatDisplay(n: number): string {
  if (!Number.isFinite(n)) return "Error"
  const rounded = Number(n.toPrecision(12))
  if (!Number.isFinite(rounded)) return "Error"
  let s = String(rounded)
  if (s === "-0") s = "0"
  return s
}

function calcReducer(state: CalcState, action: CalcAction): CalcState {
  if (state.display === "Error" && action.type !== "clear" && action.type !== "back") {
    if (action.type === "digit") {
      return { ...initialState, display: action.d, fresh: false }
    }
    return state
  }

  switch (action.type) {
    case "digit": {
      const { d } = action
      if (state.fresh) {
        return { ...state, display: d === "." ? "0." : d, fresh: false }
      }
      if (d === "0" && state.display === "0") return state
      if (state.display === "0" && d !== ".") return { ...state, display: d }
      if (state.display.replace("-", "").length >= 14) return state
      return { ...state, display: state.display + d }
    }
    case "dot": {
      if (state.fresh) return { ...state, display: "0.", fresh: false }
      if (state.display.includes(".")) return state
      return { ...state, display: `${state.display}.` }
    }
    case "op": {
      const cur = parseFloat(state.display)
      if (!Number.isFinite(cur))
        return { display: "Error", stored: null, pendingOp: null, fresh: true }

      if (state.pendingOp !== null && state.stored !== null && !state.fresh) {
        const res = compute(state.stored, cur, state.pendingOp)
        if (!Number.isFinite(res)) {
          return { display: "Error", stored: null, pendingOp: null, fresh: true }
        }
        return {
          display: formatDisplay(res),
          stored: res,
          pendingOp: action.op,
          fresh: true,
        }
      }

      return {
        ...state,
        stored: cur,
        pendingOp: action.op,
        fresh: true,
      }
    }
    case "eq": {
      if (state.pendingOp === null || state.stored === null) {
        return { ...state, fresh: true }
      }
      const cur = parseFloat(state.display)
      if (!Number.isFinite(cur))
        return { display: "Error", stored: null, pendingOp: null, fresh: true }
      const res = compute(state.stored, cur, state.pendingOp)
      if (!Number.isFinite(res)) {
        return { display: "Error", stored: null, pendingOp: null, fresh: true }
      }
      return {
        display: formatDisplay(res),
        stored: null,
        pendingOp: null,
        fresh: true,
      }
    }
    case "clear":
      return initialState
    case "back": {
      if (state.fresh) return state
      if (state.display.length <= 1) return { ...state, display: "0", fresh: true }
      const next = state.display.slice(0, -1)
      return { ...state, display: next === "-" ? "0" : next }
    }
    default:
      return state
  }
}

interface CalculatorProps {
  open: boolean
  onClose: () => void
}

export function Calculator({ open, onClose }: CalculatorProps) {
  const [state, dispatch] = useReducer(calcReducer, initialState)

  const pad = useCallback(
    (
      label: string,
      action: CalcAction,
      className = "",
      ariaLabel?: string,
    ) => (
      <button
        type="button"
        onClick={() => dispatch(action)}
        aria-label={ariaLabel}
        className={cn(
          "flex h-14 w-full items-center justify-center rounded-lg text-lg font-medium transition-colors active:bg-accent",
          className,
        )}
      >
        {label}
      </button>
    ),
    [],
  )

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-xs p-0 gap-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <span className="text-sm font-medium">Калькулятор</span>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              aria-hidden
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-4 pt-4 pb-2">
          <div className="flex h-14 items-center justify-end rounded-lg border border-border bg-secondary px-3 text-2xl font-medium tabular-nums">
            {state.display}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 px-4 pb-4">
          {pad("AC", { type: "clear" }, "bg-secondary hover:bg-secondary/80 text-sm")}
          {pad("⌫", { type: "back" }, "bg-secondary hover:bg-secondary/80")}
          {pad("÷", { type: "op", op: "/" }, "bg-secondary hover:bg-secondary/80")}
          {pad("×", { type: "op", op: "*" }, "bg-secondary hover:bg-secondary/80")}

          {pad("7", { type: "digit", d: "7" })}
          {pad("8", { type: "digit", d: "8" })}
          {pad("9", { type: "digit", d: "9" })}
          {pad("−", { type: "op", op: "-" }, "bg-secondary hover:bg-secondary/80")}

          {pad("4", { type: "digit", d: "4" })}
          {pad("5", { type: "digit", d: "5" })}
          {pad("6", { type: "digit", d: "6" })}
          {pad("+", { type: "op", op: "+" }, "bg-secondary hover:bg-secondary/80")}

          {pad("1", { type: "digit", d: "1" })}
          {pad("2", { type: "digit", d: "2" })}
          {pad("3", { type: "digit", d: "3" })}
          {pad(
            "=",
            { type: "eq" },
            "bg-foreground text-background hover:bg-foreground/90",
          )}

          {pad("0", { type: "digit", d: "0" }, "col-span-2")}
          {pad(".", { type: "dot" })}
        </div>
      </DialogContent>
    </Dialog>
  )
}
