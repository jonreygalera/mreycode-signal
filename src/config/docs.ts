export interface DocField {
  key: string;
  type: string;
  description: string;
  required?: boolean;
}

export interface DocSection {
  title: string;
  description: string;
  fields: DocField[];
}

export const WIDGET_DOCS: DocSection[] = [
  {
    title: "Core Configuration",
    description: "The essential top-level properties required for every widget.",
    fields: [
      { key: "id", type: "string", description: "Unique identifier for the widget instance.", required: true },
      { key: "label", type: "string", description: "Display title shown on the card.", required: true },
      { key: "type", type: "'stat' | 'chart' | 'iframe' | 'list' | 'clock' | 'progress' | 'status' | 'label'", description: "Widget visualization engine.", required: true },
      { key: "size", type: "'sm' | 'md' | 'lg' | 'xl'", description: "Grid footprint (width/height span)." },
      { key: "description", type: "string", description: "Contextual sub-text shown under the label." },
    ],
  },
  {
    title: "Data Fetching",
    description: "Configure how the widget retrieves its data.",
    fields: [
      { key: "api", type: "string", description: "The endpoint URL. Use 'none' for static widgets." },
      { key: "method", type: "'GET' | 'POST'", description: "HTTP request method." },
      { key: "responsePath", type: "string", description: "Dot-notation path to data (e.g., 'result.count')." },
      { key: "refreshInterval", type: "number", description: "Auto-refresh in milliseconds (min 30000)." },
      { key: "transformer", type: "string", description: "JS code to transform data: '(val, data) => val * 100'." },
      { key: "headers / body", type: "object", description: "Standard Fetch API request options." },
    ],
  },
  {
    title: "Widget Config (Nested)",
    description: "Widget-specific settings contained within the 'config' object.",
    fields: [
      { key: "config", type: "object", description: "Nested settings object.", required: true },
      { key: "config.chart", type: "'line' | 'bar' | 'area'", description: "Style selector (for 'chart' type only)." },
      { key: "config.xKey / yKey", type: "string", description: "Data keys for chart axes." },
      { key: "config.prefix / suffix", type: "string", description: "Units like $, °C, or %." },
      { key: "config.abbreviate", type: "boolean", description: "Shorten large numbers (e.g. 1.2M)." },
      { key: "config.timezone", type: "string", description: "Timezone identifier for Clock widgets." },
      { key: "config.displayType", type: "'analog' | 'digital'", description: "Visual style for Clock widgets." },
      { key: "config.iframeUrl", type: "string", description: "External URL for Iframe widgets." },
      { key: "config.trueLabel / falseLabel", type: "string", description: "Conditional text for Status widgets." },
      { key: "config.trueIcon / falseIcon", type: "string", description: "Conditional Lucide icons for Status widgets." },
      { key: "config.subtitle / align / variant", type: "string", description: "Layout and style for Label widgets." },
      { key: "config.link", type: "string", description: "External shortcut URL for Label widgets." },
    ],
  },
  {
    title: "Logic & Aesthetics",
    description: "Advanced rules and visual customization.",
    fields: [
      { key: "accentColor", type: "HEX Color", description: "Custom glow/border color (e.g. '#00ff00')." },
      { key: "color", type: "ThemeColor", description: "Static color: 'up', 'down', 'warning', 'info', 'muted'." },
      { key: "source / sourceUrl", type: "string", description: "Attribution and external link for data." },
    ],
  },
  {
    title: "Advanced: Data Transformers",
    description: "JS-based middleware to process raw API responses on the fly.",
    fields: [
      { key: "transformer", type: "string", description: "JavaScript function body as a string. Receives (val, fullData) and should return the processed value." },
      { key: "Example (Math)", type: "Code", description: "(val) => val * 100 // Convert percentage" },
      { key: "Example (Map)", type: "Code", description: "(val) => val.map(i => ({ name: i.label, value: i.count })) // For List widgets" },
    ],
  },
  {
    title: "Advanced: Color Rules",
    description: "Dynamic semantic coloring based on value thresholds.",
    fields: [
      { key: "colorRules.aboveZero / belowZero", type: "ThemeColor", description: "Basic rules for positive/negative numbers." },
      { key: "colorRules.rules", type: "array", description: "An array of custom rule objects for granular control." },
      { key: "rule.condition", type: "'above' | 'below' | 'equal'", description: "The logical operator for the threshold." },
      { key: "rule.value", type: "number", description: "The threshold value to compare against." },
      { key: "rule.color", type: "ThemeColor", description: "The color to apply if condition is met." },
    ],
  },
  {
    title: "Active Alerts: Signals",
    description: "Transform your dashboard into an active monitoring hub with threshold-based signals.",
    fields: [
      { key: "signals", type: "SignalConfig[]", description: "An array of alert configurations." },
      { key: "signal.id", type: "string", description: "Identifier for the signal.", required: true },
      { key: "signal.label", type: "string", description: "Name of the alert shown in browser notifications.", required: true },
      { key: "signal.condition", type: "'above' | 'below' | 'equals'", description: "Threshold logic.", required: true },
      { key: "signal.threshold", type: "number", description: "The value that triggers the alert.", required: true },
      { key: "signal.action", type: "Array<'notify' | 'pulse' | 'sound' | 'notify-in-app'>", description: "What happens when triggered.", required: true },
      { key: "signal.enabled", type: "boolean", description: "Toggle the signal on/off.", required: true },
      { key: "signal.duration", type: "number", description: "Duration in seconds for 'notify-in-app' (Default: 10)." },
    ],
  },
];

// Helper for components that need a flat list
export const FLAT_CONFIG_DOCS = WIDGET_DOCS.flatMap(section => section.fields);
