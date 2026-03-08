import { WidgetConfig, WidgetType, WidgetSize } from "@/types/widget";

/**
 * Converts a WidgetConfig to URLSearchParams for embedding/previewing.
 * Flattens nested objects with prefixes:
 * - c_: config.*
 * - cr_: colorRules.*
 * - s_: signals (as JSON string)
 * - h_: headers (as JSON string)
 */
export function configToSearchParams(config: Partial<WidgetConfig>): URLSearchParams {
  const params = new URLSearchParams();

  // Base properties
  if (config.id) params.set("id", config.id);
  if (config.label) params.set("label", config.label);
  if (config.type) params.set("type", config.type);
  if (config.size) params.set("size", config.size);
  if (config.description) params.set("description", config.description);
  if (config.accentColor) params.set("accentColor", config.accentColor);
  if (config.api) params.set("api", config.api);
  if (config.method) params.set("method", config.method);
  if (config.responsePath) params.set("responsePath", config.responsePath);
  if (config.transformer) params.set("transformer", config.transformer);
  if (config.refreshInterval) params.set("refreshInterval", config.refreshInterval.toString());
  if (config.source) params.set("source", config.source);
  if (config.sourceUrl) params.set("sourceUrl", config.sourceUrl);
  if (config.color) params.set("color", config.color);

  // Headers (JSON)
  if (config.headers && Object.keys(config.headers).length > 0) {
    params.set("headers", JSON.stringify(config.headers));
  }

  // Nested Config
  if (config.config) {
    Object.entries(config.config).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.set(`c_${key}`, String(value));
      }
    });
  }

  // Color Rules
  if (config.colorRules) {
    if (config.colorRules.aboveZero) params.set("cr_aboveZero", config.colorRules.aboveZero);
    if (config.colorRules.belowZero) params.set("cr_belowZero", config.colorRules.belowZero);
    if (config.colorRules.atZero) params.set("cr_atZero", config.colorRules.atZero);
    if (config.colorRules.rules && config.colorRules.rules.length > 0) {
      params.set("cr_rules", JSON.stringify(config.colorRules.rules));
    }
  }

  // Signals (JSON)
  if (config.signals && config.signals.length > 0) {
    params.set("signals", JSON.stringify(config.signals));
  }

  return params;
}

/**
 * Parses URLSearchParams back into a Partial<WidgetConfig>.
 */
export function searchParamsToConfig(params: URLSearchParams): Partial<WidgetConfig> {
  const config: any = {
    config: {},
    colorRules: { rules: [] },
    headers: {},
    signals: []
  };

  params.forEach((value, key) => {
    // Base properties
    if (["id", "label", "type", "description", "accentColor", "api", "method", "responsePath", "transformer", "source", "sourceUrl", "color"].includes(key)) {
      config[key] = value;
    } else if (key === "size") {
      config.size = value as WidgetSize;
    } else if (key === "refreshInterval") {
      config.refreshInterval = parseInt(value, 10);
    } else if (key === "headers") {
      try { config.headers = JSON.parse(value); } catch (e) { console.error("URL Params: Invalid headers JSON"); }
    } 
    // Nested Config (c_ prefix)
    else if (key.startsWith("c_")) {
      const subKey = key.slice(2);
      // Attempt to parse numbers/booleans
      if (value === "true") config.config[subKey] = true;
      else if (value === "false") config.config[subKey] = false;
      else if (!isNaN(Number(value)) && value.trim() !== "") config.config[subKey] = Number(value);
      else config.config[subKey] = value;
    }
    // Color Rules (cr_ prefix)
    else if (key === "cr_aboveZero") config.colorRules.aboveZero = value;
    else if (key === "cr_belowZero") config.colorRules.belowZero = value;
    else if (key === "cr_atZero") config.colorRules.atZero = value;
    else if (key === "cr_rules") {
      try { config.colorRules.rules = JSON.parse(value); } catch (e) { console.error("URL Params: Invalid color rules JSON"); }
    }
    // Signals
    else if (key === "signals") {
      try { config.signals = JSON.parse(value); } catch (e) { console.error("URL Params: Invalid signals JSON"); }
    }
  });

  // Cleanup empty objects
  if (Object.keys(config.config).length === 0) delete config.config;
  if (Object.keys(config.headers).length === 0) delete config.headers;
  if (!config.signals || config.signals.length === 0) delete config.signals;
  if (Object.keys(config.colorRules).length === 1 && config.colorRules.rules && config.colorRules.rules.length === 0) delete config.colorRules;
  else if (Object.keys(config.colorRules).length === 0) delete config.colorRules;

  return config as Partial<WidgetConfig>;
}
